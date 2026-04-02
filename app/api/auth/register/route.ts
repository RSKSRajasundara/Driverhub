import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { shouldUseDevAuthFallback } from '@/lib/dev-auth-store';
import { verifyIdCardDetails } from '@/lib/id-card-verification';

const RESERVED_ADMIN_EMAIL = 'admin@vehicle.com';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function POST(request: NextRequest) {
  const { name, email, password, phone, nicNumber, address, identityCardImage, ocrText } = await request.json();
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').toLowerCase().trim();
  const normalizedNic = String(nicNumber || '').trim();
  const normalizedAddress = String(address || '').trim();
  const normalizedIdentityCardImage = String(identityCardImage || '').trim();
  const normalizedOcrText = String(ocrText || '').trim();

  try {
    await connectDB();

    // Validate required fields
    if (!normalizedName || !normalizedEmail || !password || !phone) {
      return NextResponse.json(
        { error: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    if (normalizedEmail === RESERVED_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'This email is reserved for the system administrator' },
        { status: 403 }
      );
    }

    const hasAnyIdVerificationInput = !!(normalizedNic || normalizedIdentityCardImage);
    const hasAllIdVerificationInput = !!(normalizedNic && normalizedIdentityCardImage);

    if (hasAnyIdVerificationInput && !hasAllIdVerificationInput) {
      const missingFields: string[] = [];
      if (!normalizedNic) missingFields.push('NIC number');
      if (!normalizedIdentityCardImage) missingFields.push('identity card image');

      return NextResponse.json(
        {
          error: `To verify identity during registration, provide NIC number and identity card image together. Missing: ${missingFields.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    if (hasAllIdVerificationInput) {
      if (!normalizedOcrText) {
        return NextResponse.json(
          { error: 'Could not read text from the identity card image. Please upload a clearer image.' },
          { status: 400 }
        );
      }

      const verification = await withTimeout(
        verifyIdCardDetails({
          name: normalizedName,
          nicNumber: normalizedNic,
          identityCardImage: normalizedIdentityCardImage,
          ocrText: normalizedOcrText,
        }),
        20000,
        'Identity verification is taking too long. Please upload a clearer/smaller image and try again.'
      );

      if (!verification.valid) {
        return NextResponse.json(
          {
            error:
              verification.reason ||
              "Identity card verification failed. Name or NIC doesn't match the uploaded ID card.",
          },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
      phone,
      nicNumber: normalizedNic,
      address: normalizedAddress,
      identityCardImage: normalizedIdentityCardImage,
      role: 'user',
    });

    // Generate token
    const token = generateToken(user);

    return NextResponse.json(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          nicNumber: user.nicNumber,
          address: user.address,
          identityCardImage: user.identityCardImage,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (
      typeof error?.message === 'string' &&
      error.message.includes('Identity verification is taking too long')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (shouldUseDevAuthFallback(error)) {
      return NextResponse.json(
        {
          error:
            'Database is currently unavailable. Registration is temporarily disabled to prevent data loss. Please try again shortly.',
        },
        { status: 503 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
  shouldUseDevAuthFallback,
} from '@/lib/dev-auth-store';

const ADMIN_EMAIL = 'admin@vehicle.com';
const ADMIN_PASSWORD = 'admin123';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const normalizedEmail = String(email || '').toLowerCase().trim();

  try {
    await connectDB();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please provide email and password' },
        { status: 400 }
      );
    }

    // Fixed admin credentials login through the same user login form
    if (normalizedEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      let adminUser = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

      if (!adminUser) {
        adminUser = await User.create({
          name: 'Administrator',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          phone: '+10000000000',
          role: 'admin',
        });
      } else if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
      }

      const token = generateToken(adminUser);

      return NextResponse.json(
        {
          message: 'Login successful',
          token,
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            phone: adminUser.phone,
            nicNumber: adminUser.nicNumber,
            address: adminUser.address,
            identityCardImage: adminUser.identityCardImage,
            role: adminUser.role,
          },
        },
        { status: 200 }
      );
    }

    // Find user and check password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user);

    return NextResponse.json(
      {
        message: 'Login successful',
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
      { status: 200 }
    );
  } catch (error: any) {
    if (shouldUseDevAuthFallback(error)) {
      return NextResponse.json(
        {
          error:
            'Database is currently unavailable. Login is temporarily disabled to prevent inconsistent data. Please try again shortly.',
        },
        { status: 503 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

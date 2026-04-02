import { NextRequest, NextResponse } from 'next/server';
import { verifyIdCardDetails } from '@/lib/id-card-verification';

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
  try {
    const { name, nicNumber, identityCardImage, ocrText } = await request.json();

    const normalizedName = String(name || '').trim();
    const normalizedNic = String(nicNumber || '').trim();
    const normalizedIdentityCardImage = String(identityCardImage || '').trim();
    const normalizedOcrText = String(ocrText || '').trim();

    if (!normalizedName || !normalizedNic || !normalizedIdentityCardImage) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Name, NIC number, and identity card image are required for verification.',
        },
        { status: 400 }
      );
    }

    if (!normalizedOcrText) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'Could not read text from the identity card image. Please upload a clearer image.',
        },
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
      45000,
      'Identity verification is taking too long. Please upload a clearer/smaller image and try again.'
    );

    return NextResponse.json(verification, { status: verification.valid ? 200 : 400 });
  } catch (error: any) {
    if (
      typeof error?.message === 'string' &&
      error.message.includes('Identity verification is taking too long')
    ) {
      return NextResponse.json(
        { valid: false, reason: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: false, reason: 'Failed to verify identity card. Please try again.' },
      { status: 500 }
    );
  }
}

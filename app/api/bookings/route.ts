import { connectDB } from '@/lib/db';
import Booking from '@/lib/models/Booking';
import Vehicle from '@/lib/models/Vehicle';
import User from '@/lib/models/User';
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdCardDetails } from '@/lib/id-card-verification';
import { getDemoVehicleById } from '@/lib/demo-vehicles';
import { findDevUserById } from '@/lib/dev-auth-store';
import {
  createDevBooking,
  getDevBookings,
} from '@/lib/dev-bookings-store';

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

function isRecoverableDevDbError(error: unknown): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  // Match both connection errors AND ObjectId cast errors (for dev user IDs)
  return /ENOTFOUND|querySrv|ECONNREFUSED|MongoServerSelectionError|CastError.*dev-/i.test(message);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // If querying for a dev user, skip DB and use dev store directly
    if (userId && String(userId).startsWith('dev-')) {
      console.log('[BOOKINGS-GET] Dev user detected, using dev store:', userId);
      const devBookings = getDevBookings(userId);
      console.log(`[BOOKINGS-GET] Returning ${devBookings.length} dev bookings`);
      return NextResponse.json(devBookings, {
        status: 200,
        headers: {
          'x-data-source': 'fallback-dev-bookings',
        },
      });
    }

    await connectDB();

    const status = searchParams.get('status');

    let query: any = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('vehicleId')
      .populate('userId');

    return NextResponse.json(bookings, { status: 200 });
  } catch (error: any) {
    if (isRecoverableDevDbError(error)) {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');

      if (userId && String(userId).startsWith('dev-')) {
        console.log('[BOOKINGS-GET] MongoDB unavailable, returning dev-store bookings for dev user');
        const devBookings = getDevBookings(userId);
        return NextResponse.json(devBookings, {
          status: 200,
          headers: {
            'x-data-source': 'fallback-dev-bookings',
          },
        });
      }

      return NextResponse.json(
        {
          error:
            'Database is currently unavailable. Booking history is only available for dev sessions until the database reconnects.',
        },
        { status: 503 }
      );
    }

    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[BOOKING] POST request started');
    const body = await request.json();
    console.log('[BOOKING] Body parsed:', { userId: body.userId, vehicleId: body.vehicleId });
    
    const {
      vehicleId,
      startDate,
      endDate,
      pickupLocation,
      dropoffLocation,
      userId,
      nicNumber,
      address,
      identityCardImage,
      ocrText,
    } = body;

    if (!vehicleId || !startDate || !endDate || !pickupLocation || !dropoffLocation || !userId) {
      return NextResponse.json(
        { error: 'Missing required booking fields' },
        { status: 400 }
      );
    }

    const isDevUserId = String(userId).startsWith('dev-');
    const isDemoVehicleId = String(vehicleId).startsWith('demo-');
    console.log('[BOOKING] Checks:', { isDevUserId, isDemoVehicleId, userIdStr: String(userId) });

    // In local fallback mode, avoid DB/OCR paths that can block when Atlas is unavailable.
    if (isDevUserId) {
      console.log('[BOOKING] Entering dev-user fast-path');
      const devUser = findDevUserById(String(userId));
      console.log('[BOOKING] Dev user lookup:', { userId: String(userId), found: !!devUser });
      if (!devUser) {
        console.log('[BOOKING] Dev user not found - returning 404');
        return NextResponse.json(
          {
            error: 'Local session expired after server restart. Please log out and log in again.',
          },
          { status: 404 }
        );
      }

      const normalizedNic = String(nicNumber || '').trim();
      const normalizedAddress = String(address || '').trim();
      const normalizedIdentityImage = String(identityCardImage || '').trim();

      if (!devUser.nicNumber && normalizedNic) {
        devUser.nicNumber = normalizedNic;
      }
      if (!devUser.address && normalizedAddress) {
        devUser.address = normalizedAddress;
      }
      if (!devUser.identityCardImage && normalizedIdentityImage) {
        devUser.identityCardImage = normalizedIdentityImage;
      }

      if (!devUser.nicNumber || !devUser.address || !devUser.identityCardImage) {
        console.log('[BOOKING] Dev user missing KYC - returning 400');
        return NextResponse.json(
          {
            error:
              'Please complete your profile with NIC number, address, and identity card image before booking.',
          },
          { status: 400 }
        );
      }

      const demoVehicle = getDemoVehicleById(String(vehicleId));
      console.log('[BOOKING] Demo vehicle lookup:', { vehicleId: String(vehicleId), found: !!demoVehicle });
      if (!demoVehicle) {
        console.log('[BOOKING] Demo vehicle not found - returning 400');
        return NextResponse.json(
          {
            error:
              'In local mode, please book using demo vehicles from the main vehicles list.',
          },
          { status: 400 }
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = demoVehicle.pricePerDay * days;

      console.log('[BOOKING] Dev-user fast-path returning booking');
      const booking = createDevBooking({
        userId: String(userId),
        vehicleId: String(vehicleId),
        startDate,
        endDate,
        totalPrice,
        pickupLocation,
        dropoffLocation,
        status: 'confirmed',
      });

      return NextResponse.json(booking, {
        status: 201,
        headers: {
          'x-data-source': 'fallback-dev-booking',
        },
      });
    }

    console.log('[BOOKING] Not a dev user, calling connectDB...');
    await connectDB();

    const user = isDevUserId ? findDevUserById(String(userId)) : await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          error: isDevUserId
            ? 'Local session expired after server restart. Please log out and log in again.'
            : 'User not found',
        },
        { status: 404 }
      );
    }

    const normalizedNic = String(nicNumber || '').trim();
    const normalizedAddress = String(address || '').trim();
    const normalizedIdentityImage = String(identityCardImage || '').trim();
    const normalizedOcrText = String(ocrText || '').trim();

    let shouldUpdateUser = false;
    if (normalizedNic && normalizedNic !== String(user.nicNumber || '').trim()) {
      user.nicNumber = normalizedNic;
      shouldUpdateUser = true;
    }
    if (normalizedAddress && normalizedAddress !== String(user.address || '').trim()) {
      user.address = normalizedAddress;
      shouldUpdateUser = true;
    }
    if (
      normalizedIdentityImage &&
      normalizedIdentityImage !== String(user.identityCardImage || '').trim()
    ) {
      user.identityCardImage = normalizedIdentityImage;
      shouldUpdateUser = true;
    }
    if (shouldUpdateUser) {
      if (typeof (user as any).save === 'function') {
        await (user as any).save();
      }
    }

    if (!user.nicNumber || !user.address || !user.identityCardImage) {
      return NextResponse.json(
        {
          error:
            'Please complete your profile with NIC number, address, and identity card image before booking.',
        },
        { status: 400 }
      );
    }

    if (!normalizedOcrText) {
      return NextResponse.json(
        {
          error:
            'Could not read text from the uploaded ID card. Please upload a clearer image and try again.',
        },
        { status: 400 }
      );
    }

    let verification;
    try {
      verification = await withTimeout(
        verifyIdCardDetails({
          name: String(user.name || '').trim(),
          nicNumber: String(user.nicNumber),
          identityCardImage: String(user.identityCardImage),
          ocrText: normalizedOcrText,
        }),
        20000,
        'Identity verification is taking too long. Please upload a clearer/smaller image and try again.'
      );
    } catch (error: any) {
      console.error('[BOOKING] Verification error:', error?.message);
      throw error;
    }

    if (!verification.valid) {
      return NextResponse.json(
        {
          error:
            verification.reason ||
            'Identity card details do not match provided NIC number and address.',
        },
        { status: 400 }
      );
    }

    // Get vehicle to calculate price
    if (isDemoVehicleId) {
      return NextResponse.json(
        {
          error:
            'Demo vehicles are for local testing only. Please choose a real vehicle to save booking data in the database.',
        },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Calculate total price
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = vehicle.pricePerDay * days;

    const booking = await Booking.create({
      userId,
      vehicleId,
      startDate,
      endDate,
      totalPrice,
      pickupLocation,
      dropoffLocation,
      status: 'confirmed',
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    const message = error?.message || 'Internal server error';

    if (isRecoverableDevDbError(error)) {
      return NextResponse.json(
        {
          error:
            'Database is currently unavailable. Booking was not saved. Please try again once the database is back online.',
        },
        { status: 503 }
      );
    }

    if (typeof message === 'string' && message.includes('Identity verification is taking too long')) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

import { connectDB } from '@/lib/db';
import Booking from '@/lib/models/Booking';
import '@/lib/models/User';
import '@/lib/models/Vehicle';
import { NextRequest, NextResponse } from 'next/server';
import { getDevBookingById, updateDevBooking } from '@/lib/dev-bookings-store';

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

  return /ENOTFOUND|querySrv|ECONNREFUSED|MongoServerSelectionError/i.test(message);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // If querying for a dev booking, skip DB and use dev store directly
    if (id.startsWith('dev-booking-')) {
      console.log('[BOOKING-GET] Dev booking detected:', id);
      const devBooking = getDevBookingById(id);
      if (devBooking) {
        return NextResponse.json(devBooking, {
          status: 200,
          headers: { 'x-data-source': 'fallback-dev-booking' },
        });
      }
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    await connectDB();

    const booking = await Booking.findById(id)
      .populate('vehicleId')
      .populate('userId');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error: any) {
    if (isRecoverableDevDbError(error)) {
      const { id } = await params;
      if (id.startsWith('dev-booking-')) {
        const devBooking = getDevBookingById(id);
        if (devBooking) {
          return NextResponse.json(devBooking, {
            status: 200,
            headers: { 'x-data-source': 'fallback-dev-booking' },
          });
        }
      }
      return NextResponse.json(
        {
          error:
            'Database is currently unavailable. Booking details are temporarily unavailable for non-dev records.',
        },
        { status: 503 }
      );
    }
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: any;
  try {
    const { id } = await params;
    body = await request.json();

    // If updating a dev booking, skip DB and use dev store directly
    if (id.startsWith('dev-booking-')) {
      console.log('[BOOKING-PUT] Dev booking detected:', id);
      const updatedBooking = updateDevBooking(id, body);
      if (updatedBooking) {
        return NextResponse.json(updatedBooking, {
          status: 200,
          headers: { 'x-data-source': 'fallback-dev-booking' },
        });
      }
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    await connectDB();

    const booking = await Booking.findByIdAndUpdate(id, body, { new: true })
      .populate('vehicleId')
      .populate('userId');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error: any) {
    if (isRecoverableDevDbError(error)) {
      const { id } = await params;
      if (id.startsWith('dev-booking-')) {
        const updatedBooking = updateDevBooking(id, body || {});
        if (updatedBooking) {
          return NextResponse.json(updatedBooking, {
            status: 200,
            headers: { 'x-data-source': 'fallback-dev-booking' },
          });
        }
      }
      return NextResponse.json(
        {
          error:
            'Database is currently unavailable. Booking update was not saved for non-dev records.',
        },
        { status: 503 }
      );
    }
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Booking deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

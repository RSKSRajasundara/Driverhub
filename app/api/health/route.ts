import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Vehicle from '@/lib/models/Vehicle';
import Booking from '@/lib/models/Booking';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();

    const userCount = await User.countDocuments();
    const vehicleCount = await Vehicle.countDocuments();
    const bookingCount = await Booking.countDocuments();

    return NextResponse.json(
      {
        status: 'success',
        database: 'Connected to MongoDB',
        collections: {
          users: userCount,
          vehicles: vehicleCount,
          bookings: bookingCount,
        },
        message: 'Database is connected and data is being stored successfully! ✅',
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          status: 'degraded',
          database: 'Unavailable in local environment',
          error: error.message,
          message: 'Running with limited functionality until MongoDB is configured.',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        database: 'Failed to connect',
        error: error.message,
        message: '❌ Database connection failed. Check your MongoDB URI in .env.local',
      },
      { status: 500 }
    );
  }
}

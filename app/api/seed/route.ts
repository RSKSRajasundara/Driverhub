import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';
import { demoVehicles } from '@/lib/demo-vehicles';

export async function POST() {
  try {
    await connectDB();

    const ops = demoVehicles.map((vehicle) => ({
      updateOne: {
        filter: { name: vehicle.name },
        update: { $set: vehicle },
        upsert: true,
      },
    }));

    const result = await Vehicle.bulkWrite(ops);
    const total = await Vehicle.countDocuments();

    return NextResponse.json(
      {
        message: 'Seed completed successfully',
        inserted: result.upsertedCount,
        modified: result.modifiedCount,
        totalVehicles: total,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: 'Seed failed',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

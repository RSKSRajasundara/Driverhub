import { connectDB } from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';
import { NextRequest, NextResponse } from 'next/server';
import { demoVehicles, withDemoVehicleIds } from '@/lib/demo-vehicles';

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

  return /ENOTFOUND|querySrv|ECONNREFUSED|MongoServerSelectionError|server selection timed out|Could not connect to any servers|whitelisted|IP address/i.test(
    message
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const available = searchParams.get('available');

  const filterByQuery = (vehicles: typeof demoVehicles) =>
    vehicles.filter((vehicle) => {
      if (category && vehicle.category !== category) {
        return false;
      }
      if (available && vehicle.available !== (available === 'true')) {
        return false;
      }
      return true;
    });

  try {
    await connectDB();

    let query: any = {};
    if (category) query.category = category;
    if (available) query.available = available === 'true';

    const vehicles = await Vehicle.find(query);

    return NextResponse.json(vehicles, { status: 200 });
  } catch (error: any) {
    if (isRecoverableDevDbError(error)) {
      const fallbackVehicles = withDemoVehicleIds(filterByQuery(demoVehicles));
      return NextResponse.json(fallbackVehicles, {
        status: 200,
        headers: {
          'x-data-source': 'fallback-demo',
        },
      });
    }

    console.error('Get vehicles error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Only admin can create vehicles
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const vehicle = await Vehicle.create(body);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error('Create vehicle error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

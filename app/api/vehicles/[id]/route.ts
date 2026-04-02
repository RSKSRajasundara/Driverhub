import { connectDB } from '@/lib/db';
import Vehicle from '@/lib/models/Vehicle';
import { NextRequest, NextResponse } from 'next/server';
import { getDemoVehicleById } from '@/lib/demo-vehicles';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (id.startsWith('demo-')) {
    const fallbackVehicle = getDemoVehicleById(id);
    if (!fallbackVehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(fallbackVehicle, {
      status: 200,
      headers: {
        'x-data-source': 'fallback-demo',
      },
    });
  }

  try {
    await connectDB();

    const vehicle = await Vehicle.findById(id);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error: any) {
    if (isRecoverableDevDbError(error)) {
      const fallbackVehicle = getDemoVehicleById(id);
      if (!fallbackVehicle) {
        return NextResponse.json(
          {
            error:
              'Database is currently unavailable. This vehicle cannot be loaded right now. Please choose a demo vehicle from the home page or try again shortly.',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(fallbackVehicle, {
        status: 200,
        headers: {
          'x-data-source': 'fallback-demo',
        },
      });
    }

    console.error('Get vehicle error:', error);
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
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const vehicle = await Vehicle.findByIdAndUpdate(id, body, { new: true });

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle, { status: 200 });
  } catch (error: any) {
    console.error('Update vehicle error:', error);
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

    const vehicle = await Vehicle.findByIdAndDelete(id);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Vehicle deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

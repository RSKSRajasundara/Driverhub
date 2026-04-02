import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import Vehicle from '@/lib/models/Vehicle';
import Booking from '@/lib/models/Booking';

export async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    // Connect to database
    const conn = await connectDB();
    console.log('✅ Connected to MongoDB successfully');
    console.log(`📍 Database: ${conn.connection.name}`);

    // Check users collection
    const userCount = await User.countDocuments();
    console.log(`📊 Users in database: ${userCount}`);

    // Check vehicles collection
    const vehicleCount = await Vehicle.countDocuments();
    console.log(`🚗 Vehicles in database: ${vehicleCount}`);

    // Check bookings collection
    const bookingCount = await Booking.countDocuments();
    console.log(`📅 Bookings in database: ${bookingCount}`);

    return {
      connected: true,
      database: conn.connection.name,
      collections: {
        users: userCount,
        vehicles: vehicleCount,
        bookings: bookingCount,
      },
    };
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    return {
      connected: false,
      error: error.message,
    };
  }
}

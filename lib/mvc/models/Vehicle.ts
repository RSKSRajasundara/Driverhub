import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  fuelType: string;
  transmission: string;
  seats: number;
  description: string;
  image: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    name: {
      type: String,
      required: [true, 'Please provide vehicle name'],
    },
    make: {
      type: String,
      required: [true, 'Please provide vehicle make'],
    },
    model: {
      type: String,
      required: [true, 'Please provide vehicle model'],
    },
    year: {
      type: Number,
      required: [true, 'Please provide vehicle year'],
    },
    category: {
      type: String,
      enum: [
        'car',
        'bike',
        'jeep',
        'van',
        'bus',
        // Keep legacy categories for compatibility with existing records.
        'economy',
        'compact',
        'sedan',
        'suv',
        'luxury',
      ],
      required: [true, 'Please select a category'],
    },
    pricePerDay: {
      type: Number,
      required: [true, 'Please provide price per day'],
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'hybrid', 'electric'],
      required: [true, 'Please select fuel type'],
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic'],
      required: [true, 'Please select transmission'],
    },
    seats: {
      type: Number,
      required: [true, 'Please provide number of seats'],
    },
    description: {
      type: String,
    },
    image: {
      type: String,
      default: 'https://via.placeholder.com/400x300?text=Vehicle',
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);

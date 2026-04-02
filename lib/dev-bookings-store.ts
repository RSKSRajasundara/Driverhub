// In-memory storage for bookings in dev mode (fallback when MongoDB is unavailable)

export type DevBooking = {
  _id: string;
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

type DevBookingsStore = {
  bookings: DevBooking[];
};

declare global {
  // eslint-disable-next-line no-var
  var devBookingsStore: DevBookingsStore | undefined;
}

function getStore(): DevBookingsStore {
  if (!globalThis.devBookingsStore) {
    globalThis.devBookingsStore = { bookings: [] };
  }
  return globalThis.devBookingsStore;
}

export function createDevBooking(input: {
  userId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  pickupLocation: string;
  dropoffLocation: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}): DevBooking {
  const store = getStore();

  const booking: DevBooking = {
    _id: `dev-booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    userId: input.userId,
    vehicleId: input.vehicleId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: input.totalPrice,
    pickupLocation: input.pickupLocation,
    dropoffLocation: input.dropoffLocation,
    status: input.status || 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.bookings.push(booking);
  console.log(`[DEV-BOOKINGS] Created booking ${booking._id} for user ${input.userId}`);
  return booking;
}

export function getDevBookings(userId?: string): DevBooking[] {
  const store = getStore();
  if (!userId) {
    return store.bookings;
  }
  return store.bookings.filter((b) => b.userId === userId);
}

export function getDevBookingById(id: string): DevBooking | undefined {
  const store = getStore();
  return store.bookings.find((b) => b._id === id);
}

export function updateDevBooking(
  id: string,
  updates: Partial<Omit<DevBooking, '_id' | 'createdAt'>>
): DevBooking | undefined {
  const store = getStore();
  const booking = store.bookings.find((b) => b._id === id);
  if (!booking) {
    return undefined;
  }

  Object.assign(booking, updates, { updatedAt: new Date().toISOString() });
  console.log(`[DEV-BOOKINGS] Updated booking ${id}`);
  return booking;
}

export function deleteDevBooking(id: string): boolean {
  const store = getStore();
  const index = store.bookings.findIndex((b) => b._id === id);
  if (index === -1) {
    return false;
  }
  store.bookings.splice(index, 1);
  console.log(`[DEV-BOOKINGS] Deleted booking ${id}`);
  return true;
}

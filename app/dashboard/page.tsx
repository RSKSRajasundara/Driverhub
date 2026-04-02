'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { formatCurrencyRs } from '@/lib/utils';

interface Booking {
  _id: string;
  vehicleId: {
    name: string;
  };
  startDate: string;
  endDate: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  pickupLocation: string;
  dropoffLocation: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getBookings({ userId: user.id });
        setBookings(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch bookings:', err);
        setError(err.message);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, router]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await apiClient.updateBooking(bookingId, { status: 'cancelled' });
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
      alert('Booking cancelled successfully');
    } catch (error: any) {
      alert('Failed to cancel booking: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30';
      case 'pending':
        return 'bg-amber-500/20 text-amber-200 border border-amber-400/30';
      case 'completed':
        return 'bg-sky-500/20 text-sky-200 border border-sky-400/30';
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-200 border border-rose-400/30';
      default:
        return 'bg-slate-500/20 text-slate-200 border border-slate-400/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-cyan-300">
            DriveHub
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-slate-200">{user?.email}</span>
            <Button
              variant="outline"
              className="border-white/30 bg-slate-900/40 text-white hover:bg-white/10"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">My Bookings</h1>
          <p className="text-slate-300">Manage your vehicle rental bookings</p>
        </div>

        <div className="mb-8">
          <Link href="/">
            <Button className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">Browse Vehicles</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-3 text-red-200">
            Error: {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="mb-4 text-slate-300">No bookings yet</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">Start Booking</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="glass-card rounded-2xl p-6 transition-shadow hover:shadow-cyan-500/15"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Vehicle</p>
                    <p className="text-lg font-semibold text-white">{booking.vehicleId?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Pickup Location</p>
                    <p className="text-lg font-semibold text-white">{booking.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Dropoff Location</p>
                    <p className="text-lg font-semibold text-white">{booking.dropoffLocation}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Total Price</p>
                    <p className="text-lg font-bold text-cyan-300">{formatCurrencyRs(booking.totalPrice)}</p>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 border-b border-white/15 pb-6 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Start Date</p>
                    <p className="font-semibold text-white">{new Date(booking.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">End Date</p>
                    <p className="font-semibold text-white">{new Date(booking.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Status</p>
                    <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>

                {booking.status === 'pending' || booking.status === 'confirmed' ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancel(booking._id)}
                  >
                    Cancel Booking
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

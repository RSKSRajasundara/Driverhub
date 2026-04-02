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
  userId: {
    name: string;
    email: string;
    nicNumber?: string;
    address?: string;
    identityCardImage?: string;
  };
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

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchBookings();
  }, [user, router, filterStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      const data = await apiClient.getBookings(filters);
      setBookings(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await apiClient.updateBooking(bookingId, { status: newStatus });
      setBookings(bookings.map(b => b._id === bookingId ? { ...b, status: newStatus as any } : b));
      alert('Booking status updated successfully');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await apiClient.deleteBooking(bookingId);
      setBookings(bookings.filter(b => b._id !== bookingId));
      alert('Booking cancelled successfully');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-cyan-300">
            DriveHub
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="text-slate-200 transition-colors hover:text-cyan-300">
              Dashboard
            </Link>
            <Link href="/admin/vehicles" className="text-slate-200 transition-colors hover:text-cyan-300">
              Vehicles
            </Link>
            <Link href="/admin/bookings" className="text-slate-200 transition-colors hover:text-cyan-300">
              Bookings
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">{user?.name}</span>
              <Button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                variant="outline"
                size="sm"
                className="border-white/30 bg-slate-900/40 text-white hover:bg-white/10"
              >
                Logout
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Manage Bookings</h1>
          <p className="text-slate-300">View and update booking statuses</p>
        </div>

        {/* Filter */}
        <div className="mb-8 flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className={filterStatus === 'all' ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950' : 'border-white/30 bg-slate-900/40 text-slate-100 hover:bg-white/10'}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('pending')}
            className={filterStatus === 'pending' ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950' : 'border-white/30 bg-slate-900/40 text-slate-100 hover:bg-white/10'}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('confirmed')}
            className={filterStatus === 'confirmed' ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950' : 'border-white/30 bg-slate-900/40 text-slate-100 hover:bg-white/10'}
          >
            Confirmed
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            className={filterStatus === 'completed' ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950' : 'border-white/30 bg-slate-900/40 text-slate-100 hover:bg-white/10'}
          >
            Completed
          </Button>
          <Button
            variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('cancelled')}
            className={filterStatus === 'cancelled' ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950' : 'border-white/30 bg-slate-900/40 text-slate-100 hover:bg-white/10'}
          >
            Cancelled
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-3 text-red-200">
            Error: {error}
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-slate-300">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="glass-card rounded-2xl p-6 transition-shadow hover:shadow-cyan-500/15"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Customer</p>
                    <p className="font-semibold text-white">{booking.userId?.name || 'Unknown'}</p>
                    <p className="text-sm text-slate-300">{booking.userId?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Vehicle</p>
                    <p className="font-semibold text-white">{booking.vehicleId?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Total Price</p>
                    <p className="text-lg font-bold text-cyan-300">{formatCurrencyRs(booking.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Dates</p>
                    <p className="text-sm font-semibold text-white">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 border-b border-white/15 pb-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Pickup Location</p>
                    <p className="font-semibold text-white">{booking.pickupLocation}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Dropoff Location</p>
                    <p className="font-semibold text-white">{booking.dropoffLocation}</p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 border-b border-white/15 pb-4 md:grid-cols-3">
                  <div>
                    <p className="mb-1 text-sm text-slate-300">NIC Number</p>
                    <p className="font-semibold text-white">{booking.userId?.nicNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Address</p>
                    <p className="font-semibold text-white">{booking.userId?.address || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-300">Identity Card</p>
                    {booking.userId?.identityCardImage ? (
                      <a
                        href={booking.userId.identityCardImage}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={booking.userId.identityCardImage}
                          alt="Identity card"
                          className="h-20 w-full rounded-md border border-white/20 object-cover"
                        />
                      </a>
                    ) : (
                      <p className="font-semibold text-white">-</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <div className="flex gap-2">
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <>
                        <select
                          value={booking.status}
                          onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                          className="rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                        </select>
                      </>
                    )}
                    {booking.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(booking._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

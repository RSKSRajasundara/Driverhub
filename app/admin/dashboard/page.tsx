'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { formatCurrencyRs } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface Vehicle {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  pricePerDay: number;
  category: string;
  seats: number;
  available: boolean;
}

interface Stats {
  totalVehicles: number;
  availableVehicles: number;
  totalBookings: number;
  confirmedBookings: number;
}

interface Booking {
  _id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  createdAt?: string;
  startDate?: string;
  userId?: {
    name?: string;
    email?: string;
  };
  vehicleId?: {
    name?: string;
  };
}

interface ChartPoint {
  name: string;
  value: number;
}

interface MonthPoint {
  month: string;
  bookings: number;
  revenue: number;
}

const STATUS_COLORS: Record<'pending' | 'confirmed' | 'completed' | 'cancelled', string> = {
  pending: '#eab308',
  confirmed: '#22c55e',
  completed: '#3b82f6',
  cancelled: '#ef4444',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    availableVehicles: 0,
    totalBookings: 0,
    confirmedBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<ChartPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthPoint[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const [vehiclesData, bookingsData] = await Promise.all([
          apiClient.getVehicles(),
          apiClient.getBookings(),
        ]);

        const availableCount = vehiclesData.filter((v: Vehicle) => v.available).length;
        const confirmedCount = bookingsData.filter((b: Booking) => b.status === 'confirmed').length;

        const statusCount = {
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
        };

        const monthBuckets: MonthPoint[] = Array.from({ length: 6 }, (_, idx) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - idx));
          return {
            month: d.toLocaleString('en-US', { month: 'short' }),
            bookings: 0,
            revenue: 0,
          };
        });

        const monthKeyMap = new Map<string, number>();
        monthBuckets.forEach((bucket, idx) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - idx));
          monthKeyMap.set(`${d.getFullYear()}-${d.getMonth()}`, idx);
        });

        bookingsData.forEach((booking: Booking) => {
          statusCount[booking.status] += 1;

          const activityDate = booking.createdAt
            ? new Date(booking.createdAt)
            : booking.startDate
              ? new Date(booking.startDate)
              : new Date();

          const key = `${activityDate.getFullYear()}-${activityDate.getMonth()}`;
          const bucketIdx = monthKeyMap.get(key);
          if (bucketIdx !== undefined) {
            monthBuckets[bucketIdx].bookings += 1;
            monthBuckets[bucketIdx].revenue += Number(booking.totalPrice || 0);
          }
        });

        setStatusData([
          { name: 'Pending', value: statusCount.pending },
          { name: 'Confirmed', value: statusCount.confirmed },
          { name: 'Completed', value: statusCount.completed },
          { name: 'Cancelled', value: statusCount.cancelled },
        ]);
        setMonthlyData(monthBuckets);
        setRecentBookings(
          [...bookingsData]
            .sort(
              (a: Booking, b: Booking) =>
                new Date(b.createdAt || b.startDate || 0).getTime() -
                new Date(a.createdAt || a.startDate || 0).getTime()
            )
            .slice(0, 6)
        );

        setStats({
          totalVehicles: vehiclesData.length,
          availableVehicles: availableCount,
          totalBookings: bookingsData.length,
          confirmedBookings: confirmedCount,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, router]);

  return (
    <div className="min-h-screen text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-cyan-300">
            DriveHub Admin
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

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-300">Monitor your vehicle rental fleet and bookings</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* Total Vehicles */}
              <div className="glass-card rounded-2xl p-6">
                <p className="mb-2 text-sm text-slate-300">Total Vehicles</p>
                <p className="text-4xl font-bold text-cyan-300">{stats.totalVehicles}</p>
              </div>

              {/* Available Vehicles */}
              <div className="glass-card rounded-2xl p-6">
                <p className="mb-2 text-sm text-slate-300">Available Vehicles</p>
                <p className="text-4xl font-bold text-green-600">{stats.availableVehicles}</p>
              </div>

              {/* Total Bookings */}
              <div className="glass-card rounded-2xl p-6">
                <p className="mb-2 text-sm text-slate-300">Total Bookings</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalBookings}</p>
              </div>

              {/* Confirmed Bookings */}
              <div className="glass-card rounded-2xl p-6">
                <p className="mb-2 text-sm text-slate-300">Confirmed Bookings</p>
                <p className="text-4xl font-bold text-orange-600">{stats.confirmedBookings}</p>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/admin/vehicles">
                <div className="glass-card cursor-pointer rounded-2xl p-8 transition-shadow hover:shadow-cyan-500/20">
                  <h3 className="mb-2 text-xl font-bold text-white">Manage Vehicles</h3>
                  <p className="mb-4 text-slate-300">Add, edit, or remove vehicles from your fleet</p>
                  <Button variant="outline" className="w-full border-white/30 bg-slate-900/40 text-white hover:bg-white/10">
                    Go to Vehicles
                  </Button>
                </div>
              </Link>

              <Link href="/admin/bookings">
                <div className="glass-card cursor-pointer rounded-2xl p-8 transition-shadow hover:shadow-cyan-500/20">
                  <h3 className="mb-2 text-xl font-bold text-white">Manage Bookings</h3>
                  <p className="mb-4 text-slate-300">Review and update booking statuses</p>
                  <Button variant="outline" className="w-full border-white/30 bg-slate-900/40 text-white hover:bg-white/10">
                    Go to Bookings
                  </Button>
                </div>
              </Link>
            </div>

            {/* Activity Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="mb-1 text-xl font-bold text-white">Booking Status Breakdown</h3>
                <p className="mb-6 text-sm text-slate-300">Current distribution of booking states</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label
                      >
                        {statusData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              entry.name === 'Pending'
                                ? STATUS_COLORS.pending
                                : entry.name === 'Confirmed'
                                  ? STATUS_COLORS.confirmed
                                  : entry.name === 'Completed'
                                    ? STATUS_COLORS.completed
                                    : STATUS_COLORS.cancelled
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="mb-1 text-xl font-bold text-white">Monthly Booking Activity</h3>
                <p className="mb-6 text-sm text-slate-300">Last 6 months booking volume</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="glass-card rounded-2xl p-6 lg:col-span-2">
                <h3 className="mb-1 text-xl font-bold text-white">Revenue Trend</h3>
                <p className="mb-6 text-sm text-slate-300">Last 6 months booking revenue</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrencyRs(Number(value || 0))} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#14b8a6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <h3 className="mb-1 text-xl font-bold text-white">Recent Activities</h3>
                <p className="mb-4 text-sm text-slate-300">Latest booking actions</p>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {recentBookings.length === 0 ? (
                    <p className="text-sm text-slate-300">No activity yet.</p>
                  ) : (
                    recentBookings.map((booking) => (
                      <div key={booking._id} className="rounded-md border border-white/15 p-3">
                        <p className="text-sm font-semibold text-white">{booking.vehicleId?.name || 'Vehicle'}</p>
                        <p className="text-xs text-slate-300">{booking.userId?.email || 'Unknown user'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-slate-300">
                            {new Date(booking.createdAt || booking.startDate || Date.now()).toLocaleDateString()}
                          </span>
                          <span className="text-xs font-semibold text-cyan-300">{booking.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

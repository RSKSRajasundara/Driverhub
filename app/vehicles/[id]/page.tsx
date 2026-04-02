'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { use, useEffect, useState } from 'react';
import { formatCurrencyRs } from '@/lib/utils';

interface Vehicle {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  image?: string;
  pricePerDay: number;
  seats: number;
  category: string;
  description?: string;
  fuelType?: string;
  transmission?: string;
  available?: boolean;
}

const isLikelyHttpUrl = (value?: string) => Boolean(value && /^https?:\/\//i.test(value));

export default function VehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState('Colombo Fort Railway Station');
  const [dropoffLocation, setDropoffLocation] = useState('Bandaranaike International Airport');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnDate, setReturnDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getVehicle(id);
        setVehicle(data);
        setError(null);
      } catch (err: any) {
        const message = String(err?.message || 'Failed to load vehicle');
        const friendlyMessage =
          /database is currently unavailable|server selection timed out|could not connect to any servers/i.test(
            message
          )
            ? 'Database is temporarily unavailable. Please return to the home page and choose a demo vehicle, or try again shortly.'
            : message;
        setError(friendlyMessage);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <p className="text-slate-300">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Vehicle Not Found</h1>
          <p className="mb-6 text-slate-300">{error}</p>
          <Link href="/">
            <Button>Back to Vehicles</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleBooking = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!pickupLocation.trim() || !dropoffLocation.trim()) {
      alert('Please enter both pickup and return locations.');
      return;
    }

    if (!pickupDate || !returnDate) {
      alert('Please select pickup and return dates.');
      return;
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      alert('Return date must be after pickup date.');
      return;
    }

    const params = new URLSearchParams({
      vehicleId: vehicle._id,
      startDate: pickupDate,
      endDate: returnDate,
      pickupLocation,
      dropoffLocation,
    });
    router.push(`/payment?${params.toString()}`);
  };

  const start = new Date(pickupDate);
  const end = new Date(returnDate);
  const parsedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 1;
  const totalPrice = vehicle.pricePerDay * days;
  const mapSrc = `https://maps.google.com/maps?saddr=${encodeURIComponent(
    pickupLocation
  )}&daddr=${encodeURIComponent(dropoffLocation)}&output=embed`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-cyan-300">
            DriveHub
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-white/30 bg-slate-900/50 text-white hover:bg-white/10">Back</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <div className="glass-card mb-6 overflow-hidden rounded-2xl">
              <img
                src={
                  isLikelyHttpUrl(vehicle.image)
                    ? vehicle.image
                    : `https://image.pollinations.ai/prompt/${encodeURIComponent(`${vehicle.name} rental car cinematic studio shot`)}`
                }
                alt={vehicle.name}
                onError={(e) => {
                  e.currentTarget.src = `https://picsum.photos/seed/${vehicle._id}/1200/700`;
                }}
                className="h-[340px] w-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-300">Category</p>
                <p className="text-lg font-semibold text-white">{vehicle.category}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Seating Capacity</p>
                <p className="text-lg font-semibold text-white">{vehicle.seats} Passengers</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Daily Rate</p>
                <p className="text-3xl font-bold text-cyan-300">{formatCurrencyRs(vehicle.pricePerDay)}/day</p>
              </div>
            </div>
          </div>

          <div>
            <h1 className="mb-4 text-4xl font-bold text-white">{vehicle.name}</h1>
            <p className="mb-8 text-lg text-slate-300">
              {vehicle.description || 'Premium vehicle for your rental needs.'}
            </p>

            <div className="glass-card rounded-2xl p-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold">Pickup Date</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-slate-900/60 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Return Date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-slate-900/60 px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Pickup Location</label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="Search pickup location (e.g., Colombo City Centre)"
                  className="w-full rounded-lg border border-white/20 bg-slate-900/60 px-4 py-2 text-white"
                  list="pickup-locations"
                />
                <datalist id="pickup-locations">
                  <option value="Colombo Fort Railway Station" />
                  <option value="Bandaranaike International Airport" />
                  <option value="Kandy City Centre" />
                  <option value="Galle Fort" />
                  <option value="Jaffna Railway Station" />
                </datalist>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Return Location</label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Search return location (e.g., Airport terminal)"
                  className="w-full rounded-lg border border-white/20 bg-slate-900/60 px-4 py-2 text-white"
                  list="dropoff-locations"
                />
                <datalist id="dropoff-locations">
                  <option value="Colombo Fort Railway Station" />
                  <option value="Bandaranaike International Airport" />
                  <option value="Kandy City Centre" />
                  <option value="Galle Fort" />
                  <option value="Jaffna Railway Station" />
                </datalist>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Route Preview (Google Maps)</p>
                <div className="overflow-hidden rounded-xl border border-white/20">
                  <iframe
                    title="Pickup to dropoff route"
                    src={mapSrc}
                    className="h-64 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              <div className="border-t border-white/15 pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">Subtotal ({days} days)</span>
                  <span>{formatCurrencyRs(totalPrice)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-slate-300">Insurance & Fees</span>
                  <span>{formatCurrencyRs(Math.round(totalPrice * 0.1))}</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-cyan-300">{formatCurrencyRs(totalPrice + Math.round(totalPrice * 0.1))}</span>
                </div>
              </div>

              <Button onClick={handleBooking} className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 py-6 text-lg text-slate-950">
                {user ? 'Continue to Payment' : 'Login to Continue'}
              </Button>

              {!user && (
                <p className="text-center text-sm text-slate-300">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-cyan-300 hover:underline">
                    Register here
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { formatCurrencyRs } from '@/lib/utils';

interface Vehicle {
  _id: string;
  name: string;
  image?: string;
  pricePerDay: number;
  category: string;
  seats: number;
  description?: string;
  available?: boolean;
}

const isLikelyHttpUrl = (value?: string) => Boolean(value && /^https?:\/\//i.test(value));

function LandingContent() {
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getVehicles({ available: true });
        setVehicles(data);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const baseCategories = ['car', 'bike', 'jeep', 'van', 'bus'];
  const discoveredCategories = Array.from(new Set(vehicles.map((v) => v.category.toLowerCase())));
  const categoryOptions = [
    'all',
    ...baseCategories,
    ...discoveredCategories.filter((c) => !baseCategories.includes(c)),
  ];
  const filteredVehicles =
    selectedCategory === 'all'
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.category.toLowerCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold tracking-tight text-cyan-300">
            DriveHub
          </Link>
          <nav className="flex items-center gap-7 text-sm">
            <Link href="/" className="text-slate-200 transition-colors hover:text-cyan-300">
              Vehicles
            </Link>
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link href="/admin/dashboard" className="text-slate-200 transition-colors hover:text-cyan-300">
                      Admin Dashboard
                    </Link>
                    <Link href="/admin/vehicles" className="text-slate-200 transition-colors hover:text-cyan-300">
                      Manage Fleet
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="text-slate-200 transition-colors hover:text-cyan-300">
                    My Bookings
                  </Link>
                )}
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-300">
                    {user.name} ({user.role})
                  </span>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="border-cyan-300/50 bg-slate-900/50 text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="border-cyan-300/50 bg-slate-900/40 text-cyan-100 hover:bg-cyan-500/20">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="animate-glow bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 hover:opacity-90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
          src="https://cdn.coverr.co/videos/coverr-aerial-view-of-city-highway-1579/1080p.mp4"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-950/70 to-slate-950" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="animate-fade-up">
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/35 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-200">
              Premium vehicle renting experience
            </p>
            {user?.role === 'admin' ? (
              <>
                <h1 className="mb-5 text-5xl font-black leading-tight text-white md:text-6xl">
                  Command your fleet with real-time clarity.
                </h1>
                <p className="mb-8 max-w-xl text-lg text-slate-200">
                  Track bookings, optimize availability, and manage customer demand from one beautiful control center.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href="/admin/dashboard">
                    <Button size="lg" className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">
                      Open Admin Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/bookings">
                    <Button size="lg" variant="outline" className="border-white/30 bg-slate-950/30 text-white hover:bg-white/10">
                      Review Bookings
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="mb-5 text-5xl font-black leading-tight text-white md:text-6xl">
                  Rent smarter.
                  <br />
                  Drive in style.
                </h1>
                <p className="mb-8 max-w-xl text-lg text-slate-200">
                  Find SUVs, sedans, sports cars and vans in seconds. Smooth booking, transparent pricing, and dependable rides.
                </p>
                <Link href="#fleet">
                  <Button size="lg" className="animate-glow bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">
                    Explore Available Vehicles
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="animate-fade-up-delay">
            <div className="glass-card animated-border rounded-3xl p-4">
              <img
                src="https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Luxury sports car on road"
                onError={(e) => {
                  e.currentTarget.src = "https://picsum.photos/seed/drivehub-hero-car/1200/800";
                }}
                className="h-[320px] w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-10">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          ['24/7 Availability', 'Book any time with instant confirmations.', 'animate-fade-up'],
          ['Insured & Verified', 'All vehicles are safety-checked and insured.', 'animate-fade-up-delay'],
          ['Transparent Pricing', 'No hidden fees. Clear total before checkout.', 'animate-fade-up-delay-2'],
        ].map(([title, copy, animation]) => (
          <div key={title} className={`glass-card ${animation} rounded-2xl border border-white/20 bg-slate-900/70 p-6`}>
            <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-200">{copy}</p>
          </div>
        ))}
        </div>
      </section>

      <section id="fleet" className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: 'Luxury Sedans',
                image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=1200',
              },
              {
                title: 'SUV Adventures',
                image: 'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1200',
              },
              {
                title: 'City Commuters',
                image: 'https://images.pexels.com/photos/305070/pexels-photo-305070.jpeg?auto=compress&cs=tinysrgb&w=1200',
              },
            ].map((item) => (
              <div key={item.title} className="glass-card overflow-hidden rounded-2xl">
                <img
                  src={item.image}
                  alt={item.title}
                  onError={(e) => {
                    e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(item.title)}/900/500`;
                  }}
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Available Vehicles</h2>
            <p className="text-slate-300">Pick your perfect ride and book instantly.</p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {categoryOptions.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-all ${
                    active
                      ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                      : 'border-white/25 bg-slate-900/50 text-slate-200 hover:border-cyan-300/60 hover:text-cyan-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="glass-card rounded-2xl py-12 text-center">
              <p className="text-slate-300">Loading vehicles...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="glass-card rounded-2xl py-12 text-center">
              <p className="text-slate-300">No vehicles available for this category right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVehicles.map((vehicle) => (
                <Link key={vehicle._id} href={`/vehicles/${vehicle._id}`} className="group">
                  <div className="glass-card h-full overflow-hidden rounded-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-cyan-500/20">
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={
                          isLikelyHttpUrl(vehicle.image)
                            ? vehicle.image
                            : `https://image.pollinations.ai/prompt/${encodeURIComponent(`${vehicle.category} rental vehicle cinematic photo`)}`
                        }
                        alt={vehicle.name}
                        onError={(e) => {
                          e.currentTarget.src = `https://picsum.photos/seed/${vehicle._id}/900/600`;
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 text-xl font-bold text-white">{vehicle.name}</h3>
                      <p className="mb-4 text-sm text-slate-300">
                        {vehicle.seats} seats • {vehicle.category}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-cyan-300">{formatCurrencyRs(vehicle.pricePerDay)}</span>
                        <span className="text-sm text-slate-300">per day</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-12 border-t border-white/10 bg-slate-950/70 py-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-400 sm:px-6 lg:px-8">
          <p>DriveHub © 2026. Crafted for seamless vehicle rentals.</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return <LandingContent />;
}

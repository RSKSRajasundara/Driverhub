'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { formatCurrencyRs } from '@/lib/utils';

interface Vehicle {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  category: string;
  pricePerDay: number;
  fuelType?: string;
  transmission?: string;
  seats: number;
  available: boolean;
}

export default function AdminVehiclesPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'car',
    pricePerDay: 0,
    fuelType: 'petrol',
    transmission: 'automatic',
    seats: 5,
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchVehicles();
  }, [user, router]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getVehicles();
      setVehicles(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch vehicles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await apiClient.updateVehicle(editingId, formData);
        setEditingId(null);
      } else {
        await apiClient.createVehicle(formData);
      }
      await fetchVehicles();
      setFormVisible(false);
      resetForm();
      alert(editingId ? 'Vehicle updated successfully' : 'Vehicle added successfully');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await apiClient.deleteVehicle(id);
      await fetchVehicles();
      alert('Vehicle deleted successfully');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData({
      name: vehicle.name,
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      category: vehicle.category,
      pricePerDay: vehicle.pricePerDay,
      fuelType: vehicle.fuelType || 'petrol',
      transmission: vehicle.transmission || 'automatic',
      seats: vehicle.seats,
    });
    setEditingId(vehicle._id);
    setFormVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      category: 'car',
      pricePerDay: 0,
      fuelType: 'petrol',
      transmission: 'automatic',
      seats: 5,
    });
  };

  const handleCancel = () => {
    setFormVisible(false);
    setEditingId(null);
    resetForm();
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-white">Manage Vehicles</h1>
            <p className="text-slate-300">Add, edit, and remove vehicles from your fleet</p>
          </div>
          <Button onClick={() => setFormVisible(!formVisible)} size="lg" className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">
            {formVisible ? 'Cancel' : 'Add Vehicle'}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {formVisible && (
          <div className="glass-card mb-12 rounded-2xl p-8">
            <h2 className="mb-6 text-2xl font-bold text-white">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Vehicle Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Toyota Camry"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    placeholder="e.g., Toyota"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., Camry"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || new Date().getFullYear() })}
                    placeholder="2024"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    <option value="car">car</option>
                    <option value="bike">bike</option>
                    <option value="jeep">jeep</option>
                    <option value="van">van</option>
                    <option value="bus">bus</option>
                    <option value="sedan">sedan</option>
                    <option value="suv">suv</option>
                    <option value="compact">compact</option>
                    <option value="luxury">luxury</option>
                    <option value="economy">economy</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Price Per Day (Rs.) *</label>
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: Number(e.target.value) || 0 })}
                    placeholder="50"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    <option>petrol</option>
                    <option>diesel</option>
                    <option>hybrid</option>
                    <option>electric</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  >
                    <option>automatic</option>
                    <option>manual</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Seats</label>
                  <input
                    type="number"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: Number(e.target.value) || 1 })}
                    placeholder="5"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">{editingId ? 'Update Vehicle' : 'Add Vehicle'}</Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="border-white/30 bg-slate-900/40 text-white hover:bg-white/10">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-3 text-red-200">
            Error: {error}
          </div>
        )}

        {/* Vehicles List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-300">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="mb-4 text-slate-300">No vehicles in your fleet yet</p>
            <Button onClick={() => setFormVisible(true)} className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">Add First Vehicle</Button>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto rounded-2xl p-2">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/15">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Category</th>
                  <th className="text-left py-3 px-4 font-semibold">Price/Day</th>
                  <th className="text-left py-3 px-4 font-semibold">Seats</th>
                  <th className="text-left py-3 px-4 font-semibold">Fuel Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4">{vehicle.name}</td>
                    <td className="py-4 px-4">{vehicle.category}</td>
                    <td className="py-4 px-4">{formatCurrencyRs(vehicle.pricePerDay)}</td>
                    <td className="py-4 px-4">{vehicle.seats}</td>
                    <td className="py-4 px-4">{vehicle.fuelType}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${vehicle.available ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                        {vehicle.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(vehicle)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(vehicle._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

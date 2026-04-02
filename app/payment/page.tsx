'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { compressImageForOcr, imageFileToDataUrl } from '@/lib/image-file';
import { formatCurrencyRs } from '@/lib/utils';
import Tesseract from 'tesseract.js';

interface Vehicle {
  _id: string;
  name: string;
  pricePerDay: number;
  category: string;
  image?: string;
}

type PaymentMethod = 'card' | 'wallet' | 'bank' | 'cash';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const vehicleId = searchParams.get('vehicleId') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const pickupLocation = searchParams.get('pickupLocation') || '';
  const dropoffLocation = searchParams.get('dropoffLocation') || '';

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [bankRef, setBankRef] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [address, setAddress] = useState('');
  const [identityCardImage, setIdentityCardImage] = useState('');
  const [identityCardImageName, setIdentityCardImageName] = useState('');
  const [identityCardOcrText, setIdentityCardOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!vehicleId) {
      setLoadingVehicle(false);
      return;
    }

    const loadVehicle = async () => {
      try {
        setLoadingVehicle(true);
        const data = await apiClient.getVehicle(vehicleId);
        setVehicle(data);
      } catch (error) {
        console.error('Failed to load vehicle for payment:', error);
      } finally {
        setLoadingVehicle(false);
      }
    };

    loadVehicle();
  }, [router, user, vehicleId]);

  const days = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const rawDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Number.isFinite(rawDays) && rawDays > 0 ? rawDays : 1;
  }, [startDate, endDate]);

  const subtotal = (vehicle?.pricePerDay || 0) * days;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;
  const needsNicNumber = !user?.nicNumber?.trim();
  const needsAddress = !user?.address?.trim();
  const needsIdentityCardImage = !user?.identityCardImage?.trim();
  const missingKyc = needsNicNumber || needsAddress || needsIdentityCardImage;

  useEffect(() => {
    if (!user) {
      return;
    }

    setNicNumber((prev) => prev || String(user.nicNumber || '').trim());
    setAddress((prev) => prev || String(user.address || '').trim());
    setIdentityCardImage((prev) => prev || String(user.identityCardImage || '').trim());
  }, [user]);

  const handleIdentityCardFileChange = async (file: File | null) => {
    if (!file) {
      setIdentityCardImage('');
      setIdentityCardImageName('');
      setIdentityCardOcrText('');
      return;
    }

    try {
      const encoded = await imageFileToDataUrl(file, 4);
      const optimized = await compressImageForOcr(encoded, 1200, 0.92);
      const finalImage = optimized || encoded;
      setIdentityCardImage(finalImage);
      setIdentityCardImageName(file.name);
      setIdentityCardOcrText('');

      setOcrLoading(true);
      const ocrResult = await Tesseract.recognize(finalImage, 'eng');
      const text = String(ocrResult?.data?.text || '').trim();
      setIdentityCardOcrText(text);
    } catch (error: any) {
      setIdentityCardImage('');
      setIdentityCardImageName('');
      setIdentityCardOcrText('');
      alert(error.message || 'Failed to process selected identity image.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!user || !vehicleId || !startDate || !endDate || !pickupLocation || !dropoffLocation) {
      alert('Missing booking details. Please go back and try again.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !cardName.trim() || !expiry.trim() || !cvv.trim()) {
        alert('Please complete all card details.');
        return;
      }
    }
    if (paymentMethod === 'wallet' && !walletNumber.trim()) {
      alert('Please enter your wallet number.');
      return;
    }
    if (paymentMethod === 'bank' && !bankRef.trim()) {
      alert('Please enter your bank transfer reference.');
      return;
    }

    if (!nicNumber.trim() || !address.trim() || !identityCardImage.trim()) {
      alert('NIC number, address, and identity card image are required before booking.');
      return;
    }

    if (!identityCardOcrText.trim()) {
      alert('Could not read text from the uploaded ID card. Please upload a clearer image.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.createBooking({
        vehicleId,
        userId: user.id,
        startDate,
        endDate,
        pickupLocation,
        dropoffLocation,
        nicNumber: nicNumber.trim(),
        address: address.trim(),
        identityCardImage: identityCardImage.trim(),
        ocrText: identityCardOcrText.trim(),
      });

      alert('Payment successful and booking confirmed!');
      router.push('/dashboard');
    } catch (error: any) {
      alert(`Failed to complete payment: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        Loading payment details...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="glass-card w-full max-w-lg rounded-2xl p-8 text-center text-slate-200">
          <h1 className="mb-2 text-2xl font-bold text-white">Payment details unavailable</h1>
          <p className="mb-6 text-slate-300">Please return and select a vehicle again.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950">Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-cyan-300">
            DriveHub
          </Link>
          <Link href={`/vehicles/${vehicleId}`}>
            <Button variant="outline" className="border-white/30 bg-slate-900/50 text-white hover:bg-white/10">
              Back to Vehicle
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <section className="glass-card rounded-2xl p-6 lg:col-span-2">
          <h1 className="mb-1 text-3xl font-bold text-white">Payment</h1>
          <p className="mb-6 text-slate-300">Choose your payment method and complete booking.</p>

          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { id: 'card', label: 'Card' },
              { id: 'wallet', label: 'Wallet' },
              { id: 'bank', label: 'Bank Transfer' },
              { id: 'cash', label: 'Cash at Pickup' },
            ].map((method) => {
              const active = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                      : 'border-white/20 bg-slate-900/50 text-slate-200 hover:border-cyan-300/60'
                  }`}
                >
                  {method.label}
                </button>
              );
            })}
          </div>

          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">Card Number</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1111"
                  className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Cardholder Name</label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Expiry</label>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">CVV</label>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div>
              <label className="mb-2 block text-sm font-semibold">Wallet Number</label>
              <input
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                placeholder="e.g., +94 77 123 4567"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
              />
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div>
              <label className="mb-2 block text-sm font-semibold">Bank Transfer Reference</label>
              <input
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="Transaction reference ID"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
              />
            </div>
          )}

          {paymentMethod === 'cash' && (
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              You will pay the total amount in cash when you pick up the vehicle.
            </p>
          )}

          <div className="mt-6 space-y-4 rounded-xl border border-amber-300/40 bg-amber-400/10 p-4">
            <p className="text-sm text-amber-100">
              {missingKyc
                ? 'Complete these required profile details to confirm booking.'
                : 'Review or update your identity details before confirming booking.'}
            </p>
            <div>
              <label className="mb-2 block text-sm font-semibold">NIC Number</label>
              <input
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                placeholder="e.g., 200012345678"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your full address"
                rows={3}
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Identity Card Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleIdentityCardFileChange(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white"
              />
              {identityCardImageName && (
                <p className="mt-1 text-xs text-emerald-300">Selected: {identityCardImageName}</p>
              )}
              {identityCardImage && (
                <img
                  src={identityCardImage}
                  alt="Identity card preview"
                  className="mt-2 h-28 w-full rounded-md border border-white/20 object-cover"
                />
              )}
            </div>
          </div>

          <Button
            onClick={handleConfirmPayment}
            disabled={submitting || ocrLoading}
            className="mt-8 w-full bg-gradient-to-r from-cyan-400 to-violet-500 py-6 text-lg text-slate-950"
          >
            {submitting ? 'Processing Payment...' : ocrLoading ? 'Scanning ID...' : `Pay ${formatCurrencyRs(total)} and Confirm Booking`}
          </Button>
        </section>

        <aside className="glass-card rounded-2xl p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Booking Summary</h2>
          <div className="space-y-3 text-sm">
            <p className="text-slate-300">
              <span className="font-semibold text-white">Vehicle:</span> {vehicle.name}
            </p>
            <p className="text-slate-300">
              <span className="font-semibold text-white">Category:</span> {vehicle.category}
            </p>
            <p className="text-slate-300">
              <span className="font-semibold text-white">Pickup:</span> {startDate} ({pickupLocation})
            </p>
            <p className="text-slate-300">
              <span className="font-semibold text-white">Return:</span> {endDate} ({dropoffLocation})
            </p>
          </div>

          <div className="mt-6 border-t border-white/15 pt-4">
            <div className="mb-2 flex justify-between text-slate-300">
              <span>Subtotal ({days} days)</span>
              <span>{formatCurrencyRs(subtotal)}</span>
            </div>
            <div className="mb-3 flex justify-between text-slate-300">
              <span>Service Fee</span>
              <span>{formatCurrencyRs(serviceFee)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-cyan-300">
              <span>Total</span>
              <span>{formatCurrencyRs(total)}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
          Loading payment...
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

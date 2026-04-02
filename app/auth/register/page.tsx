'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { compressImageForOcr, imageFileToDataUrl } from '@/lib/image-file';
import Tesseract from 'tesseract.js';

type VerificationBadgeState =
  | 'idle'
  | 'incomplete'
  | 'checking'
  | 'matched'
  | 'name-mismatch'
  | 'nic-mismatch'
  | 'both-mismatch'
  | 'scan-failed';

function badgeUi(state: VerificationBadgeState): { text: string; className: string } {
  switch (state) {
    case 'incomplete':
      return {
        text: 'Add both NIC number and ID image to verify before submit.',
        className: 'border-amber-400/60 bg-amber-500/10 text-amber-200',
      };
    case 'checking':
      return {
        text: 'Checking ID card against Name and NIC...',
        className: 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200',
      };
    case 'matched':
      return {
        text: 'ID verification passed. Name and NIC match.',
        className: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200',
      };
    case 'name-mismatch':
      return {
        text: "Name does not match the uploaded ID card.",
        className: 'border-red-400/60 bg-red-500/10 text-red-200',
      };
    case 'nic-mismatch':
      return {
        text: "NIC does not match the uploaded ID card.",
        className: 'border-red-400/60 bg-red-500/10 text-red-200',
      };
    case 'both-mismatch':
      return {
        text: "Name and NIC do not match the uploaded ID card.",
        className: 'border-red-400/60 bg-red-500/10 text-red-200',
      };
    case 'scan-failed':
      return {
        text: 'Could not scan the ID card clearly. Upload a clearer image.',
        className: 'border-red-400/60 bg-red-500/10 text-red-200',
      };
    default:
      return {
        text: 'Optional: Add NIC and ID image for pre-check before submit.',
        className: 'border-white/20 bg-white/5 text-slate-300',
      };
  }
}

function mapReasonToState(reason: string): VerificationBadgeState {
  const normalized = reason.toLowerCase();
  if (normalized.includes('name and nic')) return 'both-mismatch';
  if (normalized.includes('name') && normalized.includes("doesn't match")) return 'name-mismatch';
  if (normalized.includes('nic') && normalized.includes("doesn't match")) return 'nic-mismatch';
  if (
    normalized.includes('could not read') ||
    normalized.includes('failed to scan') ||
    normalized.includes('taking too long')
  ) {
    return 'scan-failed';
  }
  return 'scan-failed';
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [nicNumber, setNicNumber] = useState('');
  const [address, setAddress] = useState('');
  const [identityCardImage, setIdentityCardImage] = useState('');
  const [identityCardImageName, setIdentityCardImageName] = useState('');
  const [identityCardOcrText, setIdentityCardOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationState, setVerificationState] = useState<VerificationBadgeState>('idle');

  const trimmedName = name.trim();
  const trimmedNic = nicNumber.trim();
  const trimmedImage = identityCardImage.trim();
  const trimmedOcrText = identityCardOcrText.trim();

  const hasAnyIdVerificationInput = !!(trimmedNic || trimmedImage);
  const hasAllIdVerificationInput = !!(trimmedNic && trimmedImage);
  const canRunVerification = !!(trimmedName && hasAllIdVerificationInput && trimmedOcrText);

  const verificationUi = useMemo(() => badgeUi(verificationState), [verificationState]);

  useEffect(() => {
    if (!hasAnyIdVerificationInput) {
      setVerificationState('idle');
      return;
    }

    if (!hasAllIdVerificationInput) {
      setVerificationState('incomplete');
      return;
    }

    if (!trimmedName) {
      setVerificationState('incomplete');
      return;
    }

    if (!trimmedOcrText) {
      setVerificationState(ocrLoading ? 'checking' : 'scan-failed');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setVerificationState('checking');
      try {
        const response = await fetch('/api/auth/verify-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            nicNumber: trimmedNic,
            identityCardImage: trimmedImage,
            ocrText: trimmedOcrText,
          }),
        });

        const data = await response.json();
        if (cancelled) return;

        if (response.ok && data?.valid) {
          setVerificationState('matched');
          return;
        }

        setVerificationState(mapReasonToState(String(data?.reason || '')));
      } catch {
        if (!cancelled) {
          setVerificationState('scan-failed');
        }
      }
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmedName, trimmedNic, trimmedImage, trimmedOcrText, hasAnyIdVerificationInput, hasAllIdVerificationInput, ocrLoading]);

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
      setError('');

      setOcrLoading(true);
      const ocrResult = await Tesseract.recognize(finalImage, 'eng');
      const text = String(ocrResult?.data?.text || '').trim();
      setIdentityCardOcrText(text);
    } catch (err: any) {
      setIdentityCardImage('');
      setIdentityCardImageName('');
      setIdentityCardOcrText('');
      setError(err.message || 'Failed to process selected image file.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (hasAnyIdVerificationInput && !hasAllIdVerificationInput) {
      setError(
        'To verify identity during registration, please provide NIC number and identity card image together.'
      );
      return;
    }

    if (canRunVerification && verificationState !== 'matched') {
      if (verificationState === 'checking') {
        setError('Please wait until ID verification finishes.');
      } else if (verificationState === 'name-mismatch') {
        setError("Name doesn't match the uploaded ID card.");
      } else if (verificationState === 'nic-mismatch') {
        setError("NIC doesn't match the uploaded ID card.");
      } else if (verificationState === 'both-mismatch') {
        setError("Name and NIC don't match the uploaded ID card.");
      } else {
        setError('ID verification failed. Please upload a clearer ID card image and ensure values match.');
      }
      return;
    }

    if (hasAllIdVerificationInput && !trimmedOcrText) {
      setError('Could not read text from the uploaded ID card. Please upload a clearer image.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, phone, nicNumber, address, identityCardImage, trimmedOcrText);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover opacity-60"
        src="/videos/bmw-login-register.mp4"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-slate-950/52" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/35 via-slate-950/15 to-slate-950/45" />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="rounded-2xl border border-white/25 bg-slate-950/70 p-8 shadow-[0_20px_60px_rgba(2,6,23,0.62)] backdrop-blur-md">
          <h1 className="mb-2 text-center text-3xl font-bold text-cyan-300">DriveHub</h1>
          <h2 className="mb-6 text-center text-xl font-semibold text-slate-200">
            Create Your Account
          </h2>

          {error && (
            <div className="mb-6 rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-3 text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="123-456-7890"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                NIC Number (Optional)
              </label>
              <input
                type="text"
                value={nicNumber}
                onChange={(e) => setNicNumber(e.target.value)}
                placeholder="e.g., 200012345678"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Address (Optional)
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your home address"
                rows={3}
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Identity Card Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleIdentityCardFileChange(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
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
              <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${verificationUi.className}`}>
                {verificationUi.text}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                If you add an ID card image, NIC is required and registration proceeds only when Name and NIC match the card.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || verificationState === 'checking' || ocrLoading}
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-cyan-300 hover:underline">
              Login
            </Link>
          </p>

          <Link href="/">
            <p className="mt-4 text-center text-sm text-cyan-300 hover:underline">
              Back to Home
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      router.push(loggedInUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
            Login to Your Account
          </h2>

          {error && (
            <div className="mb-6 rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-3 text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/20 bg-slate-900/65 px-4 py-2 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-cyan-300 hover:underline">
              Sign up
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

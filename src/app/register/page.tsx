'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Mail, Lock, User, Phone, ShieldAlert, Users } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'USER' | 'VOLUNTEER'>('USER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'VOLUNTEER') {
      setRole('VOLUNTEER');
    } else {
      setRole('USER');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080710]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none -z-10" />

        <div className="w-full max-w-md p-8 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white mb-2">Create Account</h1>
            <p className="text-gray-400 text-sm">Join AURA safety and response network</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
              {success}
            </div>
          )}

          <div className="flex gap-4 p-1 rounded-xl bg-white/5 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => setRole('USER')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${role === 'USER' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white bg-transparent'}`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              General User
            </button>
            <button
              type="button"
              onClick={() => setRole('VOLUNTEER')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 ${role === 'VOLUNTEER' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white bg-transparent'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Volunteer Responder
            </button>
          </div>

          {role === 'VOLUNTEER' && (
            <div className="mb-6 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 text-xs leading-relaxed">
              <strong>Volunteer Notice:</strong> Your account will register under a pending verification state. An administrator will review your profile to approve you as an active responder.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                />
                <User className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                />
                <Phone className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:scale-102 active:scale-98 disabled:opacity-50 disabled:scale-100 transition-all duration-300 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:underline font-semibold">
              Sign In here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080710] flex items-center justify-center text-gray-400">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

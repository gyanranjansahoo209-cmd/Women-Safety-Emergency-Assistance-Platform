'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(8,7,16,0.7)] px-6 py-4 mx-4 my-2 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-tr from-indigo-500 to-pink-500 p-2 rounded-lg text-white shadow-lg group-hover:scale-105 transition-all duration-300">
            <Shield className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Women Safety
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {currentUser ? (
            <>
              <Link
                href={`/dashboard/${currentUser.role.toLowerCase()}`}
                className="text-gray-300 hover:text-white transition-all text-sm font-medium hover:scale-102 flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                Dashboard
              </Link>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 py-1.5 px-3 rounded-full text-xs font-semibold text-gray-200">
                <div className={`w-1.5 h-1.5 rounded-full ${currentUser.role === 'ADMIN' ? 'bg-indigo-400' : currentUser.role === 'VOLUNTEER' ? 'bg-emerald-400' : 'bg-pink-400'} animate-pulse`} />
                {currentUser.name} ({currentUser.role})
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-rose-400 transition-all text-sm font-medium flex items-center gap-1.5 hover:scale-102 cursor-pointer bg-transparent border-0"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </>
          ) : (
            !loading && (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-all text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 px-5 rounded-lg shadow-lg hover:shadow-indigo-500/20 hover:scale-102 active:scale-98 transition-all"
                >
                  Join Network
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white transition-colors bg-transparent border-0"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Links */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/5 flex flex-col gap-4">
          {currentUser ? (
            <>
              <div className="text-sm text-gray-400 font-semibold px-2">
                Signed in as: <span className="text-white">{currentUser.name}</span> ({currentUser.role})
              </div>
              <Link
                href={`/dashboard/${currentUser.role.toLowerCase()}`}
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition-all text-sm font-medium px-2 py-1.5 rounded hover:bg-white/5"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="text-rose-400 hover:text-rose-300 transition-all text-sm font-medium text-left px-2 py-1.5 rounded hover:bg-white/5 cursor-pointer bg-transparent border-0"
              >
                Log Out
              </button>
            </>
          ) : (
            !loading && (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-300 hover:text-white transition-all text-sm font-medium px-2 py-1.5 rounded hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2 px-4 rounded-lg text-center"
                >
                  Join Network
                </Link>
              </>
            )
          )}
        </div>
      )}
    </nav>
  );
}

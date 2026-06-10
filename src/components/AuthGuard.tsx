"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!mounted) return;
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        // allowed
      } catch (e) {
        router.replace('/login');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-sm text-gray-400">Checking authentication...</div>
      </div>
    );
  }

  return <>{children}</>;
}

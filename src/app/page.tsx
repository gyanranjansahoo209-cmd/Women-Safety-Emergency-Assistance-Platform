import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Shield, Eye, MapPin, Users, Heart, ArrowRight } from 'lucide-react';
import { getAuthUserFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await getAuthUserFromCookies();
  if (!user) {
    redirect('/login');
  }
  return (
    <div className="flex flex-col min-h-screen bg-[#080710] selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[600px] md:h-[600px] rounded-full bg-indigo-500/10 blur-[80px] md:blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full bg-pink-500/5 blur-[80px] md:blur-[120px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card border border-white/5 text-xs text-indigo-300 font-medium mb-6 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          Trusted Community-Led Security
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-8 bg-gradient-to-b from-white via-gray-200 to-indigo-200 bg-clip-text text-transparent">
          Empowering Personal Safety Through <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Instant Connection</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl leading-relaxed mb-12">
          AURA bridges the gap during critical moments. Trigger one-click panic alerts, share live GPS locations, and mobilize nearby verified volunteers and safe havens instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/20 hover:scale-103 active:scale-97 transition-all duration-300"
          >
            Get Protected Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register?role=VOLUNTEER"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 glass-panel hover:bg-white/10 text-gray-200 font-semibold py-3.5 px-8 rounded-xl border border-white/10 hover:border-white/20 hover:scale-103 active:scale-97 transition-all duration-300"
          >
            Become a Responder
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl glass-panel border border-white/5 bg-gradient-to-r from-indigo-950/20 to-purple-950/20">
          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-indigo-400 to-purple-300 bg-clip-text text-transparent">10k+</h3>
            <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider">Protected Users</p>
          </div>
          <div className="text-center border-l border-white/5">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-indigo-400 to-purple-300 bg-clip-text text-transparent">1.2k+</h3>
            <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider">Verified Volunteers</p>
          </div>
          <div className="text-center border-l border-white/5">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-indigo-400 to-purple-300 bg-clip-text text-transparent">150+</h3>
            <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider">Safe Zones Map</p>
          </div>
          <div className="text-center border-l border-white/5">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-2 bg-gradient-to-r from-indigo-400 to-purple-300 bg-clip-text text-transparent">&lt;3m</h3>
            <p className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-wider">Avg Response Time</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-20 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
            Designed for Critical <span className="bg-gradient-to-r from-rose-400 to-pink-500 bg-clip-text text-transparent">Response Speed</span>
          </h2>
          <p className="text-gray-400 text-md md:text-lg">
            Every second counts during an emergency. AURA is optimized for single-tap triggers, immediate volunteer geofencing, and rapid dispatch workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col hover:scale-102 transition-transform duration-300">
            <div className="bg-rose-500/10 p-4 rounded-xl text-rose-400 w-fit mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">One-Click SOS Panic Button</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Activate an immediate alert from any responsive desktop or mobile browser. It broadcasts your live coordinates instantly, bypassing delayed setup menus.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col hover:scale-102 transition-transform duration-300">
            <div className="bg-indigo-500/10 p-4 rounded-xl text-indigo-400 w-fit mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Nearby Verified Volunteers</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              We geofence online, background-checked responders within a 5km radius. They receive high-priority alerts with map routing, enabling community-supported action.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col hover:scale-102 transition-transform duration-300">
            <div className="bg-blue-500/10 p-4 rounded-xl text-blue-400 w-fit mb-6">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Safe Haven Mapping</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Identify and navigate to local Safe Zones (including verified hospitals, police stations, and community sanctuaries) populated dynamically on your live maps.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-white/5 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} AURA Safety Network. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-indigo-400 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-indigo-400 transition-colors">Create Account</Link>
            <Link href="/register?role=VOLUNTEER" className="hover:text-indigo-400 transition-colors">Volunteer Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

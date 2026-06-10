'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { Users, ShieldAlert, CheckCircle, MapPin, Trash2, Plus, RefreshCw, BadgeAlert } from 'lucide-react';

export default function AdminDashboard() {
  // Stats
  const [stats, setStats] = useState<any>({
    users: { total: 0, victims: 0, volunteers: 0 },
    alerts: { total: 0, active: 0, resolved: 0, cancelled: 0 },
    volunteers: { pending: 0, verified: 0 },
  });

  // Volunteers management
  const [volunteers, setVolunteers] = useState<any[]>([]);

  // Safe zones management
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [newZone, setNewZone] = useState({ name: '', address: '', latitude: '', longitude: '', type: 'POLICE', contactNumber: '' });
  const [zoneError, setZoneError] = useState('');

  // Active Incidents
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/admin/stats', { credentials: 'include' });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      // 2. Fetch volunteers list
      const volunteersRes = await fetch('/api/admin/volunteers', { credentials: 'include' });
      if (volunteersRes.ok) {
        const data = await volunteersRes.json();
        setVolunteers(data.volunteers || []);
      }

      // 3. Fetch safe zones
      const safeZonesRes = await fetch('/api/admin/safezones', { credentials: 'include' });
      if (safeZonesRes.ok) {
        const data = await safeZonesRes.json();
        setSafeZones(data.safeZones || []);
      }

      // 4. Fetch active alerts
      const activeAlertsRes = await fetch('/api/alerts?filter=active', { credentials: 'include' });
      if (activeAlertsRes.ok) {
        const data = await activeAlertsRes.json();
        setActiveAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error('Failed to load admin dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  // Approve/Verify Volunteer
  const handleVerifyVolunteer = async (userId: string, verify: boolean) => {
    try {
      const res = await fetch('/api/admin/volunteers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isVerified: verify }),
      });

      if (res.ok) {
        setVolunteers(
          volunteers.map((v) =>
            v._id === userId ? { ...v, profile: { ...v.profile, isVerified: verify } } : v
          )
        );
        // Refresh stats
        const statsRes = await fetch('/api/admin/stats', { credentials: 'include' });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Safe Zone
  const handleAddSafeZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setZoneError('');

    const latNum = parseFloat(newZone.latitude);
    const lngNum = parseFloat(newZone.longitude);

    if (!newZone.name || isNaN(latNum) || isNaN(lngNum) || !newZone.type) {
      setZoneError('Please fill in Name, Type, and Valid Coordinates');
      return;
    }

    try {
      const res = await fetch('/api/admin/safezones', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newZone.name,
          address: newZone.address,
          latitude: latNum,
          longitude: lngNum,
          type: newZone.type,
          contactNumber: newZone.contactNumber,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSafeZones([data.safeZone, ...safeZones]);
        setNewZone({ name: '', address: '', latitude: '', longitude: '', type: 'POLICE', contactNumber: '' });
      } else {
        setZoneError(data.error || 'Failed to create Safe Zone');
      }
    } catch (err) {
      setZoneError('Network error adding Safe Zone');
    }
  };

  // Delete Safe Zone
  const handleDeleteSafeZone = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Safe Zone?')) return;

    try {
      const res = await fetch(`/api/admin/safezones?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setSafeZones(safeZones.filter((sz) => sz._id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-[#080710]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Header and Refresh */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white">Admin Operations Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">Global oversight and network coordination</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Control
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-panel border border-white/5 bg-gradient-to-br from-indigo-950/10 to-transparent text-left">
            <div className="text-indigo-400 p-2 bg-indigo-500/10 rounded-lg w-fit mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">{stats.users.total}</h3>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-1">Total Members</p>
            <p className="text-[10px] text-gray-500 mt-2">
              {stats.users.victims} Users &bull; {stats.users.volunteers} Volunteers
            </p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5 bg-gradient-to-br from-rose-950/10 to-transparent text-left">
            <div className="text-rose-400 p-2 bg-rose-500/10 rounded-lg w-fit mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-extrabold text-rose-500">{stats.alerts.active}</h3>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-1">Active Emergencies</p>
            <p className="text-[10px] text-gray-500 mt-2">Immediate geofencing mobilized</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5 bg-gradient-to-br from-emerald-950/10 to-transparent text-left">
            <div className="text-emerald-400 p-2 bg-emerald-500/10 rounded-lg w-fit mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">{stats.alerts.resolved}</h3>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-1">Resolved Incidents</p>
            <p className="text-[10px] text-gray-500 mt-2">{stats.alerts.cancelled} Alerts cancelled by users</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5 bg-gradient-to-br from-purple-950/10 to-transparent text-left">
            <div className="text-purple-400 p-2 bg-purple-500/10 rounded-lg w-fit mb-3">
              <BadgeAlert className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">{stats.volunteers.pending}</h3>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mt-1">Pending Approvals</p>
            <p className="text-[10px] text-gray-500 mt-2">{stats.volunteers.verified} Verified responders active</p>
          </div>
        </div>

        {/* Content Row 1: Active Emergencies & Volunteer approvals */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active alerts panel */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col min-h-[300px]">
            <h3 className="font-bold text-md text-white mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Live Incidents Dispatch Board
            </h3>

            {activeAlerts.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <CheckCircle className="w-8 h-8 text-emerald-500/30 mb-2" />
                <p className="text-xs text-gray-500">No active emergency alerts currently on the network.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/5 pb-2">
                      <th className="py-2.5 font-bold uppercase">Victim</th>
                      <th className="py-2.5 font-bold uppercase">Phone</th>
                      <th className="py-2.5 font-bold uppercase">Location</th>
                      <th className="py-2.5 font-bold uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAlerts.map((alertItem) => (
                      <tr key={alertItem._id} className="border-b border-white/5 text-gray-200">
                        <td className="py-3 font-bold">{alertItem.userId?.name}</td>
                        <td className="py-3">{alertItem.userId?.phone}</td>
                        <td className="py-3">
                          {alertItem.location.coordinates[1].toFixed(4)}, {alertItem.location.coordinates[0].toFixed(4)}
                        </td>
                        <td className="py-3">
                          <span className="bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 py-0.5 px-2 rounded-full uppercase text-[10px]">
                            {alertItem.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Volunteer registration and approval panel */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col min-h-[300px]">
            <h3 className="font-bold text-md text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Responder Approvals
            </h3>

            {volunteers.filter((v) => !v.profile?.isVerified).length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <CheckCircle className="w-8 h-8 text-indigo-500/30 mb-2" />
                <p className="text-xs text-gray-500">No pending volunteer registrations needing verification.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/5 pb-2">
                      <th className="py-2.5 font-bold uppercase">Volunteer</th>
                      <th className="py-2.5 font-bold uppercase">Contact</th>
                      <th className="py-2.5 font-bold uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers
                      .filter((v) => !v.profile?.isVerified)
                      .map((vol) => (
                        <tr key={vol._id} className="border-b border-white/5 text-gray-200">
                          <td className="py-3">
                            <p className="font-bold text-white">{vol.name}</p>
                            <p className="text-[10px] text-gray-500">{vol.email}</p>
                          </td>
                          <td className="py-3">{vol.phone}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {vol.profile?.verificationRequested && (
                                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 py-1 px-2 rounded-full border border-orange-500/20">
                                  Requested
                                </span>
                              )}
                              <button
                                onClick={() => handleVerifyVolunteer(vol._id, true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded-lg text-[10px] font-bold shadow transition-colors cursor-pointer border-0"
                              >
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Content Row 2: Safe Zones manager */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Safe zones database list */}
          <div className="md:col-span-2 p-6 rounded-2xl glass-panel border border-white/5 flex flex-col min-h-[320px]">
            <h3 className="font-bold text-md text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              Verified Safe Zones Database ({safeZones.length})
            </h3>

            {safeZones.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                <MapPin className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-xs text-gray-500">No Safe Zones registered. Add safe havens below.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[300px] pr-1">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/5 pb-2">
                      <th className="py-2.5 font-bold uppercase">Name</th>
                      <th className="py-2.5 font-bold uppercase">Type</th>
                      <th className="py-2.5 font-bold uppercase">Coordinates</th>
                      <th className="py-2.5 font-bold uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeZones.map((sz) => (
                      <tr key={sz._id} className="border-b border-white/5 text-gray-200">
                        <td className="py-3">
                          <p className="font-bold text-white">{sz.name}</p>
                          <p className="text-[10px] text-gray-500">{sz.address || 'No Address'}</p>
                        </td>
                        <td className="py-3">
                          <span className="bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 py-0.5 px-2 rounded-full uppercase text-[9px]">
                            {sz.type}
                          </span>
                        </td>
                        <td className="py-3">
                          {sz.location.coordinates[1].toFixed(4)}, {sz.location.coordinates[0].toFixed(4)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteSafeZone(sz._id)}
                            className="text-gray-500 hover:text-rose-400 p-1.5 rounded transition-colors bg-transparent border-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Safe Zone form */}
          <div className="md:col-span-1 p-6 rounded-2xl glass-panel border border-white/5">
            <h3 className="font-bold text-md text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Add Safe Zone
            </h3>

            {zoneError && <p className="text-xs text-rose-400 font-semibold mb-3">{zoneError}</p>}

            <form onSubmit={handleAddSafeZone} className="flex flex-col gap-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Safe Zone Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Police Station Sector-5"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Main Ring Road, Block B"
                  value={newZone.address}
                  onChange={(e) => setNewZone({ ...newZone, address: e.target.value })}
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Latitude *</label>
                  <input
                    type="text"
                    required
                    placeholder="28.6139"
                    value={newZone.latitude}
                    onChange={(e) => setNewZone({ ...newZone, latitude: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Longitude *</label>
                  <input
                    type="text"
                    required
                    placeholder="77.2090"
                    value={newZone.longitude}
                    onChange={(e) => setNewZone({ ...newZone, longitude: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Type *</label>
                  <select
                    value={newZone.type}
                    onChange={(e) => setNewZone({ ...newZone, type: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50 bg-[#080710]"
                  >
                    <option value="POLICE">POLICE</option>
                    <option value="HOSPITAL">HOSPITAL</option>
                    <option value="COMMUNITY_CENTER">COMMUNITY CENTER</option>
                    <option value="SAFE_HOUSE">SAFE HOUSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Contact Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 or 911"
                    value={newZone.contactNumber}
                    onChange={(e) => setNewZone({ ...newZone, contactNumber: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-colors cursor-pointer border-0"
              >
                Register Safe Haven
              </button>
            </form>
          </div>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}

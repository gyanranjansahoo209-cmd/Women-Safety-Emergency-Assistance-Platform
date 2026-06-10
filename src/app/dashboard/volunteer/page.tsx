'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { ToggleLeft, ToggleRight, ShieldAlert, Phone, MapPin, Eye, Bell, CheckCircle } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

const defaultCenter: [number, number] = [28.6139, 77.209];

export default function VolunteerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [coords, setCoords] = useState<[number, number] | null>(null);

  // Incidents
  const [nearbyAlerts, setNearbyAlerts] = useState<any[]>([]);
  const [assignedAlerts, setAssignedAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [newSOS, setNewSOS] = useState<boolean>(false);
  const latestNearbyRef = useRef<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Initial load
  useEffect(() => {
    fetchProfile();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/volunteers/status', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsOnline(data.profile?.isOnline || false);
        
        if (data.profile?.isOnline) {
          startTrackingLocation();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startTrackingLocation = () => {
    if (watchIdRef.current !== null) return;

    if (navigator.geolocation) {
      // Get initial position
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords([latitude, longitude]);
        await updateStatusOnBackend(true, latitude, longitude);
      });

      // Watch for position updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords([latitude, longitude]);
          await updateStatusOnBackend(true, latitude, longitude);
        },
        (err) => console.warn('Error watching position', err),
        { enableHighAccuracy: true }
      );
    }
  };

  const stopTrackingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    updateStatusOnBackend(false);
  };

  const updateStatusOnBackend = async (online: boolean, lat?: number, lng?: number) => {
    try {
      await fetch('/api/volunteers/status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOnline: online,
          latitude: lat,
          longitude: lng,
        }),
      });
    } catch (e) {
      console.error('Failed to sync location with server', e);
    }
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    if (nextState) {
      startTrackingLocation();
    } else {
      stopTrackingLocation();
    }
  };

  // Poll alerts only when online
  useEffect(() => {
    if (!isOnline) {
      setNearbyAlerts([]);
      setAssignedAlerts([]);
      setSelectedAlert(null);
      latestNearbyRef.current = null;
      return;
    }

    // immediate fetch then interval
    fetchAlerts();
    const pollInterval = setInterval(() => {
      fetchAlerts();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isOnline, coords]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const newNearby = data.nearbyAlerts || [];
        const newAssigned = data.assignedAlerts || [];

        // detect new nearby SOS: compare first nearby alert id
        const firstId = newNearby.length > 0 ? newNearby[0]._id : null;
        if (firstId && latestNearbyRef.current && firstId !== latestNearbyRef.current) {
          setNewSOS(true);
          setTimeout(() => setNewSOS(false), 6000);
        }
        latestNearbyRef.current = firstId;

        setNearbyAlerts(newNearby);
        setAssignedAlerts(newAssigned);

        // Sync selected alert
        if (selectedAlert) {
          const current = data.assignedAlerts?.find((a: any) => a._id === selectedAlert._id) || 
                          data.nearbyAlerts?.find((a: any) => a._id === selectedAlert._id);
          if (current) {
            setSelectedAlert(current);
          } else {
            setSelectedAlert(null); // Alert resolved or cancelled
          }
        }
      }
    } catch (e) {
      console.error('Error fetching alerts', e);
    }
  };

  // Actions
  const acceptAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/respond`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchAlerts();
        // Select accepted alert to show details
        const accepted = nearbyAlerts.find((a) => a._id === alertId);
        if (accepted) {
          setSelectedAlert({ ...accepted, responderStatus: 'ACCEPTED' });
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to accept alert');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateResponseStatus = async (alertId: string, status: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/respond`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await fetchAlerts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update response status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compile markers
  const getMapMarkers = () => {
    const markers: any[] = [];

    // Volunteer location
    if (coords) {
      markers.push({
        id: 'volunteer_current',
        position: coords,
        title: 'You (Online)',
        description: 'Your location is active in dispatch grid',
        iconType: 'volunteer',
      });
    }

    // Nearby pending alerts
    nearbyAlerts.forEach((a) => {
      markers.push({
        id: a._id,
        position: [a.location.coordinates[1], a.location.coordinates[0]],
        title: 'EMERGENCY ALERT',
        description: `Triggered by ${a.userId?.name || 'User'}`,
        iconType: 'incident',
      });
    });

    // Active accepted alerts
    assignedAlerts.forEach((a) => {
      markers.push({
        id: a._id,
        position: [a.location.coordinates[1], a.location.coordinates[0]],
        title: `RESPONDING: ${a.userId?.name || 'User'}`,
        description: `Victim contact: ${a.userId?.phone || 'N/A'}`,
        iconType: 'incident',
      });
    });

    return markers;
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-[#080710]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid md:grid-cols-3 gap-6">
        {/* Left column: Status & Alert Stream */}
        <div className="flex flex-col gap-6 md:col-span-1">
          {/* Availability Control */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider mb-4">Availability Control</h3>
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
              <span className="font-bold text-white text-md">
                {isOnline ? 'Online / Live Dispatch' : 'Offline'}
              </span>
              <button
                onClick={handleToggleOnline}
                disabled={profile && !profile.isVerified}
                className="bg-transparent border-0 p-0 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:text-gray-600 transition-colors cursor-pointer"
              >
                {isOnline ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12" />}
              </button>
            </div>

            {profile && !profile.isVerified && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                <strong>Access Restricted:</strong> Your profile is pending verification. Admins must verify you before you can toggle online status.
                <div className="mt-3 flex gap-2">
                  {!profile.verificationRequested ? (
                    <button
                      onClick={async () => {
                        try {
                          const r = await fetch('/api/volunteers/request-verification', { method: 'POST', credentials: 'include' });
                          if (r.ok) {
                            const d = await r.json();
                            setProfile(d.profile || { ...profile, verificationRequested: true });
                            alert('Verification request sent to admins.');
                          } else {
                            const err = await r.json();
                            alert(err.error || 'Failed to send request');
                          }
                        } catch (e) {
                          console.error(e);
                          alert('Network error sending request');
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors"
                    >
                      Request Verification
                    </button>
                  ) : (
                    <button disabled className="bg-gray-600 text-white text-xs py-2 px-3 rounded-lg">
                      Verification Requested
                    </button>
                  )}

                  <button
                    onClick={fetchProfile}
                    className="bg-white/5 hover:bg-white/10 text-white text-xs py-2 px-3 rounded-lg border border-white/10"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active alerts stream */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col flex-1">
            <h3 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              Alert Stream
            </h3>

              {newSOS && (
                <div className="mb-3 p-3 rounded-lg bg-rose-600/10 border border-rose-600/20 text-rose-300 text-sm flex items-center justify-between">
                  <div>New SOS signal detected nearby — check the stream below.</div>
                  <button
                    onClick={() => {
                      if (nearbyAlerts.length > 0) setSelectedAlert(nearbyAlerts[0]);
                    }}
                    className="bg-rose-600 text-white text-xs py-1 px-2 rounded-md"
                  >
                    View
                  </button>
                </div>
              )}

            {!isOnline ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Bell className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Toggle online status to start receiving nearby emergency alerts in real time.
                </p>
              </div>
            ) : nearbyAlerts.length === 0 && assignedAlerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Bell className="w-8 h-8 text-emerald-500/30 mb-2 animate-pulse" />
                <p className="text-xs text-emerald-400 max-w-xs leading-relaxed font-semibold">
                  Monitoring... No active alerts nearby.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                {/* Active Assignments first */}
                {assignedAlerts.map((alertItem) => (
                  <div
                    key={alertItem._id}
                    onClick={() => setSelectedAlert(alertItem)}
                    className={`p-4 rounded-xl text-left border cursor-pointer transition-all ${selectedAlert?._id === alertItem._id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-indigo-950/20 border-indigo-950/50 hover:bg-indigo-950/30'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{(alertItem.responderStatus || 'RESPONDING').toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400">{new Date(alertItem.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-bold text-white">Emergency for {alertItem.userId?.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Phone: {alertItem.userId?.phone || 'N/A'}</p>
                    {alertItem.responderStatus === 'NOTIFIED' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); acceptAlert(alertItem._id); }}
                        className="mt-3 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow transition-all cursor-pointer border-0"
                      >
                        Accept SOS Alert
                      </button>
                    )}
                  </div>
                ))}

                {/* Unassigned Alerts */}
                {nearbyAlerts.map((alertItem) => (
                  <div
                    key={alertItem._id}
                    onClick={() => setSelectedAlert(alertItem)}
                    className={`p-4 rounded-xl text-left border cursor-pointer transition-all ${selectedAlert?._id === alertItem._id ? 'bg-rose-600/20 border-rose-500' : 'bg-rose-950/10 border-rose-950/20 hover:bg-rose-950/20'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        NEW SIGNAL
                      </span>
                      <span className="text-[10px] text-gray-400">{new Date(alertItem.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-bold text-white">Incident from {alertItem.userId?.name}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptAlert(alertItem._id);
                      }}
                      className="mt-3 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 px-3 rounded-lg shadow transition-all cursor-pointer border-0"
                    >
                      Accept SOS Alert
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Map and Detail view */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Interactive Map Box */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-4 min-h-[360px] h-[400px]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-md text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Response Dispatch Map
              </h3>
              <span className="text-[10px] bg-white/5 border border-white/5 py-1 px-3 rounded-full text-gray-400 font-semibold uppercase">
                Active geofencing
              </span>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden relative border border-white/5">
              <MapComponent center={coords || defaultCenter} markers={getMapMarkers()} />
            </div>
          </div>

          {/* Details Card */}
          {selectedAlert && (
            <div className="p-6 rounded-2xl glass-panel border border-indigo-500/20 bg-gradient-to-r from-indigo-950/10 to-transparent animate-fade-in text-left">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                Active Emergency details
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Victim Details */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Victim Contact</h4>
                  <div className="p-4 rounded-xl bg-white/3 border border-white/5 flex flex-col gap-1.5 text-xs text-gray-200">
                    <div className="font-bold text-white text-sm">{selectedAlert.userId?.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{selectedAlert.userId?.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>
                        Lat: {selectedAlert.location.coordinates[1].toFixed(5)}, Lng: {selectedAlert.location.coordinates[0].toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Response Status Actions */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Response Operations</h4>
                  {assignedAlerts.some((a) => a._id === selectedAlert._id) ? (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateResponseStatus(selectedAlert._id, 'DISPATCHED')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-lg shadow cursor-pointer border-0 transition-colors"
                        >
                          Dispatch Status
                        </button>
                        <button
                          onClick={() => updateResponseStatus(selectedAlert._id, 'ARRIVED')}
                          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-3 rounded-lg shadow cursor-pointer border-0 transition-colors"
                        >
                          Arrived on Site
                        </button>
                      </div>
                      <button
                        onClick={() => updateResponseStatus(selectedAlert._id, 'RESOLVED')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-lg shadow flex items-center justify-center gap-1.5 cursor-pointer border-0 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Resolve & Close Incident
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-xs text-gray-400 flex flex-col items-center justify-center h-full text-center">
                      <p>You must accept this emergency request first before managing rescue operations.</p>
                      <button
                        onClick={() => acceptAlert(selectedAlert._id)}
                        className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-lg transition-colors cursor-pointer border-0"
                      >
                        Accept Response Assignment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}

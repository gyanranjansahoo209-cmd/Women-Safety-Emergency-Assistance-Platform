'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { ShieldAlert, Plus, Trash2, Phone, MapPin, Eye, Clock, CheckCircle } from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

export default function UserDashboard() {
  // Geolocation states
  const [coords, setCoords] = useState<[number, number] | null>(null);
  
  // Dashboard states
  const [contacts, setContacts] = useState<any[]>([]);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);

  // Contact Form states
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '', email: '' });
  const [contactError, setContactError] = useState('');

  // UI state
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Default center: Delhi, India if location unavailable
  const defaultCenter: [number, number] = [28.6139, 77.209];

  // Fetch initial profile & user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('Geolocation denied, using default coordinates.', err);
          setCoords(defaultCenter);
        }
      );
    } else {
      setCoords(defaultCenter);
    }

    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch contacts
      const contactsRes = await fetch('/api/contacts', { credentials: 'include' });
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.contacts || []);
      }

      // Fetch safe zones
      const safeZonesRes = await fetch('/api/admin/safezones', { credentials: 'include' });
      if (safeZonesRes.ok) {
        const data = await safeZonesRes.json();
        setSafeZones(data.safeZones || []);
      }

      // Fetch alerts
      await refreshAlertStatus();
    } catch (e) {
      console.error('Failed to load initial user dashboard data', e);
    } finally {
      setLoadingData(false);
    }
  };

  const refreshAlertStatus = async () => {
    try {
      // 1. Get active alert
      const activeRes = await fetch('/api/alerts?filter=active', { credentials: 'include' });
      if (activeRes.ok) {
        const data = await activeRes.json();
        const active = data.alerts && data.alerts.length > 0 ? data.alerts[0] : null;
        setActiveAlert(active);

        // If active, fetch assigned responders
        if (active) {
          const detailRes = await fetch(`/api/alerts/${active._id}`, { credentials: 'include' });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            setResponders(detailData.responders || []);
          }
        } else {
          setResponders([]);
        }
      }

      // 2. Get history
      const historyRes = await fetch('/api/alerts?filter=history', { credentials: 'include' });
      if (historyRes.ok) {
        const data = await historyRes.json();
        // Filter history to resolved/cancelled alerts
        const hist = data.alerts ? data.alerts.filter((a: any) => a.status === 'RESOLVED' || a.status === 'CANCELLED') : [];
        setAlertHistory(hist);
      }
    } catch (err) {
      console.error('Failed to refresh alert status', err);
    }
  };

  // Poll active alert details if active every 3 seconds
  useEffect(() => {
    if (!activeAlert) return;

    const interval = setInterval(() => {
      refreshAlertStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeAlert]);

  // Trigger SOS alert
  const triggerSOS = async () => {
    if (!coords) {
      alert('AURA is locating you. Please allow location access first.');
      return;
    }

    setLoadingSOS(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: coords[0], longitude: coords[1] }),
      });

      if (res.ok) {
        await refreshAlertStatus();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to trigger SOS');
      }
    } catch (e) {
      console.error(e);
      alert('Network error triggering SOS. Please call emergency services.');
    } finally {
      setLoadingSOS(false);
    }
  };

  // Cancel active SOS
  const cancelSOS = async () => {
    if (!activeAlert) return;

    if (!confirm('Are you sure you want to cancel the emergency request?')) return;

    try {
      const res = await fetch(`/api/alerts/${activeAlert._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      if (res.ok) {
        setActiveAlert(null);
        setResponders([]);
        await refreshAlertStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Resolve active SOS
  const resolveSOS = async () => {
    if (!activeAlert) return;

    if (!confirm('Confirm that you are safe and want to resolve the emergency alert?')) return;

    try {
      const res = await fetch(`/api/alerts/${activeAlert._id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });

      if (res.ok) {
        setActiveAlert(null);
        setResponders([]);
        await refreshAlertStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Contacts Form submit
  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!newContact.name || !newContact.phone || !newContact.relationship) {
      setContactError('Please fill out all required fields');
      return;
    }

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      });

      const data = await res.json();
      if (res.ok) {
        setContacts([...contacts, data.contact]);
        setNewContact({ name: '', phone: '', relationship: '', email: '' });
      } else {
        setContactError(data.error || 'Failed to add contact');
      }
    } catch (err) {
      setContactError('Network error adding contact');
    }
  };

  // Delete contact
  const deleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setContacts(contacts.filter((c) => c._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compile markers for map
  const getMapMarkers = () => {
    const markersList: any[] = [];

    // Add user marker
    if (coords) {
      markersList.push({
        id: 'user_current',
        position: coords,
        title: 'Your Location',
        description: 'Active SOS will share this coordinate',
        iconType: 'user',
      });
    }

    // Add Safe Zones markers
    safeZones.forEach((sz) => {
      markersList.push({
        id: sz._id,
        position: [sz.location.coordinates[1], sz.location.coordinates[0]],
        title: `${sz.name} (${sz.type})`,
        description: `${sz.address || ''} | Contact: ${sz.contactNumber || 'N/A'}`,
        iconType: 'safezone',
      });
    });

    // Add active responders if any
    responders.forEach((r) => {
      // For simulation, responders will appear slightly offset or we can show them on map if they update location
      // In volunteers table, profile current location is tracked. Let's look up if responder details contain profile location
      // For this demo, we'll put them near the user or if they have coordinates, we use them
      if (r.responderId && r.currentLocation) {
        // Future enhance: track volunteer location updates
      }
    });

    return markersList;
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-[#080710]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid md:grid-cols-3 gap-6">
        {/* Left Side: Panic Button and Status */}
        <div className="flex flex-col gap-6 md:col-span-1">
          {/* Panic Alert Box */}
          <div className="p-8 rounded-2xl glass-panel border border-white/5 text-center bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col items-center justify-center min-h-[360px]">
            {activeAlert ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="radar-pulse-ring w-24 h-24 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 mb-2">
                  <ShieldAlert className="w-12 h-12 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-rose-500 tracking-wide">SOS ACTIVE</h2>
                  <p className="text-gray-400 text-xs mt-1">Live coordinates shared with nearby responders</p>
                </div>

                <div className="w-full p-4 rounded-xl bg-white/5 border border-white/5 text-left text-xs text-gray-300">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Alert Status:</span>
                    <span className="font-bold text-rose-400 uppercase">{activeAlert.status}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span>Responders Dispatched:</span>
                    <span className="font-bold text-indigo-400">{responders.length}</span>
                  </div>
                </div>

                <div className="flex gap-4 w-full">
                  <button
                    onClick={cancelSOS}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer bg-transparent"
                  >
                    Cancel Alert
                  </button>
                  <button
                    onClick={resolveSOS}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/10 transition-all cursor-pointer border-0"
                  >
                    I Am Safe
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
                  In case of immediate threat, danger, or medical emergency, press and hold the button below.
                </p>

                <button
                  onClick={triggerSOS}
                  disabled={loadingSOS || !coords}
                  className="w-44 h-44 rounded-full bg-gradient-to-tr from-rose-600 to-pink-600 text-white font-black text-xl tracking-wider shadow-2xl hover:shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-panic-pulse disabled:opacity-50 disabled:scale-100 disabled:animate-none border-0"
                >
                  {loadingSOS ? 'ACTIVATING...' : 'SOS PANIC'}
                </button>

                <div className="text-xs text-indigo-300 bg-indigo-500/5 py-2 px-4 border border-indigo-500/10 rounded-full font-medium">
                  {coords ? '✓ Location Service Connected' : '⚡ Activating Geolocation...'}
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contacts card */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5">
            <h3 className="font-bold text-md text-white mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-400" />
              Trusted Contacts ({contacts.length})
            </h3>

            {contacts.length === 0 ? (
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                No emergency contacts added yet. Please add trusted family or friends who will receive SOS notifications.
              </p>
            ) : (
              <div className="flex flex-col gap-3 mb-6 max-h-[220px] overflow-y-auto pr-1">
                {contacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{contact.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {contact.relationship} &bull; {contact.phone}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteContact(contact._id)}
                      className="text-gray-500 hover:text-rose-400 p-1.5 rounded transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Contact Form */}
            <form onSubmit={addContact} className="flex flex-col gap-3 border-t border-white/5 pt-4">
              {contactError && <p className="text-[10px] text-rose-400 font-semibold">{contactError}</p>}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
                <input
                  type="text"
                  required
                  placeholder="Relationship"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="flex-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer border-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Safety Tips card */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5">
            <h3 className="font-bold text-md text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Quick Safety Tips
            </h3>
            <ul className="text-xs text-gray-300 list-disc pl-4 space-y-2">
              <li>Stay in well-lit public areas when possible.</li>
              <li>Share your live location with trusted contacts.</li>
              <li>Call local emergency services if you are in immediate danger.</li>
              <li>Use the SOS button — volunteers nearby will be notified.</li>
            </ul>
          </div>

          {/* Safety Tips */}
          <div className="p-4 rounded-2xl glass-panel border border-white/5 mt-2">
            <h4 className="text-xs font-bold text-white mb-2">Safety Toolkit</h4>
            <ul className="text-[10px] text-gray-300 space-y-2">
              <li>• Stay in well-lit areas and avoid isolated routes.</li>
              <li>• Share live location with trusted contacts when traveling.</li>
              <li>• Use SOS button to notify nearby responders quickly.</li>
              <li>• Call local emergency services if immediate danger: <strong>112</strong></li>
            </ul>
          </div>
        </div>

        {/* Right Side: Map & History */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Active Responders List */}
          {activeAlert && responders.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex flex-col gap-2 animate-fade-in">
              <h4 className="font-bold flex items-center gap-1.5 text-white">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Assigned Responders:
              </h4>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {responders.map((r: any) => (
                  <div key={r._id} className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-[11px]">
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span>{r.responderId?.name || 'Volunteer'}</span>
                      <span className="text-indigo-400 text-[9px] uppercase">{r.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Phone className="w-2.5 h-2.5" />
                      <span>{r.responderId?.phone || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Map Box */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5 flex flex-col gap-4 min-h-[420px] h-[480px]">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-md text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Emergency Map & Nearby Safe Zones
              </h3>
              <span className="text-[10px] bg-white/5 border border-white/5 py-1 px-3 rounded-full text-gray-400 font-semibold uppercase">
                OpenStreetMap Tile
              </span>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden relative border border-white/5">
              {coords ? (
                <MapComponent center={coords} markers={getMapMarkers()} showCircle={!!activeAlert} circleRadius={1500} />
              ) : (
                <div className="w-full h-full bg-white/2 flex items-center justify-center text-xs text-gray-400 font-medium">
                  Loading Geolocation...
                </div>
              )}
            </div>
          </div>

          {/* Incident Alert History */}
          <div className="p-6 rounded-2xl glass-panel border border-white/5">
            <h3 className="font-bold text-md text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Your Alert History
            </h3>

            {alertHistory.length === 0 ? (
              <p className="text-xs text-gray-500 leading-relaxed">
                No past alerts recorded. Your panic signals will log here after resolution.
              </p>
            ) : (
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
                {alertHistory.map((alertItem) => (
                  <div
                    key={alertItem._id}
                    className="flex justify-between items-center p-3 rounded-xl bg-white/3 border border-white/5"
                  >
                    <div className="text-left">
                      <span className="text-[10px] text-gray-400 font-medium uppercase">
                        {new Date(alertItem.createdAt).toLocaleString()}
                      </span>
                      <p className="text-xs text-gray-200 mt-0.5">
                        SOS triggered at Lat: {alertItem.location.coordinates[1].toFixed(4)}, Lng: {alertItem.location.coordinates[0].toFixed(4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {alertItem.status === 'RESOLVED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 py-1 px-2.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          RESOLVED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-white/5 py-1 px-2.5 rounded-full border border-white/10">
                          CANCELLED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </AuthGuard>
  );
}

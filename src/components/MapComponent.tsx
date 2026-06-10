'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    title: string;
    description?: string;
    iconType?: 'user' | 'volunteer' | 'safezone' | 'incident';
  }>;
  showCircle?: boolean;
  circleRadius?: number; // in meters
}

export default function MapComponent({ center, zoom = 14, markers = [], showCircle = false, circleRadius = 500 }: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const circleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // Already initialized

    // Fix default Leaflet icon assets
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    mapRef.current = L.map(mapContainerRef.current).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update View Center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
  }, [center]);

  // Update Circle
  useEffect(() => {
    if (!mapRef.current) return;

    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (showCircle) {
      circleRef.current = L.circle(center, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.12,
        radius: circleRadius,
      }).addTo(mapRef.current);
    }
  }, [center, showCircle, circleRadius]);

  // Update Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Remove old markers that are not in the new markers list
    Object.keys(markersRef.current).forEach((id) => {
      if (!markers.some((m) => m.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // 2. Add or update current markers
    markers.forEach((markerData) => {
      const { id, position, title, description, iconType } = markerData;

      let iconColor = '#6366f1';
      if (iconType === 'user') iconColor = '#a855f7'; // Purple
      if (iconType === 'volunteer') iconColor = '#10b981'; // Emerald
      if (iconType === 'safezone') iconColor = '#3b82f6'; // Blue
      if (iconType === 'incident') iconColor = '#ef4444'; // Red

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; width: 32px; height: 32px;">
            ${iconType === 'incident' ? `
              <div style="
                position: absolute;
                top: -8px;
                left: -8px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background-color: rgba(239, 68, 68, 0.25);
                animation: radar-pulse 2s infinite linear;
              "></div>` : ''}
            <svg viewBox="0 0 24 24" width="32" height="32" fill="${iconColor}" stroke="#1e1b4b" stroke-width="1.5" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      if (markersRef.current[id]) {
        markersRef.current[id].setLatLng(position);
      } else {
        const marker = L.marker(position, { icon: customIcon }).addTo(mapRef.current!);
        
        if (title) {
          const popupContent = `
            <div style="color: #fff; font-family: sans-serif; padding: 4px; min-width: 140px;">
              <h4 style="margin: 0 0 4px 0; font-weight: 600; font-size: 14px; color: ${iconColor};">${title}</h4>
              ${description ? `<p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.4;">${description}</p>` : ''}
            </div>
          `;
          marker.bindPopup(popupContent, {
            className: 'custom-leaflet-popup',
          });
        }

        markersRef.current[id] = marker;
      }
    });
  }, [markers]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <style jsx global>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #110c1c !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          border-radius: 0.5rem;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #110c1c !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

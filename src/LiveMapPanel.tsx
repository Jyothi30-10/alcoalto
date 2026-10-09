import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Signal, ShieldAlert, Radio } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import 'leaflet/dist/leaflet.css';

const carIcon = L.divIcon({
  className: 'custom-car-marker',
  html: `<div class="relative w-9 h-9 flex items-center justify-center">
    <div class="absolute inset-0 rounded-full bg-cyan-500/40 animate-ping"></div>
    <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)] font-mono text-[10px] font-bold px-1">
      ● ALCOALTO
    </div>
  </div>`,
  iconSize: [80, 32],
  iconAnchor: [40, 16],
});

const RecenterMap: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
};

export const LiveMapPanel: React.FC = () => {
  const { telemetry, vehicle, driver, connectionStatus } = useSystem();

  const hasValidGps = Boolean(telemetry.latitude && telemetry.longitude);
  const lat = telemetry.latitude || 13.021800;
  const lng = telemetry.longitude || 80.174300;
  const source = telemetry.location_source || (hasValidGps ? 'GPS' : 'NETWORK APPROXIMATION');

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/30 pb-3">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
            LIVE VEHICLE LOCATION
          </h2>
        </div>

        {/* Location Source Tag */}
        <div className="flex items-center space-x-2">
          {hasValidGps && source === 'GPS' ? (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.3)] font-bold">
              <Signal className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>LOCATION SOURCE: GPS (NEO-6M)</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>GPS: WAITING FOR FIX / NETWORK APPROXIMATION</span>
            </span>
          )}
        </div>
      </div>

      {/* Map Display */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="w-full h-full z-0">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} icon={carIcon}>
            <Popup className="font-mono text-xs">
              <div className="p-1 space-y-1 text-slate-900 font-mono">
                <div className="font-bold text-cyan-700">Vehicle: {vehicle.vehicle_id}</div>
                <div>Driver: {driver.name} ({driver.driver_id})</div>
                <div>Status: <span className="font-bold text-slate-800">{vehicle.state}</span></div>
                <div>Last update: {connectionStatus.lastUpdateSecondsAgo}s ago</div>
              </div>
            </Popup>
          </Marker>
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>

        {/* HUD Info Overlay */}
        <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 border border-cyan-500/30 p-2.5 rounded-xl font-mono text-[11px] backdrop-blur-md shadow-lg space-y-1">
          {hasValidGps ? (
            <>
              <div className="flex items-center space-x-3 text-slate-300">
                <span className="text-slate-400">LATITUDE:</span>
                <span className="text-cyan-300 font-bold">{lat.toFixed(6)}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <span className="text-slate-400">LONGITUDE:</span>
                <span className="text-cyan-300 font-bold">{lng.toFixed(6)}</span>
              </div>
            </>
          ) : (
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>GPS: WAITING FOR GPS DATA</span>
            </div>
          )}
        </div>

        {/* Update Badge */}
        <div className="absolute top-3 right-3 z-10 bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-full font-mono text-[10px] text-slate-300 backdrop-blur-md flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>LAST UPDATE: {connectionStatus.lastUpdateSecondsAgo}s ago</span>
        </div>
      </div>
    </div>
  );
};

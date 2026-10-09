import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Users, Radio, MapPin, AlertTriangle, Car } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import 'leaflet/dist/leaflet.css';

const policeVehicleIcon = L.divIcon({
  className: 'custom-police-marker',
  html: `<div class="relative w-9 h-9 flex items-center justify-center">
    <div class="absolute inset-0 rounded-full bg-rose-500/40 animate-ping"></div>
    <div class="w-8 h-8 rounded-full bg-slate-950 border-2 border-rose-500 text-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.8)]">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    </div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export const PoliceDashboard: React.FC = () => {
  const { vehicle, driver, telemetry, emergencySecondsRemaining } = useSystem();

  const lat = telemetry.latitude || 13.021800;
  const lng = telemetry.longitude || 80.174300;

  const hours = Math.floor(emergencySecondsRemaining / 3600);
  const minutes = Math.floor((emergencySecondsRemaining % 3600) / 60);
  const seconds = emergencySecondsRemaining % 60;
  const emergencyTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      {/* Fleet Monitor Header Banner */}
      <div className="bg-slate-900/90 border border-cyan-900/50 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
              AUTHORIZED LAW ENFORCEMENT & SAFETY PORTAL
            </div>
            <h1 className="text-2xl font-extrabold font-mono text-white tracking-wider">
              ALCOALTO FLEET MONITORING
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">ACTIVE VEHICLES: <strong className="text-white">1</strong></span>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">EMERGENCY MODES: <strong className="text-amber-400">{vehicle.emergency_mode ? 1 : 0}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Map + Vehicle Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns — Interactive Fleet Map */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
                ACTIVE VEHICLE MONITORING MAP
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              LIVE TELEMETRY ACTIVE
            </span>
          </div>

          <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-800 relative shadow-inner">
            <MapContainer center={[lat, lng]} zoom={14} className="w-full h-full">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]} icon={policeVehicleIcon}>
                <Popup className="font-mono text-xs">
                  <div className="p-1 space-y-1">
                    <div className="font-bold text-slate-900">{vehicle.vehicle_id}</div>
                    <div>Driver: {driver.name} ({driver.driver_id})</div>
                    <div>Status: <span className="font-bold text-rose-600">{vehicle.state}</span></div>
                    <div>License: {driver.license_plate}</div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Map HUD Overlay */}
            <div className="absolute top-3 left-3 z-10 bg-slate-950/90 border border-cyan-500/30 p-3 rounded-xl font-mono text-xs backdrop-blur-md space-y-1">
              <div className="text-cyan-400 font-bold">{vehicle.vehicle_id} • {driver.license_plate}</div>
              <div className="text-slate-300">DRIVER: {driver.name} (ID: {driver.driver_id})</div>
              <div className="text-slate-400 text-[10px]">GPS: {lat.toFixed(6)}, {lng.toFixed(6)}</div>
            </div>
          </div>
        </div>

        {/* Right Column — Selected Vehicle Inspector */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-cyan-400" />
              <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
                VEHICLE INSPECTOR
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">{vehicle.vehicle_id}</span>
          </div>

          {/* Emergency Countdown Box if Active */}
          {vehicle.emergency_mode && (
            <div className="p-4 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-mono space-y-2 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  EMERGENCY MODE ACTIVE
                </span>
                <span className="text-xs font-extrabold text-white">{emergencyTimeStr}</span>
              </div>
              <p className="text-[10px] text-amber-200/80 leading-relaxed">
                Driver authorized 6-hour temporary vehicle access. Continuous GPS tracking enabled.
              </p>
            </div>
          )}

          {/* Detailed Metric Cards */}
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">DRIVER IDENTITY</div>
              <div className="text-sm font-bold text-white">{driver.name}</div>
              <div className="text-[11px] text-cyan-300">Driver ID: {driver.driver_id} | License: {driver.license_plate}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400">VEHICLE STATE & ALCOHOL</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{vehicle.state}</span>
                <span className={`text-xs font-bold ${telemetry.classification === 'SAFE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {telemetry.classification}
                </span>
              </div>
            </div>

            {/* Sensor Live Snapshot */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400">LIVE SENSOR TELEMETRY</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-400">MQ-3</div>
                  <div className="text-xs font-bold text-cyan-400">{telemetry.mq3}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-400">MQ-2</div>
                  <div className="text-xs font-bold text-amber-400">{telemetry.mq2}</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-[9px] text-slate-400">MQ-135</div>
                  <div className="text-xs font-bold text-emerald-400">{telemetry.mq135}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

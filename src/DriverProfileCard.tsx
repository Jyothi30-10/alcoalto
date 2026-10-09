import React, { useState, useEffect } from 'react';
import { User, Cpu, CheckCircle2, RefreshCw, Wifi, Signal } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const DriverProfileCard: React.FC = () => {
  const { driver, vehicle, connectionStatus, connectionSettings, connectToCarModule, updateConnectionSettings, refreshData } = useSystem();
  
  const [inputIp, setInputIp] = useState(connectionSettings.esp32Ip || '10.12.4.133');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMsg, setConnectMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    if (connectionSettings.esp32Ip) {
      setInputIp(connectionSettings.esp32Ip);
    }
  }, [connectionSettings.esp32Ip]);

  const handleConnectIp = async () => {
    setIsConnecting(true);
    setConnectMsg(null);

    const ok = await connectToCarModule(inputIp);
    setIsConnecting(false);

    if (ok) {
      setConnectMsg({ success: true, text: `ESP32 Connected (${inputIp})` });
      refreshData();
    } else {
      setConnectMsg({ success: false, text: `Unable to connect to ${inputIp}` });
    }
  };

  const getRssiRating = (rssi: number) => {
    if (rssi >= -60) return { label: 'GOOD', color: 'text-emerald-400' };
    if (rssi >= -70) return { label: 'FAIR', color: 'text-amber-400' };
    return { label: 'WEAK', color: 'text-rose-400' };
  };

  const rssiRating = getRssiRating(connectionStatus.wifiRssi);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl text-slate-200 flex flex-col justify-between space-y-5">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
              DRIVER PROFILE
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            VERIFIED
          </span>
        </div>

        {/* Driver Details Card Grid */}
        <div className="space-y-2.5 font-mono text-xs">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">DRIVER NAME</div>
            <div className="text-sm font-bold text-white">{driver.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">DRIVER ID</div>
              <div className="text-xs font-bold text-cyan-300">{driver.driver_id}</div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">LICENSE PLATE</div>
              <div className="text-xs font-bold text-slate-200">{driver.license_plate}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">VEHICLE ID</div>
              <div className="text-xs font-bold text-slate-300">{vehicle.vehicle_id}</div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">DRIVING LICENSE</div>
              <div className="text-xs font-bold text-emerald-400">{driver.license_status || 'VALID'}</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">PHONE</div>
            <div className="text-xs font-semibold text-slate-300">{driver.phone}</div>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">VEHICLE MODEL</div>
            <div className="text-xs font-bold text-white truncate">{vehicle.model}</div>
          </div>
        </div>
      </div>

      {/* Vehicle Connection Card with Inline ESP32 IP Input */}
      <div className="border-t border-cyan-900/30 pt-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            VEHICLE CONNECTION
          </span>
          <span className={`text-[10px] font-bold flex items-center gap-1 ${connectionStatus.esp32Connected ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connectionStatus.esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
            <span>{connectionStatus.esp32Connected ? 'CONNECTED' : 'OFFLINE'}</span>
          </span>
        </div>

        {/* Interactive ESP32 IP Input & Connect Button */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-[11px]">
          <div className="space-y-1">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">ESP32 IP ADDRESS:</span>
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="10.12.4.133"
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-cyan-300 font-bold font-mono text-xs focus:outline-none"
              />
              <button
                onClick={handleConnectIp}
                disabled={isConnecting}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all cursor-pointer flex items-center space-x-1 text-[11px]"
              >
                {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>[ CONNECT ]</span>
              </button>
            </div>
          </div>

          {connectMsg && (
            <div className={`text-[10px] font-mono px-2 py-1 rounded border flex items-center gap-1 ${
              connectMsg.success ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-rose-950 text-rose-300 border-rose-500/40'
            }`}>
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{connectMsg.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-300 pt-1">
            <span className="text-slate-400">LAST PACKET:</span>
            <span className="text-slate-200 font-bold">
              {connectionStatus.lastUpdateSecondsAgo === 0 ? 'Just now' : `${connectionStatus.lastUpdateSecondsAgo}s ago (${connectionStatus.lastPacketTime})`}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">WI-FI RSSI:</span>
            {connectionStatus.esp32Connected ? (
              <span className={`font-bold flex items-center gap-1 ${rssiRating.color}`}>
                <Wifi className="w-3 h-3 shrink-0" />
                <span>{connectionStatus.wifiRssi} dBm ({rssiRating.label})</span>
              </span>
            ) : (
              <span className="text-slate-500 font-bold">No signal</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

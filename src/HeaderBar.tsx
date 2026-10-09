import React, { useState, useEffect } from 'react';
import { ShieldAlert, Cpu, Clock, RefreshCw, Radio, Car, Wifi } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const HeaderBar: React.FC = () => {
  const { connectionStatus, connectionSettings, connectToCarModule, activeMode, setMode } = useSystem();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [headerIp, setHeaderIp] = useState<string>(connectionSettings.esp32Ip || '10.12.4.133');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectSuccess, setConnectSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString());
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (connectionSettings.esp32Ip) {
      setHeaderIp(connectionSettings.esp32Ip);
    }
  }, [connectionSettings.esp32Ip]);

  const handleHeaderConnect = async () => {
    setIsConnecting(true);
    setConnectSuccess(null);
    const ok = await connectToCarModule(headerIp);
    setIsConnecting(false);
    setConnectSuccess(ok);
    setTimeout(() => setConnectSuccess(null), 4000);
  };

  const getRssiRating = (rssi: number) => {
    if (rssi >= -60) return { label: 'GOOD', color: 'text-emerald-400' };
    if (rssi >= -70) return { label: 'FAIR', color: 'text-amber-400' };
    return { label: 'WEAK', color: 'text-rose-400' };
  };

  const rssiRating = getRssiRating(connectionStatus.wifiRssi);

  return (
    <header className="bg-slate-950/95 border-b border-cyan-900/40 px-4 sm:px-6 py-2.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl z-30 backdrop-blur-md">
      {/* Left Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-mono font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5 leading-none">
            ALCO<span className="text-cyan-400">ALTO</span>
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
            INTELLIGENT VEHICLE SAFETY SYSTEM
          </p>
        </div>
      </div>

      {/* Middle: Live Car Module IP Connector */}
      <div className="flex flex-wrap items-center space-x-2 font-mono text-xs">
        {/* Mode Selector Pill */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => setMode('LIVE')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'LIVE'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>LIVE CAR MODULE</span>
          </button>
          
          <button
            onClick={() => setMode('DEMO')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'DEMO'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3 text-amber-400" />
            <span>DEMO MODE</span>
          </button>
        </div>

        {/* IP Address Connector Box */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-cyan-900/60 p-1 rounded-xl shadow-inner">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          <span className="text-[10px] text-slate-400">ESP32 IP:</span>
          <input
            type="text"
            value={headerIp}
            onChange={(e) => setHeaderIp(e.target.value)}
            placeholder="10.12.4.133"
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 text-cyan-300 font-bold px-2 py-1 rounded-lg w-28 text-[11px] font-mono focus:outline-none"
          />
          <button
            onClick={handleHeaderConnect}
            disabled={isConnecting}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] shadow-md"
          >
            {isConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Car className="w-3.5 h-3.5" />}
            <span>[ CONNECT TO CAR ]</span>
          </button>
        </div>

        {connectSuccess === true && (
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-500/40">
            CONNECTED TO CAR ({headerIp})
          </span>
        )}
        {connectSuccess === false && (
          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-500/40">
            CONNECTION FAILED
          </span>
        )}
      </div>

      {/* Right Status Indicators & Live Clock */}
      <div className="flex items-center space-x-3 font-mono text-xs">
        {/* ESP32 Status & RSSI Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 text-[10px]">CAR MODULE</span>
            <span className={`w-2 h-2 rounded-full ${connectionStatus.esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className={`font-bold ${connectionStatus.esp32Connected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {connectionStatus.esp32Connected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          {connectionStatus.esp32Connected && (
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-800 text-[10px]">
              <Wifi className="w-3 h-3 text-cyan-400" />
              <span className={`font-bold ${rssiRating.color}`}>{connectionStatus.wifiRssi} dBm ({rssiRating.label})</span>
            </div>
          )}
        </div>

        {/* Live Clock */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currentTime}</span>
        </div>
      </div>
    </header>
  );
};

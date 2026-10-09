import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  MapPin, 
  History, 
  Radio, 
  Cpu, 
  Gauge, 
  Users
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const NavigationSidebar: React.FC = () => {
  const { activeRoute, setActiveRoute, connectionStatus, demoMode, toggleDemoMode } = useSystem();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'breath-test', label: 'Breath Analysis', icon: Activity },
    { id: 'location', label: 'Live Vehicle Map', icon: MapPin },
    { id: 'events', label: 'Event Timeline', icon: History },
    { id: 'police', label: 'Police Monitor', icon: Users },
    { id: 'connection', label: 'Device Connection', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-slate-950/90 border-r border-cyan-900/40 text-slate-200 flex flex-col justify-between shadow-2xl z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-cyan-900/30 flex items-center space-x-3 bg-slate-900/50">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <h1 className="font-mono font-bold text-lg tracking-wider text-white flex items-center gap-1">
              ALCO<span className="text-cyan-400">ALTO</span>
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Automotive Safety</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRoute(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status Panel */}
      <div className="p-4 border-t border-cyan-900/30 bg-slate-950/80 space-y-3">
        {/* Demo Mode Toggle Button */}
        <button
          onClick={toggleDemoMode}
          className={`w-full py-2 px-3 rounded-md text-xs font-mono font-semibold flex items-center justify-between transition-colors ${
            demoMode
              ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            DEMO MODE
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
            {demoMode ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* System Online Badge */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
          <span className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${connectionStatus.backendConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-rose-500'}`}></span>
            <span>SYSTEM</span>
          </span>
          <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
      </div>
    </aside>
  );
};

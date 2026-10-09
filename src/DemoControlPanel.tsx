import React, { useState } from 'react';
import { Radio, ShieldCheck, ShieldAlert, Car, AlertTriangle, WifiOff, ChevronUp, ChevronDown, RefreshCw, Lock } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const DemoControlPanel: React.FC = () => {
  const { demoMode, triggerDemoScenario } = useSystem();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!demoMode) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.25)] text-white backdrop-blur-md max-w-sm w-full transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3 font-mono">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold text-xs text-amber-400 tracking-wider">DEMO MODE ACTIVE</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2.5 font-mono text-xs">
          <p className="text-[11px] font-sans text-slate-300">
            Simulate physical ESP32 state transitions for hackathon presentation:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => triggerDemoScenario('SAFE')}
              className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>[ SAFE ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('ALCOHOL')}
              className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>[ ALCOHOL ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('MOVING')}
              className="p-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              <span>[ MOVING ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('DECELERATING')}
              className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>[ DECELERATING ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('STOPPED')}
              className="p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>[ SAFE STOP ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('EMERGENCY')}
              className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>[ EMERGENCY ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('EXPIRE_EMERGENCY')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <span>[ EXPIRE EM. ]</span>
            </button>

            <button
              onClick={() => triggerDemoScenario('DISCONNECT')}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer"
            >
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>[ OFFLINE ]</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

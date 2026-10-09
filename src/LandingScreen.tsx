import React from 'react';
import { ShieldCheck, Activity, Cpu, Lock, ArrowRight } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const LandingScreen: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  const { openBreathTest } = useSystem();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-slate-950">
      {/* Background Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-3xl w-full text-center space-y-8 z-10">
        {/* Animated Radar Emblem */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-cyan-400/40 animate-spin" style={{ animationDuration: '12s' }} />
          <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)]">
            <ShieldCheck className="w-12 h-12 text-cyan-400" />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>SYSTEM ONLINE • v1.0.0</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-wider text-white font-mono">
            ALCO<span className="text-cyan-400">ALTO</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-light max-w-xl mx-auto tracking-wide">
            INTELLIGENT VEHICLE SAFETY & ALCOHOL MONITORING
          </p>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Embedded Automotive Breath Analysis & Fleet Safety Command Center
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-mono">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <Activity className="w-5 h-5 text-cyan-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">MQ Multi-Sensor</h3>
            <p className="text-xs text-slate-400 mt-1">MQ-3, MQ-2, & MQ-135 real-time breath VOC classification.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <Lock className="w-5 h-5 text-emerald-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">Motor Cutoff Relay</h3>
            <p className="text-xs text-slate-400 mt-1">Automatic motor cutoff & 6-hour emergency access protocol.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
            <Cpu className="w-5 h-5 text-amber-400 mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">Police Fleet Link</h3>
            <p className="text-xs text-slate-400 mt-1">Continuous NEO-6M GPS monitoring & police portal route.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              onEnter();
              openBreathTest();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-base tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>START BREATH TEST</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onEnter}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-mono font-semibold text-sm tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <span>LAUNCH DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};

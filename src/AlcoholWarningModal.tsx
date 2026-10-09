import React from 'react';
import { AlertOctagon, Lock, ShieldAlert, X } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const AlcoholWarningModal: React.FC = () => {
  const { isAlcoholWarningOpen, closeAlcoholWarning, openEmergencyModal, telemetry } = useSystem();

  if (!isAlcoholWarningOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(244,63,94,0.25)] text-center text-white space-y-6">
        
        {/* Top Warning Badge & Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.5)] animate-pulse">
          <AlertOctagon className="w-10 h-10" />
        </div>

        {/* Title & Warning Text */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950 border border-rose-500/40 text-rose-400 text-xs font-mono tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>ENGINE IGNITION BLOCKED</span>
          </div>
          <h2 className="text-3xl font-extrabold font-mono text-rose-500 tracking-wide">
            ALCOHOL DETECTED
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed font-sans px-2">
            Alcohol has been detected in the driver's breath. Vehicle operation is currently held for safety.
          </p>
        </div>

        {/* Sensor Snapshot Box */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 text-left">
          <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
            <span>BREATH ANALYSIS SNAPSHOT</span>
            <span className="text-rose-400 font-bold">FAIL</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-900 p-2 rounded border border-rose-900/40">
              <div className="text-[10px] text-slate-400">MQ-3 (ALCOHOL)</div>
              <div className="text-sm font-bold text-rose-400">{telemetry.mq3}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">MQ-2 (VOC)</div>
              <div className="text-sm font-bold text-amber-400">{telemetry.mq2}</div>
            </div>
            <div className="bg-slate-900 p-2 rounded border border-slate-800">
              <div className="text-[10px] text-slate-400">MQ-135 (AIR)</div>
              <div className="text-sm font-bold text-amber-400">{telemetry.mq135}</div>
            </div>
          </div>
        </div>

        {/* Small Secondary Button for Emergency Access */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            onClick={closeAlcoholWarning}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-medium text-xs tracking-wider transition-colors cursor-pointer"
          >
            ACKNOWLEDGE & KEEP VEHICLE STOPPED
          </button>

          <button
            onClick={() => {
              closeAlcoholWarning();
              openEmergencyModal();
            }}
            className="px-4 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-600/40 font-mono text-xs tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>[ EMERGENCY ACCESS ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const EmergencyTimerBadge: React.FC = () => {
  const { emergencySecondsRemaining, vehicle } = useSystem();

  if (emergencySecondsRemaining <= 0 && !vehicle.emergency_mode) return null;

  const hours = Math.floor(emergencySecondsRemaining / 3600);
  const minutes = Math.floor((emergencySecondsRemaining % 3600) / 60);
  const seconds = emergencySecondsRemaining % 60;

  const formatTime = (h: number, m: number, s: number) => {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 flex items-center justify-between font-mono text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-rose-400" />
        <div>
          <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">EMERGENCY MODE ACTIVE</div>
          <div className="text-[11px] text-rose-200/80">Vehicle access temporarily authorized</div>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-rose-500/40">
        <Clock className="w-4 h-4 text-rose-400" />
        <span className="text-base font-extrabold text-white tracking-widest">
          {formatTime(hours, minutes, seconds)}
        </span>
      </div>
    </div>
  );
};

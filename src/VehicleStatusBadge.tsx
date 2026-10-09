import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, AlertTriangle, Radio, Clock, RefreshCw } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const VehicleStatusBadge: React.FC = () => {
  const { vehicle, telemetry, emergencySecondsRemaining, openAlcoholWarning, openBreathTest } = useSystem();
  const [decelerateCountdown, setDecelerateCountdown] = useState<number>(5);

  const rawState = vehicle.state || telemetry.state || 'SAFE';
  const isAlcohol = telemetry.alcohol || (telemetry.classification === 'ALCOHOL DETECTED');
  const displayState = (isAlcohol && !vehicle.emergency_mode && rawState !== 'EMERGENCY MODE') ? 'NOT DRIVABLE' : rawState;

  // Controlled deceleration animation timer
  useEffect(() => {
    let timer: any = null;
    if (rawState === 'DECELERATING') {
      setDecelerateCountdown(5);
      timer = setInterval(() => {
        setDecelerateCountdown((prev) => (prev > 1 ? prev - 1 : 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [rawState]);

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'SAFE':
        return 'text-emerald-400 bg-emerald-950/90 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
      case 'MOVING':
        return 'text-cyan-400 bg-cyan-950/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]';
      case 'NOT DRIVABLE':
      case 'ALCOHOL WARNING':
      case 'ALCOHOL DETECTED':
      case 'SAFE STOP':
        return 'text-rose-400 bg-rose-950/90 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3)] animate-pulse';
      case 'LOCKED':
        return 'text-rose-500 bg-slate-950 border-rose-800 shadow-inner';
      case 'EMERGENCY MODE':
        return 'text-amber-400 bg-amber-950/90 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.3)]';
      case 'DECELERATING':
        return 'text-amber-400 bg-amber-950/90 border-amber-500/50 animate-pulse';
      case 'OFFLINE':
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  const hours = Math.floor(emergencySecondsRemaining / 3600);
  const minutes = Math.floor((emergencySecondsRemaining % 3600) / 60);
  const seconds = emergencySecondsRemaining % 60;
  const emergencyTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const emergencyProgressPercent = Math.max(0, Math.min(100, (emergencySecondsRemaining / (6 * 3600)) * 100));

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
            VEHICLE SAFETY
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
          ESP32 CONTROLLED
        </span>
      </div>

      {/* Prominent Status Indicator Box */}
      <div className={`p-4 rounded-xl border font-mono flex items-center justify-between ${getStatusColor(displayState)}`}>
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-80 font-semibold">VEHICLE STATUS</div>
          <div className="text-xl font-extrabold tracking-wider mt-0.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
            <span>● {displayState}</span>
          </div>
        </div>

        {displayState === 'SAFE' || displayState === 'MOVING' ? (
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
        ) : displayState === 'EMERGENCY MODE' ? (
          <AlertTriangle className="w-8 h-8 text-amber-400 animate-bounce" />
        ) : (
          <Lock className="w-8 h-8 text-rose-500" />
        )}
      </div>

      {/* Dynamic State Specific Views */}

      {/* 1. NORMAL SAFE STATE */}
      {state === 'SAFE' && !isAlcohol && (
        <div className="space-y-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">BREATH STATUS</div>
              <div className="font-bold text-emerald-400 mt-1 text-sm">CLEAR</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">VEHICLE</div>
              <div className="font-bold text-emerald-400 mt-1 text-sm">READY</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">EMERGENCY MODE</div>
              <div className="font-bold text-slate-400 mt-1 text-sm">OFF</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">LOCATION MONITORING</div>
              <div className="font-bold text-cyan-400 mt-1 flex items-center gap-1 text-xs">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALCOHOL DETECTED - NOT DRIVABLE STATE */}
      {(displayState === 'NOT DRIVABLE' || displayState === 'ALCOHOL WARNING' || isAlcohol) && !vehicle.emergency_mode && displayState !== 'DECELERATING' && displayState !== 'SAFE STOP' && displayState !== 'LOCKED' && displayState !== 'EMERGENCY MODE' && (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>ALCOHOL DETECTED — NOT DRIVABLE</span>
            </div>
            <p className="text-[11px] text-rose-200/80 leading-relaxed font-sans">
              Vehicle operation is blocked for safety. Physical ESP32 relay cutoff activated.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">BREATH STATUS</div>
              <div className="font-bold text-rose-400 mt-1">DETECTED</div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">DRIVE AUTHORIZATION</div>
              <div className="font-bold text-rose-400 mt-1">NOT DRIVABLE</div>
            </div>
          </div>

          {/* Small Secondary Emergency Access Button */}
          <button
            onClick={openAlcoholWarning}
            className="w-full py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-600/40 font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-lg"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>[ EMERGENCY ACCESS ]</span>
          </button>
        </div>
      )}

      {/* 3. EMERGENCY MODE STATE */}
      {vehicle.emergency_mode && (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-300 space-y-1.5 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <div className="font-extrabold flex items-center gap-1.5 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>⚠ EMERGENCY ACCESS ACTIVE</span>
            </div>
            <div className="text-[11px] text-slate-300">VEHICLE: <strong className="text-amber-300">TEMPORARILY ENABLED</strong></div>
            <div className="text-[11px] text-slate-300">ALCOHOL STATUS: <strong className="text-rose-400">DETECTED</strong></div>
            <div className="text-[11px] text-slate-300">LOCATION MONITORING: <strong className="text-cyan-300">ACTIVE (1-2s)</strong></div>
          </div>

          {/* Emergency Timer Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center justify-between">
              <span>EMERGENCY ACCESS REMAINING</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <div className="text-3xl font-extrabold text-white tracking-widest text-center font-mono py-1">
              {emergencyTimeStr}
            </div>

            {/* Horizontal Progress Bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-amber-400 h-full transition-all duration-1000"
                style={{ width: `${emergencyProgressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. MOVING VEHICLE ALCOHOL DETECTION (DECELERATING) */}
      {state === 'DECELERATING' && (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-300 space-y-2 animate-pulse">
            <div className="font-extrabold text-sm text-amber-400 uppercase">
              ALCOHOL DETECTED WHILE MOVING
            </div>
            <div className="text-xs font-bold text-white">CONTROLLED DECELERATION</div>
            
            <div className="pt-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span>DECELERATING...</span>
                <span>{decelerateCountdown} seconds</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000"
                  style={{ width: `${(decelerateCountdown / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SAFE STOP STATE */}
      {state === 'SAFE STOP' && (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-300 space-y-2">
            <div className="font-extrabold text-sm text-rose-400 uppercase">SAFE STOP</div>
            <div className="text-xs font-bold text-white">VEHICLE LOCKED — BREATH TEST REQUIRED</div>
            <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
              Vehicle has stopped following an alcohol detection event. Please provide a new breath sample before vehicle authorization can be restored.
            </p>
          </div>

          <button
            onClick={openBreathTest}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>BLOW AGAIN (NEW BREATH TEST)</span>
          </button>
        </div>
      )}

      {/* 6. LOCKED STATE */}
      {state === 'LOCKED' && (
        <div className="space-y-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-800 text-rose-400 space-y-2">
            <div className="font-extrabold text-sm uppercase flex items-center gap-1.5 text-rose-500">
              <Lock className="w-4 h-4" />
              <span>VEHICLE LOCKED</span>
            </div>
            <div className="text-xs font-bold text-slate-200">START AUTHORIZATION BLOCKED</div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Ignition cut off by safety controller. A valid alcohol-free breath test is required to unlock.
            </p>
          </div>

          <button
            onClick={openBreathTest}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PROVIDE BREATH TEST</span>
          </button>
        </div>
      )}
    </div>
  );
};

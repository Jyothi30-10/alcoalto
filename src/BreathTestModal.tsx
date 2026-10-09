import React, { useState } from 'react';
import { Wind, CheckCircle2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import type { ClassificationType } from '../types';

export const BreathTestModal: React.FC = () => {
  const {
    isBreathTestModalOpen,
    closeBreathTest,
    runBreathTest,
    isBreathTestingActive,
    breathTestProgress,
    openAlcoholWarning,
  } = useSystem();

  const [testResult, setTestResult] = useState<ClassificationType | null>(null);

  if (!isBreathTestModalOpen) return null;

  const handleStartTest = async () => {
    setTestResult(null);
    const result = await runBreathTest();
    setTestResult(result);
    if (result === 'ALCOHOL DETECTED') {
      closeBreathTest();
      openAlcoholWarning();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center text-white space-y-6">
        
        {/* Close Button */}
        <button
          onClick={closeBreathTest}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Wind className="w-3.5 h-3.5" />
            <span>Multi-sensor breath analysis</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-wider font-mono text-white">
            ALCO<span className="text-cyan-400">ALTO</span>
          </h2>
          <p className="text-sm text-slate-300 font-light">
            Blow steadily toward the sensor array before starting the vehicle.
          </p>
        </div>

        {/* Visual Breath Sampling Animation Display */}
        <div className="relative mx-auto w-48 h-48 flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="8"
              className={
                testResult === 'SAFE'
                  ? 'text-emerald-500 transition-all duration-500'
                  : testResult === 'ALCOHOL DETECTED'
                  ? 'text-rose-500 transition-all duration-500'
                  : 'text-cyan-400 transition-all duration-200'
              }
              strokeDasharray={502.4}
              strokeDashoffset={502.4 - (502.4 * breathTestProgress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Graphic & Progress Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {isBreathTestingActive ? (
              <div className="space-y-2">
                <Wind className="w-10 h-10 text-cyan-400 animate-bounce mx-auto" />
                <div className="font-mono text-xl font-bold text-cyan-300">{breathTestProgress}%</div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">SAMPLING BREATH...</div>
              </div>
            ) : testResult === 'SAFE' ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <div className="font-mono text-base font-bold text-emerald-400">PASSED</div>
              </div>
            ) : testResult === 'ALCOHOL DETECTED' ? (
              <div className="space-y-1">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                <div className="font-mono text-xs font-bold text-rose-400">ALCOHOL DETECTED</div>
              </div>
            ) : (
              <div className="space-y-1">
                <Wind className="w-12 h-12 text-cyan-500/60 mx-auto" />
                <div className="text-xs font-mono text-slate-400">READY</div>
              </div>
            )}
          </div>
        </div>

        {/* Live Result State Banner */}
        {testResult === 'SAFE' && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 space-y-1 font-mono text-left">
            <div className="flex items-center space-x-2 text-sm font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>BREATH TEST PASSED</span>
            </div>
            <p className="text-xs text-emerald-200/80">Alcohol-free reading detected. Vehicle authorization granted.</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {!isBreathTestingActive && (
            <button
              onClick={handleStartTest}
              className="w-full py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-base tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Wind className="w-5 h-5" />
              <span>[ START BREATH TEST ]</span>
            </button>
          )}

          {testResult === 'SAFE' && (
            <button
              onClick={closeBreathTest}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm tracking-wider transition-all cursor-pointer"
            >
              ENABLE VEHICLE AUTHORIZATION
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500 font-mono">
          Multi-sensor breath analysis combines MQ-3, MQ-2, and MQ-135 telemetry for hardware authorization.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, Cpu, Radio } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useSystem } from '../context/SystemContext';

export const SensorAnalysisPanel: React.FC = () => {
  const { telemetry, telemetryHistory, connectionStatus, connectionSettings, activeMode, openBreathTest } = useSystem();

  const formattedChartData = telemetryHistory.map((item, idx) => ({
    time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : `#${idx + 1}`,
    MQ3: item.mq3,
    MQ2: item.mq2,
    MQ135: item.mq135,
  }));

  const isAlcohol = telemetry.alcohol || (telemetry.classification === 'ALCOHOL DETECTED');

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/30 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
            LIVE BREATH ANALYSIS
          </h2>
        </div>

        {/* Data Source Indicator */}
        <div className="flex items-center space-x-2 font-mono text-xs">
          {activeMode === 'LIVE' ? (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]">
              <Cpu className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>LIVE CAR MODULE ({connectionSettings.esp32Ip})</span>
            </span>
          ) : (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-bold">
              <Radio className="w-3 h-3 text-amber-400" />
              <span>DEMO SIMULATOR</span>
            </span>
          )}

          <button
            onClick={openBreathTest}
            className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 font-mono text-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>BREATH TEST</span>
          </button>
        </div>
      </div>

      {/* 3 Large Sensor Cards */}
      <div className="grid grid-cols-3 gap-3 font-mono">
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">MQ-3 (ALCOHOL)</div>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">{telemetry.mq3}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Alcohol Sensor</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">MQ-2 (VOC)</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{telemetry.mq2}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Combustible Gas Sensor</div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">MQ-135 (AIR QUALITY)</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{telemetry.mq135}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Air Quality / VOC Sensor</div>
        </div>
      </div>

      {/* Classification Display */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400 uppercase font-semibold">CLASSIFICATION</span>
        {!isAlcohol ? (
          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>● SAFE</span>
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-500/50 font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>● ALCOHOL DETECTED</span>
          </span>
        )}
      </div>

      {/* Real-time Line Chart */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 h-48 w-full">
        <div className="text-[11px] font-mono text-slate-400 mb-2 flex justify-between items-center">
          <span>REAL-TIME SENSOR READINGS TIME-SERIES</span>
          <span className="text-[10px] text-slate-400 font-semibold">
            LAST SENSOR UPDATE: {connectionStatus.lastUpdateSecondsAgo} seconds ago
          </span>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={formattedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} domain={[0, 'auto']} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
            />
            <Line type="monotone" dataKey="MQ3" stroke="#06b6d4" strokeWidth={2} dot={false} name="MQ-3 (Alcohol)" />
            <Line type="monotone" dataKey="MQ2" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MQ-2 (VOC)" />
            <Line type="monotone" dataKey="MQ135" stroke="#10b981" strokeWidth={1.5} dot={false} name="MQ-135 (Air Quality)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

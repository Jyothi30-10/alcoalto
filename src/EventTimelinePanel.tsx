import React from 'react';
import { History, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Radio } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const EventTimelinePanel: React.FC = () => {
  const { events } = useSystem();

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('PASSED') || eventType.includes('SAFE')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
    if (eventType.includes('ALCOHOL') || eventType.includes('BLOCKED')) {
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
    if (eventType.includes('EMERGENCY')) {
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
    return <Radio className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-900/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h2 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
            SAFETY EVENT TIMELINE
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {events.length} EVENTS LOGGED
        </span>
      </div>

      {/* Timeline List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            NO SAFETY EVENTS RECORDED YET
          </div>
        ) : (
          events.map((ev) => (
            <div
              key={ev.id}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-3 font-mono text-xs hover:border-cyan-500/30 transition-colors"
            >
              <div className="mt-0.5">{getEventIcon(ev.event_type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white tracking-wide">{ev.event_type}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
                {ev.details && <p className="text-[11px] text-slate-400 font-sans">{ev.details}</p>}
                {(ev.mq3 !== undefined || ev.latitude !== undefined) && (
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 pt-1">
                    {ev.mq3 !== undefined && <span>MQ-3: {ev.mq3}</span>}
                    {ev.latitude !== undefined && <span>GPS: {ev.latitude?.toFixed(4)}, {ev.longitude?.toFixed(4)}</span>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

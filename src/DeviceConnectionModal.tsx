import React, { useState } from 'react';
import { Cpu, Wifi, Globe, Key, Save, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { localEsp32Client } from '../services/localEsp32';

export const DeviceConnectionModal: React.FC = () => {
  const { connectionSettings, updateConnectionSettings, activeRoute, setActiveRoute, refreshData } = useSystem();

  const [esp32Ip, setEsp32Ip] = useState(connectionSettings.esp32Ip);
  const [connectionMode, setConnectionMode] = useState<'LOCAL' | 'CLOUD'>(connectionSettings.connectionMode);
  const [backendUrl, setBackendUrl] = useState(connectionSettings.backendUrl);
  const [deviceApiKey, setDeviceApiKey] = useState(connectionSettings.deviceApiKey);
  
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (activeRoute !== 'connection') return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    localEsp32Client.setIp(esp32Ip);
    const result = await localEsp32Client.connectDashboard();
    
    setIsTesting(false);
    if (result.success) {
      setTestResult({ success: true, message: 'Connection successful.' });
    } else {
      setTestResult({ success: false, message: result.message });
    }
  };

  const handleSave = () => {
    localEsp32Client.setIp(esp32Ip);
    updateConnectionSettings({
      esp32Ip,
      connectionMode,
      backendUrl,
      deviceApiKey,
    });
    refreshData();
    setTestResult({ success: true, message: 'Connection settings saved.' });
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-md border border-cyan-900/50 rounded-2xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/30 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-white tracking-wider">
              DEVICE CONNECTION
            </h2>
            <p className="text-xs text-slate-400">Configure ESP32 microcontroller IP and communication mode.</p>
          </div>
        </div>

        <button
          onClick={() => setActiveRoute('dashboard')}
          className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Connection Mode Options */}
      <div className="space-y-3 font-mono text-xs">
        <label className="text-slate-300 font-bold uppercase tracking-wider block">
          CONNECTION MODE
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => setConnectionMode('LOCAL')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              connectionMode === 'LOCAL'
                ? 'bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold text-sm mb-1 text-cyan-300">
              <Wifi className="w-4 h-4" />
              <span>[ LOCAL ESP32 ]</span>
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Dashboard communicates directly with ESP32 local IP over Wi-Fi network (SSID: Park).
            </p>
          </div>

          <div
            onClick={() => setConnectionMode('CLOUD')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              connectionMode === 'CLOUD'
                ? 'bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)] text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2 font-bold text-sm mb-1 text-cyan-300">
              <Globe className="w-4 h-4" />
              <span>[ CLOUD BACKEND ]</span>
            </div>
            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              ESP32 sends telemetry to Render FastAPI backend which streams updates to dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-4 font-mono text-xs">
        {/* ESP32 IP ADDRESS */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>ESP32 IP ADDRESS</span>
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={esp32Ip}
              onChange={(e) => setEsp32Ip(e.target.value)}
              placeholder="192.168.1.105"
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none font-mono text-sm"
            />
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-lg"
            >
              [ CONNECT ]
            </button>
          </div>
        </div>

        {/* Status Snapshot after Connection */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ESP32</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>● CONNECTED</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">IP:</span>
            <span className="text-cyan-300 font-bold">{esp32Ip}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">API:</span>
            <span className="text-emerald-400 font-bold">AVAILABLE (GET /api/status)</span>
          </div>
        </div>
      </div>

      {/* Test Connection Button & Result Banner */}
      <div className="space-y-3 font-mono text-xs pt-1 border-t border-slate-800">
        {testResult && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-bold'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold tracking-wider transition-all cursor-pointer flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isTesting ? 'animate-spin' : ''}`} />
            <span>[ TEST CONNECTION ]</span>
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            SAVE CONFIGURATION
          </button>
        </div>
      </div>
    </div>
  );
};

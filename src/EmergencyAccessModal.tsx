import React from 'react';
import { AlertCircle, ArrowLeft, ShieldCheck, Clock, MapPin, Eye } from 'lucide-react';
import { useSystem } from '../context/SystemContext';

export const EmergencyAccessModal: React.FC = () => {
  const { isEmergencyModalOpen, closeEmergencyModal, openAlcoholWarning, confirmEmergencyAccess } = useSystem();

  if (!isEmergencyModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)] text-white space-y-6">
        
        {/* Header Title */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-amber-400 tracking-wider">
              EMERGENCY ACCESS
            </h2>
            <p className="text-xs text-slate-300">
              Emergency access allows temporary vehicle operation despite the alcohol warning.
            </p>
          </div>
        </div>

        {/* Explicit 6 Emergency Rules List */}
        <div className="space-y-3 font-sans text-xs text-slate-200 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div className="font-mono text-amber-400 font-semibold mb-2 uppercase text-[11px] tracking-wider">
            MANDATORY EMERGENCY RULES & CONDITIONS:
          </div>
          <ul className="space-y-2 text-slate-300 leading-relaxed">
            <li className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>• Vehicle access is limited to a maximum of <strong>6 hours</strong>.</span>
            </li>
            <li className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>• The driver is responsible for applicable police fine/challan requirements.</span>
            </li>
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>• The vehicle's location will be continuously monitored.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Eye className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>• Location and safety status will be visible to the authorized monitoring dashboard.</span>
            </li>
            <li className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>• Emergency access expires automatically after <strong>6 hours</strong>.</span>
            </li>
            <li className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>• Emergency access does not remove or override applicable legal requirements.</span>
            </li>
          </ul>
        </div>

        {/* Prototype Simulation Disclaimer Box */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono text-center">
          <span className="text-amber-400 font-bold">NOTE:</span> This is a prototype simulation. The application itself does not issue or collect real police challans.
        </div>

        {/* Exactly Two Buttons at Bottom: [ CONTINUE ANYWAY ] [ BACK ] */}
        <div className="flex items-center justify-end space-x-4 pt-2">
          <button
            onClick={() => {
              closeEmergencyModal();
              openAlcoholWarning();
            }}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold tracking-wider flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>[ BACK ]</span>
          </button>

          <button
            onClick={confirmEmergencyAccess}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
          >
            [ CONTINUE ANYWAY ]
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { DriverProfileCard } from './DriverProfileCard';
import { LiveMapPanel } from './LiveMapPanel';
import { SensorAnalysisPanel } from './SensorAnalysisPanel';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { EmergencyTimerBadge } from './EmergencyTimerBadge';
import { EventTimelinePanel } from './EventTimelinePanel';

export const MainDashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Emergency Countdown Banner if Active */}
      <EmergencyTimerBadge />

      {/* 3-COLUMN DESKTOP VIEWPORT DASHBOARD LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* COLUMN 1 — DRIVER PROFILE & CONNECTION */}
        <div className="lg:col-span-3">
          <DriverProfileCard />
        </div>

        {/* COLUMN 2 — MAIN MONITORING AREA (TOP ROW: LOCATION, BOTTOM ROW: BREATH ANALYSIS) */}
        <div className="lg:col-span-6 space-y-5">
          <LiveMapPanel />
          <SensorAnalysisPanel />
        </div>

        {/* COLUMN 3 — VEHICLE SAFETY / EMERGENCY STATUS & EVENT TIMELINE */}
        <div className="lg:col-span-3 space-y-5">
          <VehicleStatusBadge />
          <EventTimelinePanel />
        </div>

      </div>
    </div>
  );
};

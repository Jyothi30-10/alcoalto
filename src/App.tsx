import React, { useState } from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { HeaderBar } from './components/HeaderBar';
import { NavigationSidebar } from './components/NavigationSidebar';
import { LandingScreen } from './components/LandingScreen';
import { MainDashboard } from './components/MainDashboard';
import { PoliceDashboard } from './components/PoliceDashboard';
import { BreathTestModal } from './components/BreathTestModal';
import { AlcoholWarningModal } from './components/AlcoholWarningModal';
import { EmergencyAccessModal } from './components/EmergencyAccessModal';
import { DeviceConnectionModal } from './components/DeviceConnectionModal';
import { DemoControlPanel } from './components/DemoControlPanel';
import { EventTimelinePanel } from './components/EventTimelinePanel';
import { LiveMapPanel } from './components/LiveMapPanel';

const DashboardContent: React.FC = () => {
  const { activeRoute } = useSystem();
  const [showLanding, setShowLanding] = useState<boolean>(true);

  if (showLanding) {
    return <LandingScreen onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <HeaderBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <NavigationSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-slate-950 to-slate-950">
          {activeRoute === 'dashboard' && <MainDashboard />}
          {activeRoute === 'breath-test' && <MainDashboard />}
          {activeRoute === 'police' && <PoliceDashboard />}
          {activeRoute === 'location' && (
            <div className="space-y-4">
              <LiveMapPanel />
            </div>
          )}
          {activeRoute === 'events' && (
            <div className="space-y-4">
              <EventTimelinePanel />
            </div>
          )}
          {activeRoute === 'connection' && <DeviceConnectionModal />}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <BreathTestModal />
      <AlcoholWarningModal />
      <EmergencyAccessModal />
      <DemoControlPanel />
    </div>
  );
};

export function App() {
  return (
    <SystemProvider>
      <DashboardContent />
    </SystemProvider>
  );
}

export default App;

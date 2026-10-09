import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TelemetryData, DriverProfile, VehicleData, SafetyEvent, ConnectionSettings, ClassificationType, VehicleStateType } from '../types';
import * as api from '../services/api';
import { TelemetryWebSocket } from '../services/websocket';
import { localEsp32Client } from '../services/localEsp32';
import { connectToESP32, getESP32Status, setEmergencyMode, getESP32BaseUrl, setESP32BaseUrl } from '../services/esp32Api';

interface SystemContextType {
  driver: DriverProfile;
  vehicle: VehicleData;
  telemetry: TelemetryData;
  telemetryHistory: TelemetryData[];
  events: SafetyEvent[];
  connectionStatus: {
    esp32Connected: boolean;
    backendConnected: boolean;
    lastPacketTime: string;
    lastUpdateSecondsAgo: number;
    wifiRssi: number;
  };
  connectionSettings: ConnectionSettings;
  demoMode: boolean;
  activeMode: 'LIVE' | 'DEMO';
  isBreathTestModalOpen: boolean;
  isAlcoholWarningOpen: boolean;
  isEmergencyModalOpen: boolean;
  isBreathTestingActive: boolean;
  breathTestProgress: number;
  emergencySecondsRemaining: number;
  activeRoute: string;
  
  // Actions
  setActiveRoute: (route: string) => void;
  setMode: (mode: 'LIVE' | 'DEMO') => void;
  connectToCarModule: (ipAddress: string) => Promise<boolean>;
  openBreathTest: () => void;
  closeBreathTest: () => void;
  runBreathTest: (forceClassification?: ClassificationType) => Promise<ClassificationType>;
  openAlcoholWarning: () => void;
  closeAlcoholWarning: () => void;
  openEmergencyModal: () => void;
  closeEmergencyModal: () => void;
  confirmEmergencyAccess: () => Promise<void>;
  toggleDemoMode: () => void;
  triggerDemoScenario: (scenario: 'SAFE' | 'ALCOHOL' | 'EMERGENCY' | 'MOVING' | 'DECELERATING' | 'STOPPED' | 'EXPIRE_EMERGENCY' | 'DISCONNECT') => void;
  updateConnectionSettings: (settings: Partial<ConnectionSettings>) => void;
  refreshData: () => Promise<void>;
}

const defaultDriver: DriverProfile = {
  driver_id: 'SD1024',
  name: 'Primary Driver',
  license_plate: 'TN01AB1234',
  license_status: 'VALID',
  phone: '+91 98765 43210',
  vehicle_id: 'SD-CAR-01',
  vehicle_model: 'ALCOALTO SAFETY CAR',
};

const defaultVehicle: VehicleData = {
  vehicle_id: 'SD-CAR-01',
  model: 'ALCOALTO SAFETY CAR',
  license_plate: 'TN01AB1234',
  driver_id: 'SD1024',
  state: 'SAFE',
  emergency_mode: false,
};

const defaultTelemetry: TelemetryData = {
  vehicle: 'SD-CAR-01',
  vehicle_id: 'SD-CAR-01',
  driver: 'SD1024',
  driver_id: 'SD1024',
  mq3: 85,
  mq2: 120,
  mq135: 110,
  alcohol: false,
  state: 'SAFE',
  emergency: false,
  wifi_rssi: -48,
  classification: 'SAFE',
  vehicle_state: 'SAFE',
  emergency_mode: false,
  emergency_remaining: 0,
  latitude: 13.021800,
  longitude: 80.174300,
  location_source: 'GPS',
  timestamp: new Date().toISOString(),
};

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [driver, setDriver] = useState<DriverProfile>(defaultDriver);
  const [vehicle, setVehicle] = useState<VehicleData>(defaultVehicle);
  const [telemetry, setTelemetry] = useState<TelemetryData>(defaultTelemetry);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([defaultTelemetry]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);

  const [activeMode, setActiveModeState] = useState<'LIVE' | 'DEMO'>('LIVE');
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const [connectionStatus, setConnectionStatus] = useState({
    esp32Connected: false,
    backendConnected: true,
    lastPacketTime: new Date().toLocaleTimeString(),
    lastUpdateSecondsAgo: 0,
    wifiRssi: -48,
  });

  const [connectionSettings, setConnectionSettings] = useState<ConnectionSettings>({
    esp32Ip: getESP32BaseUrl().replace(/^https?:\/\//, ''),
    connectionMode: 'LOCAL',
    backendUrl: api.API_BASE_URL,
    deviceApiKey: 'alcoalto-esp32-secret-key',
    isEsp32Connected: false,
  });

  const [isBreathTestModalOpen, setIsBreathTestModalOpen] = useState<boolean>(false);
  const [isAlcoholWarningOpen, setIsAlcoholWarningOpen] = useState<boolean>(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isBreathTestingActive, setIsBreathTestingActive] = useState<boolean>(false);
  const [breathTestProgress, setBreathTestProgress] = useState<number>(0);
  const [emergencySecondsRemaining, setEmergencySecondsRemaining] = useState<number>(0);
  const [activeRoute, setActiveRoute] = useState<string>('dashboard');

  const lastTelemetryTimeRef = useRef<number>(Date.now());
  const wsClientRef = useRef<TelemetryWebSocket | null>(null);

  // Initialize emergency timer from localStorage if active
  useEffect(() => {
    const savedActivation = localStorage.getItem('alcoalto_emergency_activation_time');
    if (savedActivation) {
      const actTime = parseInt(savedActivation, 10);
      const expTime = actTime + (6 * 3600 * 1000);
      const remainingSecs = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      if (remainingSecs > 0) {
        setEmergencySecondsRemaining(remainingSecs);
        setVehicle((v) => ({ ...v, emergency_mode: true, state: 'EMERGENCY MODE' }));
        setTelemetry((t) => ({
          ...t,
          emergency: true,
          emergency_mode: true,
          state: 'EMERGENCY MODE',
          vehicle_state: 'EMERGENCY MODE',
          emergency_remaining: remainingSecs
        }));
      } else {
        localStorage.removeItem('alcoalto_emergency_activation_time');
      }
    }
  }, []);

  const setMode = (mode: 'LIVE' | 'DEMO') => {
    setActiveModeState(mode);
    setDemoMode(mode === 'DEMO');
    if (mode === 'LIVE') {
      setConnectionSettings((prev) => ({ ...prev, connectionMode: 'LOCAL' }));
    }
  };

  const processEspStatus = (espStatus: any) => {
    lastTelemetryTimeRef.current = Date.now();
    const isAlcohol = espStatus.alcohol || espStatus.mq3 > 300;
    const classification: ClassificationType = isAlcohol ? 'ALCOHOL DETECTED' : 'SAFE';
    
    // Explicit state hierarchy preservation
    let state: VehicleStateType = 'SAFE';
    if (isAlcohol && !espStatus.emergency) {
      state = 'NOT DRIVABLE';
    } else if (espStatus.emergency) {
      state = 'EMERGENCY MODE';
    } else if (espStatus.state) {
      state = espStatus.state as VehicleStateType;
    }

    const mappedTelem: TelemetryData = {
      vehicle: espStatus.vehicle || 'SD-CAR-01',
      driver: espStatus.driver || 'SD1024',
      mq3: Number(espStatus.mq3),
      mq2: Number(espStatus.mq2),
      mq135: Number(espStatus.mq135),
      alcohol: Boolean(isAlcohol),
      state: state,
      emergency: Boolean(espStatus.emergency),
      wifi_rssi: Number(espStatus.wifi_rssi || -48),
      classification: classification,
      vehicle_state: state,
      emergency_mode: Boolean(espStatus.emergency),
      latitude: espStatus.latitude ? Number(espStatus.latitude) : telemetry.latitude,
      longitude: espStatus.longitude ? Number(espStatus.longitude) : telemetry.longitude,
      location_source: espStatus.latitude ? 'GPS' : telemetry.location_source,
      timestamp: new Date().toISOString(),
    };

    setTelemetry(mappedTelem);
    setTelemetryHistory((h) => [...h.slice(-49), mappedTelem]);
    setVehicle((v) => ({ ...v, state: state, emergency_mode: Boolean(espStatus.emergency) }));

    setConnectionStatus((prev) => ({
      ...prev,
      esp32Connected: true,
      lastPacketTime: new Date().toLocaleTimeString(),
      lastUpdateSecondsAgo: 0,
      wifiRssi: Number(espStatus.wifi_rssi || -48),
    }));

    if (isAlcohol && state === 'ALCOHOL WARNING' && !espStatus.emergency) {
      setIsAlcoholWarningOpen(true);
    }
  };

  const connectToCarModule = async (ipAddress: string): Promise<boolean> => {
    const cleanIp = ipAddress.trim();
    const fullUrl = setESP32BaseUrl(cleanIp);
    setConnectionSettings((prev) => ({ ...prev, esp32Ip: cleanIp, connectionMode: 'LOCAL', isEsp32Connected: false }));
    setActiveModeState('LIVE');
    setDemoMode(false);

    const res = await connectToESP32(fullUrl);
    if (res.success) {
      setConnectionStatus((prev) => ({
        ...prev,
        esp32Connected: true,
        lastPacketTime: new Date().toLocaleTimeString(),
        lastUpdateSecondsAgo: 0,
      }));
      setConnectionSettings((prev) => ({ ...prev, isEsp32Connected: true }));
      try {
        const espStatus = await getESP32Status(fullUrl);
        processEspStatus(espStatus);
      } catch (e) {}
      return true;
    } else {
      setConnectionStatus((prev) => ({ ...prev, esp32Connected: false }));
      setConnectionSettings((prev) => ({ ...prev, isEsp32Connected: false }));
      return false;
    }
  };

  // 6-Hour Emergency countdown timer tick calculated from localStorage activation timestamp
  useEffect(() => {
    let interval: any = null;
    const checkTimer = () => {
      const savedActivation = localStorage.getItem('alcoalto_emergency_activation_time');
      if (savedActivation) {
        const actTime = parseInt(savedActivation, 10);
        const expTime = actTime + (6 * 3600 * 1000);
        const remSecs = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
        setEmergencySecondsRemaining(remSecs);

        if (remSecs === 0) {
          localStorage.removeItem('alcoalto_emergency_activation_time');
          api.expireEmergencyMode(vehicle.vehicle_id);
          if (activeMode === 'LIVE') {
            setEmergencyMode(false);
          }
          setVehicle((v) => ({ ...v, state: 'LOCKED', emergency_mode: false }));
          setTelemetry((t) => ({ ...t, state: 'LOCKED', vehicle_state: 'LOCKED', emergency_mode: false, emergency_remaining: 0 }));
        }
      } else if (emergencySecondsRemaining > 0) {
        setEmergencySecondsRemaining((prev) => Math.max(0, prev - 1));
      }
    };

    interval = setInterval(checkTimer, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [vehicle.vehicle_id, activeMode, emergencySecondsRemaining]);

  // Telemetry timeout checker (>15s offline detection)
  useEffect(() => {
    const timeoutChecker = setInterval(() => {
      const secondsAgo = Math.floor((Date.now() - lastTelemetryTimeRef.current) / 1000);
      setConnectionStatus((prev) => ({
        ...prev,
        lastUpdateSecondsAgo: secondsAgo,
        esp32Connected: activeMode === 'LIVE' ? secondsAgo < 15 : prev.esp32Connected,
      }));

      if (secondsAgo >= 15 && vehicle.state !== 'OFFLINE' && activeMode === 'LIVE') {
        setVehicle((v) => ({ ...v, state: 'OFFLINE' }));
        setTelemetry((t) => ({ ...t, state: 'OFFLINE', vehicle_state: 'OFFLINE' }));
      }
    }, 1000);

    return () => clearInterval(timeoutChecker);
  }, [vehicle.state, activeMode]);

  const refreshData = useCallback(async () => {
    try {
      if (activeMode === 'LIVE') {
        const espStatus = await getESP32Status();
        processEspStatus(espStatus);
      } else {
        const d = await api.fetchDriverProfile();
        setDriver(d);

        const v = await api.fetchVehicleData();
        setVehicle(v);

        const historyData = await api.fetchTelemetryHistory();
        if (historyData && historyData.history && historyData.history.length > 0) {
          setTelemetryHistory(historyData.history);
          const latest = historyData.latest || historyData.history[historyData.history.length - 1];
          setTelemetry(latest);
          lastTelemetryTimeRef.current = Date.now();

          if (historyData.emergency_remaining > 0) {
            setEmergencySecondsRemaining(historyData.emergency_remaining);
          }
        }

        const evs = await api.fetchEvents();
        setEvents(evs);

        setConnectionStatus((prev) => ({ ...prev, backendConnected: true }));
      }
    } catch (e) {
      if (activeMode === 'LIVE') {
        setConnectionStatus((prev) => ({ ...prev, esp32Connected: false }));
      }
    }
  }, [activeMode]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // SINGLE UNIFIED POLLING LOOP: 10s normal operating interval, 1.5s emergency/critical interval
  useEffect(() => {
    const isCritical = vehicle.state === 'EMERGENCY MODE' || vehicle.state === 'ALCOHOL WARNING' || vehicle.state === 'DECELERATING' || emergencySecondsRemaining > 0;
    const pollRate = activeMode === 'LIVE' ? (isCritical ? 1500 : 10000) : 10000;

    const interval = setInterval(() => {
      if (activeMode === 'LIVE') {
        getESP32Status()
          .then((espStatus) => {
            processEspStatus(espStatus);
          })
          .catch(() => {
            setConnectionStatus((prev) => ({ ...prev, esp32Connected: false }));
          });
      } else if (demoMode) {
        setTelemetry((prev) => {
          if (prev.state === 'OFFLINE') return prev;

          let newMq3 = prev.mq3;
          let newMq2 = prev.mq2;
          let newMq135 = prev.mq135;

          if (prev.classification === 'SAFE') {
            newMq3 = Math.max(50, Math.min(130, prev.mq3 + Math.floor(Math.random() * 9) - 4));
            newMq2 = Math.max(80, Math.min(180, prev.mq2 + Math.floor(Math.random() * 9) - 4));
            newMq135 = Math.max(70, Math.min(160, prev.mq135 + Math.floor(Math.random() * 9) - 4));
          } else if (prev.classification === 'ALCOHOL DETECTED') {
            newMq3 = Math.max(600, Math.min(950, prev.mq3 + Math.floor(Math.random() * 15) - 7));
            newMq2 = Math.max(300, Math.min(550, prev.mq2 + Math.floor(Math.random() * 15) - 7));
            newMq135 = Math.max(350, Math.min(600, prev.mq135 + Math.floor(Math.random() * 15) - 7));
          }

          let newLat = prev.latitude || 13.021800;
          let newLng = prev.longitude || 80.174300;
          if (prev.state === 'MOVING' || prev.state === 'EMERGENCY MODE') {
            newLat += (Math.random() - 0.5) * 0.0004;
            newLng += (Math.random() - 0.5) * 0.0004;
          }

          const updated: TelemetryData = {
            ...prev,
            mq3: newMq3,
            mq2: newMq2,
            mq135: newMq135,
            latitude: newLat,
            longitude: newLng,
            timestamp: new Date().toISOString(),
          };

          lastTelemetryTimeRef.current = Date.now();
          setTelemetryHistory((h) => [...h.slice(-49), updated]);
          api.sendTelemetry(updated).catch(() => {});
          return updated;
        });

        setConnectionStatus((prev) => ({
          ...prev,
          lastPacketTime: new Date().toLocaleTimeString(),
          lastUpdateSecondsAgo: 0,
          esp32Connected: true,
        }));
      }
    }, pollRate);

    return () => clearInterval(interval);
  }, [activeMode, demoMode, vehicle.state, emergencySecondsRemaining]);

  // Breath Test execution
  const runBreathTest = async (forceClassification?: ClassificationType): Promise<ClassificationType> => {
    setIsBreathTestingActive(true);
    setBreathTestProgress(0);

    api.logEvent({
      event_type: 'BREATH TEST STARTED',
      vehicle_id: vehicle.vehicle_id,
      driver_id: driver.driver_id,
      details: 'Multi-sensor breath analysis initiated.'
    }).catch(() => {});

    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(async () => {
        progress += 20;
        setBreathTestProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
          setIsBreathTestingActive(false);

          let classification: ClassificationType = forceClassification || (Math.random() > 0.4 ? 'SAFE' : 'ALCOHOL DETECTED');
          let newMq3 = classification === 'SAFE' ? Math.floor(Math.random() * 40) + 70 : Math.floor(Math.random() * 250) + 642;
          let newMq2 = classification === 'SAFE' ? Math.floor(Math.random() * 40) + 100 : Math.floor(Math.random() * 150) + 301;
          let newMq135 = classification === 'SAFE' ? Math.floor(Math.random() * 40) + 90 : Math.floor(Math.random() * 150) + 420;

          const updatedState: VehicleStateType = classification === 'SAFE' ? 'SAFE' : 'NOT DRIVABLE';

          const newTelemetry: TelemetryData = {
            ...telemetry,
            mq3: newMq3,
            mq2: newMq2,
            mq135: newMq135,
            alcohol: classification === 'ALCOHOL DETECTED',
            state: updatedState,
            classification: classification,
            vehicle_state: updatedState,
            timestamp: new Date().toISOString(),
          };

          setTelemetry(newTelemetry);
          setTelemetryHistory((prev) => [...prev.slice(-49), newTelemetry]);
          setVehicle((v) => ({ ...v, state: updatedState }));

          await api.sendTelemetry(newTelemetry).catch(() => {});

          if (classification === 'ALCOHOL DETECTED') {
            await api.logEvent({
              event_type: 'ALCOHOL DETECTED',
              vehicle_id: vehicle.vehicle_id,
              driver_id: driver.driver_id,
              latitude: telemetry.latitude,
              longitude: telemetry.longitude,
              mq3: newMq3,
              mq2: newMq2,
              mq135: newMq135,
              classification: 'ALCOHOL DETECTED',
              vehicle_state: 'ALCOHOL WARNING',
              details: 'Alcohol detected during multi-sensor breath analysis. Vehicle operation held.'
            }).catch(() => {});

            setIsAlcoholWarningOpen(true);
          } else {
            await api.logEvent({
              event_type: 'BREATH TEST PASSED',
              vehicle_id: vehicle.vehicle_id,
              driver_id: driver.driver_id,
              latitude: telemetry.latitude,
              longitude: telemetry.longitude,
              mq3: newMq3,
              mq2: newMq2,
              mq135: newMq135,
              classification: 'SAFE',
              vehicle_state: 'SAFE',
              details: 'Breath test passed. Alcohol-free reading detected. Authorization granted.'
            }).catch(() => {});
          }

          resolve(classification);
        }
      }, 300);
    });
  };

  const confirmEmergencyAccess = async () => {
    setIsEmergencyModalOpen(false);
    setIsAlcoholWarningOpen(false);

    const now = Date.now();
    localStorage.setItem('alcoalto_emergency_activation_time', now.toString());

    if (activeMode === 'LIVE') {
      await setEmergencyMode(true);
    }

    try {
      const res = await api.activateEmergencyMode(vehicle.vehicle_id, driver.driver_id);
      setEmergencySecondsRemaining(res.seconds_remaining || 6 * 3600);
    } catch (e) {
      setEmergencySecondsRemaining(6 * 3600);
    }

    setVehicle((v) => ({ ...v, emergency_mode: true, state: 'EMERGENCY MODE' }));
    setTelemetry((t) => ({
      ...t,
      alcohol: true,
      emergency: true,
      emergency_mode: true,
      state: 'EMERGENCY MODE',
      vehicle_state: 'EMERGENCY MODE',
      emergency_remaining: 6 * 3600
    }));

    await api.logEvent({
      event_type: 'EMERGENCY ACCESS ACTIVATED',
      vehicle_id: vehicle.vehicle_id,
      driver_id: driver.driver_id,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      details: '6-Hour Emergency Access activated. Continuous location monitoring enabled.'
    }).catch(() => {});
  };

  const triggerDemoScenario = (scenario: 'SAFE' | 'ALCOHOL' | 'EMERGENCY' | 'MOVING' | 'DECELERATING' | 'STOPPED' | 'EXPIRE_EMERGENCY' | 'DISCONNECT') => {
    if (scenario === 'SAFE') {
      runBreathTest('SAFE');
    } else if (scenario === 'ALCOHOL') {
      runBreathTest('ALCOHOL DETECTED');
    } else if (scenario === 'EMERGENCY') {
      setIsAlcoholWarningOpen(true);
      setIsEmergencyModalOpen(true);
    } else if (scenario === 'MOVING') {
      setVehicle((v) => ({ ...v, state: 'MOVING' }));
      setTelemetry((t) => ({ ...t, state: 'MOVING', vehicle_state: 'MOVING' }));
      api.logEvent({
        event_type: 'VEHICLE STARTED',
        vehicle_id: vehicle.vehicle_id,
        driver_id: driver.driver_id,
        details: 'Vehicle in motion.'
      });
    } else if (scenario === 'DECELERATING') {
      setVehicle((v) => ({ ...v, state: 'DECELERATING' }));
      setTelemetry((t) => ({ ...t, state: 'DECELERATING', vehicle_state: 'DECELERATING' }));
      api.logEvent({
        event_type: 'VEHICLE CONTROLLED DECELERATION STARTED',
        vehicle_id: vehicle.vehicle_id,
        driver_id: driver.driver_id,
        details: 'Alcohol detected while moving. Controlled deceleration initiated.'
      });
      setTimeout(() => {
        triggerDemoScenario('STOPPED');
      }, 5000);
    } else if (scenario === 'STOPPED') {
      setVehicle((v) => ({ ...v, state: 'SAFE STOP' }));
      setTelemetry((t) => ({ ...t, state: 'SAFE STOP', vehicle_state: 'SAFE STOP' }));
      api.logEvent({
        event_type: 'SAFE STOP',
        vehicle_id: vehicle.vehicle_id,
        driver_id: driver.driver_id,
        details: 'Vehicle reached safe stop. Vehicle locked until new breath test.'
      });
    } else if (scenario === 'EXPIRE_EMERGENCY') {
      localStorage.removeItem('alcoalto_emergency_activation_time');
      setEmergencySecondsRemaining(0);
      setVehicle((v) => ({ ...v, state: 'LOCKED', emergency_mode: false }));
      setTelemetry((t) => ({ ...t, state: 'LOCKED', vehicle_state: 'LOCKED', emergency_mode: false }));
      api.logEvent({
        event_type: 'EMERGENCY ACCESS EXPIRED',
        vehicle_id: vehicle.vehicle_id,
        driver_id: driver.driver_id,
        details: 'Emergency authorization expired. Vehicle locked.'
      });
    } else if (scenario === 'DISCONNECT') {
      setVehicle((v) => ({ ...v, state: 'OFFLINE' }));
      setTelemetry((t) => ({ ...t, state: 'OFFLINE', vehicle_state: 'OFFLINE' }));
      setConnectionStatus((prev) => ({ ...prev, esp32Connected: false, lastUpdateSecondsAgo: 25 }));
    }
  };

  const updateConnectionSettings = (settings: Partial<ConnectionSettings>) => {
    setConnectionSettings((prev) => ({ ...prev, ...settings }));
  };

  return (
    <SystemContext.Provider
      value={{
        driver,
        vehicle,
        telemetry,
        telemetryHistory,
        events,
        connectionStatus,
        connectionSettings,
        demoMode,
        activeMode,
        isBreathTestModalOpen,
        isAlcoholWarningOpen,
        isEmergencyModalOpen,
        isBreathTestingActive,
        breathTestProgress,
        emergencySecondsRemaining,
        activeRoute,
        setActiveRoute,
        setMode,
        connectToCarModule,
        openBreathTest: () => setIsBreathTestModalOpen(true),
        closeBreathTest: () => setIsBreathTestModalOpen(false),
        runBreathTest,
        openAlcoholWarning: () => setIsAlcoholWarningOpen(true),
        closeAlcoholWarning: () => setIsAlcoholWarningOpen(false),
        openEmergencyModal: () => setIsEmergencyModalOpen(true),
        closeEmergencyModal: () => setIsEmergencyModalOpen(false),
        confirmEmergencyAccess,
        toggleDemoMode: () => {
          const newDemo = !demoMode;
          setDemoMode(newDemo);
          setActiveModeState(newDemo ? 'DEMO' : 'LIVE');
        },
        triggerDemoScenario,
        updateConnectionSettings,
        refreshData,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within a SystemProvider');
  return ctx;
};

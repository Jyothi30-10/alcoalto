# SOBERDRIVE – Intelligent Alcohol Detection & Vehicle Safety Monitoring System

**SOBERDRIVE** is an embedded automotive safety prototype designed for real-time alcohol breath analysis, vehicle ignition interlocking, GPS fleet tracking, and cloud safety monitoring.

The system combines an **ESP32 microcontroller** installed in a vehicle (interfaced with MQ-3, MQ-2, MQ-135 sensors, NEO-6M GPS, and motor cutoff relay) with a **FastAPI backend** and a sci-fi automotive command center **React frontend dashboard**.

---

## 🚘 System Architecture

```
[ ESP32 Controller ] ── (Wi-Fi Telemetry) ──► [ FastAPI Backend (Render) ] ── (WebSockets) ──► [ Web Dashboard ]
       │                                              │                                               │
 (MQ Sensors & GPS)                               (SQLite/PostgreSQL)                             (Driver/Police UI)
```

1. **Vehicle-Side Controller**: ESP32 continuously samples MQ-3 (Alcohol), MQ-2 (Combustible/Gas), MQ-135 (Air Quality), and NEO-6M GPS coordinates.
2. **Cloud Backend**: Python FastAPI ingests telemetry, validates API keys, records safety events, manages 6-hour emergency countdown state, and streams real-time updates over WebSockets.
3. **Command Center Dashboard**: Responsive React + TypeScript + Vite + Tailwind CSS interface featuring interactive Leaflet GPS maps, Recharts sensor time-series, emergency timer persistence, and an authorized Police Fleet Monitor.

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Specs: `http://localhost:8000/docs`

### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Dashboard URL: `http://localhost:5173`

---

## ⚡ Hackathon Demo Mode

The application includes an onboard **Simulator Engine** so you can demonstrate the entire vehicle flow without physical hardware connected:

1. Click **`[ ENABLE DEMO MODE ]`** in the bottom control drawer.
2. Use quick trigger scenarios:
   - **`SAFE BREATH`**: Simulates alcohol-free reading (MQ-3: ~80) → Engine Authorization Granted.
   - **`ALCOHOL DETECTED`**: Simulates alcohol presence (MQ-3: >650) → Engine Ignition Blocked.
   - **`EMERGENCY MODE`**: Triggers 6-hour emergency countdown protocol & continuous location tracking.
   - **`VEHICLE MOVING`**: Updates vehicle status to in-motion and simulates live GPS path drift.
   - **`DISCONNECT`**: Simulates hardware offline state after 15s timeout.

---

## 🔑 Key Features & User Flows

- **First Screen / Splash**: Sci-fi safety scanner introducing SOBERDRIVE.
- **Multi-Sensor Breath Test**: Interactive sampling animation classifying breath samples into `SAFE`, `ALCOHOL DETECTED`, or `UNKNOWN`.
- **Safe Driver Flow**: Alcohol-free reading grants ignition clearance and unlocks main dashboard.
- **Alcohol Detected Flow**: Blocked ignition modal with secondary `[ EMERGENCY ACCESS ]` button.
- **6-Hour Emergency Access Protocol**:
  - Displays 6 explicit rules (6h maximum duration, fine responsibility, continuous tracking, visibility on Police Dashboard, automatic expiry).
  - Countdown timer (`05:59:59`) persisted server-side across page refreshes.
  - Safe controlled cutoff upon 6-hour expiry.
- **3-Column Command Center**:
  - **Column 1**: Driver Profile (Driver ID `SD1024`, License Plate `TN01AB1234`) & Connection Health.
  - **Columns 2 + 3**: Interactive Leaflet GPS Vehicle Map & Recharts MQ Sensor Time-Series Chart.
  - **Right Panel**: Live Vehicle Status Badge & Safety Event Timeline.
- **Police Monitor (`/police`)**: Law enforcement fleet monitoring route displaying live vehicle markers, telemetry inspector, and emergency timers.

---

## 🔌 ESP32 Microcontroller Setup

Find complete C++ source code in `esp32/soberdrive_esp32.ino` and pinout schematic in `esp32/README.md`.

---

## 🌐 Deploying to Render

This project is pre-configured for Render deployment via `render.yaml`:

1. Push code to GitHub.
2. Connect repository to Render as a **Blueprint**.
3. Render automatically provisions:
   - Python FastAPI Web Service (`soberdrive-backend`)
   - Static Web Dashboard (`soberdrive-dashboard`)

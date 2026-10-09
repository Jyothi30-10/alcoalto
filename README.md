# SOBERDRIVE ESP32 Microcontroller Setup & Wiring Guide

This folder contains the embedded C++ firmware for the ESP32 vehicle-side safety controller.

## Hardware Wiring Schematic

| Component | ESP32 GPIO Pin | Function |
| :--- | :--- | :--- |
| **MQ-3 Sensor (AO)** | `GPIO 34` | Alcohol Sensor Analog Output |
| **MQ-2 Sensor (AO)** | `GPIO 35` | Gas / VOC Combustible Sensor Analog Output |
| **MQ-135 Sensor (AO)**| `GPIO 32` | Air Quality VOC Sensor Analog Output |
| **NEO-6M GPS TX** | `GPIO 16` | ESP32 UART2 RX |
| **NEO-6M GPS RX** | `GPIO 17` | ESP32 UART2 TX |
| **Ignition Relay IN**| `GPIO 26` | 5V Relay Control (Ignition Motor Cutoff) |
| **Buzzer (+)** | `GPIO 25` | Piezo Alarm Buzzer |
| **Status LED (+)** | `GPIO 33` | Wi-Fi Status Indicator LED |

## Arduino IDE Required Libraries
1. `TinyGPSPlus` by Mikal Hart
2. `ArduinoJson` by Benoit Blanchon (v6 or v7)
3. `WiFi` & `HTTPClient` (built-in ESP32 core)

## Flashing Instructions
1. Open `soberdrive_esp32.ino` in Arduino IDE.
2. Select Board: **ESP32 Dev Module**.
3. Update `WIFI_SSID` and `WIFI_PASSWORD`.
4. Update `BACKEND_URL` to your Render FastAPI backend URL (e.g. `https://soberdrive.onrender.com/api/telemetry`) or local IP (`http://192.168.1.100:8000/api/telemetry`).
5. Compile and flash to your ESP32.

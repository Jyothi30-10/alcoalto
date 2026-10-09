/*
 * ALCOALTO - Intelligent Vehicle Safety & Alcohol Monitoring System
 * ESP32 Microcontroller Firmware (C++ / Arduino IDE)
 * 
 * Hardware Prototype Specs:
 * - ESP32 Development Board
 * - Wi-Fi Network SSID: "Park"
 * - MQ-3 Alcohol Sensor (Analog Pin 34)
 * - MQ-2 Gas/VOC Sensor (Analog Pin 35)
 * - MQ-135 VOC Sensor (Analog Pin 32)
 * - 16x2 I2C LCD Display (SDA: GPIO 21, SCL: GPIO 22, Address 0x27)
 * - Two Red Warning LEDs (GPIO 33, GPIO 27)
 * - Two Motor Drivers / Relay Output (GPIO 26, GPIO 14)
 * - NEO-6M GPS (UART2 RX: GPIO 16, TX: GPIO 17)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <LiquidCrystal_I2C.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// --- Wi-Fi Credentials ---
const char* WIFI_SSID     = "Park";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Render Backend API URL (Cloud Mode)
const char* CLOUD_BACKEND_URL = "https://alcoalto-backend.onrender.com/api/telemetry";
const char* DEVICE_API_KEY    = "alcoalto-esp32-secret-key";

// --- Pin Definitions ---
#define PIN_MQ3         34   // Alcohol sensor analog input
#define PIN_MQ2         35   // Gas/VOC sensor analog input
#define PIN_MQ135       32   // Air Quality VOC analog input

#define PIN_MOTOR_RELAY 26   // Motor Driver Cutoff Relay 1
#define PIN_MOTOR_RELAY2 14  // Motor Driver Cutoff Relay 2
#define PIN_LED_RED1    33   // Red Warning LED 1
#define PIN_LED_RED2    27   // Red Warning LED 2
#define PIN_BUZZER      25   // Piezo Buzzer

#define GPS_RX_PIN      16
#define GPS_TX_PIN      17

#define ALCOHOL_THRESHOLD_MQ3 300

// --- Objects & State ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
WebServer server(80);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

String vehicleId = "SD-CAR-01";
String driverId = "SD1024";

int mq3Val = 85;
int mq2Val = 120;
int mq135Val = 110;
bool isAlcoholDetected = false;
bool isEmergencyMode = false;
String vehicleState = "SAFE";

unsigned long lastTelemetryTime = 0;

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

void handleCORSPreflight() {
  sendCORSHeaders();
  server.send(204);
}

void handleRoot() {
  sendCORSHeaders();
  server.send(200, "application/json", "{\"status\":\"ALCOALTO ESP32 ONLINE\",\"vehicle\":\"SD-CAR-01\"}");
}

void handleConnect() {
  sendCORSHeaders();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("DASHBOARD");
  lcd.setCursor(0, 1);
  lcd.print("CONNECTED");

  StaticJsonDocument<256> doc;
  doc["connected"] = true;
  doc["vehicle"] = vehicleId;
  doc["driver"] = driverId;
  doc["message"] = "DASHBOARD CONNECTED";

  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleStatus() {
  sendCORSHeaders();
  mq3Val = analogRead(PIN_MQ3);
  mq2Val = analogRead(PIN_MQ2);
  mq135Val = analogRead(PIN_MQ135);

  isAlcoholDetected = (mq3Val > ALCOHOL_THRESHOLD_MQ3);

  if (isAlcoholDetected) {
    if (!isEmergencyMode) {
      vehicleState = "ALCOHOL WARNING";
      digitalWrite(PIN_MOTOR_RELAY, LOW);
      digitalWrite(PIN_MOTOR_RELAY2, LOW);
      digitalWrite(PIN_LED_RED1, HIGH);
      digitalWrite(PIN_LED_RED2, HIGH);
    } else {
      vehicleState = "EMERGENCY MODE";
      digitalWrite(PIN_MOTOR_RELAY, HIGH);
      digitalWrite(PIN_MOTOR_RELAY2, HIGH);
    }
  } else {
    vehicleState = "SAFE";
    digitalWrite(PIN_MOTOR_RELAY, HIGH);
    digitalWrite(PIN_MOTOR_RELAY2, HIGH);
    digitalWrite(PIN_LED_RED1, LOW);
    digitalWrite(PIN_LED_RED2, LOW);
  }

  StaticJsonDocument<256> doc;
  doc["vehicle"] = vehicleId;
  doc["driver"] = driverId;
  doc["mq3"] = mq3Val;
  doc["mq2"] = mq2Val;
  doc["mq135"] = mq135Val;
  doc["alcohol"] = isAlcoholDetected;
  doc["state"] = vehicleState;
  doc["emergency"] = isEmergencyMode;
  doc["wifi_rssi"] = WiFi.RSSI();

  if (gps.location.isValid()) {
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
  }

  String res;
  serializeJson(doc, res);
  server.send(200, "application/json", res);
}

void handleEmergency() {
  sendCORSHeaders();
  bool enable = false;

  if (server.hasArg("enable")) {
    String val = server.arg("enable");
    enable = (val == "true" || val == "1");
  } else if (server.hasArg("plain")) {
    StaticJsonDocument<256> doc;
    deserializeJson(doc, server.arg("plain"));
    enable = doc["enable"] | false;
  }

  isEmergencyMode = enable;
  if (enable) {
    vehicleState = "EMERGENCY MODE";
    digitalWrite(PIN_MOTOR_RELAY, HIGH);
    digitalWrite(PIN_MOTOR_RELAY2, HIGH);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("EMERGENCY MODE");
    lcd.setCursor(0, 1);
    lcd.print("AUTHORIZATION");
  } else {
    vehicleState = "LOCKED";
    digitalWrite(PIN_MOTOR_RELAY, LOW);
    digitalWrite(PIN_MOTOR_RELAY2, LOW);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("EMERGENCY EXPIRED");
    lcd.setCursor(0, 1);
    lcd.print("VEHICLE LOCKED");
  }

  server.send(200, "application/json", "{\"success\":true,\"emergency\":" + String(enable ? "true" : "false") + "}");
}

void sendCloudTelemetry() {
  if (WiFi.status() == WL_CONNECTED && (millis() - lastTelemetryTime > 4000)) {
    lastTelemetryTime = millis();
    HTTPClient http;
    http.begin(CLOUD_BACKEND_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-API-Key", DEVICE_API_KEY);

    StaticJsonDocument<256> doc;
    doc["vehicle_id"] = vehicleId;
    doc["driver_id"] = driverId;
    doc["mq3"] = mq3Val;
    doc["mq2"] = mq2Val;
    doc["mq135"] = mq135Val;
    doc["classification"] = isAlcoholDetected ? "ALCOHOL DETECTED" : "SAFE";
    doc["vehicle_state"] = vehicleState;
    doc["emergency_mode"] = isEmergencyMode;
    doc["emergency_remaining"] = 0;
    if (gps.location.isValid()) {
      doc["latitude"] = gps.location.lat();
      doc["longitude"] = gps.location.lng();
      doc["location_source"] = "GPS";
    }

    String jsonStr;
    serializeJson(doc, jsonStr);
    int httpCode = http.POST(jsonStr);
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("ALCOALTO V1.0");
  lcd.setCursor(0, 1);
  lcd.print("INITIALIZING...");

  // Pins
  pinMode(PIN_MOTOR_RELAY, OUTPUT);
  pinMode(PIN_MOTOR_RELAY2, OUTPUT);
  pinMode(PIN_LED_RED1, OUTPUT);
  pinMode(PIN_LED_RED2, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_MOTOR_RELAY, LOW);
  digitalWrite(PIN_MOTOR_RELAY2, LOW);

  // GPS Serial
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  // Connect to Wi-Fi SSID "Park"
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WIFI CONNECTED");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
  } else {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WIFI DISCONNECTED");
  }

  // Set REST API Server Endpoints with CORS support
  server.on("/", HTTP_GET, handleRoot);
  server.on("/", HTTP_OPTIONS, handleCORSPreflight);

  server.on("/api/connect", HTTP_GET, handleConnect);
  server.on("/api/connect", HTTP_OPTIONS, handleCORSPreflight);

  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/status", HTTP_OPTIONS, handleCORSPreflight);

  server.on("/api/emergency", HTTP_POST, handleEmergency);
  server.on("/api/emergency", HTTP_OPTIONS, handleCORSPreflight);

  server.begin();
  Serial.println("ESP32 REST WebServer Started with CORS support.");
}

void loop() {
  server.handleClient();
  sendCloudTelemetry();

  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
}

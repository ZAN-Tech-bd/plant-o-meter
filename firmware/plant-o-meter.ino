// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║              Plant-o-Meter  —  ESP32 Firmware                               ║
// ║  Reads soil moisture, temperature (DS18B20), and estimated pH,              ║
// ║  then POSTs JSON to the local Node.js server every 5 seconds.               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
//
// LIBRARIES REQUIRED (install via Arduino Library Manager or PlatformIO):
//   • OneWire            (Paul Stoffregen)   — for DS18B20 data bus
//   • DallasTemperature  (Miles Burton)      — easy DS18B20 reading
//   • WiFi               (built-in ESP32)
//   • HTTPClient         (built-in ESP32)
//   • ArduinoJson        (Benoit Blanchon) v6+
//
// WIRING SUMMARY:
//   Capacitive Soil Moisture Sensor  →  GPIO34  (analog, 3.3 V)
//   DS18B20 Temp Probe               →  GPIO4   (OneWire; 4.7 kΩ between DATA & 3.3 V)
//   Analog pH Sensor (e.g. PH-4502C) →  GPIO35  (analog, 3.3 V)
//   Onboard LED (built-in)           →  GPIO2   (LOW = on for most ESP32 dev boards)

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ─────────────────────────────────────────────────────────────────────────────
//  USER CONFIGURATION — edit these before flashing
// ─────────────────────────────────────────────────────────────────────────────
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// Replace with the local IP of the laptop running the Node.js server.
// Find it with:  ipconfig  (Windows) or  ifconfig  (Mac/Linux)
#define SERVER_IP       "192.168.1.100"
#define SERVER_PORT     4000
#define DEVICE_ID       "esp32-01"

// How often to take a reading and POST it (milliseconds)
#define READING_INTERVAL_MS  5000UL

// ─────────────────────────────────────────────────────────────────────────────
//  PIN ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────
#define PIN_MOISTURE    34   // Capacitive soil moisture (analog, ADC1)
#define PIN_ONEWIRE      4   // DS18B20 data (OneWire)
#define PIN_PH          35   // Analog pH sensor output (ADC1)
#define PIN_LED          2   // Onboard LED

// ─────────────────────────────────────────────────────────────────────────────
//  MOISTURE SENSOR CALIBRATION
//  1. Put the sensor completely in DRY AIR  → read Serial, set MOISTURE_DRY
//  2. Submerge the sensor tip in water     → read Serial, set MOISTURE_WET
// ─────────────────────────────────────────────────────────────────────────────
#define MOISTURE_DRY   3200   // ADC value when sensor is in dry air
#define MOISTURE_WET   1100   // ADC value when sensor is in water

// ─────────────────────────────────────────────────────────────────────────────
//  pH SENSOR CALIBRATION  (linear voltage → pH mapping)
//  The PH-4502C and similar modules output roughly:
//    pH 7  → 2.5 V    pH 4  → ~3.0 V    pH 10 → ~2.0 V  (varies by module)
//  Steps:
//    1. Dip in pH 7 buffer, note the raw ADC → set PH_CAL_ADC_7
//    2. Dip in pH 4 buffer, note the raw ADC → set PH_CAL_ADC_4
//  A two-point linear fit is then computed automatically.
//  For a quick demo without calibration, the defaults give a rough estimate.
// ─────────────────────────────────────────────────────────────────────────────
#define PH_CAL_ADC_7   1900   // ADC reading at pH 7.0  (3.3 V range, 12-bit)
#define PH_CAL_ADC_4   2400   // ADC reading at pH 4.0
//
// Two-point formula:  pH = 7.0 + (adcAt7 - adc) * (7.0 - 4.0) / (adcAt7 - adcAt4)
// Averaged over PH_SAMPLES readings to reduce noise.
#define PH_SAMPLES     10

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNALS — no need to edit below here
// ─────────────────────────────────────────────────────────────────────────────
OneWire          oneWire(PIN_ONEWIRE);
DallasTemperature tempSensor(&oneWire);

unsigned long lastReadingMs = 0;
int           wifiRetryCount = 0;

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: map moisture ADC to 0-100%
// ─────────────────────────────────────────────────────────────────────────────
float readMoisturePct() {
  int raw = analogRead(PIN_MOISTURE);
  Serial.printf("  [Moisture] raw ADC = %d\n", raw);
  float pct = map(raw, MOISTURE_DRY, MOISTURE_WET, 0, 100);
  return constrain(pct, 0.0f, 100.0f);
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: read DS18B20 temperature in °C
// ─────────────────────────────────────────────────────────────────────────────
float readTemperatureC() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C) {
    Serial.println("  [Temp] DS18B20 not found! Check wiring & pull-up resistor.");
    return -999.0f;
  }
  return t;
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: average PH_SAMPLES ADC readings then convert to pH (0-14)
//  Uses a two-point linear calibration (pH 7 and pH 4 reference points).
// ─────────────────────────────────────────────────────────────────────────────
float readPH() {
  long sum = 0;
  for (int i = 0; i < PH_SAMPLES; i++) {
    sum += analogRead(PIN_PH);
    delay(10);   // small gap between samples
  }
  float avgAdc = (float)sum / PH_SAMPLES;
  Serial.printf("  [pH] averaged ADC = %.1f\n", avgAdc);

  // Linear two-point interpolation through (PH_CAL_ADC_7, 7.0) and (PH_CAL_ADC_4, 4.0)
  float slope = (7.0f - 4.0f) / ((float)PH_CAL_ADC_7 - (float)PH_CAL_ADC_4);
  float ph    = 7.0f + slope * ((float)PH_CAL_ADC_7 - avgAdc);

  return constrain(ph, 0.0f, 14.0f);
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: connect (or reconnect) to WiFi with exponential back-off
// ─────────────────────────────────────────────────────────────────────────────
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("\n[WiFi] Connecting to %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long deadline = millis() + 20000UL;   // 20 s timeout
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP = %s\n", WiFi.localIP().toString().c_str());
    wifiRetryCount = 0;
  } else {
    wifiRetryCount++;
    unsigned long backoffMs = min(30000UL, 2000UL * (1UL << min(wifiRetryCount, 4)));
    Serial.printf("\n[WiFi] Failed. Retry in %lu s...\n", backoffMs / 1000);
    delay(backoffMs);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  HELPER: POST sensor JSON to the Node.js server
//  Returns true on HTTP 2xx, false otherwise.
// ─────────────────────────────────────────────────────────────────────────────
bool postReading(float moisture, float temperature, float ph) {
  char url[80];
  snprintf(url, sizeof(url), "http://%s:%d/api/readings", SERVER_IP, SERVER_PORT);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);   // 5 s HTTP timeout — fail fast on bad network

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["deviceId"]    = DEVICE_ID;
  doc["moisture"]    = round(moisture * 10.0f) / 10.0f;    // 1 decimal
  doc["temperature"] = round(temperature * 10.0f) / 10.0f;
  doc["ph"]          = round(ph * 100.0f) / 100.0f;        // 2 decimals
  doc["timestamp"]   = millis();

  String payload;
  serializeJson(doc, payload);
  Serial.printf("  [HTTP] POST %s  body=%s\n", url, payload.c_str());

  int code = http.POST(payload);
  http.end();

  if (code >= 200 && code < 300) {
    Serial.printf("  [HTTP] ✓ Server replied %d\n", code);
    // Blink LED to show success
    digitalWrite(PIN_LED, LOW);   delay(120);
    digitalWrite(PIN_LED, HIGH);  delay(120);
    digitalWrite(PIN_LED, LOW);   delay(120);
    digitalWrite(PIN_LED, HIGH);
    return true;
  }

  Serial.printf("  [HTTP] ✗ Server replied %d\n", code);
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n╔══════════════════════════════╗");
  Serial.println("║   Plant-o-Meter  ESP32 FW   ║");
  Serial.println("╚══════════════════════════════╝\n");

  // Configure ADC for 12-bit resolution (0-4095) and 3.3 V attenuation
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);   // full 0-3.3 V range

  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);      // LED off initially (active-low)

  tempSensor.begin();

  ensureWiFi();

  Serial.println("[Setup] Ready. First reading in 2 s...\n");
  delay(2000);
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  if (now - lastReadingMs >= READING_INTERVAL_MS) {
    lastReadingMs = now;

    Serial.println("─── Reading sensors ─────────────────────────");

    float moisture    = readMoisturePct();
    float temperature = readTemperatureC();
    float ph          = readPH();

    Serial.printf("  Moisture    : %.1f %%\n", moisture);
    Serial.printf("  Temperature : %.1f °C\n", temperature);
    Serial.printf("  pH (est.)   : %.2f\n",    ph);
    Serial.println("─────────────────────────────────────────────");

    // Skip posting if temperature sensor is disconnected
    if (temperature == -999.0f) {
      Serial.println("[Skip] Bad temperature reading — not posting.\n");
      return;
    }

    ensureWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      postReading(moisture, temperature, ph);
    } else {
      Serial.println("[Skip] No WiFi — skipping POST.\n");
    }
  }

  // Keep the LED breathing if idle (optional eye-candy for the demo)
  // Comment this block out if you don't want it.
  long breathPhase = (millis() % 3000);
  int  brightness  = breathPhase < 1500
      ? map(breathPhase, 0, 1500, 0, 255)
      : map(breathPhase, 1500, 3000, 255, 0);
  // NOTE: analogWrite(PIN_LED, brightness) only works if the board has LEDC;
  // for a simple demo just leave the LED blink-on-success behaviour above.
}

# 🌱 Plant-o-Meter — Kids' IoT Showcase

> **An interactive IoT soil station that reads soil sensors, displays live gauges on a web admin panel, and asks AI to recommend the best trees to plant in Bangladesh!**

Designed especially for school science fairs, exhibitions, and classroom demonstrations.

---

## 🏗️ Architecture (All-in-One Server)

```
┌───────────────────────┐
│     ESP32 Board       │
│                       │
│  💧 Soil Moisture     │         WiFi HTTP POST (Every 5s)
│  🌡️ DS18B20 Temp      │ ───────────────────────────────────────────┐
│  🧪 pH Sensor Module  │    { moisture, temperature, ph }           │
└───────────────────────┘                                            │
                                                                     ▼
                                                      ┌──────────────────────────────┐
                                                      │  Node.js Server (:4000)      │
                                                      │  ──────────────────────────  │
                                                      │  • Fastify API Engine        │
                                                      │  • Local SQLite Database     │
                                                      │  • Built-in Web Admin Panel  │
                                                      └──────────────┬───────────────┘
                                                                     │
                                      ┌──────────────────────────────┴──────────────────────────────┐
                                      ▼                                                             ▼
                       ┌──────────────────────────────┐                              ┌──────────────────────────────┐
                       │  Live Admin Web Panel        │   Click "Suggest a Tree"     │  Groq Cloud AI (Free)        │
                       │  http://localhost:4000       │ ───────────────────────────► │  llama-3.1-8b-instant        │
                       │  • Real-time Animated Gauges │ ◄─────────────────────────── │  Kid-friendly recommendations│
                       │  • Historical Trend Charts   │     JSON Tree Suggestions    └──────────────────────────────┘
                       └──────────────────────────────┘
```

---

## 🗂️ Project Directory Structure

```
plant-o-meter/
├── firmware/
│   ├── config.h               ← ⚙️ Put your WiFi Name, Password & Server IP here!
│   └── plant-o-meter.ino      ← 📟 ESP32 Arduino C++ firmware
├── server/
│   ├── public/
│   │   └── index.html         ← 💻 Built-in Admin Panel Web Dashboard
│   ├── src/
│   │   ├── index.js           ← 🚀 Fastify Server & Static File Server
│   │   ├── db.js              ← 🗄️ SQLite database (pure JS via @libsql/client)
│   │   ├── groq.js            ← 🤖 Groq AI tree suggestion client
│   │   └── routes/
│   │       ├── readings.js    ← 📡 Sensor POST & GET endpoints
│   │       └── suggest-tree.js← 🌳 AI tree suggestion endpoint
│   ├── .env.example           ← 🔑 Sample environment file
│   └── package.json           ← 📦 Server dependencies & scripts
├── .gitignore
└── README.md                  ← 📖 You are here!
```

---

## 🔌 Circuit & Wiring Diagram (Kid-Friendly)

> ⚠️ **Safety Tip:** Always connect wires while your ESP32 is unplugged from the computer!  
> The ESP32 analog pins can only take **up to 3.3V**. Never connect 5V directly to GPIO34 or GPIO35!

### 📋 Wiring Reference Table

| Sensor | Sensor Pin | ESP32 Pin | Wire Color (Typical) | Why & Notes |
|---|---|---|---|---|
| **💧 Capacitive Soil Moisture** | VCC | **3.3V** | Red | Powers the capacitive sensor safely |
| | GND | **GND** | Black | Ground connection |
| | AOUT | **GPIO 34** | Yellow / Green | Analog input (ADC1 — works with WiFi) |
| **🌡️ DS18B20 Temp Probe** | VCC | **3.3V** | Red | Power line |
| | GND | **GND** | Black | Ground |
| | DATA | **GPIO 4** | Yellow / White | Digital OneWire data (**Needs 4.7kΩ pull-up!**) |
| **🧪 pH Sensor Module (PH-4502C)**| VCC | **5V (VIN)** | Red | Op-Amp board needs 5V to power properly |
| | GND | **GND** | Black | Ground |
| | PO (Analog Out)| **GPIO 35** | Yellow / Blue | Analog voltage representing pH (ADC1) |

---

### 🎨 Visual ASCII Circuit Diagram

```
                              ┌─────────────────────────────┐
                              │       ESP32 Dev Board       │
                              │                             │
    💧 SOIL MOISTURE          │ 3.3V  ●────────────────┐    │
    ┌─────────────────┐       │                        │    │
    │  VCC (Red)      ├───────┤ 3.3V                   │    │
    │  GND (Black)    ├───────┤ GND                    │    │
    │  AOUT (Yellow)  ├───────┤ GPIO 34 (ADC1_CH6)     │    │
    └─────────────────┘       │                        │    │
                              │                        │    │
    🌡️ DS18B20 TEMP           │                        │    │
    ┌─────────────────┐       │                        │    │
    │  VCC (Red)      ├───────┤ 3.3V                   │    │
    │  GND (Black)    ├───────┤ GND                    │    │
    │                 │       │               [4.7kΩ]  │    │
    │  DATA (Yellow)  ├───┬───┤ GPIO 4 ───────█───────┘    │
    └─────────────────┘   │   │  (Resistor connects         │
                          │   │   DATA to 3.3V!)            │
                          │   │                             │
    🧪 pH SENSOR (PH-4502C)   │                             │
    ┌─────────────────┐       │                             │
    │  VCC (Red)      ├───────┤ 5V (VIN)                    │
    │  GND (Black)    ├───────┤ GND                         │
    │  PO / Vout      ├───────┤ GPIO 35 (ADC1_CH7)          │
    └─────────────────┘       │                             │
                              └─────────────────────────────┘

    Color Code Guide:
    🔴 Red    = Power (+3.3V or +5V)
    ⚫ Black  = Ground (GND)
    🟡 Yellow = Signal / Data
    🟦 4.7kΩ  = Pull-up resistor for DS18B20 temperature probe
```

---

## ⚙️ Step 1: Configure & Flash the ESP32

### A. Install Arduino IDE
1. Download and install [Arduino IDE 2.x](https://www.arduino.cc/en/software).
2. Open **File → Preferences** in Arduino IDE.
3. In **Additional boards manager URLs**, add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Open **Tools → Board → Boards Manager**, search for `esp32`, and click **Install**.

### B. Install Required Libraries
Open **Tools → Manage Libraries** (`Ctrl+Shift+I` on Windows) and install:
1. `OneWire` (by Paul Stoffregen)
2. `DallasTemperature` (by Miles Burton)
3. `ArduinoJson` (by Benoit Blanchon — version 6 or 7)

### C. Edit `firmware/config.h`
Open `firmware/config.h` in any text editor or Arduino IDE:

```cpp
// 1. Your 2.4 GHz WiFi credentials:
#define WIFI_SSID       "MyHomeWiFi"
#define WIFI_PASSWORD   "SecretPassword123"

// 2. Your computer's local IP address:
#define SERVER_IP       "192.168.1.100"   // <-- Set your laptop's IP!
#define SERVER_PORT     4000
```

> 🔍 **How to find your Laptop's IP address:**
> - **Windows:** Open Command Prompt or PowerShell, type `ipconfig`, find `IPv4 Address` (e.g. `192.168.1.100`).
> - **Mac / Linux:** Open Terminal, type `ifconfig` or `ip a`.

### D. Upload Code to ESP32
1. Plug your ESP32 board into your laptop using a micro-USB or USB-C cable.
2. In Arduino IDE, click **File → Open** and choose `firmware/plant-o-meter.ino`.
3. Select your board: **Tools → Board → esp32 → ESP32 Dev Module**.
4. Select your COM Port: **Tools → Port → COM...** (e.g. COM3 or COM4).
5. Click the **Upload (➡️)** button.
6. Open **Tools → Serial Monitor** and set baud rate to **115200**.
7. You should see:
   ```
   [WiFi] Connected! IP = 192.168.1.120
   ─── Reading sensors ─────────────────────────
     Moisture    : 62.4 %
     Temperature : 28.1 °C
     pH (est.)   : 6.85
   ─── [HTTP] ✓ Server replied 201 ─────────────
   ```

---

## 💻 Step 2: Run the Server & Admin Panel

You only need **Node.js (v18+)** installed. The server hosts both the REST API and the live Web Admin Panel!

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```
**Mac / Linux:**
```bash
cp .env.example .env
```

Open `.env` and add your free Groq API key:
```env
PORT=4000
GROQ_API_KEY=gsk_your_free_groq_api_key_here
```

> 🎁 **Get a Free Groq API Key:**
> 1. Go to [https://console.groq.com/keys](https://console.groq.com/keys).
> 2. Sign up with Google or GitHub (100% free, no credit card required).
> 3. Click **Create API Key**, copy it, and paste it into `.env`.

### 3. Start the Server
```bash
npm start
```
*(or `npm run dev` for automatic reloading)*

### 4. Open the Admin Panel
Open your browser and navigate to:
👉 **[http://localhost:4000](http://localhost:4000)**

You will see:
- 💧 **Live Soil Moisture Gauge** (%) with color alerts
- 🌡️ **Soil Temperature Gauge** (°C)
- 🧪 **Estimated pH Gauge**
- 📈 **Real-Time Interactive History Trend Chart**
- 🌳 **"Suggest a Tree!" Button**: Uses Groq AI to suggest Bangladesh-native trees (Mango, Neem, Jackfruit, Guava, etc.) matching your exact soil!
- 🧪 **"Test Sim" Button**: Click anytime to generate test readings even before your hardware is plugged in!

---

## 🎛️ Sensor Calibration Guide

### 1. 💧 Soil Moisture Sensor Calibration
Capacitive soil moisture sensors give raw ADC values (typically between 1000 and 3500):
1. Keep sensor in **dry air** → open Serial Monitor → note raw ADC value (e.g. `3200`).
2. Dip the sensor tip into a glass of **water** (do NOT submerge the electronics!) → note raw ADC (e.g. `1100`).
3. In `firmware/config.h`, set:
   ```cpp
   #define MOISTURE_DRY   3200   // Reading in dry air (0% moisture)
   #define MOISTURE_WET   1100   // Reading in water (100% moisture)
   ```

### 2. 🧪 pH Sensor Calibration (Two-Point Linear Calibration)
Analog pH sensors (PH-4502C) drift and are noisy. The firmware automatically **averages 10 samples** to provide a stable estimate.
1. Dip probe in **pH 7.0 buffer solution** → note raw ADC from Serial Monitor (e.g. `1900`).
2. Dip probe in **pH 4.0 buffer solution** → note raw ADC (e.g. `2400`).
3. In `firmware/config.h`, set:
   ```cpp
   #define PH_CAL_ADC_7   1900   // Reading at pH 7.0
   #define PH_CAL_ADC_4   2400   // Reading at pH 4.0
   ```

---

## 🛠️ API Reference

The server exposes simple REST endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the interactive Admin Panel Web UI |
| `GET` | `/health` | Server health check (`{"status":"ok"}`) |
| `POST` | `/api/readings` | ESP32 posts JSON payload with `{ moisture, temperature, ph, deviceId }` |
| `GET` | `/api/readings/latest` | Returns latest sensor reading from SQLite |
| `GET` | `/api/readings/history?limit=30` | Returns recent sensor readings for charting |
| `POST` | `/api/suggest-tree` | Calls Groq AI with soil parameters & returns recommended trees |

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Can I use this without sensors connected?**  
**A:** Yes! Open `http://localhost:4000` and click the **"🧪 Test Sim"** button in the top right. It will immediately generate test soil data and update all gauges and charts.

**Q: Why does the ESP32 fail to connect to WiFi?**  
**A:** ESP32 only supports **2.4 GHz WiFi**. If your router has both 5 GHz and 2.4 GHz, make sure to connect to the 2.4 GHz network name.

**Q: The ESP32 says `Server replied 404` or connection refused?**  
**A:** Make sure `SERVER_IP` in `firmware/config.h` matches your laptop's current IP address, and both the laptop and ESP32 are connected to the same WiFi network.

---

## 📜 License
MIT License · Created for STEM education and young innovators! 🌱

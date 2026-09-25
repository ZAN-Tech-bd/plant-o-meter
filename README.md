# Plant-o-Meter™ — Industrial Agritech Telemetry & AI Decision Suite
### Proprietary Telemetry Platform Developed by ZAN Tech

**Copyright © 2026 ZAN Tech. All Rights Reserved.**  
*Confidential & Proprietary — Developed by the Agritech & IoT Engineering Division at ZAN Tech.*

---

## 1. Executive Overview

**Plant-o-Meter™** is an industrial-grade IoT telemetry acquisition platform and agronomic advisory system engineered by **ZAN Tech**. The system integrates edge sensory hardware (ESP32) with a high-throughput Node.js/Fastify edge telemetry gateway and an autonomous agronomic decision support engine powered by Groq Llama-3.1 inference.

The platform provides continuous physicochemical characterization of agricultural soils, real-time time-series telemetry trends, and automated agro-ecological species suitability matching tailored specifically to Bangladesh agrarian regions.

```
┌─────────────────────────────────┐
│     ESP32 Edge Microstation     │
│                                 │
│  • Volumetric Soil Moisture     │          WiFi HTTP/1.1 REST (5000ms Cycle)
│  • High-Precision Temp (DS18B20)│ ──────────────────────────────────────────────────┐
│  • Potentiometric pH (PH-4502C) │       Payload: { deviceId, moisture, temp, ph }   │
└─────────────────────────────────┘                                                   │
                                                                                      ▼
                                                                     ┌─────────────────────────────────┐
                                                                     │   ZAN Tech Telemetry Gateway    │
                                                                     │   Port :4000 (Fastify Engine)   │
                                                                     │   ───────────────────────────   │
                                                                     │   • High-Performance Ingestion  │
                                                                     │   • Embedded SQLite Database    │
                                                                     │   • Industrial Web Admin Panel  │
                                                                     └────────────────┬────────────────┘
                                                                                      │
                                      ┌───────────────────────────────────────────────┴───────────────────────────────────────────────┐
                                      ▼                                                                                               ▼
                       ┌─────────────────────────────┐                                                                 ┌─────────────────────────────┐
                       │ Enterprise Web Admin Panel  │                 Autonomous Agronomic Advisory                   │  Groq Cloud Inference Engine│
                       │ http://localhost:4000       │ ──────────────────────────────────────────────────────────────► │  Model: llama-3.1-8b-instant│
                       │ • Multi-Channel Live Metrics│ ◄────────────────────────────────────────────────────────────── │  Agro-Ecological Suitability│
                       │ • Temporal Trend Analytics  │                    Structured JSON Response                     └─────────────────────────────┘
                       │ • Telemetry CSV Data Export │
                       └─────────────────────────────┘
```

---

## 2. System Architecture & Directory Tree

```
plant-o-meter/
├── firmware/
│   ├── config.h               # Hardware pinouts, calibration constants, WiFi & server IP settings
│   └── plant-o-meter.ino      # ESP32 C++ edge firmware (ADC sampling, OneWire bus, HTTP client)
├── server/
│   ├── public/
│   │   └── index.html         # Industrial dark-theme admin dashboard (HTML5, SVG, Chart.js)
│   ├── src/
│   │   ├── index.js           # Fastify server bootstrap & static file routing
│   │   ├── db.js              # SQLite database layer with prepared queries
│   │   ├── groq.js            # Groq Cloud AI agronomic recommendation client
│   │   └── routes/
│   │       ├── readings.js    # Telemetry ingestion POST & historical query GET endpoints
│   │       └── suggest-tree.js# AI agronomic advisory endpoint
│   ├── .env.example           # Server environment variable template
│   └── package.json           # Gateway dependencies and runtime scripts
├── LICENSE                    # Proprietary Software License — ZAN Tech (All Rights Reserved)
├── .gitignore
└── README.md                  # Comprehensive Technical Specification & Operations Manual
```

---

## 3. Hardware Schematic & Pinout Matrix

### Pin Assignment Specification

| Sensory Subsystem | Sensor Pin | ESP32 Pin | Interface Type | Operating Voltage | Engineering Notes |
|---|---|---|---|---|---|
| **Volumetric Soil Moisture** | VCC | **3.3V** | Power | 3.3V DC | Capacitive plate; corrosion-resistant |
| | GND | **GND** | Ground | 0V | System common ground |
| | AOUT | **GPIO 34** | Analog Input | 0 – 3.3V | Dedicated ADC1 channel 6 |
| **Sub-Surface Temperature** | VCC | **3.3V** | Power | 3.3V DC | Waterproof probe assembly |
| | GND | **GND** | Ground | 0V | System common ground |
| | DATA | **GPIO 4** | 1-Wire Digital | 3.3V Logic | **Mandatory 4.7 kΩ pull-up to 3.3V** |
| **Potentiometric pH Unit** | VCC | **5V (VIN)** | Power | 5.0V DC | Instrumentation amplifier supply |
| | GND | **GND** | Ground | 0V | System common ground |
| | PO (Analog) | **GPIO 35** | Analog Input | 0 – 3.3V | Dedicated ADC1 channel 7 |

---

### Engineering Circuit Diagram

```
                              ┌─────────────────────────────┐
                              │       ESP32 Dev Board       │
                              │                             │
    SOIL MOISTURE TRANSDUCER  │ 3.3V  ●────────────────┐    │
    ┌─────────────────┐       │                        │    │
    │  VCC (Power)    ├───────┤ 3.3V                   │    │
    │  GND (Ground)   ├───────┤ GND                    │    │
    │  AOUT (Signal)  ├───────┤ GPIO 34 (ADC1_CH6)     │    │
    └─────────────────┘       │                        │    │
                              │                        │    │
    DS18B20 THERMAL PROBE     │                        │    │
    ┌─────────────────┐       │                        │    │
    │  VCC (Power)    ├───────┤ 3.3V                   │    │
    │  GND (Ground)   ├───────┤ GND                    │    │
    │                 │       │               [4.7kΩ]  │    │
    │  DATA (Signal)  ├───┬───┤ GPIO 4 ───────■───────┘    │
    └─────────────────┘   │   │  (4.7kΩ pull-up to          │
                          │   │   3.3V line)                │
                          │   │                             │
    PH-4502C CONDITIONER UNIT │                             │
    ┌─────────────────┐       │                             │
    │  VCC (Power)    ├───────┤ 5V (VIN Rail)               │
    │  GND (Ground)   ├───────┤ GND                         │
    │  PO (Analog)    ├───────┤ GPIO 35 (ADC1_CH7)          │
    └─────────────────┘       │                             │
                              └─────────────────────────────┘
```

---

## 4. Firmware Configuration & Flashing

### 4.1 Prerequisites
1. Install **Arduino IDE v2.x** or **VS Code with PlatformIO**.
2. Add the ESP32 board manager package:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Install the required C++ driver libraries via the Library Manager:
   - `OneWire` (by Paul Stoffregen)
   - `DallasTemperature` (by Miles Burton)
   - `ArduinoJson` (v6 or v7 by Benoit Blanchon)

### 4.2 Network & Edge Station Settings
Open `firmware/config.h` and configure your target network credentials:

```cpp
// 1. IEEE 802.11 b/g/n (2.4 GHz) WiFi Infrastructure
#define WIFI_SSID       "YOUR_OFFICE_OR_FIELD_WIFI"
#define WIFI_PASSWORD   "YOUR_WPA2_PASSWORD"

// 2. Telemetry Ingestion Server IP & Port
#define SERVER_IP       "192.168.1.100"    // Host workstation / gateway IP address
#define SERVER_PORT     4000
#define DEVICE_ID       "esp32-01"
```

### 4.3 Flashing the Microcontroller
1. Connect the ESP32 via USB.
2. Select **Board: ESP32 Dev Module**.
3. Select the appropriate **COM Port** (e.g. `COM3` on Windows, `/dev/ttyUSB0` on Linux).
4. Click **Upload** (`Ctrl+U`).
5. Open the Serial Monitor at **115200 Baud** to verify initialization.

---

## 5. Telemetry Server Deployment

### 5.1 Environment Configuration
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install production dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file from the template:
   ```powershell
   Copy-Item .env.example .env     # Windows
   cp .env.example .env            # Linux / macOS
   ```
4. Configure your Groq API credentials in `.env`:
   ```env
   PORT=4000
   GROQ_API_KEY=gsk_your_groq_api_key_here
   ```

### 5.2 Server Execution
Start the production server:
```bash
npm start
```
For continuous development mode with automatic reloading:
```bash
npm run dev
```

The gateway console will output:
```
🌱 Plant-o-Meter All-in-One Server running!
   Admin Panel Dashboard : http://localhost:4000
   On your Wi-Fi/LAN     : http://192.168.0.114:4000
   Health check          : http://localhost:4000/health
   Latest reading API    : http://localhost:4000/api/readings/latest
```

Open your browser at **`http://localhost:4000`** to access the industrial telemetry console.

### 5.3 Accessing the Dashboard from a Mobile Device
The server listens on all network interfaces (`0.0.0.0`), and the dashboard adapts to phone and tablet screens. Any device on the same network can open it.

1. Start the server on the host computer (`npm start`).
2. Connect your phone to the **same Wi-Fi network** as the host computer.
3. Copy the `On your Wi-Fi/LAN` address from the server console, for example `http://192.168.0.114:4000`.
4. Open that address in the phone's browser (Chrome, Safari, etc.).

> **Tip:** Add the page to your home screen for app-like access. In Chrome, use **⋮ → Add to Home screen**. In Safari, use **Share → Add to Home Screen**.

**Troubleshooting**

| Symptom | Fix |
|---|---|
| Page does not load on the phone | First open `http://<host-ip>:4000` on the host computer itself to confirm the server is running. |
| Loads on the computer but not on the phone | Allow inbound TCP port `4000` in the host firewall. If Windows shows a firewall prompt for Node.js, click **Allow**. |
| Still blocked | Turn off **AP / client isolation** on the router. Guest Wi-Fi networks often enable it. |
| Address stopped working | The router gave the host a new IP. Restart the server and use the new address it prints, or reserve a fixed IP for the host in the router. |

To create the Windows firewall rule manually, run this in an Administrator PowerShell:
```powershell
New-NetFirewallRule -DisplayName "Plant-o-Meter 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow
```

> Use `http://`, not `https://`. The server does not serve TLS.

---

## 6. Industrial Admin Dashboard Capabilities

The integrated web dashboard provides real-time situational awareness:

- **Volumetric Water Content (% VWC)**: Calibrated moisture gauge with optimal/warning threshold detection.
- **Sub-Surface Thermal Metric (°C)**: High-resolution OneWire temperature monitoring.
- **Physicochemical Reaction (pH)**: Real-time hydrogen-ion measurement with buffer categorization.
- **Time-Series Telemetry Trends**: Interactive multi-channel Chart.js visualization with channel filtering (All, Moisture, Temperature, pH).
- **AI Agronomic Decision Support**: Autonomous evaluation of real-time telemetry against Bangladesh agricultural zones to recommend optimal perennial cultivars with scientific classification and suitability scoring.
- **Telemetry Ingestion Injection (Sim)**: Built-in hardware simulation engine for testing and demonstrations.
- **CSV Data Export**: One-click raw telemetry export for field agronomists and laboratory analysis.

---

## 7. Sensor Calibration Protocols

### 7.1 Capacitive Volumetric Soil Moisture Calibration
1. Record raw ADC response in dry ambient air → Update `MOISTURE_DRY` in `firmware/config.h` (nominal: `3200`).
2. Record raw ADC response with sensor immersed in water up to limit line → Update `MOISTURE_WET` in `firmware/config.h` (nominal: `1100`).

### 7.2 Chemical pH Unit Two-Point Calibration
1. Immerse clean electrode in standard **pH 7.00 Buffer Solution** → Record ADC reading → Update `PH_CAL_ADC_7` in `firmware/config.h` (nominal: `1900`).
2. Immerse clean electrode in standard **pH 4.00 Buffer Solution** → Record ADC reading → Update `PH_CAL_ADC_4` in `firmware/config.h` (nominal: `2400`).

---

## 8. REST Telemetry API Specification

| HTTP Method | Resource Route | Description | Payload / Response |
|---|---|---|---|
| `GET` | `/` | Renders the Industrial Admin Dashboard | HTML5 / CSS3 / JavaScript |
| `GET` | `/health` | Gateway Liveness & Health Probe | `{"status":"ok","time":"..."}` |
| `POST` | `/api/readings` | Edge Station Telemetry Ingestion | Body: `{ deviceId, moisture, temperature, ph }` |
| `GET` | `/api/readings/latest` | Query Most Recent Telemetry Packet | `{"id":..., "moisture":..., "temperature":..., "ph":...}` |
| `GET` | `/api/readings/history` | Historical Ingestion Stream (`?limit=50`) | Array of timestamped sensor packets |
| `POST` | `/api/suggest-tree` | AI Agronomic Decision Inference | Returns `{ trees: [...], summary: "..." }` |

---

## 9. Intellectual Property & License Notice

```
Copyright (c) 2026 ZAN Tech. All Rights Reserved.
Proprietary and Confidential.
```

This software, edge firmware, hardware architectural schematics, and UI/UX designs are proprietary works created and exclusively reserved by **ZAN Tech**. Unauthorized copying, reverse engineering, redistribution, or commercial use is strictly prohibited without prior written authorization from ZAN Tech.

For licensing inquiries or commercial integrations, contact:  
**ZAN Tech · Agritech & IoT Engineering Division**  
Email: [info@zantech.bd](mailto:info@zantech.bd) · Dhaka, Bangladesh

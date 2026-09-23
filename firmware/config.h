/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ZAN TECH · PLANT-O-METER™ ENTERPRISE AGRITECH IOT SUITE
 * Hardware Firmware Configuration Header
 *
 * Copyright (c) 2026 ZAN Tech. All Rights Reserved.
 * Proprietary & Confidential — ZAN Tech Engineering Division
 * ══════════════════════════════════════════════════════════════════════════════
 */

#ifndef CONFIG_H
#define CONFIG_H

// ─────────────────────────────────────────────────────────────────────────────
// 1. IEEE 802.11 b/g/n (2.4 GHz) WiFi Infrastructure
// ─────────────────────────────────────────────────────────────────────────────
#define WIFI_SSID       "YOUR_WIFI_NETWORK"     // Target 2.4 GHz Access Point SSID
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"    // WPA2/WPA3 Pre-Shared Key

// ─────────────────────────────────────────────────────────────────────────────
// 2. Telemetry Ingestion Server (Edge Node / Host PC)
// ─────────────────────────────────────────────────────────────────────────────
#define SERVER_IP       "192.168.1.100"         // Host PC IPv4 Address
#define SERVER_PORT     4000                    // Telemetry Ingestion HTTP Port
#define DEVICE_ID       "esp32-01"              // Unique Edge Station Node Identifier

// ─────────────────────────────────────────────────────────────────────────────
// 3. Sensor Acquisition & Telemetry Transmit Interval
// ─────────────────────────────────────────────────────────────────────────────
#define READING_INTERVAL_MS  5000UL             // Periodic Transmission Cycle (ms)

// ─────────────────────────────────────────────────────────────────────────────
// 4. GPIO Pin Assignments (ADC1 & Bus Mapping)
// ─────────────────────────────────────────────────────────────────────────────
#define PIN_MOISTURE    34   // Capacitive Soil Moisture Analog Input (ADC1_CH6)
#define PIN_ONEWIRE      4   // Dallas 1-Wire Digital Temperature Bus (GPIO4)
#define PIN_PH          35   // Analog pH Sensor Signal Input (ADC1_CH7)
#define PIN_LED          2   // Onboard Telemetry Activity LED Indicator

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sensor Calibration Constants & Signal Processing
// ─────────────────────────────────────────────────────────────────────────────
// Capacitive Volumetric Soil Moisture Calibration (12-bit ADC: 0 - 4095)
#define MOISTURE_DRY   3200   // Sensor ADC value in desiccated/air environment (0%)
#define MOISTURE_WET   1100   // Sensor ADC value at complete water saturation (100%)

// Two-Point Linear Chemical pH Calibration (PH-4502C Signal Conditioning)
#define PH_CAL_ADC_7   1900   // Measured ADC response in Standard pH 7.00 Buffer
#define PH_CAL_ADC_4   2400   // Measured ADC response in Standard pH 4.00 Buffer
#define PH_SAMPLES     10     // Moving sample window size to suppress high-frequency noise

#endif // CONFIG_H

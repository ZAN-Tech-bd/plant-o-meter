#ifndef CONFIG_H
#define CONFIG_H

// ─────────────────────────────────────────────────────────────────────────────
// 1. WiFi Network Settings (Must be 2.4 GHz WiFi — ESP32 does not support 5 GHz)
// ─────────────────────────────────────────────────────────────────────────────
#define WIFI_SSID       "YOUR_WIFI_NAME"        // Name of your WiFi network
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"    // Password of your WiFi network

// ─────────────────────────────────────────────────────────────────────────────
// 2. Server Settings (Your Computer / Laptop running the server)
// ─────────────────────────────────────────────────────────────────────────────
// Find your laptop's IP address:
// - Windows: Open Command Prompt, run "ipconfig" -> Look for IPv4 Address
// - Mac / Linux: Open Terminal, run "ifconfig" or "ip a"
#define SERVER_IP       "192.168.1.100"         // Example: 192.168.1.50
#define SERVER_PORT     4000                    // Port of your Plant-o-Meter server
#define DEVICE_ID       "esp32-01"              // Unique ID for this station

// ─────────────────────────────────────────────────────────────────────────────
// 3. Sensor Update Timing
// ─────────────────────────────────────────────────────────────────────────────
#define READING_INTERVAL_MS  5000UL             // Send data every 5 seconds (5000 ms)

// ─────────────────────────────────────────────────────────────────────────────
// 4. Hardware Pin Mapping
// ─────────────────────────────────────────────────────────────────────────────
#define PIN_MOISTURE    34   // Capacitive soil moisture sensor (ADC1)
#define PIN_ONEWIRE      4   // DS18B20 temperature probe data pin
#define PIN_PH          35   // Analog pH sensor (PH-4502C) output pin (ADC1)
#define PIN_LED          2   // Onboard indicator LED (blinks when data is sent)

// ─────────────────────────────────────────────────────────────────────────────
// 5. Calibration Constants
// ─────────────────────────────────────────────────────────────────────────────
// Soil Moisture Calibration (ADC 0-4095):
#define MOISTURE_DRY   3200   // Reading in dry air
#define MOISTURE_WET   1100   // Reading submerged in water

// pH Sensor Two-Point Calibration:
#define PH_CAL_ADC_7   1900   // Reading in pH 7.0 buffer solution
#define PH_CAL_ADC_4   2400   // Reading in pH 4.0 buffer solution
#define PH_SAMPLES     10     // Average 10 readings to smooth out noise

#endif // CONFIG_H

/*
 * Smart Helmet System — ESP32 Firmware
 * =====================================
 * WebSocket server on port 81
 * Sends: helmet:1,alcohol:0,mq3:87,drowsy:0,motor:1,led:1,buzzer:0,dist:85,rssi:-65\n
 *
 * Required Libraries (install via Arduino Library Manager):
 *   - WebSockets by Markus Sattler  (search: "WebSockets")
 *   - Arduino core for ESP32
 *
 * Wiring:
 *   Helmet switch  → GPIO 4   (INPUT_PULLUP, connect switch between pin and GND)
 *   MQ-3 sensor    → GPIO 34  (analog, 0-4095)
 *   Drowsy sensor  → GPIO 35  (analog IR reflection; or button for testing)
 *   HC-SR04 TRIG   → GPIO 12
 *   HC-SR04 ECHO   → GPIO 14
 *   Motor relay    → GPIO 26  (HIGH = motor enabled)
 *   LED            → GPIO 27  (HIGH = on)
 *   Buzzer         → GPIO 25  (HIGH = on)
 */

#include <WiFi.h>
#include <WebSocketsServer.h>

// ─── WiFi Credentials ────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── Pin Definitions ─────────────────────────────────────────────────────────
const int PIN_HELMET   = 4;    // Digital: LOW = helmet worn (pull-up)
const int PIN_MQ3      = 34;   // Analog: alcohol gas concentration
const int PIN_DROWSY   = 35;   // Analog: IR reflection (or digital button)
const int PIN_TRIG     = 12;   // HC-SR04 trigger
const int PIN_ECHO     = 14;   // HC-SR04 echo
const int PIN_MOTOR    = 26;   // Relay controlling motor
const int PIN_LED      = 27;   // Status LED
const int PIN_BUZZER   = 25;   // Active buzzer

// ─── Alert Thresholds ────────────────────────────────────────────────────────
const int   MQ3_ALCOHOL_THRESHOLD  = 400;   // Raw ADC value; tune for your sensor
const int   DROWSY_THRESHOLD       = 2000;  // Raw ADC value; tune for IR sensor
const float DISTANCE_DANGER_CM     = 20.0;  // Trigger buzzer/LED below this (cm)
const float DISTANCE_MAX_CM        = 400.0; // HC-SR04 reliable range

// ─── Timing ──────────────────────────────────────────────────────────────────
const unsigned long SEND_INTERVAL_MS   = 200;   // WebSocket broadcast every 200 ms
const unsigned long SERIAL_INTERVAL_MS = 2000;  // Serial print every 2 seconds
const unsigned long IP_PRINT_INTERVAL_MS = 5000; // Re-print IP reminder every 5 seconds
const unsigned long BLINK_INTERVAL_MS  = 500;   // LED blink period when alerting

// ─── WebSocket Server ────────────────────────────────────────────────────────
WebSocketsServer webSocket(81);

// ─── State ───────────────────────────────────────────────────────────────────
unsigned long lastSendTime    = 0;
unsigned long lastSerialTime  = 0;
unsigned long lastIpPrintTime = 0;
unsigned long lastBlinkTime   = 0;
bool          ledState        = false;
bool          motorLocked     = false;  // Lock motor if helmet off OR alcohol detected

// ─── Forward declarations ─────────────────────────────────────────────────────
float    readDistanceCm();
bool     isHelmetWorn();
bool     isAlcoholDetected(int rawMq3);
bool     isDrowsy(int rawDrowsy);
void     controlOutputs(bool helmet, bool alcohol, bool drowsy, float dist);
void     webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);

// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // Output pins
  pinMode(PIN_MOTOR,  OUTPUT);
  pinMode(PIN_LED,    OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_MOTOR,  LOW);
  digitalWrite(PIN_LED,    LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Input pins
  pinMode(PIN_HELMET, INPUT_PULLUP);
  pinMode(PIN_TRIG,   OUTPUT);
  pinMode(PIN_ECHO,   INPUT);
  // MQ3 and DROWSY are analog; no pinMode needed (GPIO 34/35 are input-only)

  // Connect to WiFi
  Serial.printf("\nConnecting to WiFi: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("========================================");
    Serial.println("       WiFi Connected Successfully!     ");
    Serial.println("========================================");
    Serial.printf("  IP Address : %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  Port       : 81\n");
    Serial.printf("  Signal     : %d dBm\n", WiFi.RSSI());
    Serial.println("========================================");
    Serial.println("Enter this IP in the Smart Helmet app.");
    Serial.println("========================================");
    Serial.println();
  } else {
    Serial.println("\nWiFi failed — running in offline mode.");
  }

  // Start WebSocket server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server started on port 81.");
  Serial.println("Sensor data will print every 2 seconds.");
}

// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  webSocket.loop();

  unsigned long now = millis();

  // ── Periodic IP reminder (every 5 seconds) ──────────────────────────────
  if (WiFi.status() == WL_CONNECTED && now - lastIpPrintTime >= IP_PRINT_INTERVAL_MS) {
    lastIpPrintTime = now;
    Serial.println("----------------------------------------");
    Serial.printf("  IP: %-16s  Port: 81\n", WiFi.localIP().toString().c_str());
    Serial.println("----------------------------------------");
  }

  // ── WebSocket broadcast (every 200 ms — keeps the web app smooth) ───────
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // Read sensors
    bool  helmet    = isHelmetWorn();
    int   rawMq3    = analogRead(PIN_MQ3);
    int   rawDrowsy = analogRead(PIN_DROWSY);
    bool  alcohol   = isAlcoholDetected(rawMq3);
    bool  drowsy    = isDrowsy(rawDrowsy);
    float dist      = readDistanceCm();
    int   rssi      = WiFi.RSSI();

    // Drive outputs
    controlOutputs(helmet, alcohol, drowsy, dist);

    bool motorOn  = digitalRead(PIN_MOTOR)  == HIGH;
    bool ledOn    = digitalRead(PIN_LED)    == HIGH;
    bool buzzerOn = digitalRead(PIN_BUZZER) == HIGH;

    // Build sensor string
    char buf[128];
    int mq3Percent = map(rawMq3, 0, 4095, 0, 100);
    snprintf(buf, sizeof(buf),
      "helmet:%d,alcohol:%d,mq3:%d,drowsy:%d,motor:%d,led:%d,buzzer:%d,dist:%.1f,rssi:%d\n",
      helmet   ? 1 : 0,
      alcohol  ? 1 : 0,
      mq3Percent,
      drowsy   ? 1 : 0,
      motorOn  ? 1 : 0,
      ledOn    ? 1 : 0,
      buzzerOn ? 1 : 0,
      dist,
      rssi
    );

    // Broadcast to web app (always fast)
    webSocket.broadcastTXT(buf);

    // ── Serial print (every 2 seconds — slow enough to read) ─────────────
    if (now - lastSerialTime >= SERIAL_INTERVAL_MS) {
      lastSerialTime = now;
      Serial.printf("[%6lus] %s", now / 1000, buf);
    }
  } // end SEND_INTERVAL
} // end loop

// ─────────────────────────────────────────────────────────────────────────────
// Sensor readers
// ─────────────────────────────────────────────────────────────────────────────

bool isHelmetWorn() {
  // Switch between PIN_HELMET and GND → LOW when helmet worn (pulled high internally)
  return digitalRead(PIN_HELMET) == LOW;
}

bool isAlcoholDetected(int rawMq3) {
  return rawMq3 > MQ3_ALCOHOL_THRESHOLD;
}

bool isDrowsy(int rawDrowsy) {
  // IR reflection: high value = eye closed / head down (tune threshold)
  return rawDrowsy > DROWSY_THRESHOLD;
}

float readDistanceCm() {
  // Send 10 µs pulse
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Measure echo duration (timeout after ~24 ms = 400 cm)
  long duration = pulseIn(PIN_ECHO, HIGH, 24000);
  if (duration == 0) return DISTANCE_MAX_CM; // nothing detected

  float cm = (duration * 0.0343f) / 2.0f;
  if (cm > DISTANCE_MAX_CM) cm = DISTANCE_MAX_CM;
  return cm;
}

// ─────────────────────────────────────────────────────────────────────────────
// Output control logic
// ─────────────────────────────────────────────────────────────────────────────

void controlOutputs(bool helmet, bool alcohol, bool drowsy, float dist) {
  bool danger     = !helmet || alcohol || drowsy;
  bool distDanger = (dist < DISTANCE_DANGER_CM);

  // Motor: disable if helmet off OR alcohol detected
  motorLocked = (!helmet || alcohol);
  digitalWrite(PIN_MOTOR, motorLocked ? LOW : HIGH);

  // Buzzer: sound on safety danger OR obstacle too close
  bool buzzerActive = danger || distDanger;
  digitalWrite(PIN_BUZZER, buzzerActive ? HIGH : LOW);

  // LED: blink when danger, solid on when normal + motor running, off when idle
  if (danger || distDanger) {
    unsigned long now = millis();
    if (now - lastBlinkTime >= BLINK_INTERVAL_MS) {
      lastBlinkTime = now;
      ledState = !ledState;
      digitalWrite(PIN_LED, ledState ? HIGH : LOW);
    }
  } else if (!motorLocked) {
    // Motor running, no danger — solid LED
    digitalWrite(PIN_LED, HIGH);
    ledState = true;
  } else {
    // Idle — LED off
    digitalWrite(PIN_LED, LOW);
    ledState = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WebSocket events
// ─────────────────────────────────────────────────────────────────────────────

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WS] Client #%u disconnected\n", num);
      break;

    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS] Client #%u connected from %s\n", num, ip.toString().c_str());
      webSocket.sendTXT(num, "connected:1\n");
      break;
    }

    case WStype_TEXT:
      // Accept commands from the web app (future use)
      Serial.printf("[WS] Command from #%u: %s\n", num, payload);

      // Example: "motor:1" or "motor:0" override from dashboard
      if (strncmp((char*)payload, "motor:1", 7) == 0 && !motorLocked) {
        digitalWrite(PIN_MOTOR, HIGH);
      } else if (strncmp((char*)payload, "motor:0", 7) == 0) {
        digitalWrite(PIN_MOTOR, LOW);
      } else if (strncmp((char*)payload, "led:1", 5) == 0) {
        digitalWrite(PIN_LED, HIGH);
      } else if (strncmp((char*)payload, "led:0", 5) == 0) {
        digitalWrite(PIN_LED, LOW);
      }
      break;

    default:
      break;
  }
}

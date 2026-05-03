/*
 * Smart Helmet System — ESP32 Firmware (SOS & Alerts)
 * =====================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>

// ─── WiFi Credentials ────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── Pin Definitions ─────────────────────────────────────────────────────────
const int PIN_HELMET   = 4;    // Digital: LOW = helmet worn
const int PIN_MQ3      = 34;   // Analog: alcohol sensor
const int PIN_DROWSY   = 35;   // Analog: IR sensor
const int PIN_TRIG     = 12;   // HC-SR04 trigger
const int PIN_ECHO     = 14;   // HC-SR04 echo
const int PIN_MOTOR    = 26;   // Relay for motor
const int PIN_LED      = 27;   // Status LED
const int PIN_BUZZER   = 25;   // Buzzer
const int PIN_SOS      = 13;   // SOS Button (GPIO 13)

// ─── Thresholds ──────────────────────────────────────────────────────────────
const int   MQ3_ALCOHOL_THRESHOLD = 400;
const int   DROWSY_THRESHOLD      = 2000;
const float DISTANCE_DANGER_CM    = 20.0;
const float DISTANCE_MAX_CM       = 400.0;

// ─── Timing ──────────────────────────────────────────────────────────────────
const unsigned long SEND_INTERVAL_MS     = 200;
const unsigned long SERIAL_INTERVAL_MS   = 2000;
const unsigned long IP_PRINT_INTERVAL_MS = 5000;
const unsigned long BLINK_INTERVAL_MS    = 500;

WebSocketsServer webSocket(81);

unsigned long lastSendTime    = 0;
unsigned long lastSerialTime  = 0;
unsigned long lastIpPrintTime = 0;
unsigned long lastBlinkTime   = 0;
bool          ledState        = false;
bool          motorLocked     = false;

// ─── Function Prototypes ─────────────────────────────────────────────────────
float readDistanceCm();
bool  isHelmetWorn();
bool  isAlcoholDetected(int rawMq3);
bool  isDrowsy(int rawDrowsy);
bool  isSosPressed();
void  controlOutputs(bool helmet, bool alcohol, bool drowsy, float dist, bool sos);
void  webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length);

void setup() {
  Serial.begin(115200);

  pinMode(PIN_MOTOR,  OUTPUT); digitalWrite(PIN_MOTOR,  LOW);
  pinMode(PIN_LED,    OUTPUT); digitalWrite(PIN_LED,    LOW);
  pinMode(PIN_BUZZER, OUTPUT); digitalWrite(PIN_BUZZER, LOW);
  
  pinMode(PIN_HELMET, INPUT_PULLUP);
  pinMode(PIN_SOS,    INPUT_PULLUP);
  pinMode(PIN_TRIG,   OUTPUT);
  pinMode(PIN_ECHO,   INPUT);

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
    Serial.println("========================================");
  }

  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  unsigned long now = millis();

  if (WiFi.status() == WL_CONNECTED && now - lastIpPrintTime >= IP_PRINT_INTERVAL_MS) {
    lastIpPrintTime = now;
    Serial.printf("IP: %s | Port: 81\n", WiFi.localIP().toString().c_str());
  }

  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    bool  helmet    = isHelmetWorn();
    int   rawMq3    = analogRead(PIN_MQ3);
    int   rawDrowsy = analogRead(PIN_DROWSY);
    bool  alcohol   = isAlcoholDetected(rawMq3);
    bool  drowsy    = isDrowsy(rawDrowsy);
    bool  sos       = isSosPressed();
    float dist      = readDistanceCm();
    int   rssi      = WiFi.RSSI();

    controlOutputs(helmet, alcohol, drowsy, dist, sos);

    // Build data string
    char buf[128];
    int mappedMq3 = map(rawMq3, 0, 4095, 0, 1023); 
    snprintf(buf, sizeof(buf),
      "helmet:%d,alcohol:%d,mq3:%d,drowsy:%d,motor:%d,led:%d,buzzer:%d,dist:%.1f,rssi:%d,sos:%d\n",
      helmet ? 1:0, alcohol ? 1:0, mappedMq3,
      drowsy ? 1:0, digitalRead(PIN_MOTOR), digitalRead(PIN_LED), digitalRead(PIN_BUZZER), dist, rssi, sos ? 1:0);

    webSocket.broadcastTXT(buf);

    if (now - lastSerialTime >= SERIAL_INTERVAL_MS) {
      lastSerialTime = now;
      Serial.print(buf);
    }
  }
}

bool isHelmetWorn()  { return digitalRead(PIN_HELMET) == LOW; }
bool isSosPressed()   { return digitalRead(PIN_SOS) == LOW; }
bool isAlcoholDetected(int raw) { return raw > MQ3_ALCOHOL_THRESHOLD; }
bool isDrowsy(int raw)          { return raw > DROWSY_THRESHOLD; }

float readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long dur = pulseIn(PIN_ECHO, HIGH, 24000);
  if (dur == 0) return DISTANCE_MAX_CM;
  float cm = (dur * 0.0343f) / 2.0f;
  return cm > DISTANCE_MAX_CM ? DISTANCE_MAX_CM : cm;
}

void controlOutputs(bool helmet, bool alcohol, bool drowsy, float dist, bool sos) {
  bool danger = !helmet || alcohol || drowsy || sos;
  bool distDanger = dist < DISTANCE_DANGER_CM;

  motorLocked = (!helmet || alcohol);
  digitalWrite(PIN_MOTOR, motorLocked ? LOW : HIGH);
  digitalWrite(PIN_BUZZER, (danger || distDanger) ? HIGH : LOW);

  if (danger || distDanger) {
    if (millis() - lastBlinkTime >= BLINK_INTERVAL_MS) {
      lastBlinkTime = millis();
      ledState = !ledState;
      digitalWrite(PIN_LED, ledState ? HIGH : LOW);
    }
  } else {
    digitalWrite(PIN_LED, motorLocked ? LOW : HIGH);
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type == WStype_CONNECTED) {
    webSocket.sendTXT(num, "connected:1\n");
  }
}

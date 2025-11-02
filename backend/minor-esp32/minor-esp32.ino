#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h>
WebServer server(80);

// ======================== Wi-Fi CONFIG ========================
const char* ssid = "Aditya";
const char* password = "11111111";
const int   CH   = 11;  
const char* stateUrl = "http://192.168.230.115:3000/relay/state";

// ======================== RELAY CONFIG ========================
bool ACTIVE_LOW = true;
bool relayStates[40];   // store state per pin

// Safe GPIOs on ESP32 for digital output
int usablePins[] = {2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19,
                    21, 22, 23, 25, 26, 27, 32, 33};
int pinCount = sizeof(usablePins) / sizeof(usablePins[0]);

// Relay write helper
inline void relayWrite(int pin, bool on) {
  if (pin >= 0 && pin < 40 && !(pin >= 6 && pin <= 11)) { // exclude flash pins
    digitalWrite(pin, ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW));
  }
}

void handleGetState() {
  int pin = server.arg("pin").toInt();
  bool state = digitalRead(pin);
  String json = "{\"pin\":" + String(pin) + ",\"state\":" + String(state) + "}";
  server.send(200, "application/json", json);
}

void handleSetState() {
  int pin = server.arg("pin").toInt();
  bool state = server.arg("state") == "on";
  relayWrite(pin, state);
  String json = "{\"pin\":" + String(pin) + ",\"state\":" + String(state) + "}";
  server.send(200, "application/json", json);
}


// ======================== SETUP ========================
void setup() {
  Serial.begin(115200);
  delay(300);
  
  Serial.printf("Connecting to %s (CH:%d)\n", ssid, CH);
  WiFi.mode(WIFI_STA);
  WiFi.persistent(false);
  WiFi.setSleep(false);
  WiFi.disconnect(true, true);
  delay(300);
  WiFi.begin(ssid, password, CH);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(200);
    yield();
    Serial.print(".");
    if (millis() - start > 20000) {
      Serial.println("\nRetrying connection...");
      WiFi.disconnect(true, true);
      delay(500);
      WiFi.begin(ssid, password, CH);
      start = millis();
    }
  }
  
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  Serial.println("--------------------------------------");

  // Initialize only usable pins
  for (int i = 0; i < pinCount; i++) {
    int pin = usablePins[i];
    pinMode(pin, OUTPUT);
    relayWrite(pin, false);
    relayStates[pin] = false;
  }
  Serial.println("Relay pins initialized safely.");
  Serial.println("--------------------------------------");
    server.on("/getState", handleGetState);
  server.on("/setState", handleSetState);
  server.begin();
}

// ======================== LOOP ========================
void loop() {
    server.handleClient();
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(1500);
    http.begin(stateUrl);
    int httpCode = http.GET();

    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Received payload:");
      Serial.println(payload);

      StaticJsonDocument<1024> doc;
      DeserializationError err = deserializeJson(doc, payload);
      if (err) {
        Serial.print("JSON parse failed: ");
        Serial.println(err.c_str());
      } else {
        // Single relay
        if (doc.containsKey("relay")) {
          int pin = doc["relay"]["pin"];
          bool state = doc["relay"]["state"];
          if (!(pin >= 6 && pin <= 11)) { // skip invalid pins
            relayStates[pin] = state;
            relayWrite(pin, state);
            Serial.printf("Pin %d → %s\n", pin, state ? "ON" : "OFF");
          }
        }
        // Multiple relays
        else if (doc.containsKey("relays")) {
          JsonArray arr = doc["relays"].as<JsonArray>();
          for (JsonObject r : arr) {
            int pin = r["pin"];
            bool state = r["state"];
            if (!(pin >= 6 && pin <= 11)) {
              relayStates[pin] = state;
              relayWrite(pin, state);
              Serial.printf("Pin %d → %s\n", pin, state ? "ON" : "OFF");
            }
          }
        } else {
          Serial.println("Unexpected JSON format!");
        }
      }
    } else {
    Serial.printf("HTTP Error: %d (%s)\n", httpCode, http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
  }

  delay(2000); // poll every 2s
}

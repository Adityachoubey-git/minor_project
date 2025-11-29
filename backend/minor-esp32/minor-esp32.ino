#include <WiFi.h>
#include <WebServer.h>

// TFT display
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

// ======================== Wi-Fi CONFIG ========================
const char* ssid     = "Aditya";
const char* password = "11111111";
const int   CH       = 11;

WebServer server(80);

// ======================== RELAY CONFIG ========================
bool ACTIVE_LOW = true;
bool relayStates[40];   // store state per pin

// Safe GPIOs on ESP32 for digital output (relays only)
// DO NOT put TFT pins here: 2, 4, 5, 18, 19, 23
int usablePins[] = {
  12, 13, 14, 15, 16, 17,
  21, 22, 25, 26, 27, 32, 33
};
int pinCount = sizeof(usablePins) / sizeof(usablePins[0]);

// Relay write helper
inline void relayWrite(int pin, bool on) {
  if (pin >= 0 && pin < 40 && !(pin >= 6 && pin <= 11)) { // exclude flash pins
    digitalWrite(pin, ACTIVE_LOW ? (on ? LOW : HIGH) : (on ? HIGH : LOW));
  }
}

// ======================== TFT CONFIG ==========================
#define TFT_CS   5
#define TFT_DC   2
#define TFT_RST  4

Adafruit_ILI9341 tft(TFT_CS, TFT_DC, TFT_RST);

// virtual pin number for TFT "device"
#define TFT_VIRTUAL_PIN 99
bool tftOn = false;

// ======================== TFT HELPERS =========================
void drawLabScreen() {
  tft.fillScreen(ILI9341_BLACK);

  // --- Border box settings ---
  int marginX = 10;
  int marginY = 10;
  int boxW    = tft.width()  - 2 * marginX;   // width of rectangle
  int boxH    = tft.height() - 2 * marginY;   // height of rectangle

  // Draw outer border rectangle
  tft.drawRect(marginX, marginY, boxW, boxH, ILI9341_WHITE);

  // Optionally, add inner border for a thicker frame (optional)
   tft.drawRect(marginX + 2, marginY + 2, boxW - 4, boxH - 4, ILI9341_WHITE);

  // --- Text inside the rectangle ---
  // small padding inside the box
  int padX = marginX + 15;
  int y    = marginY + 20;

  // Title
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(padX, y);
  tft.println("Lab Autonomy");

  // "present by :"
  tft.setTextSize(2);
  y += 35;  // move down a bit
  tft.setCursor(padX, y);
  tft.println("present by :");

  // Names
  y += 25;
  tft.setCursor(padX, y);
  tft.println("Rishika");
  y += 25;
  tft.setCursor(padX, y);
  tft.println("Aditya");
  y += 25;
  tft.setCursor(padX, y);
  tft.println("Piyush");
  y += 25;
  tft.setCursor(padX, y);
  tft.println("Tarun");
}

// ======================== HTTP HANDLERS =======================
void handleGetState() {
  int pin = server.arg("pin").toInt();

  // ===== Smart Display (TFT virtual pin 99) =====
  if (pin == TFT_VIRTUAL_PIN) {
    int val = tftOn ? 0 : 1;  // 0 = ON, 1 = OFF
    String json = "{\"pin\":" + String(pin) + ",\"state\":" + String(val) + "}";
    server.send(200, "application/json", json);
    return;
  }

  // ===== Relays (ACTIVE_LOW) =====
  int digi = digitalRead(pin);   // 0 = LOW, 1 = HIGH
  // Because ACTIVE_LOW: LOW(0) = relay ON, HIGH(1) = relay OFF
  int val = digi;                // 0 = ON, 1 = OFF
  String json = "{\"pin\":" + String(pin) + ",\"state\":" + String(val) + "}";
  server.send(200, "application/json", json);
}


void handleSetState() {
  int pin = server.arg("pin").toInt();
  String stateStr = server.arg("state");   // "on" or "off"
  bool on = (stateStr == "on");

  // ===== Smart Display (TFT virtual pin 99) =====
  if (pin == TFT_VIRTUAL_PIN) {
    if (on) {
      tftOn = true;
      drawLabScreen();
      Serial.println("TFT -> ON (Lab Autonomy screen shown)");
    } else {
      tftOn = false;
      tft.fillScreen(ILI9341_BLACK);
      Serial.println("TFT -> OFF (screen cleared)");
    }

    int val = on ? 0 : 1;  // 0 = ON, 1 = OFF
    String json = "{\"pin\":" + String(pin) + ",\"state\":" + String(val) + "}";
    server.send(200, "application/json", json);
    return;
  }

  // ===== Normal relay handling =====
  if (pin >= 0 && pin < 40 && !(pin >= 6 && pin <= 11)) {
    relayWrite(pin, on);
    relayStates[pin] = on;
    Serial.printf("Relay pin %d -> %s\n", pin, on ? "ON" : "OFF");
  } else {
    Serial.printf("Warning: invalid relay pin %d\n", pin);
  }

  int val = on ? 0 : 1;  // 0 = ON, 1 = OFF
  String json = "{\"pin\":" + String(pin) + ",\"state\":" + String(val) + "}";
  server.send(200, "application/json", json);
}


// ======================== SETUP ================================
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

  // ===== TFT INIT =====
  SPI.begin(18, 19, 23, TFT_CS); // SCK, MISO, MOSI, SS
  tft.begin();
  tft.setRotation(1);            // 1 = landscape
  tft.fillScreen(ILI9341_BLACK);

  // Show screen on boot
  drawLabScreen();
  tftOn = true;
  Serial.println("TFT initialized and Lab Autonomy screen drawn.");
  Serial.println("--------------------------------------");

  // ===== RELAY INIT =====
  for (int i = 0; i < pinCount; i++) {
    int pin = usablePins[i];
    pinMode(pin, OUTPUT);
    relayWrite(pin, false);
    relayStates[pin] = false;
  }
  Serial.println("Relay pins initialized safely.");
  Serial.println("--------------------------------------");

  // ===== HTTP ROUTES =====
  server.on("/getState", handleGetState);
  server.on("/setState", handleSetState);
  server.begin();
}

// ======================== LOOP ================================
void loop() {
  server.handleClient();
  delay(2);   // small delay to keep loop responsive
}

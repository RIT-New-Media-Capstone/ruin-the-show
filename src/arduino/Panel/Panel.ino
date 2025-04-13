// Game Controller Script
// Components:
// - 6 buttons with LEDs (4 podium, 1 cheat, 1 applause)
// - Joystick (left/right buttons)
// - Potentiometer lever (mapped to 1-100)

// Pin definitions
// Buttons - Digital inputs
const int PODIUM_BTN_1 = 4;
const int PODIUM_BTN_2 = 5;
const int PODIUM_BTN_3 = 6;
const int PODIUM_BTN_4 = 7;
const int CHEAT_BTN = 2;
const int APPLAUSE_BTN = 3;

// Button LEDs - Digital outputs
const int PODIUM_LED_1 = 10;
const int PODIUM_LED_2 = 12;
const int PODIUM_LED_3 = 11;
const int PODIUM_LED_4 = 13;
const int CHEAT_LED = 8;
const int APPLAUSE_LED = 9;

// Joystick buttons
const int JOYSTICK_LEFT = A0;
const int JOYSTICK_RIGHT = A1;

// Potentiometer lever
const int LEVER_POT = A2;

// Variables to store button states
int podium1State = 0;
int podium2State = 0;
int podium3State = 0;
int podium4State = 0;
int cheatState = 0;
int applauseState = 0;
int joystickLeftState = 0;
int joystickRightState = 0;
int joystickValue = 0;  // Variable to store joystick position (-1, 0, or 1)

// Variables to store previous button states for edge detection
int prevPodium1State = 0;
int prevPodium2State = 0;
int prevPodium3State = 0;
int prevPodium4State = 0;
int prevCheatState = 0;
int prevApplauseState = 0;
int prevJoystickLeftState = 0;
int prevJoystickRightState = 0;

// Lever variables
int leverValue = 0;
int prevLeverValue = 0;
const int LEVER_THRESHOLD = 2; // Threshold for lever value change

// Timing for joystick streaming
unsigned long lastJoystickStreamTime = 0;
const int JOYSTICK_STREAM_INTERVAL = 100; // Stream joystick value every 100ms

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Initialize button pins as inputs with pull-up resistors
  pinMode(PODIUM_BTN_1, INPUT_PULLUP);
  pinMode(PODIUM_BTN_2, INPUT_PULLUP);
  pinMode(PODIUM_BTN_3, INPUT_PULLUP);
  pinMode(PODIUM_BTN_4, INPUT_PULLUP);
  pinMode(CHEAT_BTN, INPUT_PULLUP);
  pinMode(APPLAUSE_BTN, INPUT_PULLUP);
  
  // Joystick buttons also use pull-up resistors
  pinMode(JOYSTICK_LEFT, INPUT_PULLUP);
  pinMode(JOYSTICK_RIGHT, INPUT_PULLUP);
  
  // Initialize LED pins as outputs
  pinMode(PODIUM_LED_1, OUTPUT);
  pinMode(PODIUM_LED_2, OUTPUT);
  pinMode(PODIUM_LED_3, OUTPUT);
  pinMode(PODIUM_LED_4, OUTPUT);
  pinMode(CHEAT_LED, OUTPUT);
  pinMode(APPLAUSE_LED, OUTPUT);
  
  // Initially turn off all LEDs
  digitalWrite(PODIUM_LED_1, LOW);
  digitalWrite(PODIUM_LED_2, LOW);
  digitalWrite(PODIUM_LED_3, LOW);
  digitalWrite(PODIUM_LED_4, LOW);
  digitalWrite(CHEAT_LED, LOW);
  digitalWrite(APPLAUSE_LED, LOW);
  
  Serial.println("Game Controller initialized!");
}

void loop() {
  // Read button states (invert because pull-up resistors)
  podium1State = !digitalRead(PODIUM_BTN_1);
  podium2State = !digitalRead(PODIUM_BTN_2);
  podium3State = !digitalRead(PODIUM_BTN_3);
  podium4State = !digitalRead(PODIUM_BTN_4);
  cheatState = !digitalRead(CHEAT_BTN);
  applauseState = !digitalRead(APPLAUSE_BTN);
  
  // Read joystick states (invert because pull-up resistors)
  joystickLeftState = !digitalRead(JOYSTICK_LEFT);
  joystickRightState = !digitalRead(JOYSTICK_RIGHT);
  
  // Determine joystick value: -1 (left), 0 (neutral), or 1 (right)
  if (joystickLeftState && !joystickRightState) {
    joystickValue = -1;
  } else if (!joystickLeftState && joystickRightState) {
    joystickValue = 1;
  } else {
    joystickValue = 0;
  }
  
  // Stream joystick position at regular intervals
  unsigned long currentTime = millis();
  if (currentTime - lastJoystickStreamTime >= JOYSTICK_STREAM_INTERVAL) {
    Serial.print("JOYSTICK_POSITION:");
    Serial.println(joystickValue);
    lastJoystickStreamTime = currentTime;
  }
  
  // Read potentiometer and map to 1-100
  int rawLeverValue = analogRead(LEVER_POT);
  leverValue = map(rawLeverValue, 834, 328, 1, 100);
  //leverValue= rawLeverValue;
  
  // Check for button presses (rising edge detection)
  if (podium1State && !prevPodium1State) {
    Serial.println("PODIUM_1_PRESSED");
  }
  if (podium2State && !prevPodium2State) {
    Serial.println("PODIUM_2_PRESSED");
  }
  if (podium3State && !prevPodium3State) {
    Serial.println("PODIUM_3_PRESSED");
  }
  if (podium4State && !prevPodium4State) {
    Serial.println("PODIUM_4_PRESSED");
  }
  if (cheatState && !prevCheatState) {
    Serial.println("CHEAT_PRESSED");
  }
  if (applauseState && !prevApplauseState) {
    Serial.println("APPLAUSE_PRESSED");
  }
  
  // Check for significant lever value changes
  if (abs(leverValue - prevLeverValue) >= LEVER_THRESHOLD) {
    Serial.print("LEVER_VALUE:");
    Serial.println(leverValue);
    prevLeverValue = leverValue;
  }
  
  // Update previous states
  prevPodium1State = podium1State;
  prevPodium2State = podium2State;
  prevPodium3State = podium3State;
  prevPodium4State = podium4State;
  prevCheatState = cheatState;
  prevApplauseState = applauseState;
  prevJoystickLeftState = joystickLeftState;
  prevJoystickRightState = joystickRightState;
  
  // Check for serial commands
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    // Process commands
    processCommand(command);
  }
  
  // Short delay to debounce
  delay(20);
}

void processCommand(String command) {
  // LED control commands
  if (command == "PODIUM_1_LED_ON") {
    digitalWrite(PODIUM_LED_1, HIGH);
    Serial.println("PODIUM_1_LED_ON_ACK");
  }
  else if (command == "PODIUM_1_LED_OFF") {
    digitalWrite(PODIUM_LED_1, LOW);
    Serial.println("PODIUM_1_LED_OFF_ACK");
  }
  else if (command == "PODIUM_2_LED_ON") {
    digitalWrite(PODIUM_LED_2, HIGH);
    Serial.println("PODIUM_2_LED_ON_ACK");
  }
  else if (command == "PODIUM_2_LED_OFF") {
    digitalWrite(PODIUM_LED_2, LOW);
    Serial.println("PODIUM_2_LED_OFF_ACK");
  }
  else if (command == "PODIUM_3_LED_ON") {
    digitalWrite(PODIUM_LED_3, HIGH);
    Serial.println("PODIUM_3_LED_ON_ACK");
  }
  else if (command == "PODIUM_3_LED_OFF") {
    digitalWrite(PODIUM_LED_3, LOW);
    Serial.println("PODIUM_3_LED_OFF_ACK");
  }
  else if (command == "PODIUM_4_LED_ON") {
    digitalWrite(PODIUM_LED_4, HIGH);
    Serial.println("PODIUM_4_LED_ON_ACK");
  }
  else if (command == "PODIUM_4_LED_OFF") {
    digitalWrite(PODIUM_LED_4, LOW);
    Serial.println("PODIUM_4_LED_OFF_ACK");
  }
  else if (command == "CHEAT_LED_ON") {
    digitalWrite(CHEAT_LED, HIGH);
    Serial.println("CHEAT_LED_ON_ACK");
  }
  else if (command == "CHEAT_LED_OFF") {
    digitalWrite(CHEAT_LED, LOW);
    Serial.println("CHEAT_LED_OFF_ACK");
  }
  else if (command == "APPLAUSE_LED_ON") {
    digitalWrite(APPLAUSE_LED, HIGH);
    Serial.println("APPLAUSE_LED_ON_ACK");
  }
  else if (command == "APPLAUSE_LED_OFF") {
    digitalWrite(APPLAUSE_LED, LOW);
    Serial.println("APPLAUSE_LED_OFF_ACK");
  }
  else if (command == "ALL_LEDS_ON") {
    digitalWrite(PODIUM_LED_1, HIGH);
    digitalWrite(PODIUM_LED_2, HIGH);
    digitalWrite(PODIUM_LED_3, HIGH);
    digitalWrite(PODIUM_LED_4, HIGH);
    digitalWrite(CHEAT_LED, HIGH);
    digitalWrite(APPLAUSE_LED, HIGH);
    Serial.println("ALL_LEDS_ON_ACK");
  }
  else if (command == "ALL_LEDS_OFF") {
    digitalWrite(PODIUM_LED_1, LOW);
    digitalWrite(PODIUM_LED_2, LOW);
    digitalWrite(PODIUM_LED_3, LOW);
    digitalWrite(PODIUM_LED_4, LOW);
    digitalWrite(CHEAT_LED, LOW);
    digitalWrite(APPLAUSE_LED, LOW);
    Serial.println("ALL_LEDS_OFF_ACK");
  }
  else if (command == "STATUS") {
    // Send current state of all inputs and outputs
    Serial.println("STATUS_BEGIN");
    Serial.print("PODIUM_1_BTN:"); Serial.println(podium1State);
    Serial.print("PODIUM_2_BTN:"); Serial.println(podium2State);
    Serial.print("PODIUM_3_BTN:"); Serial.println(podium3State);
    Serial.print("PODIUM_4_BTN:"); Serial.println(podium4State);
    Serial.print("CHEAT_BTN:"); Serial.println(cheatState);
    Serial.print("APPLAUSE_BTN:"); Serial.println(applauseState);
    Serial.print("JOYSTICK_POSITION:"); Serial.println(joystickValue);
    Serial.print("LEVER_VALUE:"); Serial.println(leverValue);
    Serial.println("STATUS_END");
  }
  else {
    Serial.println("UNKNOWN_COMMAND");
  }
}
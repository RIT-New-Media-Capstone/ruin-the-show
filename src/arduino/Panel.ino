// Combined code for arcade joystick and two LED controllers with serial communication
// Pin definitions
const int LEFT_PIN = 4;      // Digital pin for left direction switch
const int RIGHT_PIN = 5;     // Digital pin for right direction switch
const int BUTTON_PIN_1 = 2;  // First game button
const int LED_PIN_1 = 13;    // First game LED
const int BUTTON_PIN_2 = 6;  // Second game button
const int LED_PIN_2 = 12;    // Second game LED

// Joystick variables
unsigned long lastJoystickChangeTime = 0;  // For debouncing joystick
const int debounceDelay = 200;     // Milliseconds between input updates

// LED/button 1 variables
int buttonState1 = 0;        // Variable to store button state
bool ledOn1 = false;         // Track if LED is currently on
unsigned long lastButton1ChangeTime = 0;  // Last time button1 was pressed

// LED/button 2 variables
int buttonState2 = 0;        // Variable to store button state
bool ledOn2 = false;         // Track if LED is currently on
unsigned long lastButton2ChangeTime = 0;  // Last time button2 was pressed

// Serial communication variables
String inputString = "";     // String to hold incoming data
bool stringComplete = false; // Whether the string is complete

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  inputString.reserve(200);  // Reserve space for the input string
  
  // Set up joystick switch pins with internal pull-up resistors
  pinMode(LEFT_PIN, INPUT_PULLUP);
  pinMode(RIGHT_PIN, INPUT_PULLUP);
  
  // Set up button and LED pins
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(BUTTON_PIN_1, INPUT_PULLUP);
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(BUTTON_PIN_2, INPUT_PULLUP);
  
  // Initialize LEDs to off
  digitalWrite(LED_PIN_1, LOW);
  digitalWrite(LED_PIN_2, LOW);
  
  Serial.println("System ready for serial commands");
  Serial.println("Send 'LED1_ON' or 'LED2_ON' to turn on LEDs");
}

void loop() {
  // Current time used by all systems
  unsigned long currentTime = millis();
  
  // Handle joystick inputs
  handleJoystick(currentTime);
  
  // Handle buttons and LEDs
  handleButton(currentTime, BUTTON_PIN_1, LED_PIN_1, &buttonState1, &ledOn1, 
               &lastButton1ChangeTime, 1);
  handleButton(currentTime, BUTTON_PIN_2, LED_PIN_2, &buttonState2, &ledOn2, 
               &lastButton2ChangeTime, 2);
  
  // Process any received serial commands
  processSerialCommands();
}

void handleJoystick(unsigned long currentTime) {
  // Read switch states (LOW when pressed because of pull-up resistors)
  bool leftPressed = (digitalRead(LEFT_PIN) == LOW);
  bool rightPressed = (digitalRead(RIGHT_PIN) == LOW);
  
  // Only process input after debounce delay has passed
  if (currentTime - lastJoystickChangeTime > debounceDelay) {
    if (leftPressed) {
      Serial.println("JOYSTICK_LEFT");
      lastJoystickChangeTime = currentTime;  // Reset the timer
    }
    else if (rightPressed) {
      Serial.println("JOYSTICK_RIGHT");
      lastJoystickChangeTime = currentTime;  // Reset the timer
    }
  }
}

void handleButton(unsigned long currentTime, int buttonPin, int ledPin, 
                  int *buttonState, bool *ledOn, unsigned long *lastChangeTime, 
                  int buttonNumber) {
  // Read the state of the button (LOW when pressed due to pull-up resistor)
  *buttonState = digitalRead(buttonPin);
  
  // Check if button is pressed and LED is on
  if (*buttonState == LOW && *ledOn && (currentTime - *lastChangeTime > debounceDelay)) {
    digitalWrite(ledPin, LOW);  // Turn off LED
    *ledOn = false;
    *lastChangeTime = currentTime;
    
    // Send message that button was pressed
    Serial.print("BUTTON");
    Serial.print(buttonNumber);
    Serial.println("_PRESSED");
  }
}

void processSerialCommands() {
  // If a complete command was received
  if (stringComplete) {
    inputString.trim();  // Remove any whitespace
    
    // Process the command
    if (inputString == "LED1_ON" && !ledOn1) {
      digitalWrite(LED_PIN_1, HIGH);
      ledOn1 = true;
      Serial.println("LED1 turned on");
    }
    else if (inputString == "LED2_ON" && !ledOn2) {
      digitalWrite(LED_PIN_2, HIGH);
      ledOn2 = true;
      Serial.println("LED2 turned on");
    }
    
    // Clear the string for the next command
    inputString = "";
    stringComplete = false;
  }
}

// Serial event happens automatically when new data arrives
void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    
    // Add character to input string
    inputString += inChar;
    
    // If newline character, set flag to process the command
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}
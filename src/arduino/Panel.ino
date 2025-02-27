// Combined code for arcade joystick value control and two independent LED games
// Pin definitions
const int LEFT_PIN = 4;      // Digital pin for left direction switch
const int RIGHT_PIN = 5;     // Digital pin for right direction switch
const int BUTTON_PIN_1 = 2;  // First game button
const int LED_PIN_1 = 13;    // First game LED
const int BUTTON_PIN_2 = 6;  // Second game button
const int LED_PIN_2 = 12;    // Second game LED

// Joystick value control variables
int currentValue = 50;      // Start in the middle (1-100)
int previousValue = 50;     // For tracking changes
unsigned long lastJoystickChangeTime = 0;  // For debouncing joystick
const int debounceDelay = 200;     // Milliseconds between value updates
const int fastModeThreshold = 1000; // Time in ms before entering "fast mode"
const int fastModeRate = 5;        // How much to increment/decrement in fast mode

// LED game 1 variables
int buttonState1 = 0;        // Variable to store button state
bool ledOn1 = false;         // Track if LED is currently on
unsigned long lastLedChangeTime1 = 0;  // Last time the LED state changed
unsigned long randomInterval1 = 0;     // Random interval for LED to turn on

// LED game 2 variables
int buttonState2 = 0;        // Variable to store button state
bool ledOn2 = false;         // Track if LED is currently on
unsigned long lastLedChangeTime2 = 0;  // Last time the LED state changed
unsigned long randomInterval2 = 0;     // Random interval for LED to turn on

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
  
  // Set up joystick switch pins with internal pull-up resistors
  pinMode(LEFT_PIN, INPUT_PULLUP);
  pinMode(RIGHT_PIN, INPUT_PULLUP);
  
  // Set up LED game 1 pins
  pinMode(LED_PIN_1, OUTPUT);
  pinMode(BUTTON_PIN_1, INPUT_PULLUP);
  
  // Set up LED game 2 pins
  pinMode(LED_PIN_2, OUTPUT);
  pinMode(BUTTON_PIN_2, INPUT_PULLUP);
  
  // Initialize random seed using an unconnected analog pin
  randomSeed(analogRead(0));
  
  // Generate first random interval for game 1 (3-10 seconds)
  randomInterval1 = random(3000, 10000);
  
  // Generate first random interval for game 2 (3-10 seconds)
  randomInterval2 = random(3000, 10000);
  
  Serial.println("Combined Arcade Joystick and Dual LED Game");
  Serial.println("Current joystick value: 50");
  Serial.println("Game 1 and Game 2 started - watch for LEDs to light up!");
}

void loop() {
  // Current time used by all systems
  unsigned long currentTime = millis();
  
  // Handle joystick logic
  handleJoystick(currentTime);
  
  // Handle LED game 1 logic
  handleLedGame(currentTime, BUTTON_PIN_1, LED_PIN_1, &buttonState1, &ledOn1, 
                &lastLedChangeTime1, &randomInterval1, 1);
  
  // Handle LED game 2 logic
  handleLedGame(currentTime, BUTTON_PIN_2, LED_PIN_2, &buttonState2, &ledOn2, 
                &lastLedChangeTime2, &randomInterval2, 2);
}

void handleJoystick(unsigned long currentTime) {
  // Read switch states (LOW when pressed because of pull-up resistors)
  bool leftPressed = (digitalRead(LEFT_PIN) == LOW);
  bool rightPressed = (digitalRead(RIGHT_PIN) == LOW);
  
  // Only process input after debounce delay has passed
  if (currentTime - lastJoystickChangeTime > debounceDelay) {
    int changeAmount = 1; // Default change amount
    
    // If a direction is held for a while, enter "fast mode" for quicker adjustments
    if (leftPressed || rightPressed) {
      if (currentTime - lastJoystickChangeTime > fastModeThreshold) {
        changeAmount = fastModeRate;
      }
    }
    
    // Adjust value based on joystick direction
    if (rightPressed) {
      // Increase value but don't exceed 100
      currentValue = min(100, currentValue + changeAmount);
      lastJoystickChangeTime = currentTime;  // Reset the timer
    }
    else if (leftPressed) {
      // Decrease value but don't go below 1
      currentValue = max(1, currentValue - changeAmount);
      lastJoystickChangeTime = currentTime;  // Reset the timer
    }
    
    // If the value has changed, print the new value
    if (currentValue != previousValue) {
      Serial.print("Current value: ");
      Serial.println(currentValue);
      previousValue = currentValue;
    }
  }
}

void handleLedGame(unsigned long currentTime, int buttonPin, int ledPin, 
                  int *buttonState, bool *ledOn, unsigned long *lastChangeTime, 
                  unsigned long *randomInterval, int gameNumber) {
  // Read the state of the button
  // When using INPUT_PULLUP, button press gives LOW reading
  *buttonState = digitalRead(buttonPin);
  
  // Check if LED is off and it's time to turn it on
  if (!*ledOn && (currentTime - *lastChangeTime > *randomInterval)) {
    digitalWrite(ledPin, HIGH);  // Turn on LED
    *ledOn = true;
    *lastChangeTime = currentTime;
    //Serial.print("Game ");
    //Serial.print(gameNumber);
    //Serial.println(" LED turned ON - press the button!");
  }
  
  // Check if button is pressed (LOW when using INPUT_PULLUP) and LED is on
  if (*buttonState == LOW && *ledOn) {
    digitalWrite(ledPin, LOW);   // Turn off LED
    *ledOn = false;
    *lastChangeTime = currentTime;
    
    // Generate new random interval for next light-up (3-10 seconds)
    *randomInterval = random(3000, 10000);
    //Serial.print("Game ");
    //Serial.print(gameNumber);
    //Serial.println(" - Good job! Waiting for next round...");
    
    // Small delay to debounce button press - using a fixed delay for simplicity
    // In a more complex program, we would handle this without blocking
    delay(50);
  }
}
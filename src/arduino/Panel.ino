// Define a struct to handle various inputs
struct Input {
    int pin;        // Pin number for the input
    bool isAnalog;  // True if analog input, false if digital
    int value;      // Current value read from the pin
    int lastValue;  // Previous value to detect state changes
};

// Define multiple inputs dynamically (digital and analog)
Input inputs[] = {
    {A0, true, 0, 0},  // Analog input (e.g., potentiometer)
    {8, false, 0, 0}   // Digital input (e.g., button)
};

const int numInputs = sizeof(inputs) / sizeof(inputs[0]);

void setup() {
    Serial.begin(9600);  // Initialize serial communication

    // Set pin modes dynamically
    for (int i = 0; i < numInputs; i++) {
        pinMode(inputs[i].pin, inputs[i].isAnalog ? INPUT : INPUT);
    }
}

void loop() {
    // Read values dynamically
    for (int i = 0; i < numInputs; i++) {
        inputs[i].value = inputs[i].isAnalog ? analogRead(inputs[i].pin) : digitalRead(inputs[i].pin);

        // Only print when state changes
        if (inputs[i].value != inputs[i].lastValue) {
            Serial.print("Pin ");
            Serial.print(inputs[i].pin);
            Serial.print(": ");
            
            if (inputs[i].isAnalog) {
                Serial.println(inputs[i].value);  // Print raw analog value
            } else {
                Serial.println(inputs[i].value == HIGH ? "Button Pressed" : "Button Released");
            }

            inputs[i].lastValue = inputs[i].value;  // Update last state
        }
    }

    delay(100);  // Small delay to reduce spam
}

# ![Ruin The Show](https://framerusercontent.com/images/VvMwG6Eu8ztUXPjxhWTwiP4.png?scale-down-to=1024)

Ruin the Show is an interactive exhibit that takes you behind the scenes of a game show as the producer, where you manage the lights and cameras to make the show run smoothly. Ruin the Show was also inspired by the 1950s Quiz Show Scandals, where producers would have certain contestants cheat in order to boost their ratings, so in Ruin the Show, you are also trying to cheat without getting caught - the more you successfully cheat, the higher your ratings go! 

[Visit our Website](https://ruintheshow.com)

## Meet the Team
Ruin the Show was created by a team of designers and developers from the Rochester Institute of Technology, partnering with the Strong Museum of Play as their Senior Capstones for New Media Design (BFA) and New Media Interactive Development (BS). 

| Designers                 | Developers    |
| --------                  | -------       |
| [Adi D.](https://www.linkedin.com/in/adi-das-01a200197/)         | [Blessing O.](https://www.linkedin.com/in/ugochinyereokogeri/)   |
| [Brandon R.](https://www.linkedin.com/in/brandon-riley-906794262/)    | [Kaiden T.](https://www.linkedin.com/in/kaiden-terrana/)     |
| [Cass K.](https://www.linkedin.com/in/casskress/)    | [Max C.](https://www.linkedin.com/in/maxwell-c-69714121b/)        |
| [Griffin P.](https://www.linkedin.com/in/griffin-paradee-7b0980218/)    |   |
| [Jaelin V.](https://www.linkedin.com/in/jaelin-vernon-926b17255/)     |   |
| [Lily K.](https://www.linkedin.com/in/lilykniseley25/)       |   |
| [Yohermry K.](https://www.linkedin.com/in/yohermrykpodo/)   |   |


## Implementation
Add images with links to the Instagram sources 

https://www.instagram.com/p/DI670IuO3ti/?img_index=1
https://www.instagram.com/p/DI6eAd7usoe/?img_index=1

## Technical Overview

The system uses a Finite State Machine with an Event-Driven architecture to handle hardware input and control rendering.

### Software Used: 

* Node.js
* P5.js
* Arduino 

### Navigating the Repo 

    src
    ├── arduino         # Everything hardware-related
    │   ├── Panel       # Arduino code
    │   └── panel.js    # Connects the arduino & server
    ├── client          # Front-End related code
    │   ├── assets      # Images, videos, audio, and lighting 
    │   ├── sketch.js   # Rendering code 
    │   └── ...              
    ├── server          # Server-side code
    │   ├── game.js     # Controls the program via state machine
    │   └── index.js    # Initializes node server, routes GET and POST requests to alter the state machine
    └── ...
    

### Running the project

1. Install node and npm, if not already installed
2. Clone the repo
3. Run `npm i`
4. Connect the Arduino to your computer, and update `src/arduino/panel.js line:20` to be the correct port. 

    1. Note: You may run the project in "development mode", which uses keyboard controls in place of the Arduino. See `src/client/sketch.js line:5` for the keyboard controls. 
5. For a full installation, ensure Resolume Arena is open to the file `src/client/assets/lighting/ImagineRITxRTS.avc`and lights are connected. 
6. Run `npm test`
7. Open `localhost:3000` in your web browser

    1. Click the HTML button that appears. It will hide itself and ensure videos and audio are allowed to play. 

## Hardware
<!-- -- Notes:  (delete later) -->

Tech, justifications for why we used the tech, problems encountered, what is going on in each section 

<!-- -- Full description below:  -->

We used Arduino for the physical components, and SerialPort to connect it to Node. When a button is pressed (or other feature interacted with), an event is emitted and processed in the server. 

### Overview

<!-- images below -->
![Tinkercad Diagram]()
![Podium in Context]()

The podium was built out of wood, and created with an Arduino Uno, 4 small LED buttons, 2 large arcade buttons, a custom lever (a potentiometer and a 3D printed handle), and a joystick. 

The joystick may be subsituted for another controller that exclusively moves horizontally. We used the joystick as it was readily available. 

The RFID scanner (and accompanying wristbands) were supplied by The Strong Museum of Play. 

Prototypes of the podium were built with cardboard, and while it was functional, would not have held up during the exhibition. The wood construction was extremely durable and held up well throughout the length of the exhibit and afterwards. The only issue we ran into was the height required smaller children to use a stepstool to effectively reach the buttons. 

### Panel.ino

This file processes input and output for the Arduino. It can be reached via `src/arduino/Panel/Panel.ino`.

`setup()` intializes all of the buttons and LEDs, turning off all LEDs to start. 

`loop()` reads the state of each interactable component, and sets a reference to the previous state. 

`processCommand(String command)` takes in a command, given from `src/arduino/panel.js`. It then parses what the command is, and turns on / off relevant LEDs, then prints an "acknowledged" response after it successfully executes the command. 

### Panel.js

<!-- (go into detail on what's in here) -->
This file communicates and handles events between the server and the podium. It can be reached via `src/arduino/panel.js`. 

## Server

As the backbone of this application, this part of the repository is responsible for the actual gameplay of Ruin the Show. There are two javascript files conatined here: 'game.js' and 'index.js'. The former processes how the game is run, and the latter communicates data between the server folder and client folder.

### Game.js

As an event driven architecture, the main components of 'game.js' can be listed as such:

1. Finite State Machine
2. Recognized Inputs from panel.js
3. MIDI OSC Outputs
4. RFID Event Handling

#### 1. Finite State Machine

The Finite State Machine (FSM) is the core backbone of this entire application, where all gameplay elements can stem from this aspect of code. Recognized as the class "GameMachine", the five main methods of understanding how the game runs involve getState(), step(), run(), stop(), and addEvent(). Before the game actually runs, there are some initialized variables and objects that can be considered as resetting the game too, the most imporant being the eventQueue. To recognize feedback, a second array called messages_for_frontend acts as another list of events that the frontend should follow.

The getState() method contains a few objects that were gathered for affecting frontend elements in 'sketch.js'. This includes score, the actual state of the game (Idle, Onboarding, etc.), host, cues, and feedback.

The step() method is the main processor of the FSM. It is a mass of if/else conditions that can be summed up as moving through different states of the game, recognizing specific Arduino inputs, and adjust specific values such as the score, position, and others. The biggest part of the game is the 'PLAYING' state where 'on' and 'off' states for the minigames are cycling through within that particular state, which is coordinating visual cues. It utilizes setTimeout()s, along with some events from the Arduino impacting the loop. The function, moveToPlaying(), is called when transitioning from the Onboarding state to Playing state, and is essentially resetting all known variables of the game itself.

The run() method is what starts the game machine up, specifically within the awake() function that is called from on `npm start`. When its called, the game will then immediately loop with various inputs from panel and changing variables from the inside altering the state of the game. 

The stop() method is responsible for immediately stopping the FSM loop, however this is ultimately never called.

The addEvent() method maintains coordination with the eventQueue array. Items, or in this case events and respective data, are added to the array. This will be sent through the step() method  with conditions in place throughout that impact various parts of the game.

#### 2. Recognized Functions from panel.js

Through importing the functions from 'panel.js', all inputs are recognized such as all 6 buttons, the joystick, and the potentiometer (lever). There is also the ability to turn LEDs on and off for each of the buttons from this file too.

#### 3. MIDI OSC Outputs

<!-- 3 on the list should be added here -->

#### 4. RFID Event Handling

<!-- 4 on the list should be added here -->

### Index.js

Through the utilization of Node.js, the project setup occurs at this specific file. A notable framework from Node.js in use is Express. The only get and post requests that are noteworthy are '/getState' and '/setState' respectively, leaving out the get request '/' which hosts index.html. 

As the main file for handling communication between files in this application, the main goal of index.js is to understand the current state of the game and send that information out to 'sketch.js'. This is the purpose of '/getState'.

As a backup plan on the occurence of something on Arduino side malfunctioning, keyboard shortcuts are mapped to specific componenets. This is done through '/setState', as all inputs are recognized in game.js instead of the frontend file 'sketch.js'.

## Client
Tech, justifications for why we used the tech, problems encountered, what is going on in each section 

Highlight the spritesheet class & anything else unique

## Known Bugs

1. List bugs here

## Acknowledgements 
NMDE, NMID, The Strong, Austin Willoughby, Marc, Jack Nalitt

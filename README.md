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

Featured on [RIT's Instagram](https://www.instagram.com/p/DI670IuO3ti/?img_index=1)

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

`processCommand(String command)` takes in a command, given from `panel.js`. It then parses what the command is, and turns on / off relevant LEDs, then prints an "acknowledged" response after it successfully executes the command. 

### Panel.js

This file executes and handles events between the server and the podium. It can be reached via `src/arduino/panel.js`. 

#### Events & Input Received 

In `serialSetup() ... serial.on('data', ...)`, different strings are received from `Panel.ino`. There are 3 different types of messages received: 

1. System Started ("Game Controller Intialized!")
2. Command From Server Acknowledged ("[...]ACK")
3. Component Interacted With ("CHEAT_PRESSED", "JOYSTICK_POSITION:", etc)

The first type of message starts the game, calling `game.awake()`. 

The second type is effectively ignored by the server. 

The third type of message sends commands to `game.js` depending on which message was received. Each message type has effectively the same implementation; sending an event to the server with any relevant information. 

#### Events & Output Given

This file also has public methods that control the state of the LEDs, that the server could access to turn on and off the LEDs as needed. 

#### Development Mode

During development, we created a flag to allow us to test the program without being connected to the Arduino. Errors will print to the console, but will not crash the program. 

## Server

As the backbone of this application, this part of the repository is responsible for the actual gameplay of Ruin the Show. The server is split into two files: `index.js` and `game.js`. 

### Index.js

<!-- edit line -->

Through the utilization of Node.js, the project setup occurs at this specific file. A notable framework from Node.js in use is Express. The only get and post requests that are noteworthy are '/getState' and '/setState' respectively, leaving out the get request '/' which hosts index.html. 

As the main file for handling communication between files in this application, the main goal of index.js is to understand the current state of the game and send that information out to 'sketch.js'. This is the purpose of '/getState'.

As a backup plan on the occurence of something on Arduino side malfunctioning, keyboard shortcuts are mapped to specific componenets. This is done through '/setState', as all inputs are recognized in game.js instead of the frontend file 'sketch.js'.


### Game.js

This file is the main source of all state related variables and events. It can be reached at `src/server/game.js`. There are four main components of `game.js`:

1. Finite State Machine
2. Event Firing & Handling
3. Resolume OSC Outputs
4. RFID Integration

#### 1. Finite State Machine

The Finite State Machine (FSM) is the driving force of the entire application. The FSM is contained in the `GameMachine` class. 

`GameMachine.getState()` returns an object with data about the current state of the game that the client would need. This includes the users' score, the current scene (Idle, Onboarding, Playing, End), details about the host, any event cues, and event feedback.

`GameMachine.step()` is the primary section of this class, containing nested conditionals that fire events and handle fired events as needed. The top level conditionals are checking for what scene is active, secondary level conditionals are designated for relevant interactions - for example, when the game is in Idle, the user can only have two interactions; RFID scan, and Applause button pressed. There are conditionals for each of those events, and all other events are ignored. 

`GameMachine.run()` begins the game loop if it hasn't already been started. It does this by calling the `loop` function (containing a call to `GameMachine.step()`) repeatedly using `setImmediate()`.

`GameMachine.stop()` immediately stops the game loop that is created in `GameMachine.run()`, however it is unutilized in the codebase. 

`GameMachine.addEvent()` adds events to our `eventQueue` queue. Each event is an object containing a name (an enum) and a data object (defaulting to an empty object). This event is parsed in `GameMachine.step()`, and when it is processed, the event is dequeued using the `Array.shift()` function. 

We chose to implement the FSM structure since our game has multiple states with large blocks of code to be executed. The FSM pattern was the simplest way we found to avoid unnecessary checks, and increase performance. 

#### 2. Event Firing & Handling

In addition to the FSM, we implemented an event-driven architecture for the project. There are two types of events; game events (stored in `eventQueue`) and animation events (stored in `messages_for_frontend`).

`eventQueue` is the primary list used within the state machine. There are 2 main categories of events that are added to this cue, with each category being its own enum; game state altering events (`events`) and feedback-based events (`feedback`). 

The `events` enum has all of the events that relate to the state of the game. There are input-based events (`events.CHEAT_BUTTON_PRESSED`, `events.LEVER_MOVED`, etc) that are added to the queue when the hardware has been interacted with (emitted in `src/arduino/panel.js`), controller events (`events.TURN_ON_APPLAUSE`, `events.TURN_OFF_PODIUM`, etc) that are added to the queue on timers specific to each mechanic. There are also state-related events (`events.RETURN_IDLE`, `events.GAME_OVER`, etc) that are added to the queue on timers to control what the state of the game is, and alter the FSM. 

The `feedback` enum contains events for each mechanic, and whether the feedback the user should receive was positive (points gained, example: `feedback.APPLAUSE_GOOD`) or negative (points lost, example: `feedback.APPLAUSE_BAD`). These events are fired alongside the points changing, and primarily serve to trigger animation events.  

`messages_for_frontend` is a list that gets sent to the client in `src/server/index.js` through the `/getState` endpoint. Each message is an object that contains a `target` and a `name`: the `target` is which visual element is being animated (the host Al, the audience, etc), and the `name` is which animation should occur (idle, walkRight, walkLeft, etc). These messages are then parsed by the client, altering the target to run the named animation. 

We chose to use an event-driven architecture due to the nature of our interactions. We needed something that could communicate with many parties (server, client, hardware) when something happens, and events are able to do that most effectively. We also wanted to make sure the structure we chose allowed for multiple simultaneous interactions, as users could hit multiple buttons at the same time, since the gameplay encourages it. Putting our events in a queue like this meant they would each be processed in the order they occurred in. 

#### 3. Lighting OSC Outputs

<!-- 3 on the list should be added here -->

#### 4. RFID Integration

<!-- 4 on the list should be added here -->


## Client
Tech, justifications for why we used the tech, problems encountered, what is going on in each section 

Highlight the spritesheet class & anything else unique

## Known Bugs

1. List bugs here

## Acknowledgements 
NMDE, NMID, The Strong, Austin Willoughby, Marc, Jack Nalitt

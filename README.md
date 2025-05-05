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

### Physical Construction

<!-- images below -->
![Tinkercad Diagram]()
![Podium in Context]()

The podium was built out of wood, and created with an Arduino Uno, 4 small LED buttons, 2 large arcade buttons, a custom lever (a potentiometer and a 3D printed handle), and a joystick. 

The joystick may be substituted for another controller that exclusively moves horizontally. We used the joystick as it was readily available. 

The RFID scanner (and accompanying wristbands) were supplied by The Strong Museum of Play. 

Prototypes of the podium were built with cardboard, and while it was functional, would not have held up during the exhibition. The wood construction was extremely durable and held up well throughout the length of the exhibit and afterwards. The only issue we ran into was the height required smaller children to use a stepstool to effectively reach the buttons. 

### Panel.ino

This file processes input and output for the Arduino. It can be reached via `src/arduino/Panel/Panel.ino`.

`setup()` initializes all of the buttons and LEDs, turning off all LEDs to start. 

`loop()` reads the state of each interactable component, and sets a reference to the previous state. 

`processCommand(String command)` takes in a command, given from `panel.js`. It then parses what the command is, and turns on / off relevant LEDs, then prints an "acknowledged" response after it successfully executes the command. 

### Panel.js

This file executes and handles events between the server and the podium. It can be reached via `src/arduino/panel.js`. 

#### Events & Input Received 

In `serialSetup() ... serial.on('data', ...)`, different strings are received from `Panel.ino`. There are 3 different types of messages received: 

1. System Started ("Game Controller Initialized!")
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

This file sets up the express application, starts the node server, and handles GET and POST requests. It largely serves with the GET and POST requests as the connection between the back end and the front end, so understanding relevant information about the state of the application, and communicating this information. It can be reached at `src/server/index.js`. 

#### Setting up Express & Starting the Server

We are using Express for this project due to its ease and familiarity. It is used in this project to serve our assets and scripts to the client, and for routing. 

`app.listen(PORT, ...)` starts up the server at localhost at port 3000 (`localhost:3000`). From there, the application can be loaded and all functionality can occur. 

#### GET Requests 

`app.get('/', ...)` serves the client our `index.html` file, containing tags for p5.js and our client-side scripts. 

`app.get('/getState', ...)` communicates between the server and the client the current state of the game. It contains two parts: variables tied to the state of the game (`state`) and animation events that need to be triggered (`messages`). `state` pulls data from the `GameMachine.getState()` method in `src/server/game.js`, sending it to the client to update as needed. `messages` takes the `GameMachine.messages_for_frontend` array, sending that to the client, then clearing the array, assuming that the client handles any and all events it receives. More information on what both of these are and contain can be found below.  

#### POST Requests

We have a single POST request, and it is not particularly necessary for the application to function, but moreso a feature of the "Development Mode". This allows for testing and gameplay to occur with keyboard controls in place of or in addition to Arduino controls. We implemented this mode as a failsafe in the event of the hardware malfunctioning during the length of our exhibition, and for developers to test remotely, without access to the hardware.

`app.post('/setState', ...)` was created so that the game state variables could be altered and updated from the client on a keypress, in addition to from the server on an Arduino button press. The POST request is written to expect two values in the body: `event` and `data`. `event` is a string that corresponds to an event name in the server (`'applause-button-pressed'`, `'rfid-scan'`, etc), particularly looking for an input-based event. If the string is not one of those events, or if the event is not a string at all, it returns early with a 400 status code. Otherwise, it adds the event to the queue of events, alongside any `data` that is sent along with it. `data` defaults to an empty object, and contains any relevant data for a given event (podium number, lever position, etc). More information about the event-driven architecture can be found below. 

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

`eventQueue` is the primary list used within the state machine. There are 2 main categories of events that are added to this queue, with each category being its own enum; game state altering events (`events`) and feedback-based events (`feedback`). 

The `events` enum has all of the events that relate to the state of the game. There are input-based events (`events.CHEAT_BUTTON_PRESSED`, `events.LEVER_MOVED`, etc) that are added to the queue when the hardware has been interacted with (emitted in `src/arduino/panel.js`), controller events (`events.TURN_ON_APPLAUSE`, `events.TURN_OFF_PODIUM`, etc) that are added to the queue on timers specific to each mechanic. There are also state-related events (`events.RETURN_IDLE`, `events.GAME_OVER`, etc) that are added to the queue on timers to control what the state of the game is, and alter the FSM. 

The `feedback` enum contains events for each mechanic, and whether the feedback the user should receive was positive (points gained, example: `feedback.APPLAUSE_GOOD`) or negative (points lost, example: `feedback.APPLAUSE_BAD`). These events are fired alongside the points changing, and primarily serve to trigger animation events.  

`messages_for_frontend` is a list that gets sent to the client in `src/server/index.js` through the `/getState` endpoint. Each message is an object that contains a `target` and a `name`: the `target` is which visual element is being animated (the host Al, the audience, etc), and the `name` is which animation should occur (idle, walkRight, walkLeft, etc). These messages are then parsed by the client, altering the target to run the named animation. 

We chose to use an event-driven architecture due to the nature of our interactions. We needed something that could communicate with many parties (server, client, hardware) when something happens, and events are able to do that most effectively. We also wanted to make sure the structure we chose allowed for multiple simultaneous interactions, as users could hit multiple buttons at the same time, since the gameplay encourages it. Putting our events in a queue like this meant they would each be processed in the order they occurred in. 

#### 3. Lighting OSC Outputs

The installation includes environmental lighting, which is also controlled through this section of the code. The lighting patterns are done through Resolume Arena, and the server sends OSC commands to the software on each cue. Within the Resolume file (`src/client/Assets/Lighting/ImagineRITxRTS.avc`), each lighting preset is organized by column, and named appropriately. 

The OSC client is initialized near the top of the file, using the Resolume default port of 7000. For the purposes of our installation, we have the connection running through the localhost address, thus Resolume would have to be open on the same computer in order for this to function properly. 

The commands are sent to Resolume via `GameMachine.sendOscCue(cueType)`. This method takes in which cue is being sent (of type `GameMachine.lighting`) and via switch statement dictates which lighting preset should be triggered. It then uses that to send the OSC command, triggering the specified column. If there was an invalid preset, or a new one that hadn't been accounted for through this function, it would return early, printing the invalid cue. 

We chose to use Resolume via OSC since we had worked with the software and method previously, and chose to implement each preset as a column due to its ease and adaptability. By sending whole columns, we could link multiple different outputs all with the same call, allowing us to have sound effects and different lighting all triggered at once. 

#### 4. RFID Integration

The last part of the server is integrating the RFID provided by The Strong Museum of Play. They requested we utilize their technology present in their LevelUp videogame exhibit into our exhibit design, so we incorporate the scanner into the podium, and had wristbands for guests that they could use to interact with the game. 

Guests with an RFID wristband could scan their wristband to start the game. At scale, this would store the user's ID, and would add their final score to their cumulative score for the whole Beyond the Buzzer exhibit. They could also, if they did not receive a wristband, begin the game by pressing a button on the podium (the applause button). 

Additionally, for repeat visitors, they could tap their RFID band to skip the onboarding video. At scale this could be worked to use their user ID as well, checking if they have already played within the past hour before letting them skip the onboarding video, to avoid visitors accidentally skipping the video.

When users scan their RFID bands, the events are sent as an SSE event. In `awake()`, we create an event listener for the `tap` event, which adds the `GameMachine.events.RFID_SCAN` event to the `eventQueue`, and allows for the interactions stated. 

We also implemented custom lighting for the RFID scanner. We created several presets for the scanner in `RTSrfidPresets`, and trigger each one dependent on the state of the game. The presets are changed when cued, primarily on game-state changes. If there is an error in changing the lights, for example if the network is down momentarily, it waits for 2 seconds before trying to send the lighting change again. 

## Client

The client is broken up into x parts: 

1. p5.js rendering 
2. Assets
3. Static files

Each of these are things that are displayed to visitors visually in some regard, and are hosted and changed in the browser. 

### Sketch.js (p5.js Rendering)

<!-- add overview -->

#### State-affected Variables

There are a number of variables that are tied to the state of the game - a full list can be found within the `RTSstate` object. Each of these affect a different aspect of what is being rendered. 

In `syncStateLoop()` we are polling the server every 50ms at the `/getState` endpoint, copying the old values to a `previousState` variable, then populating the state object with the new values. Additionally, if there are any animation cues that were sent, those would also be handled accordingly. 

#### Front-end Rendering Variables

Not every variable that affects the front-end are affected by the server state. 

For example, the game timer that is displayed is independent from the internal timer (as that is a `setTimeout` rather than a variable). The timer presented to the visitor utilizes the `millis()` function, calculating the difference between the current time and the time the game began in `getTimeRemaining()`. This is then parsed into minute:second format, and displayed to the user in the UI in `drawCountdown()`. 

<!-- talk about zoom and others -->

#### Static Assets

We generally organized our static assets by what scene they are for, and included relevant variables within the object, giving us 3 different objects related to static assets: `idleOnboarding`, combining the idle and onboarding scenes, `assets` holding the main game assets, and `end` holding the game over assets. Some assets in these objects are animated assets, and the animated assets are differentiated by being initialized with an object instead of an empty string. 

All of our assets are loaded in `window.preload`, regardless of type. With more time we may have looked into lazy loading of game and end state assets, as loading every asset on reload results in the page having slow load speed, however for the purposes of our installation, we only needed to load the page once at the start of the exhibition, and let it loop over the course of the day, so it was a nonissue. 

We are also loading our background audio through the same manner, storing the paths and ideal volume for each track in the `audio` object. Sound effects are given alongside lighting cues through Resolume Arena (more on that above). 

#### Simple Animations 

<!-- should tint green for example -->

#### Character Animations 

Our more complex character animations are all handled through spritesheets. We created a `SpriteAnimator` class to manage each animated object. 

The `SpriteAnimator` class takes in the relevant animations (idle, walkLeft, etc) for a given animated object, and what the default animation should be (which defaults to idle unless otherwise specified). 

The function `SpriteAnimator.setAnimation` will change what spritesheet is currently being looped through on an object, and has optional parameters for if it should not loop, and if it shouldn't, what happens when it reaches the end of the spritesheet. The animation can be played and paused with `SpriteAnimator.play()` and `SpriteAnimator.stop()` respectively. 

Each relevant frame, `SpriteAnimator.update()` and `SpriteAnimator.draw()` are called. `update()` changes which frame of the spritesheet is being displayed. If the animation is loopable, it will wrap the animation back to the beginning of the spritesheet, otherwise it will stop the animation and if there is an `onComplete` callback function, will execute that. `draw()` will draw whatever `update()` designates at the appropriate position and size. There are two ways that size can be passed into this function: 

1. Scale

The scale parameter evenly scales the width and height. This is generally the most used parameter, as it prevents image distortion, and is applicable in most cases. 

2. Specified width & height

This is generally used in animations that take up the whole screen, or where the exact width and height matters to the animation. If each of these variables are passed in, they overwrite the scaled parameter. If only the width or only the height are sent in, the other size with default to sprite size multiplied by the scale. 

Each animated object is initialized in `window.preload`. The structure is as follows: 
        
    animatedObject      # Example: host
    ├── animation       # Example: 'idle'
    │   ├── file        # Name of the spritesheet. Example 'AL_idle'
    │   ├── config      # Object detailing which configuration was used in exporting
    |   ├── frames      # Array with details about each frame (x, y, w, h) in relation to the overall spritesheet
    │   ├── image       # Set in preload, the actual spritesheet
    |   └── animator    # Set in preload, SpriteAnimator object 
    ├── animation         
    │   └── ...              
    └── ...

The `config` property is an object that contains the total columns, rows, width, and height of the spritesheet. We organized with the designers a system through which all spritesheets would be created, and the `config` property details which of the 3 types were used for the given spritesheet. 

The `frames` property is populated via `populateFrames()`, which takes in the `config` property and which array to update. It then loops through each frame of the animation, populating the array with x, y, width, and height properties of each frame in relation to the complete spritesheet. 



#### Graphics Buffer Layers 

<!-- game vs hud -->

#### Keyboard Controls

The keyboard controls present are designated for "Development Mode", with a flag to enable or disable them. They are enabled by default, but can be disabled to avoid accidental interference while the full installation is active. 

The keyboard controls are meant to mimic the physical Arduino controls, with the exception of the lever. The lever keypress maps to either fully up or fully down, thus a successful completion of the interaction. The keyboard interactions use the same data flow as the physical interactions aside from how they get to the server; the physical buttons emit an event that gets handled in the server, the keyboard creates a POST request that gets handled in the server. 

The current state of the keyboard controls are: 

| Applause | Cheat | Joystick Left | Joystick Right | Lever Up | Lever Down | Podium 1-4 | RFID Scan |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| `q` | `e` | `a` | `d` | `w` | `s` | `1, 2, 3, 4` | `[SPACEBAR]` |

These are parsed in `window.keyPressed` through a switch statement, using the controls dictionary to dictate what data is sent via POST request to the server. More information about the POST request can be found above. 

<!-- running edit -->

Tech, justifications for why we used the tech, problems encountered, what is going on in each section 

Highlight the spritesheet class & anything else unique

## Known Bugs

1. Long initial load time
2. Joystick doesn't hide on no interaction 
3. Cheat & applause intro animation sometimes skips
4. Zoom stacks
5. In game stars do not correlate to End stars

<!-- reword and remember more ? -->

## Acknowledgements 
NMDE, NMID, The Strong, Austin Willoughby, Marc, Jack Nalitt

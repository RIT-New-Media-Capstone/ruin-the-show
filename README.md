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
Tech, justifications for why we used the tech, problems encountered, what is going on in each section 

Highlight and break down the state machine 

In this section include how information is transferring from server to client 

## Client
Tech, justifications for why we used the tech, problems encountered, what is going on in each section 

Highlight the spritesheet class & anything else unique

## Known Bugs

1. List bugs here

## Acknowledgements 
NMDE, NMID, The Strong, Austin Willoughby, Marc, Jack Nalitt

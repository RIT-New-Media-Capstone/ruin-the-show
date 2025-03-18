// Event manager & boilerplate for hooking up ardiuno 

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';


import * as game from '../server/game.js';

import {
    hideCheat,
    hideApplause,
  } from "../client/utils.js"

let port;

const serialSetup = () => {
    port = new SerialPort({ path: 'COM6', baudRate: 9600 });
    const serial = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
        console.log('Serial port opened.');
    });

    port.on('error', (err) => {
        console.log('Error: ', err.message);
    });

    serial.on('data', (data) => {
        data = data.trim()

        // Get which input
        // logic to change based on how we send serial data 
        if(data == "BUTTON2_PRESSED") cheatButtonPressed();
        else if (data == "BUTTON1_PRESSED") applauseButtonPressed();
        else if (data == "JOYSTICK_LEFT") lightsMoved(-1);
        else if (data == "JOYSTICK_RIGHT") lightsMoved(1);
        else if (data.substring(0, 15) == "LEVER_POSITION:") leverRotated(data.substring(15))
    })

}


const cheatIncrement = 5;
const otherIncrement = 1;

const cheatButtonPressed = () => { 
    game.updateRatings(cheatIncrement) 
    hideCheat()
}

//hides applause after pressed
const applauseButtonPressed = () => { 
    game.updateRatings(otherIncrement) 
    hideApplause()
}

const lightsMoved = (direction) => {
    game.changeLights(direction)
    game.updateRatings(otherIncrement)
}

const leverRotated = (newPosition) => {
    let pos = Number(newPosition)
    game.updateVolume(pos)
    game.updateRatings(otherIncrement)
}

oscClient.open();
serialSetup();

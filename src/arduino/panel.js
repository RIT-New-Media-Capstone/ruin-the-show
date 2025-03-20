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
    port = new SerialPort({ path: 'COM5', baudRate: 9600 });
    const serial = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
        console.log('Serial port opened.');
    });

    port.on('error', (err) => {
        console.log('Error: ', err.message);
    });

    serial.on('data', (data) => {
        data = data.trim()

        if(data.startsWith("System")) game.rfidScan()


        // Get which input
        // logic to change based on how we send serial data 
        if (data == "BUTTON2_PRESSED") cheatButtonPressed();
        else if (data == "BUTTON1_PRESSED") applauseButtonPressed();
        else if (data == "JOYSTICK_LEFT") lightsMoved(-1);
        else if (data == "JOYSTICK_RIGHT") lightsMoved(1);
        else if (data.startsWith("LEVER_POSITION:")) leverRotated(data.substring(15))
        else console.log(data)
    })

}


const cheatIncrement = 5;
const otherIncrement = 1;

const cheatButtonPressed = () => {
    console.log("cheat")
    game.updateRatings(cheatIncrement)
    hideCheat()
}

//hides applause after pressed
const applauseButtonPressed = () => {
    console.log("applause")
    game.updateRatings(otherIncrement)
    hideApplause()
}

const lightsMoved = (direction) => {
    game.changeLights(direction * 40)
    game.updateRatings(otherIncrement)
}

const leverRotated = (newPosition) => {
    let pos = Number(newPosition)
    game.updateVolume(pos)
    game.updateRatings(otherIncrement)
}

const turnOnCheatLED = () => {
    if (port && port.isOpen) {
        port.write('LED2_ON\r\n', (err) => {
            if (err) {
                console.error('Error sending data:', err);
            } else {
                console.log('Sent "LED2_ON" to Arduino');
            }
        });
    } else {
        console.error('Serial port not open. Cannot send LED2_ON');
    }
}

const turnOnApplauseLED = () => {
    if (port && port.isOpen) {
        port.write('LED1_ON\r\n', (err) => {
            if (err) {
                console.error('Error sending data:', err);
            } else {
                console.log('Sent "LED1_ON" to Arduino');
            }
        });
    } else {
        console.error('Serial port not open. Cannot send LED1_ON');
    }
}

export { turnOnCheatLED, turnOnApplauseLED }

serialSetup();

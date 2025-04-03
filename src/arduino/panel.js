// Event manager & boilerplate for hooking up ardiuno 

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

import * as game from '../server/game.js';

import {
    hideCheat,
    hideApplause,
} from "../client/utils.js"

let port;

// find a better way to do this
const devPorts = {
    max: '/dev/tty.usbserial-DA017SAV', 
    kaiden: 'COM5',
}

const serialSetup = () => {
    // Change based on which dev is running the program 
    const portPath = devPorts.max

    port = new SerialPort({ path: portPath, baudRate: 9600 });
    const serial = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => {
        console.log(`Serial port opened at ${portPath}.`);
    });

    port.on('error', (err) => {
        console.log('Error: ', err.message);
        console.log("Running in developer mode")
        game.rfidScan()
    });

    serial.on('data', (data) => {
        data = data.trim()

        if (data.startsWith("Game Controller")) game.rfidScan()


        // Get which input
        // logic to change based on how we send serial data 
        if (data == "CHEAT_PRESSED") cheatButtonPressed();
        else if (data == "APPLAUSE_PRESSED") applauseButtonPressed();
        else if (data == "PODIUM_1_PRESSED") podiumButtonPressed(1);
        else if (data == "PODIUM_2_PRESSED") podiumButtonPressed(2);
        else if (data == "PODIUM_3_PRESSED") podiumButtonPressed(3);
        else if (data == "PODIUM_4_PRESSED") podiumButtonPressed(4);
        else if (data == "JOYSTICK_LEFT") lightsMoved(-1);
        else if (data == "JOYSTICK_RIGHT") lightsMoved(1);
        else if (data.startsWith("LEVER_VALUE:")) leverRotated(data.substring(15))
        else if (data.lastIndexOf("ACK") === -1) console.log(data) // if it isn't ack 
    })

}

const cheatIncrement = 5;
const otherIncrement = 1;

const cheatButtonPressed = () => {
    console.log("cheat")
    let prompted = game.getCheatState()
    if(prompted) game.updateRatings(cheatIncrement)
    else game.updateRatings(-cheatIncrement)

    hideCheat()
}

//hides applause after pressed
const applauseButtonPressed = () => {
    console.log("applause")
    game.updateRatings(otherIncrement)
    hideApplause()
}

//function for all 4 small podium buttons
const podiumButtonPressed = (podiumNum) => {
    console.log("Podium " + podiumNum + " pressed")
}
 
const lightsMoved = (direction) => {
    console.log("Light direction: " + direction)
    game.changeLights(direction * 40)
    game.updateRatings(otherIncrement)
}

const leverRotated = (newPosition) => {
    console.log("Lever position: " + Number(newPosition))
    let pos = Number(newPosition)
    let oldPos = game.getZoom()

    // Tolerance - if sent again, don't count it again, +/- 1
    if(pos === oldPos || pos + 1 === oldPos || pos - 1 === oldPos) return 

    game.updateZoom(pos)
    game.updateRatings(otherIncrement)
}

const turnOnPodiumLED = (podiumNum) => {
    if (port && port.isOpen) {
        port.write('PODIUM_'+podiumNum+'_LED_ON\r\n', (err) => {
            if (err) {
                console.log('Error sending data:', err);
            } else {
                console.log('Sent "PODIUM_'+podiumNum+'_LED_ON" to Arduino');
            }
        });
    } else {
        console.log('Serial port not open. Cannot send PODIUM'+podiumNum+'LED_ON" to Arduino');
    }
}

const turnOffPodiumLED = (podiumNum) => {
    if (port && port.isOpen) {
        port.write('PODIUM_'+podiumNum+'_LED_OFF\r\n', (err) => {
            if (err) {
                console.log('Error sending data:', err);
            } else {
                console.log('Sent "PODIUM_'+podiumNum+'_LED_OFF" to Arduino');
            }
        });
    } else {
        console.log('Serial port not open. Cannot send PODIUM_'+podiumNum+'LED_OFF" to Arduino');
    }
}

const turnOnCheatLED = () => {
    if (port && port.isOpen) {
        port.write('CHEAT_LED_ON\r\n', (err) => {
            if (err) {
                console.error('Error sending data:', err);
            } else {
                console.log('Sent "CHEAT_LED_ON" to Arduino');
            }
        });
    } else {
        console.error('Serial port not open. Cannot send CHEAT_LED_ON');
    }
}

const turnOffCheatLED = () => {
    if (port && port.isOpen) {
        port.write('CHEAT_LED_OFF\r\n', (err) => {
            if (err) {
                console.error('Error sending data:', err);
            } else {
                console.log('Sent "CHEAT_LED_OFF" to Arduino');
            }
        });
    } else {
        console.error('Serial port not open. Cannot send CHEAT_LED_OFF');
    }
}

const turnOnApplauseLED = () => {
    if (port && port.isOpen) {
        port.write('APPLAUSE_LED_ON\r\n', (err) => {
            if (err) {
                console.error('Error sending data:', err);
            } else {
                console.log('Sent "APPLAUSE_LED_ON" to Arduino');
            }
        });
    } else {
        console.error('Serial port not open. Cannot send APPLAUSE_LED_ON');
    }
}

const turnOffApplauseLED = () => {
    if (port && port.isOpen) {
        port.write('APPLAUSE_LED_OFF\r\n', (err) => {
            if (err) {
                console.error('Error sending data:', err);
            } else {
                console.log('Sent "APPLAUSE_LED_OFF" to Arduino');
            }
        });
    } else {
        console.error('Serial port not open. Cannot send APPLAUSE_LED_OFF');
    }
}

export { turnOnCheatLED, turnOnApplauseLED, turnOffCheatLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED, }

serialSetup();

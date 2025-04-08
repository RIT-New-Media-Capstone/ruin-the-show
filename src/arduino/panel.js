// Event manager & boilerplate for hooking up ardiuno 

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { EventEmitter } from 'events';
import * as game from '../server/game.js';

const eventBus = new EventEmitter();
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
    });

    serial.on('data', (data) => {
        data = data.trim()

        if (data.startsWith("Game Controller")) game.start();

        // Get which input
        if (data == "CHEAT_PRESSED") cheatButtonPressed();
        else if (data == "APPLAUSE_PRESSED") applauseButtonPressed();
        else if (data == "PODIUM_1_PRESSED") podiumButtonPressed(1);
        else if (data == "PODIUM_2_PRESSED") podiumButtonPressed(2);
        else if (data == "PODIUM_3_PRESSED") podiumButtonPressed(3);
        else if (data == "PODIUM_4_PRESSED") podiumButtonPressed(4);
        else if (data == "JOYSTICK_LEFT") joystickMoved(-1);
        else if (data == "JOYSTICK_RIGHT") joystickMoved(1);
        else if (data.startsWith("LEVER_VALUE:")) leverRotated(data.substring(15))
        else if (data.lastIndexOf("ACK") === -1) console.log(data) // if it isn't ack 
    });
}

//THESE FUNCTIONS ARE WHEN THE USER PRESSES THE BUTTON
const cheatButtonPressed = () => {
    eventBus.emit('cheatPressed');
}
const applauseButtonPressed = () => {
    eventBus.emit('applausePressed');
}
const podiumButtonPressed = (podiumNum) => {
    eventBus.emit('podiumPressed', podiumNum);
}
const joystickMoved = (direction) => {
    eventBus.emit('joystickMoved', direction);
}
const leverRotated = (value) => {
    eventBus.emit('leverMoved', Number(value));
}

//General Function for controlling all button LEDs
const sendLEDCommand = (component, state, extra = '') => {
    if (port && port.isOpen) {
        const cmd = `${component.toUpperCase()}${extra}_LED_${state.toUpperCase()}\r\n`;
        port.write(cmd, (err) => {
            if (err) {
                console.error('Error sending LED command:', err);
            } else {
                console.log(`Sent "${cmd.trim()}" to Arduino`);
            }
        });
    } else {
        console.error(`Serial port not open. Cannot send ${component}_LED_${state}`);
    }
};

//TURNING ON/OFF LEDS FOR BUTTONS (CHEAT, APPLAUSE, PODIUMS 1-4)
const turnOnCheatLED = () => sendLEDCommand('cheat', 'on');
const turnOffCheatLED = () => sendLEDCommand('cheat', 'off');

const turnOnApplauseLED = () => sendLEDCommand('applause', 'on');
const turnOffApplauseLED = () => sendLEDCommand('applause', 'off');

const turnOnPodiumLED = (podiumNum) => sendLEDCommand('podium', 'on', `_${podiumNum}`);
const turnOffPodiumLED = (podiumNum) => sendLEDCommand('podium', 'off', `_${podiumNum}`);

export { turnOnCheatLED, turnOnApplauseLED, turnOffCheatLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED }
export default eventBus;
serialSetup();
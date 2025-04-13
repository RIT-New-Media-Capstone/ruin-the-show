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
        game.awake();
    });

    serial.on('data', (data) => {
        data = data.trim()

        if (data.startsWith("Game Controller")) game.awake();

        // Get which input
        if (data == "CHEAT_PRESSED") cheatButtonPressed();
        else if (data == "APPLAUSE_PRESSED") applauseButtonPressed();
        else if (data == "PODIUM_1_PRESSED") podiumButtonPressed(1);
        else if (data == "PODIUM_2_PRESSED") podiumButtonPressed(2);
        else if (data == "PODIUM_3_PRESSED") podiumButtonPressed(3);
        else if (data == "PODIUM_4_PRESSED") podiumButtonPressed(4);
        else if (data.startsWith("JOYSTICK_POSITION:")) joystickMoved(data);
        else if (data.startsWith("LEVER_VALUE:")) leverRotated(data)
        else if (data.lastIndexOf("ACK") === -1) console.log(data) // if it isn't ack 
    });

    process.on('SIGINT', () => {
        console.log('\nGracefully shutting down...');
        // Check if port is open before sending LED off commands
        if (port && port.isOpen) {
            turnOffCheatLED();
            turnOffApplauseLED();
            for (let i = 1; i <= 4; i++) {
                turnOffPodiumLED(i);
            }
            // Attempt to close the port after turning off LEDs
            setTimeout(() => {
                if (port && port.isOpen) {
                    port.close((err) => {
                        if (err) {
                            console.error('Error closing port:', err);
                        } else {
                            console.log('Serial port closed.');
                        }
                        process.exit();
                    });
                } else {
                    console.log('Serial port already closed.');
                    process.exit();
                }
            }, 200); // Delay to ensure LEDs are turned off first
        } else {
            console.log('Serial port not open, skipping LED turn off.');
            process.exit();
        }
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
    eventBus.emit('joystickMoved', parseInt(direction.split(':')[1], 10));
}
const leverRotated = (value) => {
    eventBus.emit('leverMoved', parseInt(value.split(':')[1], 10));
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
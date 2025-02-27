// Event manager & boilerplate for hooking up ardiuno 

const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')

const game = require("../server/game.js")

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
        if(data == "cheat") cheatButtonPressed();
        else if (data == "applause") applauseButtonPressed();
        else if (data == "lights") lightsMoved(-1)
    })

}

const cheatScoreIncrement = 5;
const otherScoreIncrement = 1

const cheatButtonPressed = () => { 
    game.updateScore(cheatScoreIncrement) 
}

const applauseButtonPressed = () => { 
    game.updateScore(otherScoreIncrement) 
}

const lightsMoved = (direction) => {
    game.changeLights(direction)
    game.updateScore(otherScoreIncrement)
}


oscClient.open();
serialSetup();

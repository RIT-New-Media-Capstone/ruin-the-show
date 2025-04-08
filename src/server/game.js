import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

const machine = new GameMachine('IDLE');

// Gets all 5 Inputs from Panel.js
panel.on('cheatPressed', () => {
    console.log("Game logic: handling cheat press");
    machine.addEvent('cheat-button-pressed', {})
});
panel.on('applausePressed', () => {
    console.log("Game logic: handling applause press");
    turnOffApplauseLED();
});
panel.on('podiumPressed', (num) => {
    console.log(`Game logic: handling podium ${num} press`);
    turnOffPodiumLED(num);
});
panel.on('joystickMoved', (dir) => {
    console.log(`Game logic: joystick moved ${dir}`);
});
panel.on('leverMoved', (value) => {
    console.log(`Game logic: lever at position ${value}`);
});

//On Start Up, Light Up All LEDs Now (TEST)
const awake = () => {
    turnOnCheatLED();
    turnOnApplauseLED();
    turnOnPodiumLED(1);
    turnOnPodiumLED(2);
    turnOnPodiumLED(3);
    turnOnPodiumLED(4);
    runExample();
};
// OUTER LOOP / GAME MACHINE (Idle, Onboard, Playing)
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null

    constructor(initialState) {
        this.state = initialState;
    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        
        if (!event) return;

        console.log(`Processing event: ${event.name} in state: ${this.state}`);

        if (this.state === 'IDLE') {
            if (event.name === 'cheat-button-pressed') {
                // do nothing
                return;
            }
            if (event.name === 'rfid-scan') {
                // switch to onboarding
                this.state = 'ONBOARDING';
                console.log(`State transition: IDLE -> ONBOARDING`);
                // set 60 second timer
                setTimeout(() => {
                    this.addEvent.push('onboarding-complete', {});
                }, 60 * 1000);
            }
        } else if (this.state === 'ONBOARDING') {
            if (event.name === 'onboarding-complete') {
                this.state = 'PLAYING';
                console.log(`State transition: ONBOARDING -> PLAYING`);
                // Start the game timer
                setTimeout(() => {
                    this.addEvent('game-over', {});
                }, 60 * 1000);
            }
            if (event.name === 'cheat-button-pressed') {
                this.state = 'PLAYING';
                console.log(`State transition: ONBOARDING -> PLAYING`);
                // Start the game timer
                setTimeout(() => { 
                    this.addEvent('game-over', {});
                }, 60 * 1000);
            }
        } else if (this.state === 'PLAYING') {
            if (event.name === 'game-over') {
                this.state = 'IDLE';
                console.log(`State transition: PLAYING -> IDLE`);
            }
            if (event.name === 'button-pushed-red') {
                this.state = 'IDLE';
                console.log(`State transition: PLAYING -> IDLE (canceled by user)`);
            }
        }
    }

    run() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        const loop = () => {
            this.step();
            
            if (this.isRunning) {
                this.loopHandle = setImmediate(loop);
            }
        };
        
        this.loopHandle = setImmediate(loop);
        console.log('State machine started');
    }

    stop() {
        // stop the infinite loop started by run()
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.loopHandle) {
            clearImmediate(this.loopHandle);
            this.loopHandle = null;
        }
        
        console.log('State machine stopped');
    }
    
    // Helper method to add events to the queue
    addEvent(eventName, eventData = {}) {
        this.eventQueue.push({
            name: eventName,
            data: eventData
        });
        console.log(`Event added: ${eventName}`);
    }
}

// Example usage
const runExample = () => {
    // Create a new game machine in IDLE state
    
    // Start the state machine
    machine.run();
    
    console.log('Current state:', machine.state);
    
    // Simulate an RFID scan after 2 seconds
    setTimeout(() => {
        machine.addEvent('rfid-scan');
    }, 2000);
    
    // Simulate the game ending early after 30 seconds (user presses red button)
    setTimeout(() => {
        machine.addEvent('button-pushed-red');
    }, 30000);
    
    // Stop the state machine after 1 minute
    setTimeout(() => {
        machine.stop();
        console.log('Example complete. Final state:', machine.state);
    }, 60000);
};

const switchPage = (page) => {
    if (page == 'idle') {
        console.log(page);
    } else if (page == 'onboarding') {
        console.log(page);
    } else if (page == 'sketch') {
        console.log(page);
    }
};

// INNER LOOP / ACTUAL GAMEPLAY


export { awake }
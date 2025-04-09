import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

// OUTER LOOP / GAME MACHINE (Idle, Onboard, Playing)
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null
    
    states = {
        IDLE: 'IDLE',
        ONBOARDING: 'ONBOARDING',
        PLAYING: 'PLAYING'
    }
    
    events = {
        //Inputs Received
        RFID_SCAN: 'rfid-scan',
        CHEAT_BUTTON_PRESSED: 'cheat-button-pressed',
        APPLAUSE_BUTTON_PRESSED: 'applause-button-pressed',
        PODIUM_1_BUTTON_PRESSED: 'podium-1-button-pressed',
        PODIUM_2_BUTTON_PRESSED: 'podium-2-button-pressed',
        PODIUM_3_BUTTON_PRESSED: 'podium-3-button-pressed',
        PODIUM_4_BUTTON_PRESSED: 'podium-4-button-pressed',
        JOYSTICK_MOVED: 'joystick-moved',
        LEVER_MOVED: 'lever-moved',
        //Inputs Given (LEDs)
        TURN_ON_CHEAT_LED: 'turn-on-cheat-led',
        TURN_OFF_CHEAT_LED: 'turn-off-cheat-led',
        TURN_ON_APPLAUSE_LED: 'turn-on-applause-led',
        TURN_OFF_APPLAUSE_LED: 'turn-off-applause-led',
        TURN_ON_PODIUM_1_LED: 'turn-on-podium-1-led',
        TURN_OFF_PODIUM_1_LED: 'turn-off-podium-1-led',
        TURN_ON_PODIUM_2_LED: 'turn-on-podium-2-led',
        TURN_OFF_PODIUM_2_LED: 'turn-off-podium-2-led',
        TURN_ON_PODIUM_3_LED: 'turn-on-podium-3-led',
        TURN_OFF_PODIUM_3_LED: 'turn-off-podium-3-led',
        TURN_ON_PODIUM_4_LED: 'turn-on-podium-4-led',
        TURN_OFF_PODIUM_4_LED: 'turn-off-podium-4-led',
        //Possible Time (Auto) Events
        ONBOARDING_COMPLETE: 'onboarding-complete',
        GAME_OVER: 'game-over'
    }

    constructor(initialState) {
        this.state = initialState;
    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        if (!event) return;
        console.log(`Processing event: ${event.name} in state: ${this.state}`);

        if (this.state === this.states.IDLE) {                      //IDLE STATE
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                // DEBUG Purposes, goes to onboarding
                this.state = 'ONBOARDING';
                console.log(`State transition: IDLE -> ONBOARDING`);
                setTimeout(() => {
                    this.addEvent('onboarding-complete', {});
                }, 60 * 1000);
            }
            if (event.name === this.events.RFID_SCAN) {
                // switch to onboarding
                this.state = 'ONBOARDING';
                console.log(`State transition: IDLE -> ONBOARDING`);
                // set 60 second timer, change length depending on how long onboarding is
                setTimeout(() => {
                    this.addEvent('onboarding-complete', {});
                }, 60 * 1000);
            }
            else {
                return;
            }
        } else if (this.state === this.states.ONBOARDING) {                   //ONBOARDING STATE
            if (event.name === this.events.ONBOARDING_COMPLETE) {
                this.state = 'PLAYING';
                console.log(`State transition: ONBOARDING -> PLAYING`);
                // Start the game timer
                setTimeout(() => {
                    this.addEvent('game-over', {});
                }, 60 * 1000);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                this.state = 'PLAYING';
                console.log(`State transition: ONBOARDING -> PLAYING`);
                // Start the game timer (Game Time / 1min AND how long score screen)
                setTimeout(() => { 
                    this.addEvent('game-over', {});
                }, 60 * 1000);
            }
            else {
                return;
            }
        } else if (this.state === this.states.PLAYING) {                      //PLAYING STATE
            if (event.name === this.events.GAME_OVER) {
                this.state = 'IDLE';
                console.log(`State transition: PLAYING -> IDLE`);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
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

const machine = new GameMachine('IDLE');

// Gets all 5 Inputs from Panel.js
panel.on('cheatPressed', () => {
    machine.addEvent('cheat-button-pressed', {})
});
panel.on('applausePressed', () => {
    machine.addEvent('applause-button-pressed', {});
});
panel.on('podiumPressed', (num) => {
    machine.addEvent(`podium-${num}-button-pressed`, {});
});
panel.on('joystickMoved', (dir) => {
    machine.addEvent('joystick-moved', {dir});
});
panel.on('leverMoved', (value) => {
    machine.addEvent('lever-moved', {value});
});

// Example usage
const runExample = () => {
    // Create a new game machine in IDLE state
    
    // Start the state machine
    machine.run();
    
    console.log('Current state:', machine.state);
    
    // Simulate an RFID scan after 5 seconds
    setTimeout(() => {
        machine.addEvent('rfid-scan');
    }, 5000);
    
    // Simulate the game ending early after 30 seconds (user presses red button)
    setTimeout(() => {
        machine.addEvent('button-pushed-red');
    }, 30000);
    
    // Stop the state machine after 3 minute
    setTimeout(() => {
        machine.stop();
        console.log('Example complete. Final state:', machine.state);
    }, 60000 * 3);
};

//On Start Up, Light Up All LEDs Now (TEST)
const awake = () => {
    runExample();
};

export { awake, machine }
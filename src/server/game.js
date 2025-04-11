import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

// OUTER LOOP / GAME MACHINE (Idle, Onboard, Playing)
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null
    score

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
        PODIUM_BUTTON_PRESSED: 'podium-button-pressed',
        JOYSTICK_MOVED: 'joystick-moved',
        LEVER_MOVED: 'lever-moved',
        //Inputs Given (LEDs)
        TURN_ON_CHEAT: 'turn-on-cheat',
        TURN_OFF_CHEAT_LED: 'turn-off-cheat-led',
        TURN_ON_APPLAUSE: 'turn-on-applause',
        TURN_OFF_APPLAUSE_LED: 'turn-off-applause-led',
        TURN_ON_PODIUM: 'turn-on-podium',
        TURN_OFF_PODIUM_1_LED: 'turn-off-podium-1-led',
        TURN_OFF_PODIUM_2_LED: 'turn-off-podium-2-led',
        TURN_OFF_PODIUM_3_LED: 'turn-off-podium-3-led',
        TURN_OFF_PODIUM_4_LED: 'turn-off-podium-4-led',
        TURN_ON_JOYSTICK: 'turn-on-joystick',
        TURN_ON_LEVER: 'turn-on-lever',
        //Possible Time (Auto) Events
        ONBOARDING_COMPLETE: 'onboarding-complete',
        GAME_OVER: 'game-over'
    }

    interactionState = {
        APPLAUSE_BTN: 'off',
        CHEAT_BTN: 'off',
        PODIUM_1_BTN: 'off',
        PODIUM_2_BTN: 'off',
        PODIUM_3_BTN: 'off',
        PODIUM_4_BTN: 'off',
        LEVER_DESIRED: 'off', //Lever's on/off state for turning on and off lever
        LEVER_POS: -1,
        JOYSTICK_DESIRED: 'off', //Joystick same ^
        JOYSTICK_DIR: 0,     // whatever default state should be
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
                }, 75 * 1000);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                this.state = 'PLAYING';
                console.log(`State transition: ONBOARDING -> PLAYING`);
                // Start the game timer (Game Time / 1 min AND 15 sec (for score screen)
                setTimeout(() => {
                    this.addEvent('game-over', {});
                }, 75 * 1000);
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
                if (this.interactionState.APPLAUSE_BTN === 'on') {
                    score += 5
                } else if (this.interactionState.APPLAUSE_BTN === 'off') {
                    score -= 5
                }
                this.interactionState.APPLAUSE_BTN = 'off'
                turnOffApplauseLED()

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent('turn-on-applause', {});
                }, 2 * 1000);
            }
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                if (this.interactionState.CHEAT_BTN === 'on') {
                    score += 15
                } else if (this.interactionState.CHEAT_BTN === 'off') {
                    score -= 15
                }
                this.interactionState.CHEAT_BTN = 'off'
                turnOffCheatLED()

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent('turn-on-cheat', {});
                }, 2 * 1000);
            }
            if (event.name === this.events.JOYSTICK_MOVED) {
                if (this.interactionState.APPLAUSE_BTN === 'on') { //CHANGE THIS
                    score += 5
                } else if (this.interactionState.APPLAUSE_BTN === 'off') {
                    score -= 5
                }
                this.interactionState.JOYSTICK_DESIRED = 'off'
                const direction = event.data.dir
                this.interactionState.JOYSTICK_DIR = direction
                console.log(`joystick moved in: ${direction}`)

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent(`turn-on-joystick', ${direction}`);
                }, 2 * 1000);
            }
            if (event.name === this.events.LEVER_MOVED) {
                if (this.interactionState.APPLAUSE_BTN === 'on') { //CHANGE THIS
                    score += 7
                } else if (this.interactionState.APPLAUSE_BTN === 'off') {
                    score -= 7
                }
                this.interactionState.LEVER_DESIRED = 'off'
                const position = event.data.value
                this.interactionState.LEVER_POS = position
                console.log(`lever moved: ${position}`)

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent('turn-on-lever', {position});
                }, 2 * 1000);
            }
            if (event.name === this.events.PODIUM_BUTTON_PRESSED) {
                const podiumNum = event.data.num
                if (this.interactionState[`PODIUM_${podiumNum}_BTN`] === 'on') {
                    score += 8
                } else if (this.interactionState[`PODIUM_${podiumNum}_BTN`] === 'off') {
                    score -= 8
                }
                this.interactionState[`PODIUM_${podiumNum}_BTN`] = 'off'
                turnOffPodiumLED(podiumNum)

                // Trigger on state after downtime
                setTimeout(() => {
                    const podiumToTrigger = Math.floor(Math.random() * 4) + 1
                    this.addEvent('turn-on-podium', {podiumToTrigger});
                }, 2 * 1000);
            }

            // Set on-states
            if (event.name === this.events.TURN_ON_APPLAUSE) {
                this.interactionState.APPLAUSE_BTN = 'on'
                turnOnApplauseLED();
            }
            if (event.name === this.events.TURN_ON_CHEAT) {
                this.interactionState.CHEAT_BTN = 'on'
                turnOnCheatLED();
            }
            if (event.name === this.events.TURN_ON_JOYSTICK) {
                this.interactionState.JOYSTICK_DESIRED = 'on'
                this.interactionState.JOYSTICK_DIR = event.data.dir
                console.log("JOYSTICK IS ON AT " + this.interactionState.JOYSTICK_DIR);
            }
            if (event.name === this.events.TURN_ON_LEVER) {
                this.interactionState.LEVER_DESIRED = 'on'
                this.interactionState.LEVER_POS = event.data.position
                console.log("LEVEL IS ON AT " + this.interactionState.LEVER_POS);
            }
            if (event.name === this.events.TURN_ON_PODIUM) {
                if(event.data.podiumToTrigger === 1) {
                    this.interactionState.PODIUM_1_BTN = 'on'
                } else if (event.data.podiumToTrigger === 2) {
                    this.interactionState.PODIUM_2_BTN = 'on'
                } else if (event.data.podiumToTrigger === 3) {
                    this.interactionState.PODIUM_3_BTN = 'on'
                } else if (event.data.podiumToTrigger === 4) {
                    this.interactionState.PODIUM_4_BTN = 'on'
                }
                turnOnPodiumLED(event.data.podiumToTrigger);
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
    machine.addEvent(`podium-button-pressed`, { num });
});
panel.on('joystickMoved', (dir) => {
    machine.addEvent('joystick-moved', { dir });
});
panel.on('leverMoved', (value) => {
    machine.addEvent('lever-moved', { value });
});

// Example usage
const runExample = () => {
    // Create a new game machine in IDLE state

    // Start the state machine
    machine.run();

    console.log('Current state:', machine.state);

    //DEBUG PURPOSES: START AT PLAYING STATE
    machine.state = "PLAYING";

    /*
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
    */
};

//On Start Up, Light Up All LEDs Now (TEST)
const awake = () => {
    runExample();
};

export { awake, machine }
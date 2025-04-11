import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

const moveToPlaying = (machine) => {
    machine.state = 'PLAYING';
    console.log(`State transition: ONBOARDING -> PLAYING`);
    // Start the game timer
    setTimeout(() => {
        machine.addEvent('game-over', {});
    }, 75 * 1000);

    machine.score = 0
    setTimeout(() => {
        machine.addEvent('turn-on-applause', {});
    }, 3 * 1000);
    setTimeout(() => {
        machine.addEvent(this.events.TURN_ON_CHEAT, {});
    }, 2 * 1000);
    setTimeout(() => {
        const direction = machine.interactionState.JOYSTICK_DIR
        machine.addEvent('turn-on-joystick', { direction });
    }, 3 * 1000);
    setTimeout(() => {
        const podiumToTrigger = Math.floor(Math.random() * 4) + 1
        machine.addEvent('turn-on-podium', { podiumToTrigger });
    }, 3 * 1000);
    setTimeout(() => {
        this.addEvent(this.events.TURN_ON_LEVER, {
            position: Math.random() * 100
        });
    }, 5 * 1000);

}

// OUTER LOOP / GAME MACHINE (Idle, Onboard, Playing)
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null
    score = 0

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
        //Inputs Given
        TURN_ON_CHEAT: 'turn-on-cheat',
        TURN_OFF_CHEAT: 'turn-off-cheat',
        TURN_ON_APPLAUSE: 'turn-on-applause',
        TURN_OFF_APPLAUSE: 'turn-off-applause',
        TURN_ON_PODIUM: 'turn-on-podium',
        TURN_OFF_PODIUM: 'turn-off-podium',
        TURN_ON_JOYSTICK: 'turn-on-joystick',
        TURN_OFF_JOYSTICK: 'turn-off-joystick',
        TURN_ON_LEVER: 'turn-on-lever',
        TURN_OFF_LEVER: 'turn-off-lever',
        //Possible Time (Auto) Events
        ONBOARDING_COMPLETE: 'onboarding-complete',
        GAME_OVER: 'game-over',
    }

    interactionState = {
        APPLAUSE_BTN: 'off',
        CHEAT_BTN: 'off',
        PODIUM_1_BTN: 'off',
        PODIUM_2_BTN: 'off',
        PODIUM_3_BTN: 'off',
        PODIUM_4_BTN: 'off',
        LEVER_DESIRED: 'off', //Lever's on/off state for turning on and off lever
        LEVER_POS: null,
        LEVER_TARGET: null,
        JOYSTICK_DESIRED: 'off', //Joystick same ^
        JOYSTICK_DIR: 0,     // whatever default state should be
    }


    constructor(initialState) {
        this.state = initialState;
    }

    getState() {

    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        if (!event) return;
        console.log(`Processing event: ${event.name} in state: ${this.state}`);

        if (event.name === this.events.LEVER_MOVED) {
            // store the data 
            let position = event.data.value
            if(position > 100) {
                position = 100
            } else if (position < 1) {
                position = 1
            }
            this.interactionState.LEVER_POS = position
        }
        

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
                moveToPlaying(this);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                // this.state = 'PLAYING';
                // console.log(`State transition: ONBOARDING -> PLAYING`);
                // // Start the game timer (Game Time / 1 min AND 15 sec (for this.score screen)
                // setTimeout(() => {
                //     this.addEvent('game-over', {});
                // }, 75 * 1000);
                moveToPlaying(this);
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
                    this.score += 5
                    if (this.score >= 100) {
                        this.score = 100
                    }
                } else if (this.interactionState.APPLAUSE_BTN === 'off') {
                    this.score -= 5
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
                this.interactionState.APPLAUSE_BTN = 'off'
                turnOffApplauseLED()
                console.log(this.score)

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent('turn-on-applause', {});
                }, 5 * 1000);
            }
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                if (this.interactionState.CHEAT_BTN === 'on') {
                    this.score += 15
                    if (this.score >= 100) {
                        this.score = 100
                    }

                    this.addEvent(this.events.TURN_OFF_CHEAT);
                } else if (this.interactionState.CHEAT_BTN === 'off') {
                    this.score -= 15
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
               
            }
            if (event.name === this.events.JOYSTICK_MOVED) {
                // store the data 
                let dir = event.data.value
            
                this.interactionState.SPOTLIGHT_POSITION += dir;
    
                if (this.interactionState.APPLAUSE_BTN === 'on') { //CHANGE THIS
                    this.score += 10
                    if (this.score >= 100) {
                        this.score = 100
                    }
                } else if (this.interactionState.APPLAUSE_BTN === 'off') {
                    this.score -= 10
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
                this.interactionState.JOYSTICK_DESIRED = 'off'
                const direction = event.data.dir
                this.interactionState.JOYSTICK_DIR = direction
                console.log(`joystick moved in: ${direction}`)
                console.log(this.score)

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent(`turn-on-joystick', ${direction}`);
                }, 5 * 1000);
            }
            if (event.name === this.events.LEVER_MOVED) {

                // if lever is cued (desired) && lever_pos is in range of lever_target

                if (this.interactionState.LEVER_DESIRED === 'on') {
                    this.score += 7
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    this.addEvent(this.events.TURN_OFF_LEVER);
                } 
                // else if (this.interactionState.LEVER_DESIRED === 'off') {
                //     this.score -= 7
                //     if (this.score <= 0) {
                //         this.score = 0
                //     }
                // }

   
                console.log(`lever moved: ${position}`)
                console.log(this.score)


                // Trigger on state after downtime
                // setTimeout(() => {
                //     this.addEvent('turn-on-lever', {position});
                // }, 5 * 1000);
            }
            if (event.name === this.events.PODIUM_BUTTON_PRESSED) {
                const podiumNum = event.data.num
                if (this.interactionState[`PODIUM_${podiumNum}_BTN`] === 'on') {
                    this.score += 8
                    if (this.score >= 100) {
                        this.score = 100
                    }
                } else if (this.interactionState[`PODIUM_${podiumNum}_BTN`] === 'off') {
                    this.score -= 8
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
                this.interactionState[`PODIUM_${podiumNum}_BTN`] = 'off'
                turnOffPodiumLED(podiumNum)
                console.log(this.score)


                // Trigger on state after downtime
                setTimeout(() => {
                    const podiumToTrigger = Math.floor(Math.random() * 4) + 1
                    this.addEvent('turn-on-podium', {podiumToTrigger});
                }, 5 * 1000);
            }

            // Set on-states
            if (event.name === this.events.TURN_ON_APPLAUSE) {
                this.interactionState.APPLAUSE_BTN = 'on'
                turnOnApplauseLED();
            }
            if (event.name === this.events.TURN_ON_CHEAT && this.interactionState.CHEAT_BTN === 'off') {
                this.interactionState.CHEAT_BTN = 'on'
                turnOnCheatLED();
                setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_CHEAT)
                }, 5 * 1000);
            }
            if (event.name === this.events.TURN_ON_JOYSTICK) {
                this.interactionState.JOYSTICK_DESIRED = 'on'
                this.interactionState.JOYSTICK_DIR = event.data.dir
                console.log("JOYSTICK IS ON AT " + this.interactionState.JOYSTICK_DIR);
            }
            if (event.name === this.events.TURN_ON_LEVER && this.interactionState.CHEAT_BTN === 'off') {
                this.interactionState.LEVER_DESIRED = 'on'
                this.interactionState.LEVER_TARGET = event.data.position

                console.log("LEVER IS ON AT " + this.interactionState.LEVER_POS);
            }
            if (event.name === this.events.TURN_ON_PODIUM) {
                this.interactionState.PODIUM_CUED = 'on';
                this.interactionState.PODIUM_TARGET = event.data.podiumToTrigger;

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

            // Set off-states
            if (event.name == this.events.TURN_OFF_APPLAUSE) {
                this.interactionState.APPLAUSE_BTN = 'off'
                turnOffApplauseLED();
            }
            if (event.name == this.events.TURN_OFF_CHEAT && this.interactionState.CHEAT_BTN === 'on') {
                this.interactionState.CHEAT_BTN = 'off'
                turnOffCheatLED();
                // clearTimeout(someVariable);
                setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_CHEAT, {});
                }, 2 * 1000);
            }
            if (event.name == this.events.TURN_OFF_JOYSTICK) {
                this.interactionState.JOYSTICK_DESIRED = 'off'
            }
            if (event.name == this.events.TURN_OFF_LEVER  && this.interactionState.LEVER_DESIRED === 'on') {
                this.interactionState.LEVER_DESIRED = 'off'
            }
            if (event.name == this.events.TURN_OFF_PODIUM) {
                if (event.data.podiumToTrigger === 1) {
                    this.interactionState.PODIUM_1_BTN = 'off'
                } else if (event.data.podiumToTrigger === 2) {
                    this.interactionState.PODIUM_2_BTN = 'off'
                } else if (event.data.podiumToTrigger === 3) {
                    this.interactionState.PODIUM_3_BTN = 'off'
                } else if (event.data.podiumToTrigger === 4) {
                    this.interactionState.PODIUM_4_BTN = 'off'
                }
                turnOffPodiumLED(event.data.podiumToTrigger);
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
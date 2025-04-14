import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

const moveToPlaying = (machine) => {
    machine.state = 'PLAYING';
    console.log(`State transition: ONBOARDING -> PLAYING`);
    //INITIALIZE ALL GAMEPLAY COMPONENTS HERE (e.g. Score)

    clearTimeout(machine.cheatTimer);
    clearTimeout(machine.applauseTimer);
    clearTimeout(machine.joystickTimer);
    clearTimeout(machine.leverTimer);
    clearTimeout(machine.podiumTimer);
    
    machine.cheatTimer = null;
    machine.applauseTimer = null;
    machine.joystickTimer = null;
    machine.leverTimer = null;
    machine.podiumTimer = null;

    machine.score = 0
    
    // Start the game timer
    setTimeout(() => {
        machine.addEvent(machine.events.GAME_OVER, {});
    }, 60 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_APPLAUSE, {});
    }, 3 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_CHEAT, {});
    }, 2 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_JOYSTICK, {});
    }, 3 * 1000);
    setTimeout(() => {
        const podiumToTrigger = Math.floor(Math.random() * 4) + 1
        machine.addEvent(machine.events.TURN_ON_PODIUM, { num: podiumToTrigger });
    }, 3 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_LEVER, {});
    }, 5 * 1000);
}

// GAME MACHINE (Idle, Onboard, Playing (w/ Associated Sub Machine Functions))
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null
    score = 0
    applauseTimer = null
    cheatTimer = null
    joystickTimer = null
    leverTimer = null
    podiumTimer = null
    leverTouched = false
    joystickTouched = false
    lastDir = null
    targetDir = null

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
        HOST_MOVED: 'host-moved',
        //Possible Time (Auto) Events
        ONBOARDING_COMPLETE: 'onboarding-complete',
        GAME_OVER: 'game-over',
    }

    cues = {
        APPLAUSE_CUE: false,
        CHEAT_CUE: false,
        PODIUM_1_CUE: false,
        PODIUM_2_CUE: false,
        PODIUM_3_CUE: false,
        PODIUM_4_CUE: false,
        LEVER_CUE: false,
        JOYSTICK_CUE: false,
    }

    feedback = {
        LEVER_INITIAL: null,
        LEVER_POS: null,
        LEVER_TARGET: null,
        JOYSTICK_POS: 0,
        JOYSTICK_TARGET: Math.floor(Math.random() * 100) - 50 //Range between -50 and 50 Change later (AL's Xcoord)
    }

    constructor(initialState) {
        this.state = initialState;
    }

    getState() {
        return {
            state: this.state,
            score: this.score,
            cues: this.cues,
            feedback: this.feedback,
        };
    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        if (!event) return;
        console.log(`Processing event: ${event.name} in state: ${this.state}`);

        if (event.name === this.events.LEVER_MOVED) { //LEVER VALUE INITIALIZATION
            let position = event.data.value
            if(position > 100) {
                position = 100
            } else if (position < 1) {
                position = 1
            }
            this.feedback.LEVER_POS = position
        }

        if (event.name === this.events.HOST_MOVED) {
            // take the data steps amount, try to move him
            // if boundary check fails, force the direction to be good
                // set his position to the boundary
        }
        
        if (this.state === this.states.IDLE) {                      //IDLE STATE
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                // DEBUG Purposes, goes to onboarding
                this.state = this.states.ONBOARDING;
                console.log(`State transition: IDLE -> ONBOARDING`);
                setTimeout(() => {
                    this.addEvent(this.events.ONBOARDING_COMPLETE, {});
                }, 60 * 1000);
            }
            if (event.name === this.events.RFID_SCAN) {
                // switch to onboarding
                this.state = this.states.ONBOARDING;
                console.log(`State transition: IDLE -> ONBOARDING`);
                // set 60 second timer, change length depending on how long onboarding is
                setTimeout(() => {
                    this.addEvent(this.events.ONBOARDING_COMPLETE, {});
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
                moveToPlaying(this);
            }
            else {
                return;
            }
        } else if (this.state === this.states.PLAYING) {                      //PLAYING STATE           
            if (event.name === this.events.GAME_OVER) {
                this.state = this.states.IDLE;
                console.log(`State transition: PLAYING -> IDLE`);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                if (this.cues.APPLAUSE_CUE) {
                    this.score += 5
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    clearTimeout(this.applauseTimer);
                    this.addEvent(this.events.TURN_OFF_APPLAUSE);
                } else if (!this.cues.APPLAUSE_CUE) {
                    this.score -= 5
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
            }
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                if (this.cues.CHEAT_CUE) {
                    this.score += 15
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    clearTimeout(this.cheatTimer);
                    this.addEvent(this.events.TURN_OFF_CHEAT);
                } else if (!this.cues.CHEAT_CUE) {
                    this.score -= 15
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
            }
            if (event.name === this.events.JOYSTICK_MOVED) {
                if (this.cues.JOYSTICK_CUE) {
                    this.joystickTouched = true
                    this.feedback.JOYSTICK_POS -= event.data.dir
                    if (this.feedback.JOYSTICK_POS <= -50) {
                        this.feedback.JOYSTICK_POS = -50;
                    } else if (this.feedback.JOYSTICK_POS >= 50) {
                        this.feedback.JOYSTICK_POS = 50;
                    }
                    console.log(this.feedback.JOYSTICK_POS);
                }
            }
            if (event.name === this.events.LEVER_MOVED) {
                const pos = this.feedback.LEVER_POS;
                const start = this.feedback.LEVER_INITIAL || pos;
                //Handling for sensitive lever
                if (!this.leverTouched && Math.abs(pos - start) > 3) {
                    this.leverTouched = true;
                }
                if (this.cues.LEVER_CUE && this.feedback.LEVER_TARGET) {                    
                    const { min, max } = this.feedback.LEVER_TARGET;
                    
                    if (pos >= min && pos <= max) {
                        // Successful move
                        this.score += 7;
                        if (this.score >= 100) {
                            this.score = 100;
                        }
                        clearTimeout(this.leverTimer);
                        this.feedback.LEVER_TARGET = null; // prevent double scoring
                        console.log("Lever moved correctly. Score rewarded.");
                        this.addEvent(this.events.TURN_OFF_LEVER);
                    }
                }
            }
            if (event.name === this.events.PODIUM_BUTTON_PRESSED) {
                if (this.cues[`PODIUM_${event.data.num}_CUE`]) {
                    this.score += 8
                    if (this.score >= 100) {
                        this.score = 100
                    }
                } else if (!this.cues[`PODIUM_${event.data.num}_CUE`]) {
                    this.score -= 8
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
                clearTimeout(this.podiumTimer);
                this.addEvent(this.events.TURN_OFF_PODIUM, {num: event.data.num});
            }

            // Set on-states
            if (event.name === this.events.TURN_ON_APPLAUSE && !this.cues.APPLAUSE_CUE) {
                this.cues.APPLAUSE_CUE = true
                turnOnApplauseLED();
                this.applauseTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_APPLAUSE, {});
                }, 10 * 1000);
            }
            if (event.name === this.events.TURN_ON_CHEAT && !this.cues.CHEAT_CUE) {
                this.cues.CHEAT_CUE = true
                turnOnCheatLED();
                this.cheatTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_CHEAT, {});
                }, 5 * 1000);
            }
            if (event.name === this.events.TURN_ON_JOYSTICK && !this.cues.JOYSTICK_CUE) {
                this.feedback.JOYSTICK_POS = 0
                this.joystickTouched = false
                this.cues.JOYSTICK_CUE = true

                this.joystickTimer = setTimeout(() => {
                    const diff = Math.abs(this.feedback.JOYSTICK_POS - this.feedback.JOYSTICK_TARGET)
                    if (this.joystickTouched) {
                        if (diff <= 10) {
                            this.score += 10
                            if (this.score > 100) this.score = 100
                            console.log("Joystick moved correctly to target. Score rewarded.")
                        } else {
                            this.score -= 10
                            if (this.score < 0) this.score = 0
                            console.log("Joystick missed the target. Score penalized.")
                        }
                    } else {
                        console.log("Joystick was not touched. Nothing happens")
                    }
                    this.addEvent(this.events.TURN_OFF_JOYSTICK, {});
                }, 5 * 1000);
            }
            if (event.name === this.events.TURN_ON_LEVER && !this.cues.LEVER_CUE) {
                this.cues.LEVER_CUE = true
                this.leverTouched = false;

                const currentPos = this.feedback.LEVER_POS;
                if (currentPos <= 50) {
                    this.feedback.LEVER_TARGET = {min: 85, max: 100};
                } else {
                    this.feedback.LEVER_TARGET = {min: 1, max: 15};
                }
                this.feedback.LEVER_INITIAL = currentPos;

                this.leverTimer = setTimeout(() => {
                    if (this.feedback.LEVER_TARGET) {
                        if (this.leverTouched) {
                            // Moved but failed to hit target
                            this.score -= 7;
                            if (this.score < 0) this.score = 0;
                            console.log("Lever moved but missed target. Score penalized.");
                        } else {
                            console.log("Lever not touched. No penalty.");
                        }
                    }
                    this.addEvent(this.events.TURN_OFF_LEVER, {});
                }, 10 * 1000);
            }
            if (event.name === this.events.TURN_ON_PODIUM && !this.cues[`PODIUM_${event.data.num}_CUE`]) {
                this.cues[`PODIUM_${event.data.num}_CUE`] = true
                turnOnPodiumLED(event.data.num);
                this.podiumTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_PODIUM, {num: event.data.num});
                }, 3 * 1000);
            }

            // Set off-states
            if (event.name === this.events.TURN_OFF_APPLAUSE && this.cues.APPLAUSE_CUE) {
                this.cues.APPLAUSE_CUE = false
                turnOffApplauseLED();
                this.applauseTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_APPLAUSE, {});
                }, 1 * 1000);
            }
            if (event.name === this.events.TURN_OFF_CHEAT && this.cues.CHEAT_CUE) {
                this.cues.CHEAT_CUE = false
                turnOffCheatLED();
                this.cheatTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_CHEAT, {});
                }, 2 * 1000);
            }
            if (event.name === this.events.TURN_OFF_JOYSTICK && this.cues.JOYSTICK_CUE) {
                this.cues.JOYSTICK_CUE = false
                this.joystickTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_JOYSTICK, {});
                }, 5 * 1000);
            }
            if (event.name === this.events.TURN_OFF_LEVER  && this.cues.LEVER_CUE) {
                this.cues.LEVER_CUE = false
                this.leverTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_LEVER, {});
                }, 2 * 1000);
            }
            if (event.name == this.events.TURN_OFF_PODIUM) {
                for(let i = 1; i <= 4; i++) {
                    this.cues[`PODIUM_${i}_CUE`] = false
                    turnOffPodiumLED(i);
                }
                const podiumToTrigger = Math.floor(Math.random() * 4) + 1
                this.podiumTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_PODIUM, { num: podiumToTrigger });
                }, 3 * 1000);
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
    machine.addEvent(machine.events.CHEAT_BUTTON_PRESSED, {})
});
panel.on('applausePressed', () => {
    machine.addEvent(machine.events.APPLAUSE_BUTTON_PRESSED, {});
});
panel.on('podiumPressed', (num) => {
    machine.addEvent(machine.events.PODIUM_BUTTON_PRESSED, { num });
});
panel.on('joystickMoved', (dir) => {
    if (dir === 0 && machine.lastDir === 0) {
        return; // Ignore if still at 0
    }
    if (dir !== 0) {
        machine.lastDir = dir; // Update lastDir to new direction
        machine.addEvent(machine.events.JOYSTICK_MOVED, { dir });
    } else {
        machine.lastDir = dir; // Keep track of neutral state
    }
});
panel.on('leverMoved', (value) => {
    machine.addEvent(machine.events.LEVER_MOVED, { value });
});

/*
const updateAlPosition = () => {
    machine.addEvent(machine.events.HOST_MOVED, { steps: 10 });
    // check his direction
    // if right, 80% chance of firing +10
    // if left, 80% chance of firing -10

    setTimeout(updateAlPosition, 100);
};
setTimeout(updateAlPosition, 100);
*/

// Example usage
const runExample = () => {
    // Create a new game machine in IDLE state

    // Start the state machine
    machine.run();

    console.log('Current state:', machine.state);

    //DEBUG PURPOSES: START AT PLAYING STATE
    moveToPlaying(machine);

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
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
    }, 75 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_APPLAUSE, {});
    }, 3 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_CHEAT, {});
    }, 2 * 1000);
    setTimeout(() => {
        const direction = machine.cues.JOYSTICK_DIR
        machine.addEvent(machine.events.TURN_ON_JOYSTICK, { direction });
    }, 3 * 1000);
    setTimeout(() => {
        const podiumToTrigger = Math.floor(Math.random() * 4) + 1
        machine.addEvent(machine.events.TURN_ON_PODIUM, { podiumToTrigger });
    }, 3 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_LEVER, {position: Math.random() * 100});
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

    cues = {
        APPLAUSE_CUE: 'off',
        CHEAT_CUE: 'off',
        PODIUM_1_CUE: 'off',
        PODIUM_2_CUE: 'off',
        PODIUM_3_CUE: 'off',
        PODIUM_4_CUE: 'off',
        LEVER_CUE: 'off',
        LEVER_POS: null,      // whatever default state should be
        LEVER_TARGET: null,
        JOYSTICK_CUE: 'off',
        JOYSTICK_DIR: 0,     // whatever default state should be
        JOYSTICK_TARGET: 0
    }

    constructor(initialState) {
        this.state = initialState;
    }

    getState() {
        return {
            state: this.state,
            score: this.score,
            cues: this.cues
        };
    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        if (!event) return;
        console.log(`Processing event: ${event.name} in state: ${this.state}`);

        if (event.name === this.events.LEVER_MOVED) {// TRAVIS PUT THIS IN
            // store the data 
            let position = event.data.value
            if(position > 100) {
                position = 100
            } else if (position < 1) {
                position = 1
            }
            this.cues.LEVER_POS = position
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
                moveToPlaying(this); //TRAVIS MADE THIS CHANGE
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
                this.state = this.states.IDLE;
                console.log(`State transition: PLAYING -> IDLE`);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                if (this.cues.APPLAUSE_CUE === 'on') {
                    this.score += 5
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    clearTimeout(this.applauseTimer);
                    this.addEvent(this.events.TURN_OFF_APPLAUSE);
                } else if (this.cues.APPLAUSE_CUE === 'off') {
                    this.score -= 5
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
            }
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                if (this.cues.CHEAT_CUE === 'on') {
                    this.score += 15
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    clearTimeout(this.cheatTimer);
                    this.addEvent(this.events.TURN_OFF_CHEAT);
                } else if (this.cues.CHEAT_CUE === 'off') {
                    this.score -= 15
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
            }
            if (event.name === this.events.JOYSTICK_MOVED) {
                // store the data 
                let dir = event.data.value
            
                this.cues.SPOTLIGHT_POSITION += dir;
    
                if (this.cues.APPLAUSE_CUE === 'on') { //CHANGE THIS
                    this.score += 10
                    if (this.score >= 100) {
                        this.score = 100
                    }
                } else if (this.cues.APPLAUSE_CUE === 'off') {
                    this.score -= 10
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
                this.cues.JOYSTICK_CUE = 'off'
                const direction = event.data.dir
                this.cues.JOYSTICK_DIR = direction
                console.log(`joystick moved in: ${direction}`)
                console.log(this.score)

                // Trigger on state after downtime
                setTimeout(() => {
                    this.addEvent(`turn-on-joystick', ${direction}`);
                }, 5 * 1000);
            }
            if (event.name === this.events.LEVER_MOVED) {

                // if lever is cued (desired) && lever_pos is in range of lever_target

                if (this.cues.LEVER_CUE === 'on') {
                    this.score += 7
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    this.addEvent(this.events.TURN_OFF_LEVER);
                } 
                // else if (this.cues.LEVER_CUE === 'off') {
                //     this.score -= 7
                //     if (this.score <= 0) {
                //         this.score = 0
                //     }
                // }
                console.log(this.score)
            }
            if (event.name === this.events.PODIUM_BUTTON_PRESSED) {
                if (this.cues[`PODIUM_${event.data.num}_CUE`] === 'on') {
                    this.score += 8
                    if (this.score >= 100) {
                        this.score = 100
                    }
                    clearTimeout(this.podiumTimer);
                    this.addEvent(this.events.TURN_OFF_PODIUM, {});
                } else if (this.cues[`PODIUM_${event.data.num}_CUE`] === 'off') {
                    this.score -= 8
                    if (this.score <= 0) {
                        this.score = 0
                    }
                }
            }

            // Set on-states
            if (event.name === this.events.TURN_ON_APPLAUSE && this.cues.APPLAUSE_CUE === 'off') {
                this.cues.APPLAUSE_CUE = 'on'
                turnOnApplauseLED();
                this.applauseTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_APPLAUSE, {});
                }, 10 * 1000);
            }
            if (event.name === this.events.TURN_ON_CHEAT && this.cues.CHEAT_CUE === 'off') {
                this.cues.CHEAT_CUE = 'on'
                turnOnCheatLED();
                this.cheatTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_CHEAT, {});
                }, 5 * 1000);
            }
            if (event.name === this.events.TURN_ON_JOYSTICK) {
                this.cues.JOYSTICK_CUE = 'on'
                this.cues.JOYSTICK_DIR = event.data.dir
                console.log("JOYSTICK IS ON AT " + this.cues.JOYSTICK_DIR);
            }
            if (event.name === this.events.TURN_ON_LEVER && this.cues.LEVER_CUE === 'off') {
                this.cues.LEVER_CUE = 'on'
                this.cues.LEVER_TARGET = event.data.position

                console.log("LEVER IS ON AT " + this.cues.LEVER_POS);
            }
            if (event.name === this.events.TURN_ON_PODIUM && this.cues[`PODIUM_${event.data.num}_CUE`] === 'off') {
                this.cues[`PODIUM_${event.data.num}_CUE`] === 'on'
                turnOnPodiumLED(event.data.num);
                this.podiumTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_PODIUM, {num: event.data.num});
                }, 3 * 1000);
            }

            // Set off-states
            if (event.name == this.events.TURN_OFF_APPLAUSE && this.cues.APPLAUSE_CUE === 'on') {
                this.cues.APPLAUSE_CUE = 'off'
                turnOffApplauseLED();
                this.applauseTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_APPLAUSE, {});
                }, 1 * 1000);
            }
            if (event.name == this.events.TURN_OFF_CHEAT && this.cues.CHEAT_CUE === 'on') {
                this.cues.CHEAT_CUE = 'off'
                turnOffCheatLED();
                this.cheatTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_CHEAT, {});
                }, 2 * 1000);
            }
            if (event.name == this.events.TURN_OFF_JOYSTICK) {
                this.cues.JOYSTICK_CUE = 'off'
            }
            if (event.name == this.events.TURN_OFF_LEVER  && this.cues.LEVER_CUE === 'on') {
                this.cues.LEVER_CUE = 'off'
            }
            if (event.name == this.events.TURN_OFF_PODIUM && this.cues[`PODIUM_${event.data.num}_CUE`] === 'on') {
                this.cues[`PODIUM_${event.data.num}_CUE`] === 'off'
                turnOffPodiumLED(event.data.num);
                const podiumToTrigger = Math.floor(Math.random() * 4) + 1
                this.podiumTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_PODIUM, { podiumToTrigger });
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
    machine.addEvent(machine.events.JOYSTICK_MOVED, { dir });
});
panel.on('leverMoved', (value) => {
    machine.addEvent(machine.events.LEVER_MOVED, { value });
});

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
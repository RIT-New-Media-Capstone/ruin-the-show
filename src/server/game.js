import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

import pkg from "osc";
const osc = pkg;
const oscClient = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 3000,
    remoteAddress: "127.0.0.1",
    remotePort: 7000
});

const moveToPlaying = (machine) => {
    machine.state = 'PLAYING';
    console.log(`State transition: ONBOARDING -> PLAYING`);
    //INITIALIZE ALL GAMEPLAY COMPONENTS HERE (e.g. Score)

    clearTimeout(machine.cheatTimer);
    clearTimeout(machine.applauseTimer);
    clearTimeout(machine.joystickTimer);
    clearTimeout(machine.leverTimer);
    clearTimeout(machine.podiumTimer);

    machine.cues.APPLAUSE_CUE = false;
    machine.cues.CHEAT_CUE = false;
    machine.cues.JOYSTICK_CUE = false;
    machine.cues.LEVER_CUE = false;
    for (let i = 1; i <= 4; i++) {
        machine.cues[`PODIUM_${i}_CUE`] = false;
    }

    turnOffApplauseLED();
    turnOffCheatLED();
    for (let i = 1; i <= 4; i++) {
        turnOffPodiumLED(i);
    }
    
    machine.cheatTimer = null;
    machine.applauseTimer = null;
    machine.joystickTimer = null;
    machine.leverTimer = null;
    machine.podiumTimer = null;

    machine.score = 0
    //Delete below after testing
    machine.scoreApplause = 0
    machine.scoreCheat = 0
    machine.scoreJoystick = 0
    machine.scoreLever = 0
    machine.scorePodium = 0
    
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

//Third variable temporary (For Testing Purposes)
const scoreChange = (machine, scoreEarned, minigame) => {
    machine.score += scoreEarned;
    if(machine.score <= 0) {
        machine.score = 0
    }

    if (scoreEarned > 0) sendOscCue(this.lighting.POSITIVE_FEEDBACK)
    else if (scoreEarned < 0) sendOscCue(this.lighting.NEGATIVE_FEEDBACK)

    console.log("Your total score is: " + machine.score);
    //Delete below after testing
    const key = `score${minigame}`;
    machine[key] += scoreEarned;
    if(machine[key] <= 0) {
        machine[key] = 0
    }
    console.log("Your " + minigame + " score is: " + machine[key]);
}

// GAME MACHINE (Idle, Onboard, Playing (w/ Associated Sub Machine Functions))
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null
    difficulty = 1
    score = 0
    //Testing Purposes: Score Statistics
    scoreApplause = 0
    scoreCheat = 0
    scoreJoystick = 0
    scoreLever = 0
    scorePodium = 0
    //Timeout Timers
    applauseTimer = null
    cheatTimer = null
    joystickTimer = null
    leverTimer = null
    podiumTimer = null
    //Lever Variables
    leverTouched = false
    joystickTouched = false
    //Joystick Variables
    lastDir = null
    targetDir = null

    states = {
        IDLE: 'IDLE',
        ONBOARDING: 'ONBOARDING',
        PLAYING: 'PLAYING',
        END: 'END'
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
        RETURN_IDLE: 'return-idle',
    }

    host = {
        POSITION: Math.floor(Math.random() * 100) - 50,
        DIRECTION: 1,
        VELOCITY: 2,
        PAUSED: false,
        MAX: 50,
        MIN: -50,
    }

    cues = {
        APPLAUSE_CUE: false,
        CHEAT_CUE: false,
        PODIUM_1_CUE: false,
        PODIUM_2_CUE: false,
        PODIUM_3_CUE: false,
        PODIUM_4_CUE: false,
        LEVER_CUE: false,
        LEVER_TARGET: null,
        JOYSTICK_CUE: false,
        JOYSTICK_TARGET: 0, // Host's position on screen
    }

    feedback = { //Call true then settimout false for how many seconds needed to animate?
        APPLAUSE_GOOD: false, //Applause
        APPLAUSE_BAD: false, //Boos
        CHEAT_GOOD: false, // Host Animate (Happy)
        CHEAT_BAD: false, // Host Animate (Mad)
        PODIUM_1_GOOD: false, // Green Light & Contestant (Happy)
        PODIUM_1_BAD: false, // Red Light Contestant (Sad)
        PODIUM_2_GOOD: false,
        PODIUM_2_BAD: false,
        PODIUM_3_GOOD: false,
        PODIUM_3_BAD: false,
        PODIUM_4_GOOD: false,
        PODIUM_4_BAD: false, // ^^^
        LEVER_INITIAL: null,
        LEVER_POS: null, // Zoom Dial Rotating
        JOYSTICK_POS: 0,
        JOYSTICK_GOOD: false, // Spotlight is Green
        JOYSTICK_BAD: false, // Spotlight is Red
    }

    lighting = {
        START_GAME: "start-game",
        WIN: "win", 
        FAIL: "fail", 
        CHEAT: "cheat", 
        PODIUM_1: "podium-1", 
        PODIUM_2: "podium-2",
        PODIUM_3: "podium-3", 
        PODIUM_4: "podium-4", 
        IDLE: "idle", 
        POSITIVE_FEEDBACK: "positive-feedback", 
        NEGATIVE_FEEDBACK: "negative-feedback", 
        ONBOARDING_START: "onboarding-start", 
    }

    constructor(initialState) {
        this.state = initialState;
    }

    getState() {
        return {
            score: this.score,
            state: this.state,
            host: this.host,
            cues: this.cues,
            feedback: this.feedback,
        };
    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        if (!event) return;
        //console.log(`Processing event: ${event.name} in state: ${this.state}`);

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
            const steps = event.data.steps || 0;
            let newPos = this.host.POSITION + steps * this.host.DIRECTION;

            // Boundary check
            if (newPos >= this.host.MAX) {
                newPos = this.host.MAX;
                this.host.DIRECTION = -1; // Flip direction to left
                this.host.PAUSED = true;
                setTimeout(() => { this.host.PAUSED = false; }, 500);
            } else if (newPos <= this.host.MIN) {
                newPos = this.host.MIN;
                this.host.DIRECTION = 1; // Flip direction to right
                this.host.PAUSED = true;
                setTimeout(() => { this.host.PAUSED = false; }, 500);
            }

            this.host.POSITION = newPos;
        }
        
        if (this.state === this.states.IDLE) {                                //IDLE STATE
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                // DEBUG Purposes, goes to onboarding
                this.state = this.states.ONBOARDING;
                console.log(`State transition: IDLE -> ONBOARDING`);
                sendOscCue(this.lighting.ONBOARDING_START)
            }
            if (event.name === this.events.RFID_SCAN) {
                // switch to onboarding
                this.state = this.states.ONBOARDING;
                console.log(`State transition: IDLE -> ONBOARDING`);
                sendOscCue(this.lighting.ONBOARDING_START)
            }
            else {
                return;
            }
        } else if (this.state === this.states.ONBOARDING) {                   //ONBOARDING STATE
            if (event.name === this.events.ONBOARDING_COMPLETE) {
                moveToPlaying(this);
                sendOscCue(this.lighting.START_GAME)
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                moveToPlaying(this);
                sendOscCue(this.lighting.START_GAME)
            }
            else {
                return;
            }
        } else if (this.state === this.states.PLAYING) {                      //PLAYING STATE
            if (event.name === this.events.GAME_OVER) {

                clearTimeout(this.applauseTimer);
                clearTimeout(this.cheatTimer);
                clearTimeout(this.joystickTimer);
                clearTimeout(this.leverTimer);
                clearTimeout(this.podiumTimer);

                this.cues.APPLAUSE_CUE = false;
                this.cues.CHEAT_CUE = false;
                this.cues.JOYSTICK_CUE = false;
                this.cues.LEVER_CUE = false;
                for (let i = 1; i <= 4; i++) {
                    this.cues[`PODIUM_${i}_CUE`] = false;
                }

                turnOffApplauseLED();
                turnOffCheatLED();
                for(let i = 1; i <= 4; i++) {
                    this.cues[`PODIUM_${i}_CUE`] = false
                    turnOffPodiumLED(i);
                }

                //Delete Afterwards; Testing Purposes
                console.log(`Final score: ${this.score} | Applause: ${this.scoreApplause}, Cheat: ${this.scoreCheat}, Joystick: ${this.scoreJoystick}, Lever: ${this.scoreLever}, Podium: ${this.scorePodium}`);

                this.state = this.states.END;

                // However we want to figure win vs lose 
                if (this.score > 0) sendOscCue(this.lighting.WIN)
                else sendOscCue(this.lighting.FAIL)

                console.log(`State transition: PLAYING -> END`);
                turnOnApplauseLED();
                setTimeout(() => {
                    machine.addEvent(machine.events.RETURN_IDLE, {});
                }, 15 * 1000);
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                if (this.cues.APPLAUSE_CUE) {
                    scoreChange(this, 5, "Applause");
                    clearTimeout(this.applauseTimer);
                    this.addEvent(this.events.TURN_OFF_APPLAUSE);
                } else if (!this.cues.APPLAUSE_CUE) {
                    scoreChange(this, -5, "Applause");
                }
            }
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                if (this.cues.CHEAT_CUE) {
                    scoreChange(this, 15, "Cheat");
                    clearTimeout(this.cheatTimer);
                    this.addEvent(this.events.TURN_OFF_CHEAT);
                    this.sendOscCue(this.lighting.CHEAT)
                } else if (!this.cues.CHEAT_CUE) {
                    scoreChange(this, -15, "Cheat");
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
                if (this.cues.LEVER_CUE && this.cues.LEVER_TARGET) {                    
                    const { min, max } = this.cues.LEVER_TARGET;
                    
                    if (pos >= min && pos <= max) {
                        // Successful move
                        scoreChange(this, 7, "Lever");
                        clearTimeout(this.leverTimer);
                        this.cues.LEVER_TARGET = null; // prevent double scoring
                        console.log("Lever moved correctly. Score rewarded.");
                        this.addEvent(this.events.TURN_OFF_LEVER);
                    }
                }
            }
            if (event.name === this.events.PODIUM_BUTTON_PRESSED) {
                const podiumNum = event.data.num
                if (this.cues[`PODIUM_${podiumNum}_CUE`]) {
                    scoreChange(this, 8, "Podium");
                    this.sendOscCue(this.lighting[`PODIUM_${podiumNum}`])
                } else if (!this.cues[`PODIUM_${podiumNum}_CUE`]) {
                    scoreChange(this, -8, "Podium");
                }
                clearTimeout(this.podiumTimer);
                this.addEvent(this.events.TURN_OFF_PODIUM, {num: podiumNum});
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
                    this.cues.JOYSTICK_TARGET = this.host.POSITION;
                    const diff = Math.abs(this.feedback.JOYSTICK_POS - this.cues.JOYSTICK_TARGET)
                    if (this.joystickTouched) {
                        if (diff <= 10) {
                            scoreChange(this, 10, "Joystick");
                            console.log("Joystick moved correctly to target. Score rewarded.")
                        } else {
                            scoreChange(this, -10, "Joystick");
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
                    this.cues.LEVER_TARGET = {min: 85, max: 100};
                    console.log("YOUR LEVER SHOULD GO HIGH")
                } else {
                    this.cues.LEVER_TARGET = {min: 1, max: 15};
                    console.log("YOUR LEVER SHOULD GO LOW")
                }
                this.feedback.LEVER_INITIAL = currentPos;

                this.leverTimer = setTimeout(() => {
                    if (this.cues.LEVER_TARGET) {
                        if (this.leverTouched) {
                            // Moved but failed to hit target
                            scoreChange(this, -7, "Lever");
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
        } else if (this.state === this.states.END) {                          //END STATE
            if (event.name === this.events.RETURN_IDLE) {
                turnOffApplauseLED();
                this.state = this.states.IDLE;
                console.log(`State transition: END -> IDLE`);
                sendOscCue(this.lighting.IDLE)
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                turnOffApplauseLED();
                this.state = this.states.IDLE;
                console.log(`State transition: END -> IDLE`);
                sendOscCue(this.lighting.IDLE)
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
        //console.log(`Event added: ${eventName}`);
    }

    // Helper method to send cues to lighting 
    sendOscCue(cueType) {
        let column = null
        switch (cueType) {
            case this.lighting.START_GAME: 
            column = 0
            break;

            case this.lighting.WIN: 
            column = 0
            break;

            case this.lighting.FAIL: 
            column = 0
            break;

            case this.lighting.CHEAT: 
            column = 0
            break;

            case this.lighting.PODIUM_1: 
            column = 0
            break;

            case this.lighting.PODIUM_2: 
            column = 0
            break;

            case this.lighting.PODIUM_3: 
            column = 0
            break;

            case this.lighting.PODIUM_4: 
            column = 0
            break;

            case this.lighting.IDLE: 
            column = 0
            break;

            case this.lighting.POSITIVE_FEEDBACK: 
            column = 0
            break;

            case this.lighting.NEGATIVE_FEEDBACK: 
            column = 0
            break;

            case this.lighting.ONBOARDING_START: 
            column = 0
            break;
        }

        if(column == null || column <= 0) {
            console.log(`Cue ${cueType} is not valid`)
            return
        } 

        oscClient.send({
            address: `/composition/columns/${column}/connect`,  // selects whole column and plays all animations in column
            args: [{ type: "i", value: 1 }] // type: integer, value: boolean -> turns on column 
        });
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

const updateHostPosition = () => {
    const host = machine.host;

    // Skip if paused
    if (host.paused) {
        setTimeout(updateHostPosition, 100);
        return;
    }

    // 10% chance to pause randomly for a short break mid-track
    if (Math.random() < 0.1) {
        host.paused = true;
        setTimeout(() => {
            host.paused = false;
        }, 300); // brief pause
    }

    // 80% chance to move
    if (Math.random() < 0.8) {
        const steps = 2;
        machine.addEvent(machine.events.HOST_MOVED, { steps });
    }

    setTimeout(updateHostPosition, 100);
};
setTimeout(updateHostPosition, 100);

// On Start Up
const awake = () => {
    console.log("WELCOME TO RUIN THE SHOW! PLEASE SHOW YOUR RFID BAND TO START PLAYING!");
    // Create a new game machine in IDLE state

    // Start the state machine
    machine.run();

    console.log('Current state:', machine.state);

    //DEBUG PURPOSES: START AT PLAYING STATE
    //moveToPlaying(machine);

    
    // Simulate an RFID scan after 5 seconds
    setTimeout(() => {
        machine.addEvent('rfid-scan');
    }, 5000);
};

export { awake, machine }
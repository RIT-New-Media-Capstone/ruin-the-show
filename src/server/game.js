import panel, { turnOnCheatLED, turnOffCheatLED, turnOnApplauseLED, turnOffApplauseLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

// OSC for lighting - connects to resolume (needs to be running on same machine)
import oscpkg from "osc";
const osc = oscpkg;
const oscClient = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 3000,
    remoteAddress: "127.0.0.1",
    remotePort: 7000
});
oscClient.open();

// RFID 
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const EventSource = require('eventsource').EventSource;

const rfidEventSource = new EventSource('http://nm-rfid-5.new-media-metagame.com:8001/sse')

const RTSrfidPresets = {
    idle: {
        duration: 0,
        pattern: "pulse",
        foreground: "#ff00ee",
        background: "#000000",
        period: 2
    },
    onboarding: {
        duration: 0,
        pattern: "solid",
        foreground: "#ff00ee",
    },
    end: {
        good: {
            duration: 0,
            pattern: "comet",
            foreground: "#FFC800",
            background: "#705800",
            period: 0.75
        },
        mid: {
            duration: 0,
            pattern: "comet",
            foreground: "#0091FF",
            background: "#004275",
            period: 0.75
        },
        fail: {
            duration: 0,
            pattern: "comet",
            foreground: "#ff0000",
            background: "#800000",
            period: 0.75
        }
    },
    onSuccessfulTap: {
        duration: 2,
        pattern: "pulse",
        foreground: "#00ff00",
        background: "#000000",
        period: 0.5
    },
    off: {
        duration: 0,
        pattern: "solid",
        foreground: "#000000",
    }
}

const sendLightingPreset = (rtsPreset) => {
    const url = 'http://nm-rfid-5.new-media-metagame.com:8001/lights';

    const body = new URLSearchParams();

    for (const [key, value] of Object.entries(rtsPreset)) {
        if (value !== undefined && value !== null) {
            body.append(key, value.toString());
        }
    }

    fetch(url, {
        method: 'POST',
        body,
    }).then((response) => {
        if (!response.ok) {
            console.error('Failed to set lights:', response.statusText);
        } else {
            console.log('Lights set!');
        }
    });
}


let videoCues = []
const moveToOnboarding = (machine) => {
    machine.debounce = false;
    turnOffApplauseLED();
    machine.state = machine.states.ONBOARDING;
    console.log(`State transition: IDLE -> ONBOARDING`);
    setTimeout(() => {
        machine.addEvent(machine.events.ONBOARDING_COMPLETE, {});
    }, 30 * 1000);
    machine.sendOscCue(machine.lighting.ONBOARDING_START)
    sendLightingPreset(RTSrfidPresets.onboarding)

    // Setup timers for lighting up buttons 
    // Podiums: light one at a time 
    // Rough cues: 1 per second 0-4s
    videoCues.push(setTimeout(() => {
        turnOnPodiumLED(1)
    }, 0 * 1000))
    videoCues.push(setTimeout(() => {
        turnOnPodiumLED(2)
        turnOffPodiumLED(1)
    }, 1 * 1000))
    videoCues.push(setTimeout(() => {
        turnOnPodiumLED(3)
        turnOffPodiumLED(2)
    }, 2 * 1000))
    videoCues.push(setTimeout(() => {
        turnOnPodiumLED(4)
        turnOffPodiumLED(3)
    }, 3 * 1000))
    videoCues.push(setTimeout(() => {
        turnOffPodiumLED(4)
    }, 4 * 1000))

    // Applause
    // Rough cues: 4-8s on 
    videoCues.push(setTimeout(() => {
        turnOnApplauseLED()
    }, 4 * 1000))
    videoCues.push(setTimeout(() => {
        turnOffApplauseLED()
    }, 8 * 1000))

    // Lever
    // No podium cue, rough cues: 8-12s

    // Cheat
    // Rough cues: 12-17s 
    videoCues.push(setTimeout(() => {
        turnOnCheatLED()
    }, 12 * 1000))
    videoCues.push(setTimeout(() => {
        turnOffCheatLED()
    }, 17 * 1000))

    // Joystick 
    // No podium cue, rough cues: 17-22s 
}

const moveToPlaying = (machine) => {
    // Clean up onboarding cues
    videoCues.forEach(clearTimeout)
    videoCues.length = 0
    for (let i = 1; i <= 4; i++) {
        turnOffPodiumLED(i)
    }
    turnOffApplauseLED()
    turnOffCheatLED()

    sendLightingPreset(RTSrfidPresets.off)

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

    // Start the game timer | Intial Delay
    setTimeout(() => {
        machine.addEvent(machine.events.GAME_OVER, {});
    }, 60 * 1000);
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_APPLAUSE, {});
    }, machine.applause.initialDelay * 1000); // prev val: 3   E: x M: x H: x
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_CHEAT, {});
    }, machine.cheat.initialDelay * 1000);  // prev val: 2   E: x M: x H: x
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_JOYSTICK, {});
    }, machine.joystick.initialDelay * 1000); // prev val: 3   E: x M: x H: x
    setTimeout(() => {
        const podiumToTrigger = Math.floor(Math.random() * 4) + 1
        machine.addEvent(machine.events.TURN_ON_PODIUM, { num: podiumToTrigger });
    }, machine.podium.initialDelay * 1000); // prev val: 3   E: x M: x H: x
    setTimeout(() => {
        machine.addEvent(machine.events.TURN_ON_LEVER, {});
    }, machine.lever.initialDelay * 1000); // prev val: 5   E: x M: x H: x
}

//Third variable temporary (For Testing Purposes)
const scoreChange = (machine, scoreEarned, minigame) => {
    machine.score += scoreEarned;
    if (machine.score <= 0) {
        machine.score = 0
    }

    //Uncomment for Midi testing
    //if (scoreEarned > 0) this.sendOscCue(this.lighting.POSITIVE_FEEDBACK)
    //else if (scoreEarned < 0) this.sendOscCue(this.lighting.NEGATIVE_FEEDBACK)

    console.log("Your total score is: " + machine.score);
    //Delete below after testing
    const key = `score${minigame}`;
    machine[key] += scoreEarned;
    if (machine[key] <= 0) {
        machine[key] = 0
    }
    console.log("Your " + minigame + " score is: " + machine[key]);
}

// Helper random
const randomRange = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
}

// GAME MACHINE (Idle, Onboard, Playing (w/ Associated Sub Machine Functions))
class GameMachine {
    eventQueue = []
    isRunning = false
    loopHandle = null
    difficulty = 1
    score = 0
    debounce = false;
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
    messages_for_frontend = []

    // End screen states
    scoreThreshold = {
        good: 200,
        mid: 100,
        fail: 0,
    }

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
        APPLAUSE_GOOD: 'applause-good', //Applause
        APPLAUSE_BAD: 'applause-bad', //Boos
        CHEAT_GOOD: 'cheat-good', // Host Animate (Happy)
        CHEAT_BAD: 'cheat-bad', // Host Animate (Mad)
        PODIUM_GOOD: 'podium-good', // Green Light & Contestant (Happy)
        PODIUM_BAD: 'podium-bad', // Red Light Contestant (Sad)
        LEVER_INITIAL: null,
        LEVER_POS: null, // Zoom Dial Rotating
        LEVER_GOOD: 'lever-good',
        LEVER_BAD: 'lever-bad',
        JOYSTICK_POS: 0,
        JOYSTICK_GOOD: 'joystick-good', // Spotlight is Green
        JOYSTICK_BAD: 'joystick-bad', // Spotlight is Red
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

    // Variables for each minigame values
    // If one set value, make max = (min + 1)
    applause = {
        initialDelay: 5,
        onMin: 8,
        onMax: 11,
        cooldownMin: 2,
        cooldownMax: 3,
        points: 5,
    }

    cheat = {
        initialDelay: 10,
        onMin: 4,
        onMax: 9,
        cooldownMin: 5,
        cooldownMax: 9,
        points: 15,
    }

    joystick = {
        initialDelay: 20,
        onMin: 10,
        onMax: 11,
        cooldownMin: 8,
        cooldownMax: 11,
        points: 10,
    }

    podium = {
        initialDelay: 8,
        onMin: 3,
        onMax: 7,
        cooldownMin: 3,
        cooldownMax: 4,
        points: 8,
    }

    lever = {
        initialDelay: 12,
        onMin: 6,
        onMax: 12,
        cooldownMin: 5,
        cooldownMax: 6,
        points: 7,
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
        // console.log(`Processing event: ${event.name} in state: ${this.state}`);

        if (event.name === this.events.LEVER_MOVED) { //LEVER VALUE INITIALIZATION
            let position = event.data.value
            if (position > 100) {
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
                machine.messages_for_frontend.push({
                    name: 'turnForLeft',
                    target: 'al'
                })
                this.host.PAUSED = true;
                setTimeout(() => { this.host.PAUSED = false; }, 500);
            } else if (newPos <= this.host.MIN) {
                newPos = this.host.MIN;
                this.host.DIRECTION = 1; // Flip direction to right
                machine.messages_for_frontend.push({
                    name: 'turnForRight',
                    target: 'al'
                })
                this.host.PAUSED = true;
                setTimeout(() => { this.host.PAUSED = false; }, 500);
            } else {
                const walkDir = this.host.DIRECTION > 0 ? 'walkRight' : 'walkLeft'
                machine.messages_for_frontend.push({
                    name: walkDir,
                    target: 'al'
                })
            }

            this.host.POSITION = newPos;
        }

        if (this.state === this.states.IDLE) {                                //IDLE STATE
            if (this.debounce === false) {
                setTimeout(() => { this.debounce = true }, 1000);
            } else {
                turnOnApplauseLED();
                if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                    moveToOnboarding(this)
                }
            }
            if (event.name === this.events.RFID_SCAN) {
                sendLightingPreset(RTSrfidPresets.onSuccessfulTap)
                moveToOnboarding(this)
            }
            else {
                return;
            }
        } else if (this.state === this.states.ONBOARDING) {                   //ONBOARDING STATE
            if (this.debounce === false) {
                setTimeout(() => { this.debounce = true }, 1000);
            } else {
                // Scan RFID to exit early
                if (event.name === this.events.RFID_SCAN) {
                    this.debounce = false;
                    sendLightingPreset(RTSrfidPresets.onSuccessfulTap)
                    moveToPlaying(this);
                    this.sendOscCue(this.lighting.START_GAME)
                }
            }
            if (event.name === this.events.ONBOARDING_COMPLETE) {
                moveToPlaying(this);
                this.sendOscCue(this.lighting.START_GAME)
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
                for (let i = 1; i <= 4; i++) {
                    this.cues[`PODIUM_${i}_CUE`] = false
                    turnOffPodiumLED(i);
                }

                //Delete Afterwards; Testing Purposes
                console.log(`Final score: ${this.score} | Applause: ${this.scoreApplause}, Cheat: ${this.scoreCheat}, Joystick: ${this.scoreJoystick}, Lever: ${this.scoreLever}, Podium: ${this.scorePodium}`);

                this.debounce = false
                this.state = this.states.END;

                // However we want to figure win vs lose 
                if (this.score > 0) this.sendOscCue(this.lighting.WIN)
                else this.sendOscCue(this.lighting.FAIL)

                console.log(`State transition: PLAYING -> END`);
                setTimeout(() => {
                    machine.addEvent(machine.events.RETURN_IDLE, {});
                }, 15 * 1000);

                if (this.score >= this.scoreThreshold.good) sendLightingPreset(RTSrfidPresets.end.good)
                else if (this.score >= this.scoreThreshold.mid) sendLightingPreset(RTSrfidPresets.end.mid)
                else if (this.score >= this.scoreThreshold.fail) sendLightingPreset(RTSrfidPresets.end.fail)
                else sendLightingPreset(RTSrfidPresets.off)
            }
            if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                if (this.cues.APPLAUSE_CUE) {
                    scoreChange(this, this.applause.points, "Applause");
                    clearTimeout(this.applauseTimer);
                    this.addEvent(this.events.TURN_OFF_APPLAUSE);
                    this.addEvent(this.feedback.APPLAUSE_GOOD, {});
                } else if (!this.cues.APPLAUSE_CUE) {
                    scoreChange(this, -1 * this.applause.points, "Applause");
                    this.addEvent(this.feedback.APPLAUSE_BAD, {});
                }
            }
            if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
                if (this.cues.CHEAT_CUE) {
                    scoreChange(this, this.cheat.points, "Cheat");
                    clearTimeout(this.cheatTimer);
                    this.addEvent(this.feedback.CHEAT_GOOD, {});
                    this.addEvent(this.events.TURN_OFF_CHEAT);
                    this.sendOscCue(this.lighting.CHEAT)
                    this.sendOscCue(this.lighting.IDLE)
                } else if (!this.cues.CHEAT_CUE) {
                    scoreChange(this, -1 * this.cheat.points, "Cheat");
                    this.addEvent(this.feedback.CHEAT_BAD, {});
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
                        scoreChange(this, this.lever.points, "Lever");
                        this.addEvent(this.feedback.LEVER_GOOD, {});
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
                    scoreChange(this, this.podium.points, "Podium");
                    this.addEvent(this.feedback.PODIUM_GOOD, { podiumNum });
                    this.sendOscCue(this.lighting[`PODIUM_${podiumNum}`])
                } else if (!this.cues[`PODIUM_${podiumNum}_CUE`]) {
                    scoreChange(this, -1 * this.podium.points, "Podium");
                    this.addEvent(this.feedback.PODIUM_BAD, { podiumNum });
                }
                clearTimeout(this.podiumTimer);
                this.addEvent(this.events.TURN_OFF_PODIUM, { num: podiumNum });
            }

            // Set on-states
            if (event.name === this.events.TURN_ON_APPLAUSE && !this.cues.APPLAUSE_CUE) {
                this.cues.APPLAUSE_CUE = true
                turnOnApplauseLED();
                this.applauseTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_APPLAUSE, {});
                }, randomRange(this.applause.onMin, this.applause.onMax) * 1000);
            }
            if (event.name === this.events.TURN_ON_CHEAT && !this.cues.CHEAT_CUE) {
                this.cues.CHEAT_CUE = true
                turnOnCheatLED();
                this.cheatTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_CHEAT, {});
                }, randomRange(this.cheat.onMin, this.cheat.onMax) * 1000);
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
                            scoreChange(this, this.joystick.points, "Joystick");
                            this.addEvent(this.feedback.JOYSTICK_GOOD, {});
                            console.log("Joystick moved correctly to target. Score rewarded.")
                        } else {
                            scoreChange(this, -1 * this.joystick.points, "Joystick");
                            this.addEvent(this.feedback.JOYSTICK_BAD, {});
                            console.log("Joystick missed the target. Score penalized.")
                        }
                    } else {
                        console.log("Joystick was not touched. Nothing happens")
                    }
                    this.addEvent(this.events.TURN_OFF_JOYSTICK, {});
                }, randomRange(this.joystick.onMin, this.joystick.onMax) * 1000);
            }
            if (event.name === this.events.TURN_ON_LEVER && !this.cues.LEVER_CUE) {
                this.cues.LEVER_CUE = true
                this.leverTouched = false;

                const currentPos = this.feedback.LEVER_POS;
                if (currentPos <= 50) {
                    this.cues.LEVER_TARGET = { min: 85, max: 100 };
                    console.log("YOUR LEVER SHOULD GO HIGH")
                } else {
                    this.cues.LEVER_TARGET = { min: 1, max: 15 };
                    console.log("YOUR LEVER SHOULD GO LOW")
                }
                this.feedback.LEVER_INITIAL = currentPos;

                this.leverTimer = setTimeout(() => {
                    if (this.cues.LEVER_TARGET) {
                        if (this.leverTouched) {
                            // Moved but failed to hit target
                            scoreChange(this, -1 * this.lever.points, "Lever");
                            this.addEvent(this.feedback.LEVER_BAD, {});
                            console.log("Lever moved but missed target. Score penalized.");
                        } else {
                            console.log("Lever not touched. No penalty.");
                        }
                    }
                    this.addEvent(this.events.TURN_OFF_LEVER, {});
                }, randomRange(this.lever.onMin, this.lever.onMax) * 1000);
            }
            if (event.name === this.events.TURN_ON_PODIUM && !this.cues[`PODIUM_${event.data.num}_CUE`]) {
                this.cues[`PODIUM_${event.data.num}_CUE`] = true
                turnOnPodiumLED(event.data.num);
                this.podiumTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_OFF_PODIUM, { num: event.data.num });
                }, randomRange(this.podium.onMin, this.podium.onMax) * 1000);
            }

            // Set off-states
            if (event.name === this.events.TURN_OFF_APPLAUSE && this.cues.APPLAUSE_CUE) {
                this.cues.APPLAUSE_CUE = false
                turnOffApplauseLED();
                this.applauseTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_APPLAUSE, {});
                }, randomRange(this.applause.cooldownMin, this.applause.cooldownMax) * 1000);
            }
            if (event.name === this.events.TURN_OFF_CHEAT && this.cues.CHEAT_CUE) {
                this.cues.CHEAT_CUE = false
                turnOffCheatLED();
                this.cheatTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_CHEAT, {});
                }, randomRange(this.cheat.cooldownMin, this.cheat.cooldownMax) * 1000);
            }
            if (event.name === this.events.TURN_OFF_JOYSTICK && this.cues.JOYSTICK_CUE) {
                this.cues.JOYSTICK_CUE = false
                this.joystickTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_JOYSTICK, {});
                }, randomRange(this.joystick.cooldownMin, this.joystick.cooldownMax) * 1000);
            }
            if (event.name === this.events.TURN_OFF_LEVER && this.cues.LEVER_CUE) {
                this.cues.LEVER_CUE = false
                this.leverTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_LEVER, {});
                }, randomRange(this.lever.cooldownMin, this.lever.cooldownMax) * 1000);
            }
            if (event.name == this.events.TURN_OFF_PODIUM) {
                for (let i = 1; i <= 4; i++) {
                    this.cues[`PODIUM_${i}_CUE`] = false
                    turnOffPodiumLED(i);
                }
                const podiumToTrigger = Math.floor(Math.random() * 4) + 1
                this.podiumTimer = setTimeout(() => {
                    this.addEvent(this.events.TURN_ON_PODIUM, { num: podiumToTrigger });
                }, randomRange(this.podium.cooldownMin, this.podium.cooldownMax) * 1000);
            }
            // Set feedback 
            if (event.name === this.feedback.PODIUM_GOOD) {
                const podiumNum = event.data.podiumNum
                machine.messages_for_frontend.push({
                    name: 'right',
                    target: podiumNum
                })
                machine.messages_for_frontend.push({
                    name: 'green',
                    target: 'podium',
                    location: podiumNum
                })
                setTimeout(() => {
                    machine.messages_for_frontend.push({
                        name: 'idle',
                        target: podiumNum
                    })
                }, 4 * 1000);
            }
            if (event.name === this.feedback.PODIUM_BAD) {
                const podiumNum = event.data.podiumNum
                machine.messages_for_frontend.push({
                    name: 'wrong',
                    target: podiumNum
                })
                machine.messages_for_frontend.push({
                    name: 'red',
                    target: 'podium',
                    location: podiumNum
                })

                setTimeout(() => {
                    machine.messages_for_frontend.push({
                        name: 'idle',
                        target: podiumNum
                    })
                }, 4 * 1000);
            }
            if (event.name === this.feedback.APPLAUSE_GOOD) {
                machine.messages_for_frontend.push({
                    name: 'stars',
                    target: 'audience'
                })
            }
            if (event.name === this.feedback.APPLAUSE_BAD) {
                machine.messages_for_frontend.push({
                    name: 'hands',
                    target: 'audience'
                })
            }
            if (event.name === this.feedback.CHEAT_GOOD) {
                machine.messages_for_frontend.push({
                    name: 'green',
                    target: 'screen'
                })
            }
            if (event.name === this.feedback.CHEAT_BAD) {
                machine.messages_for_frontend.push({
                    name: 'red',
                    target: 'screen'
                })
            }
            if (event.name === this.feedback.JOYSTICK_GOOD) {
                machine.messages_for_frontend.push({
                    name: 'green',
                    target: 'light'
                })
            }
            if (event.name === this.feedback.JOYSTICK_BAD) {
                machine.messages_for_frontend.push({
                    name: 'red',
                    target: 'light'
                })
            }
            if (event.name === this.feedback.LEVER_GOOD) {
                machine.messages_for_frontend.push({
                    name: 'green',
                    target: 'dial'
                })
            }
            if (event.name === this.feedback.LEVER_BAD) {
                machine.messages_for_frontend.push({
                    name: 'red',
                    target: 'dial'
                })
            }
        } else if (this.state === this.states.END) {                          //END STATE
            if (this.debounce === false) {
                setTimeout(() => { this.debounce = true }, 3 * 1000);
            } else {
                turnOnApplauseLED();
                if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
                    turnOffApplauseLED();
                    this.debounce = false
                    this.state = this.states.IDLE;
                    console.log(`State transition: END -> IDLE`);
                    this.sendOscCue(this.lighting.IDLE)

                    sendLightingPreset(RTSrfidPresets.idle)
                }
                else if (event.name === this.events.RFID_SCAN) {
                    sendLightingPreset(RTSrfidPresets.onSuccessfulTap)
                    turnOffApplauseLED();
                    this.debounce = false
                    this.state = this.states.IDLE;
                    console.log(`State transition: END -> IDLE`);
                    this.sendOscCue(this.lighting.IDLE)
                    sendLightingPreset(RTSrfidPresets.idle)
                }
            }
            if (event.name === this.events.RETURN_IDLE) {
                turnOffApplauseLED();
                this.debounce = false
                this.state = this.states.IDLE;
                console.log(`State transition: END -> IDLE`);
                this.sendOscCue(this.lighting.IDLE)
                sendLightingPreset(RTSrfidPresets.idle)
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
        this.sendOscCue(this.lighting.IDLE)
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
        // console.log(`Event added: ${eventName}`);
    }

    // Helper method to send cues to lighting 
    sendOscCue(cueType) {
        let column = null
        switch (cueType) {
            case this.lighting.START_GAME:
                column = 1
                break;

            case this.lighting.WIN:
                column = 4
                break;

            case this.lighting.FAIL:
                column = 5
                break;

            case this.lighting.CHEAT:
                column = 6
                break;

            case this.lighting.PODIUM_1:
                column = 9
                break;

            case this.lighting.PODIUM_2:
                column = 10
                break;

            case this.lighting.PODIUM_3:
                column = 11
                break;

            case this.lighting.PODIUM_4:
                column = 12
                break;

            case this.lighting.IDLE:
                column = 3
                break;

            case this.lighting.POSITIVE_FEEDBACK:
                column = 7
                break;

            case this.lighting.NEGATIVE_FEEDBACK:
                column = 8
                break;

            case this.lighting.ONBOARDING_START:
                column = 2
                break;
        }

        if (column == null || column <= 0) {
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
    if (host.PAUSED) {
        setTimeout(updateHostPosition, 100);
        return;
    }

    // 10% chance to pause randomly for a short break mid-track
    if (Math.random() < 0.1) {
        host.PAUSED = true;
        machine.messages_for_frontend.push({
            name: 'idle',
            target: 'al'
        })
        setTimeout(() => {
            host.PAUSED = false;
        }, 300); // brief pause
    }

    // 80% chance to move
    if (Math.random() < 0.8) {
        const steps = 1;
        machine.addEvent(machine.events.HOST_MOVED, { steps });
    }

    setTimeout(updateHostPosition, 100);
};
setTimeout(updateHostPosition, 100);

// On Start Up
const awake = () => {
    console.log("WELCOME TO RUIN THE SHOW! PLEASE SHOW YOUR RFID BAND TO START PLAYING!");
    sendLightingPreset(RTSrfidPresets.idle)
    // Create a new game machine in IDLE state

    // Start the state machine
    machine.run();

    // DEBUG: Set starting state
    // machine.state = machine.states.END
    // machine.score = 240

    console.log('Current state:', machine.state);

    //DEBUG PURPOSES: START AT PLAYING STATE
    //moveToPlaying(machine);


    rfidEventSource.addEventListener('message', (event) => {
        const data = event.data
        if (data) {
            machine.addEvent(machine.events.RFID_SCAN)
        }
    })

};

export { awake, machine }
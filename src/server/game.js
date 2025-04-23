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

// Optimized state transition function with better event initialization
const moveToPlaying = (machine) => {
    machine.state = 'PLAYING';
    console.log(`State transition: ONBOARDING -> PLAYING`);
    
    // Clear all active timers at once
    const timers = [
        machine.cheatTimer, 
        machine.applauseTimer, 
        machine.joystickTimer, 
        machine.leverTimer, 
        machine.podiumTimer
    ];
    
    timers.forEach(timer => clearTimeout(timer));

    // Reset all cues at once
    machine.cues.APPLAUSE_CUE = false;
    machine.cues.CHEAT_CUE = false;
    machine.cues.JOYSTICK_CUE = false;
    machine.cues.LEVER_CUE = false;
    
    // Reset all podium cues in a loop
    for (let i = 1; i <= 4; i++) {
        machine.cues[`PODIUM_${i}_CUE`] = false;
        turnOffPodiumLED(i);
    }

    // Clear LED states
    turnOffApplauseLED();
    turnOffCheatLED();

    // Nullify all timers
    machine.cheatTimer = machine.applauseTimer = machine.joystickTimer = 
    machine.leverTimer = machine.podiumTimer = null;

    // Reset score
    machine.score = 0;
    machine.scoreApplause = 0;
    machine.scoreCheat = 0;
    machine.scoreJoystick = 0;
    machine.scoreLever = 0;
    machine.scorePodium = 0;

    // Pre-schedule the game events with proper timeouts
    // Use a configuration object for better maintenance
    const eventSchedule = [
        { event: machine.events.GAME_OVER, delay: 60 * 1000, data: {} },
        { event: machine.events.TURN_ON_APPLAUSE, delay: 3 * 1000, data: {} },
        { event: machine.events.TURN_ON_CHEAT, delay: 2 * 1000, data: {} },
        { event: machine.events.TURN_ON_JOYSTICK, delay: 3 * 1000, data: {} },
        { 
            event: machine.events.TURN_ON_PODIUM, 
            delay: 3 * 1000, 
            data: { num: Math.floor(Math.random() * 4) + 1 } 
        },
        { event: machine.events.TURN_ON_LEVER, delay: 5 * 1000, data: {} }
    ];
    
    // Schedule all events at once
    eventSchedule.forEach(item => {
        setTimeout(() => {
            machine.addEvent(item.event, item.data);
        }, item.delay);
    });
}

// Optimized score change function with batched updates
const scoreChange = (machine, scoreEarned, minigame) => {
    // Update the main score and ensure it doesn't go below 0
    machine.score = Math.max(0, machine.score + scoreEarned);
    
    // Also update the minigame-specific score for testing
    const key = `score${minigame}`;
    if (machine[key] !== undefined) {
        machine[key] = Math.max(0, machine[key] + scoreEarned);
    }
    
    // Log only once with both scores
    console.log(`Your total score is: ${machine.score}`);
    if (key && machine[key] !== undefined) {
        console.log(`Your ${minigame} score is: ${machine[key]}`);
    }
}

// GAME MACHINE (Idle, Onboard, Playing (w/ Associated Sub Machine Functions))
class GameMachine {
    // Use more efficient data structures and event management
    eventQueue = []
    eventBatch = [] // New batch processing array
    isRunning = false
    loopHandle = null
    difficulty = 1
    score = 0
    debounce = false
    
    // Testing Purposes: Score Statistics
    scoreApplause = 0
    scoreCheat = 0
    scoreJoystick = 0
    scoreLever = 0
    scorePodium = 0
    
    // Timeout Timers - combine related timers
    applauseTimer = null
    cheatTimer = null
    joystickTimer = null
    leverTimer = null
    podiumTimer = null
    
    // Game mechanic state
    leverTouched = false
    joystickTouched = false
    lastDir = null
    targetDir = null
    
    // Message queue with batching
    messages_for_frontend = []
    messagesBatch = []
    lastMessageBatchTime = 0
    MESSAGE_BATCH_INTERVAL = 50 // ms between message batches
    
    // Cache frequently used values and objects
    cachedHostPosition = 0

    states = {
        IDLE: 'IDLE',
        ONBOARDING: 'ONBOARDING',
        PLAYING: 'PLAYING',
        END: 'END'
    }

    events = {
        // Inputs Received
        RFID_SCAN: 'rfid-scan',
        CHEAT_BUTTON_PRESSED: 'cheat-button-pressed',
        APPLAUSE_BUTTON_PRESSED: 'applause-button-pressed',
        PODIUM_BUTTON_PRESSED: 'podium-button-pressed',
        JOYSTICK_MOVED: 'joystick-moved',
        LEVER_MOVED: 'lever-moved',
        // Inputs Given
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
        // Possible Time (Auto) Events
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

    feedback = {
        APPLAUSE_GOOD: 'applause-good',
        APPLAUSE_BAD: 'applause-bad',
        CHEAT_GOOD: 'cheat-good',
        CHEAT_BAD: 'cheat-bad',
        PODIUM_GOOD: 'podium-good',
        PODIUM_BAD: 'podium-bad',
        LEVER_INITIAL: null,
        LEVER_POS: null,
        LEVER_GOOD: 'lever-good',
        LEVER_BAD: 'lever-bad',
        JOYSTICK_POS: 0,
        JOYSTICK_GOOD: 'joystick-good',
        JOYSTICK_BAD: 'joystick-bad',
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
        // Initialize performance monitoring
        this.eventCount = 0;
        this.messageCount = 0;
        this.lastPerfCheck = Date.now();
        
        // Set up periodic performance logging
        setInterval(() => this.logPerformance(), 10000);
        
        // Set up message batching
        setInterval(() => this.flushMessageBatch(), this.MESSAGE_BATCH_INTERVAL);
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
    
    // Performance monitoring
    logPerformance() {
        const now = Date.now();
        const elapsed = (now - this.lastPerfCheck) / 1000;
        
        if (elapsed > 0) {
            const eventsPerSec = (this.eventCount / elapsed).toFixed(2);
            const messagesPerSec = (this.messageCount / elapsed).toFixed(2);
            
            console.log(`Performance: ${eventsPerSec} events/sec, ${messagesPerSec} messages/sec`);
            
            // Reset counters
            this.eventCount = 0;
            this.messageCount = 0;
            this.lastPerfCheck = now;
        }
    }
    
    // Message batching
    flushMessageBatch() {
        if (this.messagesBatch.length > 0) {
            // Add batched messages to the main queue
            this.messages_for_frontend.push(...this.messagesBatch);
            this.messageCount += this.messagesBatch.length;
            
            // Clear the batch
            this.messagesBatch = [];
        }
    }
    
    // Add a message to the batch instead of directly to the queue
    addMessage(message) {
        this.messagesBatch.push(message);
        
        // If this is urgent or we have many messages, flush immediately
        if (this.messagesBatch.length > 10) {
            this.flushMessageBatch();
        }
    }

    // This is your (state, event) => state function
    step() {
        const event = this.eventQueue.shift();
        if (!event) return;
        
        // Count processed events for performance monitoring
        this.eventCount++;

        // Process LEVER_MOVED events with value normalization
        if (event.name === this.events.LEVER_MOVED) {
            // Constrain lever value to valid range 1-100
            this.feedback.LEVER_POS = Math.max(1, Math.min(100, event.data.value));
        }

        // Process HOST_MOVED events
        if (event.name === this.events.HOST_MOVED) {
            if (this.host.PAUSED) return; // Skip if host is paused
            
            const steps = event.data.steps || 0;
            let newPos = this.host.POSITION + steps * this.host.DIRECTION;

            // Boundary checks with animation triggers
            if (newPos >= this.host.MAX) {
                newPos = this.host.MAX;
                this.host.DIRECTION = -1; // Flip direction to left
                this.addMessage({
                    name: 'turnForLeft',
                    target: 'al'
                });
                this.host.PAUSED = true;
                setTimeout(() => { this.host.PAUSED = false; }, 500);
            } else if (newPos <= this.host.MIN) {
                newPos = this.host.MIN;
                this.host.DIRECTION = 1; // Flip direction to right
                this.addMessage({
                    name: 'turnForRight',
                    target: 'al'
                });
                this.host.PAUSED = true;
                setTimeout(() => { this.host.PAUSED = false; }, 500);
            } else {
                // Only send animation message if position changed significantly
                if (Math.abs(newPos - this.cachedHostPosition) > 2) {
                    const walkDir = this.host.DIRECTION > 0 ? 'walkRight' : 'walkLeft';
                    this.addMessage({
                        name: walkDir,
                        target: 'al'
                    });
                    this.cachedHostPosition = newPos;
                }
            }

            this.host.POSITION = newPos;
        }

        // State machine with optimized state handling
        switch (this.state) {
            case this.states.IDLE:
                this.handleIdleState(event);
                break;
                
            case this.states.ONBOARDING:
                this.handleOnboardingState(event);
                break;
                
            case this.states.PLAYING:
                this.handlePlayingState(event);
                break;
                
            case this.states.END:
                this.handleEndState(event);
                break;
        }
    }
    
    // Break down state handling into separate methods for clarity and optimization
    handleIdleState(event) {
        if(this.debounce === false) {
            setTimeout(() => {this.debounce = true}, 1000);
            return;
        }
        
        // Handle applause button in IDLE state
        if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
            this.debounce = false;
            turnOffApplauseLED();
            this.state = this.states.ONBOARDING;
            console.log(`State transition: IDLE -> ONBOARDING`);
            
            // Schedule onboarding completion
            setTimeout(() => {
                this.addEvent(this.events.ONBOARDING_COMPLETE, {});
            }, 30 * 1000);
            
            this.sendOscCue(this.lighting.ONBOARDING_START)
            return;
        }
        
        // Handle RFID scan
        if (event.name === this.events.RFID_SCAN) {
            turnOffApplauseLED();
            this.state = this.states.ONBOARDING;
            console.log(`State transition: IDLE -> ONBOARDING`);
            
            setTimeout(() => {
                this.addEvent(this.events.ONBOARDING_COMPLETE, {});
            }, 30 * 1000);
            
            this.sendOscCue(this.lighting.ONBOARDING_START)
            return;
        }
        
        // Turn on applause LED
        turnOnApplauseLED();
    }
    
    handleOnboardingState(event) {
        if(this.debounce === false) {
            setTimeout(() => {this.debounce = true}, 1000);
            return;
        }
        
        // Handle applause button
        if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
            this.debounce = false;
            turnOffApplauseLED();
            moveToPlaying(this);
            this.sendOscCue(this.lighting.START_GAME)
            return;
        }
        
        // Turn on applause LED
        turnOnApplauseLED();
        
        // Handle onboarding complete
        if (event.name === this.events.ONBOARDING_COMPLETE) {
            turnOffApplauseLED();
            moveToPlaying(this);
            this.sendOscCue(this.lighting.START_GAME)
        }
    }
    
    handlePlayingState(event) {
        // Handle game over
        if (event.name === this.events.GAME_OVER) {
            this.handleGameOver();
            return;
        }
        
        // Handle player inputs
        this.handlePlayerInput(event);
        
        // Handle game state changes
        this.handleStateChange(event);
    }
    
    handleGameOver() {
        // Clear all timers
        [
            this.applauseTimer,
            this.cheatTimer,
            this.joystickTimer,
            this.leverTimer,
            this.podiumTimer
        ].forEach(timer => clearTimeout(timer));
        
        // Reset all cues
        this.cues.APPLAUSE_CUE = false;
        this.cues.CHEAT_CUE = false;
        this.cues.JOYSTICK_CUE = false;
        this.cues.LEVER_CUE = false;
        
        // Reset all podium cues
        for (let i = 1; i <= 4; i++) {
            this.cues[`PODIUM_${i}_CUE`] = false;
            turnOffPodiumLED(i);
        }
        
        // Turn off LEDs
        turnOffApplauseLED();
        turnOffCheatLED();
        
        // Log final score
        console.log(`Final score: ${this.score} | Applause: ${this.scoreApplause}, Cheat: ${this.scoreCheat}, Joystick: ${this.scoreJoystick}, Lever: ${this.scoreLever}, Podium: ${this.scorePodium}`);
        
        // Transition to END state
        this.debounce = false;
        this.state = this.states.END;
        
        // Send appropriate OSC cue
        if (this.score > 0) {
            this.sendOscCue(this.lighting.WIN);
        } else {
            this.sendOscCue(this.lighting.FAIL);
        }
        
        console.log(`State transition: PLAYING -> END`);
        
        // Schedule return to IDLE
        setTimeout(() => {
            this.addEvent(this.events.RETURN_IDLE, {});
        }, 15 * 1000);
    }
    
    handlePlayerInput(event) {
        // Handle applause button
        if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
            if (this.cues.APPLAUSE_CUE) {
                scoreChange(this, 5, "Applause");
                clearTimeout(this.applauseTimer);
                this.addEvent(this.events.TURN_OFF_APPLAUSE);
                this.addEvent(this.feedback.APPLAUSE_GOOD, { });
            } else {
                scoreChange(this, -5, "Applause");
                this.addEvent(this.feedback.APPLAUSE_BAD, { });
            }
        }
        
        // Handle cheat button
        if (event.name === this.events.CHEAT_BUTTON_PRESSED) {
            if (this.cues.CHEAT_CUE) {
                scoreChange(this, 15, "Cheat");
                clearTimeout(this.cheatTimer);
                this.addEvent(this.feedback.CHEAT_GOOD, { });
                this.addEvent(this.events.TURN_OFF_CHEAT);
                this.sendOscCue(this.lighting.CHEAT);
                this.sendOscCue(this.lighting.IDLE);
            } else {
                scoreChange(this, -15, "Cheat");
                this.addEvent(this.feedback.CHEAT_BAD, { });
            }
        }
        
        // Handle joystick with debouncing
        let lastJoystickValue = 0;
        let joystickTimeout = null;

        panel.on('joystickMoved', (dir) => {
        // Completely ignore rapidly repeated values
        if (dir === lastJoystickValue) return;
        lastJoystickValue = dir;

        // Clear any pending joystick updates
        if (joystickTimeout) {
            clearTimeout(joystickTimeout);
        }

        // Delay ALL joystick processing by 100ms
        joystickTimeout = setTimeout(() => {
            // Only process significant movements
            if (Math.abs(dir) >= 2) {
            machine.addEvent(machine.events.JOYSTICK_MOVED, { dir });
            }
            joystickTimeout = null;
        }, 100);
        });
        
        // Handle lever moved
        if (event.name === this.events.LEVER_MOVED) {
            const pos = this.feedback.LEVER_POS;
            const start = this.feedback.LEVER_INITIAL || pos;
            
            //Handling for sensitive lever
            if (!this.leverTouched && Math.abs(pos - start) > 3) {
                this.leverTouched = true;
            }
            
            // Check if lever hit target
            if (this.cues.LEVER_CUE && this.cues.LEVER_TARGET) {
                const { min, max } = this.cues.LEVER_TARGET;
                
                if (pos >= min && pos <= max) {
                    // Successful move
                    scoreChange(this, 7, "Lever");
                    this.addEvent(this.feedback.LEVER_GOOD, { });
                    clearTimeout(this.leverTimer);
                    this.cues.LEVER_TARGET = null; // prevent double scoring
                    console.log("Lever moved correctly. Score rewarded.");
                    this.addEvent(this.events.TURN_OFF_LEVER);
                }
            }
        }
        
        // Handle podium button
        if (event.name === this.events.PODIUM_BUTTON_PRESSED) {
            const podiumNum = event.data.num;
            
            if (this.cues[`PODIUM_${podiumNum}_CUE`]) {
                scoreChange(this, 8, "Podium");
                this.addEvent(this.feedback.PODIUM_GOOD, { podiumNum });
                this.sendOscCue(this.lighting[`PODIUM_${podiumNum}`]);
            } else {
                scoreChange(this, -8, "Podium");
                this.addEvent(this.feedback.PODIUM_BAD, { podiumNum });
            }
            
            clearTimeout(this.podiumTimer);
            this.addEvent(this.events.TURN_OFF_PODIUM, { num: podiumNum });
        }
    }
    
    handleStateChange(event) {
        // Set on-states
        this.handleTurnOnEvents(event);
        
        // Set off-states
        this.handleTurnOffEvents(event);
        
        // Set feedback
        this.handleFeedbackEvents(event);
    }
    
    handleTurnOnEvents(event) {
        // Applause
        if (event.name === this.events.TURN_ON_APPLAUSE && !this.cues.APPLAUSE_CUE) {
            this.cues.APPLAUSE_CUE = true;
            turnOnApplauseLED();
            
            this.applauseTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_OFF_APPLAUSE, {});
            }, 10 * 1000);
        }
        
        // Cheat
        if (event.name === this.events.TURN_ON_CHEAT && !this.cues.CHEAT_CUE) {
            this.cues.CHEAT_CUE = true;
            turnOnCheatLED();
            
            this.cheatTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_OFF_CHEAT, {});
            }, 5 * 1000);
        }
        
        // Joystick
        if (event.name === this.events.TURN_ON_JOYSTICK && !this.cues.JOYSTICK_CUE) {
            this.feedback.JOYSTICK_POS = 0;
            this.joystickTouched = false;
            this.cues.JOYSTICK_CUE = true;
            
            this.joystickTimer = setTimeout(() => {
                this.cues.JOYSTICK_TARGET = this.host.POSITION;
                const diff = Math.abs(this.feedback.JOYSTICK_POS - this.cues.JOYSTICK_TARGET);
                
                if (this.joystickTouched) {
                    if (diff <= 10) {
                        scoreChange(this, 10, "Joystick");
                        this.addEvent(this.feedback.JOYSTICK_GOOD, {});
                        console.log("Joystick moved correctly to target. Score rewarded.");
                    } else {
                        scoreChange(this, -10, "Joystick");
                        this.addEvent(this.feedback.JOYSTICK_BAD, {});
                        console.log("Joystick missed the target. Score penalized.");
                    }
                } else {
                    console.log("Joystick was not touched. Nothing happens");
                }
                
                this.addEvent(this.events.TURN_OFF_JOYSTICK, {});
            }, 5 * 1000);
        }
        
        // Lever
        if (event.name === this.events.TURN_ON_LEVER && !this.cues.LEVER_CUE) {
            this.cues.LEVER_CUE = true;
            this.leverTouched = false;
            
            const currentPos = this.feedback.LEVER_POS;
            if (currentPos <= 50) {
                this.cues.LEVER_TARGET = { min: 85, max: 100 };
                console.log("YOUR LEVER SHOULD GO HIGH");
            } else {
                this.cues.LEVER_TARGET = { min: 1, max: 15 };
                console.log("YOUR LEVER SHOULD GO LOW");
            }
            
            this.feedback.LEVER_INITIAL = currentPos;
            
            this.leverTimer = setTimeout(() => {
                if (this.cues.LEVER_TARGET) {
                    if (this.leverTouched) {
                        // Moved but failed to hit target
                        scoreChange(this, -7, "Lever");
                        this.addEvent(this.feedback.LEVER_BAD, { });
                        console.log("Lever moved but missed target. Score penalized.");
                    } else {
                        console.log("Lever not touched. No penalty.");
                    }
                }
                
                this.addEvent(this.events.TURN_OFF_LEVER, {});
            }, 10 * 1000);
        }
        
        // Podium
        if (event.name === this.events.TURN_ON_PODIUM && !this.cues[`PODIUM_${event.data.num}_CUE`]) {
            this.cues[`PODIUM_${event.data.num}_CUE`] = true;
            turnOnPodiumLED(event.data.num);
            
            this.podiumTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_OFF_PODIUM, { num: event.data.num });
            }, 3 * 1000);
        }
    }
    
    handleTurnOffEvents(event) {
        // Applause
        if (event.name === this.events.TURN_OFF_APPLAUSE && this.cues.APPLAUSE_CUE) {
            this.cues.APPLAUSE_CUE = false;
            turnOffApplauseLED();
            
            this.applauseTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_ON_APPLAUSE, {});
            }, 1 * 1000);
        }
        
        // Cheat
        if (event.name === this.events.TURN_OFF_CHEAT && this.cues.CHEAT_CUE) {
            this.cues.CHEAT_CUE = false;
            turnOffCheatLED();
            
            this.cheatTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_ON_CHEAT, {});
            }, 2 * 1000);
        }
        
        // Joystick
        if (event.name === this.events.TURN_OFF_JOYSTICK && this.cues.JOYSTICK_CUE) {
            this.cues.JOYSTICK_CUE = false;
            
            this.joystickTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_ON_JOYSTICK, {});
            }, 5 * 1000);
        }
        
        // Lever
        if (event.name === this.events.TURN_OFF_LEVER && this.cues.LEVER_CUE) {
            this.cues.LEVER_CUE = false;
            
            this.leverTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_ON_LEVER, {});
            }, 2 * 1000);
        }
        
        // Podium
        if (event.name == this.events.TURN_OFF_PODIUM) {
            // Reset all podium cues
            for (let i = 1; i <= 4; i++) {
                this.cues[`PODIUM_${i}_CUE`] = false;
                turnOffPodiumLED(i);
            }
            
            // Schedule next podium activation
            const podiumToTrigger = Math.floor(Math.random() * 4) + 1;
            this.podiumTimer = setTimeout(() => {
                this.addEvent(this.events.TURN_ON_PODIUM, { num: podiumToTrigger });
            }, 3 * 1000);
        }
    }
    
    handleFeedbackEvents(event) {
        // Podium feedback
        if (event.name === this.feedback.PODIUM_GOOD) {
            const podiumNum = event.data.podiumNum;
            
            this.addMessage({
                name: 'right',
                target: podiumNum
            });
            
            this.addMessage({
                name: 'green',
                target: 'podium',
                location: podiumNum
            });
            
            setTimeout(() => {
                this.addMessage({
                    name: 'idle',
                    target: podiumNum
                });
            }, 4 * 1000);
        }
        
        if (event.name === this.feedback.PODIUM_BAD) {
            const podiumNum = event.data.podiumNum;
            
            this.addMessage({
                name: 'wrong',
                target: podiumNum
            });
            
            this.addMessage({
                name: 'red',
                target: 'podium',
                location: podiumNum
            });
            
            setTimeout(() => {
                this.addMessage({
                    name: 'idle',
                    target: podiumNum
                });
            }, 4 * 1000);
        }
        
        // Applause feedback
        if (event.name === this.feedback.APPLAUSE_GOOD) {
            this.addMessage({
                name: 'stars',
                target: 'audience'
            });
        }
        
        if (event.name === this.feedback.APPLAUSE_BAD) {
            this.addMessage({
                name: 'hands',
                target: 'audience'
            });
        }
        
        // Cheat feedback
        if (event.name === this.feedback.CHEAT_GOOD) {
            this.addMessage({
                name: 'green',
                target: 'screen'
            });
        }
        
        if (event.name === this.feedback.CHEAT_BAD) {
            this.addMessage({
                name: 'red',
                target: 'screen'
            });
        }
        
        // Joystick feedback
        if (event.name === this.feedback.JOYSTICK_GOOD) {
            this.addMessage({
                name: 'green',
                target: 'light'
            });
        }
        
        if (event.name === this.feedback.JOYSTICK_BAD) {
            this.addMessage({
                name: 'red',
                target: 'light'
            });
        }
        
        // Lever feedback
        if (event.name === this.feedback.LEVER_GOOD) {
            this.addMessage({
                name: 'green',
                target: 'dial'
            });
        }
        
        if (event.name === this.feedback.LEVER_BAD) {
            this.addMessage({
                name: 'red',
                target: 'dial'
            });
        }
    }
    
    handleEndState(event) {
        if(this.debounce === false) {
            setTimeout(() => {this.debounce = true}, 3 * 1000);
            return;
        }
        
        // Handle applause button
        if (event.name === this.events.APPLAUSE_BUTTON_PRESSED) {
            turnOffApplauseLED();
            this.debounce = false;
            this.state = this.states.IDLE;
            console.log(`State transition: END -> IDLE`);
            this.sendOscCue(this.lighting.IDLE);
            return;
        }
        
        // Turn on applause LED
        turnOnApplauseLED();
        
        // Handle return to idle
        if (event.name === this.events.RETURN_IDLE) {
            turnOffApplauseLED();
            this.debounce = false;
            this.state = this.states.IDLE;
            console.log(`State transition: END -> IDLE`);
            this.sendOscCue(this.lighting.IDLE);
        }
    }

    run() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        // Optimize the event loop with batch processing
        const loop = () => {
            // Process a batch of events per frame for better performance
            const maxEventsPerFrame = 10;
            let eventsProcessed = 0;
            
            while (this.eventQueue.length > 0 && eventsProcessed < maxEventsPerFrame) {
                this.step();
                eventsProcessed++;
            }
            
            if (this.isRunning) {
                this.loopHandle = setImmediate(loop);
            }
        };
        
        this.loopHandle = setImmediate(loop);
        console.log('State machine started');
        this.sendOscCue(this.lighting.IDLE);
    }

    stop() {
        // Stop the infinite loop started by run()
        if (!this.isRunning) return;
        this.isRunning = false;
        
        if (this.loopHandle) {
            clearImmediate(this.loopHandle);
            this.loopHandle = null;
        }
        
        console.log('State machine stopped');
    }

    // Helper method to add events to the queue with batching for similar events
    addEvent(eventName, eventData = {}) {
        // Special handling for high-frequency events
        if (eventName === this.events.JOYSTICK_MOVED) {
            // Only add joystick events if they're significantly different
            if (this.eventQueue.length > 0) {
                const lastEvent = this.eventQueue[this.eventQueue.length - 1];
                
                if (lastEvent.name === this.events.JOYSTICK_MOVED) {
                    // Replace the last event instead of adding a new one
                    lastEvent.data = eventData;
                    return;
                }
            }
        }
        
        // Add the event to the queue
        this.eventQueue.push({
            name: eventName,
            data: eventData
        });
    }

    // Helper method to send cues to lighting with optimization
    sendOscCue(cueType) {
        // Lookup table for cue type to column mapping
        const columnMap = {
            [this.lighting.START_GAME]: 1,
            [this.lighting.WIN]: 4,
            [this.lighting.FAIL]: 5,
            [this.lighting.CHEAT]: 6,
            [this.lighting.PODIUM_1]: 9,
            [this.lighting.PODIUM_2]: 10,
            [this.lighting.PODIUM_3]: 11,
            [this.lighting.PODIUM_4]: 12,
            [this.lighting.IDLE]: 3,
            [this.lighting.POSITIVE_FEEDBACK]: 7,
            [this.lighting.NEGATIVE_FEEDBACK]: 8,
            [this.lighting.ONBOARDING_START]: 2
        };
        
        const column = columnMap[cueType];
        
        if (!column) {
            console.log(`Cue ${cueType} is not valid`);
            return;
        }
        
        // Throttle OSC messages to prevent flooding
        if (this.lastOscSend && Date.now() - this.lastOscSend < 50) {
            setTimeout(() => this.sendOscCue(cueType), 50);
            return;
        }
        
        this.lastOscSend = Date.now();
        
        oscClient.send({
            address: `/composition/columns/${column}/connect`,
            args: [{ type: "i", value: 1 }]
        });
    }
}

const machine = new GameMachine('IDLE');

// Batch joystick events to reduce processing load
let lastJoystickTime = 0;
let joystickBuffer = 0;

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
    const now = Date.now();
    
    // Buffer joystick movements and only send significant changes
    if (dir === 0 && machine.lastDir === 0) {
        return; // Ignore if still at 0
    }
    
    // Throttle joystick events
    if (now - lastJoystickTime < 100) {
        joystickBuffer += dir;
        return;
    }
    
    // If we have a buffered value, use that
    if (joystickBuffer !== 0) {
        dir = joystickBuffer;
        joystickBuffer = 0;
    }
    
    if (dir !== 0) {
        machine.lastDir = dir;
        machine.addEvent(machine.events.JOYSTICK_MOVED, { dir });
        lastJoystickTime = now;
    } else {
        machine.lastDir = dir;
    }
});

// Throttle and buffer lever events
let lastLeverTime = 0;
let lastLeverValue = 0;

panel.on('leverMoved', (value) => {
    const now = Date.now();
    
    // Only send lever events if value changed significantly or enough time passed
    if (Math.abs(value - lastLeverValue) > 3 || now - lastLeverTime > 100) {
        machine.addEvent(machine.events.LEVER_MOVED, { value });
        lastLeverValue = value;
        lastLeverTime = now;
    }
});

// Optimize host movement updates
const updateHostPosition = () => {
    const host = machine.host;
    
    // Skip if paused or not in playing state
    if (host.PAUSED || machine.state !== machine.states.PLAYING) {
        setTimeout(updateHostPosition, 150);
        return;
    }
    
    // Randomize movement with throttling
    if (Math.random() < 0.6) { // Reduced from 0.8 to 0.6
        const steps = 1;
        machine.addEvent(machine.events.HOST_MOVED, { steps });
    }
    
    // Adaptive timing - move faster during active gameplay
    const nextUpdate = machine.cues.JOYSTICK_CUE ? 80 : 150;
    setTimeout(updateHostPosition, nextUpdate);
};

// Start host movement with delay
setTimeout(updateHostPosition, 100);

// On Start Up
const awake = () => {
    console.log("WELCOME TO RUIN THE SHOW! PLEASE SHOW YOUR RFID BAND TO START PLAYING!");
    
    // Create a new game machine in IDLE state
    // Start the state machine
    machine.run();
    
    console.log('Current state:', machine.state);
    
    rfidEventSource.addEventListener('message', (event) => {
        const data = event.data
        if (data) {
            machine.addEvent(machine.events.RFID_SCAN)
        }
    })
};

export { awake, machine }
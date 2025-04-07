// Holds game state, logic, variables
const baseRatings = { '1': 10, '2': 5, '3': 0 }
const lightStartingPos = -300
const zoomStart = 50
const baseCheat = {
    '1': {
        threshold: 0.50, 
        delayMaxTime: 10000, 
        maxTime: 2500, 
    },
    '2': {
        threshold: 0.60,
        delayMaxTime: 8000,
        maxTime: 2500
    },
}

const user = { id: "DEFAULT", score: 0 } // from the RFID band
const state = {
    difficulty: 2, ratings: baseRatings['2'], lightPosition: lightStartingPos, zoom: zoomStart, isGameOver: false, lastInputTime: Date.now(),
    cheat: {
        cheatTimer: 0,
        threshold: baseCheat['2'].threshold,
        delayMaxTime: 8000,
        onTimer: 0,
        maxTime: 5000,
        cheatOn: false,
    },
    applause: {
        applauseTimer: 0,
        threshold: 0.75,
        delayMaxTime: 3000,
        onTimer: 0,
        maxTime: 5000,
        x: -1,
        applauseOn: false,
    },
    podium: {
        index: 1,
        totalPodiums: 4,
        lightTimer: 0, 
        threshold: 0.5,
        delayMaxTime: 10000, 
        onTimer: 0, 
        maxTime: 5000,
        lightOn: false,
    },
    joystick: {
        joystickTimer: 0,
        onTimer: 0,
        maxTime: 5000,
        moved: false,
    },
    timer: {
        lastTime: 0,
        gameTime: 0,
    }
}

import { showCheat, resetVisuals, showApplause, hideCheat, hideApplause, lightUpPodium, hidePodiumLight } from "../client/utils.js"
import { turnOffApplauseLED, turnOffCheatLED, turnOnApplauseLED, turnOnCheatLED, turnOnPodiumLED, turnOffPodiumLED } from "../arduino/panel.js"

const rfidScan = (userId, userScore) => {
    // store valid RFID input 
    if (userId) user.id = userId
    else user.id = "DEFAULT"

    if (userScore) user.score = userScore
    else user.score = 0

    // reset all variables & state
    state.difficulty = 2
    state.ratings = baseRatings[state.difficulty]

    console.log("Difficulty: " + state.difficulty)

    resetState()
    resetVisuals()

    state.timer.lastTime = Date.now()
    gameLoop()
}

const gameLoop = () => {
    const currentTime = Date.now()
        const deltaTime = currentTime - state.timer.lastTime
        state.timer.lastTime = currentTime
        state.timer.gameTime += deltaTime

        // Inactivity check
        if (currentTime - state.lastInputTime > 30000) return gameOver()
        if (currentTime - state.lastInputTime > 15000 && (state.timer.gameTime - deltaTime) < 15000) {
            console.log("Warning: No input detected")
        }

        if (user.score < 60) {
            if (state.cheat.cheatOn) return;  // Prevent cheat if score is below 60
            if (state.podium.lightOn) return;  // Prevent podium light if score is below 60
        }

        // CHEAT logic
        if (!state.cheat.cheatOn) {
            state.cheat.cheatTimer += deltaTime
            if (state.cheat.cheatTimer > state.cheat.delayMaxTime && Math.random() < state.cheat.threshold) {
                state.cheat.cheatTimer = 0
                triggerCheatButton()
                console.log("CHEAT!")
            }
        } else {
            state.cheat.onTimer += deltaTime
            if (state.cheat.onTimer > state.cheat.maxTime) turnOffCheatButton()
        }

        // APPLAUSE logic
        if (!state.applause.applauseOn) {
            state.applause.applauseTimer += deltaTime
            if (state.applause.applauseTimer > state.applause.delayMaxTime && Math.random() < state.applause.threshold) {
                state.applause.applauseTimer = 0
                state.applause.x = Math.random()
                triggerApplauseButton()
                console.log("Applause!")
            }
        } else {
            state.applause.onTimer += deltaTime
            if (state.applause.onTimer > state.applause.maxTime) turnOffApplauseButton()
        }

        // PODIUM logic
        if (!state.podium.lightOn) {
            state.podium.lightTimer += deltaTime
            if (state.podium.lightTimer > state.podium.delayMaxTime && Math.random() < state.podium.threshold) {
                state.podium.lightTimer = 0
                state.podium.index = (state.podium.index % state.podium.totalPodiums) + 1
                triggerPodiumButton(state.podium.index)
                console.log(`Podium ${state.podium.index} lit up!`)
            }
        } else {
            state.podium.onTimer += deltaTime
            if (state.podium.onTimer > state.podium.maxTime) turnOffPodiumButton(state.podium.index)
        }

        //if (state.timer.gameTime > 60000) return gameOver() // 1 min

        setImmediate(gameLoop)
}

const resetState = () => {
    state.lightPosition = lightStartingPos
    state.zoom = zoomStart

    state.cheat = {
        cheatTimer: 0,
        threshold: baseCheat[state.difficulty].threshold,
        delayMaxTime: baseCheat[state.difficulty].delayMaxTime,
        onTimer: 0,
        maxTime: baseCheat[state.difficulty].maxTime,
        cheatOn: false
    }
    state.applause = { ...state.applause, applauseOn: false, applauseTimer: 0, delayMaxTime: 3000, maxTime: 5000, onTimer: 0, threshold: 0.75, x: -1 }
    state.podium = { ...state.podium, lightOn: false, lightTimer: 0, delayMaxTime: 10000, maxTime: 5000, onTimer: 0, index: 1 }
    state.timer = { lastTime: 0, gameTime: 0 }
    state.lastInputTime = Date.now()
}

const gameOver = () => {
    //state.isGameOver = true
    console.log("Game Over");
}

const selectDifficulty = () => {
    // this should prompt the user for which level they want 
    // for now, we only have 1 difficulty, so return 2
    return 2;
}


const triggerCheatButton = () => {
    state.cheat.cheatOn = true
    showCheat()
    turnOnCheatLED()
    console.log("Cheat - on")
}

const turnOffCheatButton = () => {
    state.cheat.cheatOn = false
    hideCheat()
    turnOffCheatLED()
    console.log("Cheat - off")
}

const triggerApplauseButton = () => {
    state.applause.applauseOn = true
    showApplause()
    turnOnApplauseLED()
}

const turnOffApplauseButton = () => {
    state.applause.applauseOn = false
    hideApplause()
    turnOffApplauseLED()
    console.log("Applause - off")
}

const triggerPodiumButton = (index) => {
    state.podium.lightOn = true
    lightUpPodium(index)
    turnOnPodiumLED(index)
}

const turnOffPodiumButton = (index) => {
    state.podium.lightOn = false
    hidePodiumLight(index)
    turnOffPodiumLED(index)
    console.log(`Podium ${index} light - off`)
}

const registerInput = (type) => {
    state.lastInputTime = Date.now();
    let scoreChange = 0;
    // Determine the score change based on input type and whether it's valid
    switch(type) {
        case 'applause':
            scoreChange = state.applause.applauseOn ? 5 : -5;
            break;
        case 'cheat':
            scoreChange = state.cheat.cheatOn ? 15 : -15;
            break;
        case 'podium':
            scoreChange = state.podium.lightOn ? 8 : -8;
            break;
        case 'joystick':
            scoreChange = state.joystick.moved ? 10 : -10;
            break;
        default:
            break;
    }
    // Update the score, ensuring it doesn't go below zero
    user.score = Math.max(user.score + scoreChange, 0);
    console.log(`Score: ${user.score}`);
    console.log("register input");
}


const getRatings = () => state.ratings
const updateRatings = (value) => { state.ratings += value }
const getDifficulty = () => state.difficulty
const changeLights = (value) => { state.lightPosition += value }
const getLights = () => state.lightPosition
const getZoom = () => state.zoom
const updateZoom = (value) => { state.zoom = value }
const getApplauseX = () => state.applause.x
const getCheatState = () => state.cheat.cheatOn
const getGameOver = () => state.isGameOver

export { updateRatings, getRatings, getDifficulty, changeLights, rfidScan, getLights, getZoom, updateZoom, triggerCheatButton, triggerApplauseButton, getApplauseX, getCheatState, getGameOver, registerInput, state }
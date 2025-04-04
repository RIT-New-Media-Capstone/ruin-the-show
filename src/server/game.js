// Holds game state, logic, variables
const baseRatings = { '1': 10, '2': 5, '3': 0 }
const lightStartingPos = -300
const zoomStart = 50
const baseCheat = {
    '1': {
        threshold: 0.50, 
        delayMaxTime: 10000, 
        maxTime: 2500, 
    }
}

const user = { id: "DEFAULT", score: 0 } // from the RFID band
const state = {
    difficulty: 1, ratings: baseRatings['1'], lightPosition: lightStartingPos, zoom: zoomStart, isGameOver: false,
    cheat: {
        cheatTimer: 0,
        threshold: baseCheat['1'].threshold,
        delayMaxTime: 10000,
        onTimer: 0,
        maxTime: 2500,
        cheatOn: false,
    },
    applause: {
        applauseTimer: 0,
        threshold: 0.75,
        delayMaxTime: 3000,
        onTimer: 0,
        maxTime: 10000,
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
        maxTime: 2000,
        lightOn: false,
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

    newGame()
}

const newGame = () => {
    // reset all variables & state
    state.difficulty = selectDifficulty()
    state.ratings = baseRatings[state.difficulty]

    console.log("Difficulty: " + state.difficulty)

    resetState()
    resetVisuals()

    startGame()
}

const startGame = () => {
    state.timer.lastTime = Date.now()

    const game = () => {
        const currentTime = Date.now()
        const deltaTime = currentTime - state.timer.lastTime
        state.timer.lastTime = currentTime
        state.timer.gameTime += deltaTime

        // Every 5 seconds, 50% chance cheat button triggers
        if (!state.cheat.cheatOn) {
            state.cheat.cheatTimer += deltaTime

            if (state.cheat.cheatTimer > state.cheat.delayMaxTime) {
                const chance = Math.random()
                if (chance < state.cheat.threshold) {
                    state.cheat.cheatTimer = 0
                    triggerCheatButton()
                    console.log("CHEAT!")
                }
            }
        }
        // If the cheat button is on for 2.5 seconds, turn it off 
        else {
            state.cheat.onTimer += deltaTime
            if (state.cheat.onTimer > state.cheat.maxTime) {
                state.cheat.onTimer = 0
                turnOffCheatButton()
            }
        }

        // Every 3 seconds, 75% chance applause button triggers
        if(!state.applause.applauseOn) {
            state.applause.applauseTimer += deltaTime
            if (state.applause.applauseTimer > state.applause.delayMaxTime) {
                const chance = Math.random()
                if (chance < state.applause.threshold) {
                    state.applause.applauseTimer = 0
                    state.applause.x = Math.random()
                    triggerApplauseButton()
                    console.log("Applause!")
                }
            }
        }
        // If the applause button is on for 10 seconds, turn it off
        else {
            state.applause.onTimer += deltaTime
            if (state.applause.onTimer > state.applause.maxTime) {
                state.applause.onTimer = 0
                turnOffApplauseButton()
            }
        }

        // Every 10 seconds, 50% chance a podium button triggers
        if(!state.podium.lightOn) {
            state.podium.lightTimer += deltaTime
            if (state.podium.lightTimer > state.podium.delayMaxTime) {
                const chance = Math.random()
                if (chance < state.podium.threshold) {
                    state.podium.lightTimer = 0
                    triggerPodiumButton(state.podium.index)
                    console.log(`Podium ${state.podium.index} lit up!`)
                    state.podium.index++
                    if (state.podium.index > state.podium.totalPodiums) state.podium.index = 1;
                }
            }
        }
        // If the podium button is on for 2 seconds, turn it off
        else {
            state.podium.onTimer += deltaTime
            if (state.podium.onTimer > state.podium.maxTime) {
                state.podium.onTimer = 0
                turnOffPodiumButton(state.podium.index)
            }
        }

        if(state.timer.gameTime > 600000) return gameOver()

        setImmediate(game)
    }

    game()
}

const resetState = () => {
    state.lightPosition = lightStartingPos
    state.zoom = zoomStart

    // reset cheat params based on difficulty
    state.cheat.cheatTimer = 0
    state.cheat.cheatOn = false
    state.cheat.delayMaxTime = 10000
    state.cheat.maxTime = 2500
    state.cheat.onTimer = 0
    state.cheat.threshold =  baseCheat[state.difficulty].threshold

    // reset applause params based on difficulty
    state.applause.applauseOn = false
    state.applause.applauseTimer = 0
    state.applause.delayMaxTime = 3000
    state.applause.maxTime = 10000
    state.applause.onTimer = 0
    state.applause.threshold = 0.75
    state.applause.x = -1
}

const gameOver = () => {
    state.isGameOver = true
}

const selectDifficulty = () => {
    // this should prompt the user for which level they want 
    // for now, we only have 1 difficulty, so return 1
    return 1;
}

/*

// function that limits the current interaction based of the users cureent score 
const getAllowedInteractions = () => {
    const score = user.score
    if (score >= 0 && score < 20) {
        return { applause: true, cheat: false, podium: false }
    } else if (score >= 20 && score < 40) {
        return { applause: true, cheat: true, podium: false }
    } else if (score >= 40 && score < 60) {
        return { applause: true, cheat: true, podium: true }
    } else {
        return { applause: false, cheat: false, podium: false, gameOver: true }
    }
}*/


const triggerCheatButton = () => {
    
    showCheat()
    turnOnCheatLED()
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


const getRatings = () => { return state.ratings }
const updateRatings = (value) => { state.ratings += value }
const getDifficulty = () => { return state.difficulty }
const changeLights = (value) => { state.lightPosition += value }
const getLights = () => { return state.lightPosition }
const getZoom = () => { return state.zoom }
const updateZoom = (value) => { state.zoom = value }
const getApplauseX = () => { return state.applause.x }
const getCheatState = () => { return state.cheat.cheatOn }
const getGameOver = () => { return state.isGameOver }

export { updateRatings, getRatings, getDifficulty, changeLights, rfidScan, getLights, getZoom, updateZoom, triggerCheatButton, triggerApplauseButton, getApplauseX, getCheatState,  getGameOver, };
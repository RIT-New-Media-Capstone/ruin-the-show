// Holds game state, logic, variables
const baseRatings = {'1': 10, '2': 5, '3': 0}

const user = {id: "DEFAULT", score: 0} // from the RFID band
const state = {difficulty: 1, ratings: baseRatings['1'], lightPosition: 0}


import { resetVisuals } from "../client/utils.js"

const rfidScan = (userId, userScore) => {
    // store valid RFID input 
    if(userId) user.id = userId
    else user.id = "DEFAULT"

    if(userScore) user.score = userScore
    else user.score = 0

    newGame()
}

const newGame = () => {
    // reset all variables & state
    state.difficulty = 1
    state.ratings = baseRatings[state.difficulty]
    resetVisuals()

    state.difficulty = selectDifficulty()

    console.log("Difficulty: " + state.difficulty)
}

const selectDifficulty = () => {
    // this should prompt the user for which level they want 
    // for now, we only have 1 difficulty, so return 1
    return 1;
}

const getRatings = () => { return state.ratings }
const updateRatings = (value) => { state.ratings += value }
const getDifficulty = () => { return state.difficulty }
const changeLights = (value) => { state.lightPosition += value }
const getLights = () => {return state.lightPosition }

export { updateRatings, getRatings, getDifficulty, changeLights, rfidScan, getLights };
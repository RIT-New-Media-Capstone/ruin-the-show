// Holds game state, logic, variables
/**
 * Pseudo Code Algorithm - Event Manager
 * 
 * 
 * 
 * 
 * 
 */

const user = {id: "DEFAULT", score: 0} // from the RFID band
const state = {difficulty: 0, ratings: 0, lightPosition: 0}

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
    state.difficulty = 0
    state.ratings = 0

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

module.exports = { updateRatings: updateRatings, getScore: getRatings, getDifficulty, changeLights, rfidScan, }
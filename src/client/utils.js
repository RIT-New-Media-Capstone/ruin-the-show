// State variables for animations
let cheatX = 0;
let cheatVis = false;
let applauseX = 0;
let applauseVis = false;
let lightPosX = 0;

// Control variables 
const chanceOfCheat = 0.5;
const chanceOfApplause = 0.5;

// Utility to randomize values
const randomRange = (min, max) => Math.random() * (max - min) + min;

// Cheat Visibility Handlers
const moveAndShowCheat = () => {
    const cheat = randomRange(0,1)

    // if chance of it happening within bounds to trigger and 
    // state that it just move 
    //if not true sets visible to true 
    if (cheat < chanceOfCheat && !cheatVis) {
        cheatX = randomRange(80, 250);
        cheatVis = true;
    }
};

const hideCheat = () => {
    cheatVis = false;
};

// Applause Visibility Handlers
const showApplause = () => {
    const applause = randomRange(0,1)

    // if chance of it happening within bounds to trigger and 
    // state that it just move 
    //if not true sets visible to true 
    if (applause < chanceOfApplause && !applauseVis) {
        applauseX = randomRange(100, 250);
        applauseVis = true;
    }
};

const hideApplause = () => {
    applauseVis = false;
};

// Reset visuals on new game
const resetVisuals = () => {
    cheatVis = false;
    applauseVis = false;
    lightPosX = 0;
};

// Sync light position with game state
const updateLightPosition = async () => {
    const response = await fetch('/getState');
    const state = await response.json();
    lightPosX = state.lights;
};

// Get the current animation state (for sketch.js)
const getState = async () => {
    const response = await fetch('/getState');
    const state = await response.json();
    return ({
        cheatX,
        cheatVis,
        applauseX,
        applauseVis,
        lightPosX: state.lights,
        ratings: state.ratings,
        difficulty: state.difficulty,
    })
};

// Export functions
export {
    moveAndShowCheat,
    hideCheat,
    showApplause,
    hideApplause,
    resetVisuals,
    updateLightPosition,
    getState,
};

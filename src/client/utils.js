// State variables for animations
let cheatX = 0;
let cheatVis = false;
let applauseX = 0;
let applauseVis = false;
let lightPosX = 0;

// Utility to randomize values
const randomRange = (min, max) => Math.random() * (max - min) + min;

// Cheat Visibility Handlers
const moveAndShowCheat = () => {
    cheatX = randomRange(100, 600);
    cheatVis = true;
};

const hideCheat = () => {
    cheatVis = false;
};

// Applause Visibility Handlers
const showApplause = () => {
    applauseX = randomRange(100, 250);
    applauseVis = true;
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
        volume: state.volume
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

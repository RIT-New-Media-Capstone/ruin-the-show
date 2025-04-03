// State variables for animations
let cheatX = 0;
let cheatVis = false;
let applauseVis = false;
let lightPosX = 0;
let isGameOver = false

// Utility to randomize values
const randomRange = (min, max) => Math.random() * (max - min) + min;

// Cheat Visibility Handlers
const showCheat = () => {
    cheatX = 300
    cheatVis = true;
};

const hideCheat = () => {
    cheatVis = false;
};

// Applause Visibility Handlers
const showApplause = () => {

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

const lightUpPodium = (index) => {
    // fill out 
}

const hidePodiumLight = (index) => {
    // fill out
}

// Get the current animation state (for sketch.js)
const getState = async () => {
    const response = await fetch('/getState');
    const state = await response.json();
    return ({
        cheatX,
        cheatVis,
        applauseX: (state.applauseX) * (windowWidth - 100) + 100,
        applauseVis,
        lightPosX: state.lights,
        ratings: state.ratings,
        difficulty: state.difficulty,
        zoom: state.zoom,
        isGameOver: state.isGameOver
    })
};

// Export functions
export {
    showCheat,
    hideCheat,
    showApplause,
    hideApplause,
    resetVisuals,
    updateLightPosition,
    getState,
    lightUpPodium,
    hidePodiumLight,
};

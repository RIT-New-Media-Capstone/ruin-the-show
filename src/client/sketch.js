"use strict";

// I. Initialize "RTSstate" object for syncing
let RTSstate = {
    score: 0,
    state: 'IDLE',
    version: 0, // Added version tracking for state changes
    host: {
        POSITION: Math.floor(Math.random() * 100) - 50,
        DIRECTION: 1,
        VELOCITY: 2,
        PAUSED: false,
        MAX: 50,
        MIN: -50,
    },
    cues: {
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
    },
    feedback: {
        APPLAUSE_GOOD: 'applause-good',
        APPLAUSE_BAD: 'applause-bad',
        CHEAT_GOOD: 'cheat-good',
        CHEAT_BAD: 'cheat-bad',
        PODIUM_GOOD: 'podium-good',
        PODIUM_BAD: 'podium-bad',
        LEVER_INITIAL: null,
        LEVER_POS: null,
        JOYSTICK_POS: 0,
        JOYSTICK_GOOD: 'joystick-good',
        JOYSTICK_BAD: 'joystick-bad',
    }
};

// Store previous state values for change detection
let prevRTSstate = { state: null, score: 0 };
let prevHostPosition = 0;
let RTSmessages = [];

// Track if we need to redraw the scene
let needsRedraw = true;

// Asset cache to improve loading and prevent reloading same assets
const assetCache = {
    loaded: 0,
    total: 0,
    assets: {}
};

// II. Initialize objects/variables for assets
// *Sprite Sheets are calculated by a single frame's width & height, how many rows and columns a sheet has, and indexing the current frame
// -Sprite Sheets*
const defaultSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 4,
    sheetWidth: 4802,
    sheetHeight: 2162,
};
const smallSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 2,
    sheetWidth: 4802,
    sheetHeight: 1081,
};
const bigSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 8,
    sheetWidth: 4802,
    sheetHeight: 4324,
};
const starSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 7,
    sheetWidth: 1880,
    sheetHeight: 2640
}
// Regular Assets
// -Idle/Onboarding
const idleOnboarding = {
    idle: "",
    onboarding: "",
    onboarding_playing: false,
    easy: "",
    medium: "",
    hard: "",
}
// Playing 
const assets = {
    audience: "",
    background: "",
    cheat: "",
    hands: { idle: { file: "Audience Reaction", config: bigSpriteSheetConfig, frames: [] } },
    handstars: { idle: { file: "RTS_Stars", config: starSpriteSheetConfig, frames: [] } },
    podium1: "",
    podium2: "",
    podium3: "",
    podium4: "",
    podiumlit1: "",
    podiumlit2: "",
    podiumlit3: "",
    podiumlit4: "",
    score: "",
    spotlight: "",
    stage: "",
    stagelights: "",
    stars: "",
    timer: "",
    levercamera: "",
    leverdial: "",
}
// -End
const end = {
    shadow: "",
    star: "",
    emptyStar: "",
    success: "",
    middle: "",
    fail: "",
    curtains: { idle: { file: "CurtainsClose", config: smallSpriteSheetConfig, frames: [] } },
    curtainsClosed: false,
    scoreVis: false,
}
// -Host
const host = {
    idle: { file: "AL_idle", config: bigSpriteSheetConfig, frames: [] },
    talk: { file: "AL_Talk", config: defaultSpriteSheetConfig, frames: [] },
    turnForLeft: { file: "AL_TurnF_to_L", config: smallSpriteSheetConfig, frames: [] },
    turnForRight: { file: "AL_TurnF_to_R", config: smallSpriteSheetConfig, frames: [] },
    turnLeftFor: { file: "AL_TurnL_to_F", config: smallSpriteSheetConfig, frames: [] },
    turnRightFor: { file: "AL_TurnR_to_F", config: smallSpriteSheetConfig, frames: [] },
    walkLeft: { file: "AL_Walk_L", config: smallSpriteSheetConfig, frames: [] },
    walkRight: { file: "AL_Walk_R", config: smallSpriteSheetConfig, frames: [] },
};
// -Contestants
const contestants = {
    1: {
        name: "P1",
        animations: {
            idle: { file: "P1_Idle", config: defaultSpriteSheetConfig, frames: [] },
            right: { file: "P1_Right", config: bigSpriteSheetConfig, frames: [] },
            wrong: { file: "P1_Wrong", config: bigSpriteSheetConfig, frames: [] }
        }
    },
    2: {
        name: "P2",
        animations: {
            idle: { file: "P2_Idle", config: defaultSpriteSheetConfig, frames: [] },
            right: { file: "P2_Right", config: bigSpriteSheetConfig, frames: [] },
            wrong: { file: "P2_Wrong", config: bigSpriteSheetConfig, frames: [] }
        }
    },
    3: {
        name: "P3",
        animations: {
            idle: { file: "P3_Idle", config: defaultSpriteSheetConfig, frames: [] },
            right: { file: "P3_Right", config: bigSpriteSheetConfig, frames: [] },
            wrong: { file: "P3_Wrong", config: bigSpriteSheetConfig, frames: [] },
        }
    },
    4: {
        name: "P4",
        animations: {
            idle: { file: "P4_Idle", config: defaultSpriteSheetConfig, frames: [] },
            right: { file: "P4_Right", config: bigSpriteSheetConfig, frames: [] },
            wrong: { file: "P4_Wrong", config: bigSpriteSheetConfig, frames: [] },
        }
    }
};
// Global Variables
// -Game States
let previousState = RTSstate.state;
let previousCue = RTSstate.cues;
let backgroundLayer;
let onboardingGraphicsLayer;
let currentFrame = 0;
let frameDelay = 6;
// -Zoom
let zoomedIn = false;
let zoom;
let zoomTimer = 0;
let zoomDuration = 30;
let dialRotation = 0;
const dial = {
    shouldTintGreen: false,
    shouldTintRed: false,
    isVisible: false,
};
// -Timer
let countdownFont;
let timerDuration = 60000; // 60 seconds
let timerStart;
let timerActive = false;
// -Podiums
const podiumOffsets = {
    1: 241,
    2: 345,
    3: 565,
    4: 635,
};
const podiumLights = {
    1: {
        shouldGreen: false,
        shouldRed: false
    },
    2: {
        shouldGreen: false,
        shouldRed: false
    },
    3: {
        shouldGreen: false,
        shouldRed: false
    },
    4: {
        shouldGreen: false,
        shouldRed: false
    },
};
// -Applause 
const applause = {
    shouldHands: false,
    shouldStars: false,
    applauseActive: false,
};
// -Light
const light = {
    shouldTintGreen: false,
    shouldTintRed: false,
    isVisible: false
};
const cheat = {
    shouldGreen: false, 
    shouldRed: false,
    isVisible: false
};

// Track ongoing animations for optimization
let activeAnimations = {
    host: false,
    contestants: [false, false, false, false],
    applause: false,
    timer: false
};

// Classes
// -Sprite Animator
class SpriteAnimator {
    constructor(animations, defaultAnim = 'idle', frameDelay = 3) {
        this.animations = animations;
        this.currentAnim = defaultAnim;
        this.frameDelay = frameDelay;
        this.currentFrame = 0;
        this.lastSwitchFrame = 0;
        this.isPlaying = true;
        this.shouldLoop = true;
        this.isDirty = true; // Track if animation needs updating
        this.onComplete = null;
    }
    
    setAnimation(name, frameDelay = null, loop = true, onComplete = null) {
        if (this.currentAnim !== name || !this.isPlaying) {
            this.currentAnim = name;
            this.currentFrame = 0;
            this.lastSwitchFrame = frameCount;
            if (frameDelay !== null) this.frameDelay = frameDelay;
            this.isPlaying = true;
            this.shouldLoop = loop;
            this.onComplete = onComplete;
            this.isDirty = true;
            needsRedraw = true; // Trigger a redraw when animation changes
        } else {
            if (frameDelay !== null && this.frameDelay !== frameDelay) {
                this.frameDelay = frameDelay;
                this.isDirty = true;
                needsRedraw = true;
            }
            if (this.shouldLoop !== loop) {
                this.shouldLoop = loop;
                this.isDirty = true;
            }
            this.isPlaying = true;
            this.onComplete = onComplete;
        }
    }
    
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.isDirty = true;
            needsRedraw = true;
        }
    }
    
    stop() {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.isDirty = true;
            needsRedraw = true;
        }
    }
    
    update() {
        if (!this.isPlaying) return false;
        
        const anim = this.animations[this.currentAnim];
        if (!anim || anim.frames.length === 0) return false;
        
        const totalFrames = anim.frames.length;
        let updated = false;
        
        if ((frameCount - this.lastSwitchFrame) % this.frameDelay === 0) {
            if (this.currentFrame < totalFrames - 1) {
                this.currentFrame++;
                updated = true;
                needsRedraw = true;
            } else if (this.shouldLoop) {
                this.currentFrame = 0;
                updated = true;
                needsRedraw = true;
            } else {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
        }
        
        this.isDirty = updated;
        return updated;
    }
    
    draw(x, y, scale = 1, widthOverride = null, heightOverride = null) {
        const anim = this.animations[this.currentAnim];
        if (!anim) return;
        
        const frame = anim.frames[this.currentFrame];
        if (!frame) return;
        
        const [sx, sy, sw, sh] = frame;
        backgroundLayer.image(
            anim.image, 
            x, y, 
            widthOverride ? widthOverride : sw * scale, 
            heightOverride ? heightOverride : sh * scale, 
            sx, sy, sw, sh
        );
    }
}

// III. Improved asset loading with caching
window.preload = function () {
    // Count total assets for loading progress
    countTotalAssets();
    
    // Load assets in priority order based on likely first states
    loadIdleOnboardingAssets();
    loadPlayingStateAssets();
    loadEndStateAssets();
}

// Count total assets for loading progress
function countTotalAssets() {
    // Count idle/onboarding assets
    assetCache.total += 6; // Number of assets in idleOnboarding
    
    // Count playing state core assets
    assetCache.total += 24; // Approximate count of assets object
    
    // Count host animations
    assetCache.total += 8; // Number of animations in host
    
    // Count contestant animations (4 contestants x 3 animations each)
    assetCache.total += 12;
    
    // Count end state assets
    assetCache.total += 8; // Number of assets in end
    
    console.log(`Total assets to load: ${assetCache.total}`);
}

// Improved loadImage with caching
function optimizedLoadImage(path) {
    if (assetCache.assets[path]) {
        return assetCache.assets[path];
    }
    
    const img = loadImage(path, 
        () => {
            assetCache.loaded++;
            console.log(`Loaded ${assetCache.loaded}/${assetCache.total}: ${path}`);
        },
        (err) => console.error('Failed to load asset:', path, err)
    );
    
    assetCache.assets[path] = img;
    return img;
}

// Load assets in groups by priority
function loadIdleOnboardingAssets() {
    // Idle/Onboarding assets (highest priority - shown first)
    idleOnboarding.easy = optimizedLoadImage('/Assets/Idle_Onboarding/LevelSelections_EASY.png');
    idleOnboarding.medium = optimizedLoadImage('/Assets/Idle_Onboarding/LevelSelections_MED.png');
    idleOnboarding.hard = optimizedLoadImage('/Assets/Idle_Onboarding/LevelSelections_HARD.png');
    idleOnboarding.idle = optimizedLoadImage('/Assets/Idle_Onboarding/00_RTS_Splash.gif');
}

function loadPlayingStateAssets() {
    // Playing state essential assets
    assets.background = optimizedLoadImage('/Assets/Background/MainBackground.png');
    assets.stage = optimizedLoadImage('/Assets/Background/Stage.png');
    assets.stagelights = optimizedLoadImage('/Assets/Background/StageLights.png');
    assets.audience = optimizedLoadImage('/Assets/Background/Audience.png');
    assets.applause = optimizedLoadImage('/Assets/Background/Applause_OFF.png');
    
    // Podiums
    assets.podium1 = optimizedLoadImage('/Assets/Background/PodiumYellow_Resized0.png');
    assets.podium2 = optimizedLoadImage('/Assets/Background/PodiumWhite_Resized0.png');
    assets.podium3 = optimizedLoadImage('/Assets/Background/PodiumRed_Resized0.png');
    assets.podium4 = optimizedLoadImage('/Assets/Background/PodiumBlue_Resized0.png');
    
    // HUD elements
    assets.stars = optimizedLoadImage('/Assets/Background/StarRatings.png');
    assets.timer = optimizedLoadImage('/Assets/Background/Timer.png');
    assets.score = optimizedLoadImage('/Assets/Background/PointTrack.png');
    countdownFont = loadFont('/Assets/Fonts/SourceCodePro-Bold.ttf');
    
    // Cues & Feedback
    assets.cheat = optimizedLoadImage('/Assets/Interactions/Cheat/CheatingHand-01.png');
    assets.applauseon = optimizedLoadImage('/Assets/Interactions/Applause/Applause_ON.png');
    assets.podiumlit2 = optimizedLoadImage('/Assets/Interactions/Podiums/1light_WhitePodium.png');
    assets.podiumlit1 = optimizedLoadImage('/Assets/Interactions/Podiums/2light_YellowPodium.png');
    assets.podiumlit4 = optimizedLoadImage('/Assets/Interactions/Podiums/3light_BluePodium.png');
    assets.podiumlit3 = optimizedLoadImage('/Assets/Interactions/Podiums/4light_RedPodium.png');
    assets.levercamera = optimizedLoadImage('/Assets/Interactions/Lever/ZoomFeature.png');
    assets.leverdial = optimizedLoadImage('/Assets/Interactions/Lever/ZoomDial.png');
    
    assets.rightLit = optimizedLoadImage('/Assets/Interactions/Podiums/ContestantRight.png');
    assets.wrongLit = optimizedLoadImage('/Assets/Interactions/Podiums/ContestantWrong.png');
    
    // Load hands animation
    assets.hands.idle.image = optimizedLoadImage('Assets/SpriteSheets/Misc/Audience Reaction.png');
    populateFrames(assets.hands.idle.config, assets.hands.idle.frames);
    assets.hands.animator = new SpriteAnimator({ idle: assets.hands.idle });
    assets.hands.animator.setAnimation("idle", null, false);
    
    assets.handstars.idle.image = optimizedLoadImage('Assets/SpriteSheets/Misc/RTS_Stars.png');
    populateFrames(assets.handstars.idle.config, assets.handstars.idle.frames);
    assets.handstars.animator = new SpriteAnimator({ idle: assets.handstars.idle });
    assets.handstars.animator.setAnimation("idle", null, false);
    
    assets.spotlight = optimizedLoadImage('/Assets/Interactions/Joystick/HostSpotlight.png');
    
    // Host sprite sheets (load asynchronously)
    Promise.all(Object.entries(host).map(async ([key, anim]) => {
        if (key !== 'animator') {  // Skip the animator property
            anim.image = optimizedLoadImage(`/Assets/SpriteSheets/Host/${anim.file}.png`);
            populateFrames(anim.config, anim.frames);
        }
    })).then(() => {
        host.animator = new SpriteAnimator(host);
        host.animator.setAnimation("idle");
    });
    
    // Contestant sprite sheets (load asynchronously)
    Object.values(contestants).forEach(contestant => {
        Object.values(contestant.animations).forEach(anim => {
            anim.image = optimizedLoadImage(`/Assets/SpriteSheets/${contestant.name}/${anim.file}.png`);
            populateFrames(anim.config, anim.frames);
        });
        contestant.animator = new SpriteAnimator(contestant.animations);
        contestant.animator.setAnimation("idle");
    });
}

function loadEndStateAssets() {
    // End state assets (lowest priority - shown last)
    end.shadow = optimizedLoadImage('/Assets/EndState/EndStates_Shadow.png');
    end.star = optimizedLoadImage('/Assets/EndState/SingleStar.png');
    end.emptyStar = optimizedLoadImage('/Assets/EndState/EmptyStar.png');
    end.success = optimizedLoadImage('Assets/EndState/EndStates_NoStars-02.png');
    end.middle = optimizedLoadImage('Assets/EndState/EndStates_NoStars-04.png');
    end.fail = optimizedLoadImage('Assets/EndState/EndStates_NoStars-01.png');

    end.curtains.idle.image = optimizedLoadImage('Assets/SpriteSheets/Misc/CurtainsClose.png');
    populateFrames(end.curtains.idle.config, end.curtains.idle.frames);
    end.curtains.animator = new SpriteAnimator({ idle: end.curtains.idle });
    end.curtains.animator.setAnimation("idle", null, false, () => {
        end.curtainsClosed = true;
    });
}

// Helper function to calculate sprite sheet frames more efficiently
function populateFrames(animConfig, framesArray) {
    // If frames are already populated, skip
    if (framesArray.length > 0) return;
    
    const { totalColumns, totalRows, sheetWidth, sheetHeight } = animConfig;
    const frameWidth = sheetWidth / totalColumns;
    const frameHeightAnim = sheetHeight / totalRows;
    
    // Pre-allocate array size for better performance
    framesArray.length = totalColumns * totalRows;
    
    let index = 0;
    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalColumns; col++) {
            framesArray[index++] = [
                col * frameWidth, 
                row * frameHeightAnim, 
                frameWidth, 
                frameHeightAnim
            ];
        }
    }
}

// IV. Improved setup and state sync
window.setup = async function () {
    // 16:9 aspect ratio with slight padding
    createCanvas(assets.background ? assets.background.width / 6 : 800, 
                assets.background ? assets.background.height / 6 : 450);
    frameRate(30);
    angleMode(DEGREES);
    backgroundLayer = createGraphics(width, height);
    onboardingGraphicsLayer = createGraphics(width, height);

    idleOnboarding.onboarding = createVideo('/Assets/Idle_Onboarding/NEW ONBOARDING w Captions.mp4');
    idleOnboarding.onboarding.hide();
    idleOnboarding.onboarding.volume(0);
    idleOnboarding.onboarding.size(width, height);

    // Start sync loop after a short delay to ensure setup is complete
    setTimeout(syncStateLoop, 100);
}

// Optimized state synchronization with efficient polling and abort controller
let syncInProgress = false;
let syncRequestQueue = 0;
const syncStateLoop = async () => {
    // Skip if a sync is already in progress, but queue another one
    if (syncInProgress) {
        syncRequestQueue++;
        return;
    }
    
    syncInProgress = true;
    try {
        // Use AbortController to cancel pending requests if new ones are made
        if (window.currentFetchController) {
            window.currentFetchController.abort();
        }
        
        window.currentFetchController = new AbortController();
        const signal = window.currentFetchController.signal;
        
        // Add a timestamp to prevent caching
        const timestamp = Date.now();
        const res = await fetch(`/getState?t=${timestamp}`, { signal });
        const data = await res.json();
        
        // Deep compare important state properties to detect changes
        const hasStateChanged = data.state.state !== RTSstate.state || 
                              data.state.score !== RTSstate.score ||
                              data.state.host.POSITION !== RTSstate.host.POSITION;
                              
        if (hasStateChanged) {
            // Track previous values for animation
            prevRTSstate = { 
                state: RTSstate.state, 
                score: RTSstate.score 
            };
            prevHostPosition = RTSstate.host.POSITION;
            
            // Update state
            RTSstate = data.state;
            needsRedraw = true;
            
            // Process messages if there are any
            if (data.messages && data.messages.length > 0) {
                processMessagesBatch(data.messages);
            }
        }
    } catch (err) {
        // Don't log abort errors (they're intentional)
        if (err.name !== 'AbortError') {
            console.error('Error syncing state:', err);
        }
    } finally {
        syncInProgress = false;
        
        // If requests were queued during this sync, process one now
        if (syncRequestQueue > 0) {
            syncRequestQueue--;
            setTimeout(syncStateLoop, 0);
        } else {
            // Adaptive polling - increase interval when game is less active
            const nextInterval = (RTSstate.state === 'PLAYING') ? 50 : 150;
            setTimeout(syncStateLoop, nextInterval);
        }
    }
}

// Process multiple animation messages more efficiently
function processMessagesBatch(messages) {
    // Group messages by target to reduce redundant updates
    const targetGroups = {};
    
    messages.forEach(message => {
        const target = message.target;
        if (!target) return;
        
        if (!targetGroups[target]) {
            targetGroups[target] = [];
        }
        targetGroups[target].push(message);
    });
    
    // For each target, only apply the most recent message
    Object.entries(targetGroups).forEach(([target, msgs]) => {
        // Get the last message for this target (most recent)
        const lastMessage = msgs[msgs.length - 1];
        changeAnimations(lastMessage);
    });
}

// Optimized animation change function
function changeAnimations(message) {
    if (!message || !message.target || !message.name) {
        console.log('Invalid message:', message);
        return;
    }
    
    const target = message.target;
    const animation = message.name;
    needsRedraw = true;
    
    switch(target) {
        case 'al':
            host.animator.setAnimation(animation);
            activeAnimations.host = true;
            break;
            
        case 1:
        case 2:
        case 3:
        case 4:
            contestants[target].animator.setAnimation(animation);
            activeAnimations.contestants[target - 1] = true;
            break;
            
        case 'podium':
            if (animation === 'green') {
                podiumLights[message.location].shouldGreen = true;
                setTimeout(() => {
                    podiumLights[message.location].shouldGreen = false;
                    needsRedraw = true;
                }, 4000);
            }
            else if (animation === 'red') {
                podiumLights[message.location].shouldRed = true;
                setTimeout(() => {
                    podiumLights[message.location].shouldRed = false;
                    needsRedraw = true;
                }, 4000);
            }
            break;
            
        case 'audience':
            if (animation === 'stars') applause.shouldStars = true;
            applause.shouldHands = true;
            activeAnimations.applause = true;
            break;
            
        case 'light':
            if (animation === 'green') {
                light.shouldTintGreen = true;
                setTimeout(() => {
                    light.shouldTintGreen = false;
                    needsRedraw = true;
                }, 1000);
            }
            else if (animation === 'red') {
                light.shouldTintRed = true;
                setTimeout(() => {
                    light.shouldTintRed = false;
                    needsRedraw = true;
                }, 1000);
            }
            light.isVisible = true;
            break;
            
        case 'dial':
            if (animation === 'green') {
                dial.shouldTintGreen = true;
                setTimeout(() => {
                    dial.shouldTintGreen = false;
                    needsRedraw = true;
                }, 1000);
            }
            else if (animation === 'red') {
                dial.shouldTintRed = true;
                setTimeout(() => {
                    dial.shouldTintRed = false;
                    needsRedraw = true;
                }, 1000);
            }
            break;
            
        case 'screen':
            if (animation === 'green') {
                cheat.shouldTintGreen = true;
                setTimeout(() => {
                    cheat.shouldTintGreen = false;
                    needsRedraw = true;
                }, 1000);
            }
            else if (animation === 'red') {
                cheat.shouldTintRed = true;
                setTimeout(() => {
                    cheat.shouldTintRed = false;
                    needsRedraw = true;
                }, 1000);
            }
            cheat.isVisible = true;
            break;
            
        default:
            console.log(`Unhandled target/animation: ${target}/${animation}`);
    }
}

// V. Optimized draw function with state checking to avoid unnecessary rendering
window.draw = function () {
    // Check for state transitions
    if (RTSstate.state === 'PLAYING' && previousState !== 'PLAYING') {
        timerStart = millis();
        timerActive = true;
        needsRedraw = true;
    }
    
    previousState = RTSstate.state;
    
    // Skip drawing if no changes and no animations are active
    if (!needsRedraw && !isAnimating()) {
        return;
    }
    
    // Clear background layer when needed
    backgroundLayer.clear();
    
    // Draw current state
    switch (RTSstate.state) {
        case 'IDLE':
            drawIdleState();
            break;
        case 'ONBOARDING':
            drawOnboardingState();
            break;
        case 'PLAYING':
            drawPlayingState();
            break;
        case 'END':
            drawEndState();
            break;
    }
    
    // Reset redraw flag
    needsRedraw = false;
}

// Check if any animations are currently active
function isAnimating() {
    // Update animation state trackers
    activeAnimations.host = host.animator.isPlaying;
    
    Object.values(contestants).forEach((contestant, index) => {
        activeAnimations.contestants[index] = contestant.animator.isPlaying;
    });
    
    activeAnimations.applause = applause.applauseActive;
    activeAnimations.timer = timerActive;
    
    // Return true if any animations are active
    return activeAnimations.host || 
           activeAnimations.contestants.some(active => active) ||
           activeAnimations.applause ||
           activeAnimations.timer;
}

// State-specific drawing functions
function drawIdleState() {
    idleOnboarding.onboarding.stop();
    idleOnboarding.onboarding_playing = false;

    end.curtainsClosed = false;
    end.scoreVis = false;
    if (end.curtains.animator) {
        end.curtains.animator.currentFrame = 0;
    }

    image(idleOnboarding.idle, 0, 0, width, height);
}

function drawOnboardingState() {
    // Handle video playback
    idleOnboarding.onboarding.volume(1);
    if (!idleOnboarding.onboarding_playing) {
        idleOnboarding.onboarding.play();
        idleOnboarding.onboarding_playing = true;
    }
    onboardingGraphicsLayer.image(idleOnboarding.onboarding, 0, 0);
    image(onboardingGraphicsLayer, 0, 0);
}

function drawPlayingState() {
    // Reset video state
    idleOnboarding.onboarding.stop();
    idleOnboarding.onboarding_playing = false;
    idleOnboarding.onboarding.volume(0);
    
    // Draw background elements (more efficient ordering)
    drawBackground();
    
    // Update and draw contestant animations
    const contestantXPositions = [
        width / 5,
        width / 3.14,
        width / 2.25,
        width / 1.78
    ];
    
    Object.values(contestants).forEach((contestant, index) => {
        if (contestant.animator.isPlaying) {
            contestant.animator.update();
            contestant.animator.draw(contestantXPositions[index], height / 3.1, 0.4);
        }
    });
    
    // Draw podium feedback
    for (let i = 1; i <= 4; i++) {
        if (podiumLights[i].shouldGreen) {
            drawRightLight(i);
        }
        else if (podiumLights[i].shouldRed) {
            drawWrongLight(i);
        }
    }
    
    // Draw podiums
    drawPodiums();
    
    // Handle podium cues
    for (let i = 1; i <= 4; i++) {
        if (RTSstate.cues[`PODIUM_${i}_CUE`]) {
            drawPodiumLight(i);
        }
    }
    
    // Update and draw host animation
    if (host.animator.isPlaying) {
        host.animator.update();
        host.animator.draw(
            map(RTSstate.host.POSITION, RTSstate.host.MIN, RTSstate.host.MAX, -300, width - 500), 
            height / 2.4, 
            0.75
        );
    }
    
    // Handle joystick/spotlight
    if (RTSstate.cues.JOYSTICK_CUE) {
        light.isVisible = true;
    }
    
    if (light.isVisible) {
        drawSpotlight();
    }
    
    // Handle applause animations
    if (applause.shouldHands && !applause.applauseActive) {
        assets.hands.animator.setAnimation("idle", null, false);
        assets.hands.animator.play();
        
        if (applause.shouldStars) {
            assets.handstars.animator.setAnimation("idle", null, false);
            assets.handstars.animator.play();
            applause.shouldStars = false;
        }
        
        applause.applauseActive = true;
        applause.shouldHands = false;
    }
    
    // Draw applause animations if active
    if (applause.applauseActive) {
        const wasPlaying = assets.hands.animator.isPlaying;
        
        assets.hands.animator.update();
        assets.hands.animator.draw(30, 30, 1.3);
        
        assets.handstars.animator.update();
        assets.handstars.animator.draw(150, 400, 0.5);
        assets.handstars.animator.draw(450, 380, 0.5);
        assets.handstars.animator.draw(800, 380, 0.5);
        assets.handstars.animator.draw(1050, 400, 0.5);
        
        // Check if animation just finished
        if (wasPlaying && !assets.hands.animator.isPlaying) {
            applause.applauseActive = false;
            needsRedraw = true;
        }
    }
    
    // Draw cheat feedback if visible
    if (cheat.isVisible) {
        drawCheatFeedback();
    }
    
    // Draw the background layer to the canvas
    image(backgroundLayer, 0, 0);
    
    // Draw foreground elements
    drawApplause();
    
    // Draw applause cue if active
    if (RTSstate.cues.APPLAUSE_CUE) {
        drawApplauseON();
    }
    
    // Draw audience
    drawAudience();
    
    // Draw cheat cue if active
    if (RTSstate.cues.CHEAT_CUE) {
        drawCheat();
    }
    
    // Draw HUD elements
    drawHUD();
    
    // Handle lever/zoom cue
    if (RTSstate.cues.LEVER_CUE) {
        dial.isVisible = true;
    }
    
    if (dial.isVisible) {
        drawLeverCue();
        drawLeverFeedback();
    }
}

function drawEndState() {
    // Stop video playback
    idleOnboarding.onboarding.stop();
    
    // Draw curtains animation
    if (!end.curtainsClosed) {
        end.curtains.animator.play();
        end.curtains.animator.update();
        end.curtains.animator.draw(0, 0, 1, width, height);
        image(backgroundLayer, 0, 0);
    }
    
    // Draw score when curtains are closed
    if (end.curtainsClosed && !end.scoreVis) {
        drawScore();
        end.scoreVis = true;
    }
}

// DRAW Functions (Playing)
function drawBackground() {
    if (assets.background) {
        backgroundLayer.image(assets.background, 0, 0, width, height);
    }
    if (assets.stage) {
        backgroundLayer.image(assets.stage, width / 10, height / 1.75, width / 1.25, height / 2);
    }
    if (assets.stagelights) {
        backgroundLayer.image(assets.stagelights, 0, -45, width, height / 3);
    }
}

function drawPodiums() {
    if (assets.podium1) {
        backgroundLayer.image(assets.podium1, width / 4.5, height / 2 + 20, width / 4, height / 4);
    }
    if (assets.podium2) {
        backgroundLayer.image(assets.podium2, width / 2.93, height / 2 + 20, width / 4, height / 4);
    }
    if (assets.podium3) {
        backgroundLayer.image(assets.podium3, width / 2.16, height / 2 + 20, width / 4, height / 4);
    }
    if (assets.podium4) {
        backgroundLayer.image(assets.podium4, width / 1.74, height / 2 + 20, width / 4, height / 4);
    }
}

function drawApplause() {
    if (assets.applause) {
        image(assets.applause, width / 2 - 150, -55, width / 4, height / 4);
    }
}

function drawAudience() {
    if (assets.audience) {
        image(assets.audience, 0, 100, width, height);
    }
}

// Optimized HUD drawing
function drawHUD() {
    // Draw timer with improved font rendering
    if (assets.timer) {
        image(assets.timer, -20, 60, assets.timer.width / 5, assets.timer.height / 5);
        drawCountdown();
    }
    
    // Draw score display
    if (assets.stars) {
        let x = 10;
        let y = -10;

        // Draw score bar background
        fill('#d9d9d9');
        rect(x + 15, y + 70, 250 * 2 / 3 + 70, 50 * 2 / 3);
        
        // Draw score bar fill - avoid recalculating values
        const scoreWidth = min(RTSstate.score * 5 / 6, 200);
        fill('#dc4042');
        rect(x + 25, y + 70, scoreWidth, 50 * 2 / 3);
        
        // Draw stars image
        image(assets.stars, x, y, width / 5, height / 5);
    }
    
    // Draw score number with optimized text rendering
    if (assets.score) {
        push();
        image(assets.score, width - 250, -22, assets.score.width / 5, assets.score.height / 5);
        
        // Cache the formatted score text to avoid regenerating it each frame
        const formattedScore = nf(RTSstate.score * 10, 4);
        
        fill('#000000');
        textSize(60);
        scale(1.3, 1);
        text(formattedScore, width - 398.5, 60);
        pop();
    }
}

// Optimized countdown drawing
function drawCountdown() {
    if (timerActive) {
        const remaining = getTimeRemaining();
        
        // Only update text when time changes significantly
        const seconds = floor(remaining / 1000);
        const minutes = floor(seconds / 60);
        const secondsRemainder = seconds % 60;
        
        // Format time string efficiently
        const timeString = `0${minutes}:${secondsRemainder < 10 ? '0' : ''}${secondsRemainder}`;
        
        fill('black');
        textFont(countdownFont);
        textSize(32);
        textAlign(CENTER, CENTER);
        text(timeString, 112, 148);
        
        // If timer just finished, update state
        if (remaining === 0 && timerActive) {
            timerActive = false;
            needsRedraw = true;
        }
    }
}

function getTimeRemaining() {
    if (!timerActive) return timerDuration;
    const elapsed = millis() - timerStart;
    return max(0, timerDuration - elapsed);
}

// Game (Playing State) Cues
function drawApplauseON() {
    if (assets.applauseon) {
        image(assets.applauseon, width / 2 - 148, -50, width / 4, height / 4);
    }
}

function drawCheat() {
    if (assets.cheat) {
        image(assets.cheat, 0, 100, width / 3, height / 1.5);
    }
}

function drawCheatFeedback() {
    push();
    let c = color(0, 0, 0, 0);
    
    if (cheat.shouldTintGreen) {
        c = color(25, 161, 129, 100);
    } else if (cheat.shouldTintRed) {
        c = color(213, 55, 50, 100);
    }
    
    backgroundLayer.fill(c);
    backgroundLayer.rect(0, 0, width, height);
    pop();
}

function drawSpotlight() {
    const newJoystickPosition = map(RTSstate.feedback.JOYSTICK_POS, -50, 50, 0, width);
    
    if (assets.spotlight) {
        if (light.shouldTintGreen) {
            backgroundLayer.tint(25, 161, 129);
        } else if (light.shouldTintRed) {
            backgroundLayer.tint(213, 55, 50);
        } else {
            backgroundLayer.noTint();
        }
        
        backgroundLayer.image(assets.spotlight, newJoystickPosition - (width / 4), 100, width / 2, height);
        backgroundLayer.noTint();
    }
}

function drawLeverCue() {
    if (assets.levercamera) {
        if (dial.shouldTintGreen) {
            tint(25, 161, 129);
        } else if (dial.shouldTintRed) {
            tint(213, 55, 50);
        } else {
            noTint();
        }
        
        image(assets.levercamera, 0, 0, width, height);
        noTint();
    }
}

function drawLeverFeedback() {
    if (assets.leverdial) {
        push();
        const x = width / 1.05;
        const y = height / 2;
        
        translate(x, y);
        
        // Cache dial rotation calculation
        dialRotation = map(RTSstate.feedback.LEVER_POS, 1, 100, -45, 45);
        rotate(dialRotation);
        
        imageMode(CENTER);
        
        if (dial.shouldTintGreen) {
            tint(25, 161, 129);
        } else if (dial.shouldTintRed) {
            tint(213, 55, 50);
        } else {
            noTint();
        }
        
        image(assets.leverdial, 0, 0, assets.leverdial.width / 7, assets.leverdial.height / 7);
        noTint();
        pop();
    }
}

function drawPodiumLight(podiumNumber) {
    const asset = assets[`podiumlit${podiumNumber}`];
    const x = podiumOffsets[podiumNumber];

    if (asset && x !== undefined) {
        backgroundLayer.image(asset, x, -50, width / 3, height);
    }
}

// Game (Playing State) Feedback
function changeZoom(oldX, oldY, newX, newY, oldWidth, newWidth, oldHeight, newHeight, timer, duration) {
    // Cache the timer/duration ratio
    const amount = timer / duration;
    
    // Use more efficient lerp calculations
    return {
        x: oldX + amount * (newX - oldX),
        y: oldY + amount * (newY - oldY),
        w: oldWidth + amount * (newWidth - oldWidth),
        h: oldHeight + amount * (newHeight - oldHeight)
    };
}

// More efficient podium light rendering
function drawRightLight(index) {
    let x;
    
    // Use switch for better performance than multiple if statements
    switch (index) {
        case 1: x = 243; break;
        case 2: x = 393; break;
        case 3: x = 563; break;
        case 4: x = 707; break;
        default: return; // Skip invalid indices
    }
    
    backgroundLayer.image(assets.rightLit, x, 100, width / 3, height / 1.5);
}

function drawWrongLight(index) {
    let x;
    
    switch (index) {
        case 1: x = 243; break;
        case 2: x = 393; break;
        case 3: x = 563; break;
        case 4: x = 707; break;
        default: return; // Skip invalid indices
    }
    
    backgroundLayer.image(assets.wrongLit, x, 123, width / 3, height / 1.5);
}

// DRAW Functions (End)
function drawScore() {
    if (RTSstate.score >= 0) {
        image(end.shadow, 0, 0, width, height);
        
        // Determine which end state to show based on score
        let endImage;
        let starCount;
        
        if (RTSstate.score > 250) {
            endImage = end.success;
            starCount = 5;
        } else if (RTSstate.score > 200) {
            endImage = end.success;
            starCount = 4;
        } else if (RTSstate.score > 150) {
            endImage = end.middle;
            starCount = 3;
        } else if (RTSstate.score > 100) {
            endImage = end.middle;
            starCount = 2;
        } else if (RTSstate.score > 50) {
            endImage = end.fail;
            starCount = 1;
        } else {
            endImage = end.fail;
            starCount = 0;
        }
        
        // Draw appropriate end state image
        image(endImage, 0, 0, width, height);
        
        // Draw stars with animation
        for (let i = 1; i <= 5; i++) {
            setTimeout(() => {
                drawStar(i, i <= starCount);
                if (i === 5) needsRedraw = true;
            }, 100 * i);
        }
        
        // Draw score
        push();
        fill('black');
        textFont(countdownFont);
        textSize(64);
        textAlign(CENTER, CENTER);
        text(RTSstate.score * 10, 670, 380);
        pop();
    }
}

// Optimized star drawing
function drawStar(index, filledIn) {
    // Fixed star positions instead of calculating them each time
    const starPositions = [
        null, // Skip 0 index
        [485, 274], // Star 1
        [543, 254], // Star 2
        [602, 246], // Star 3
        [661, 254], // Star 4
        [720, 269]  // Star 5
    ];
    
    const [x, y] = starPositions[index];
    image(filledIn ? end.star : end.emptyStar, x, y, 140, 140);
}
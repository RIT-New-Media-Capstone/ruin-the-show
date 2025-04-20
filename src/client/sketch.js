"use strict";

// I. Initialize "RTSstate" object for syncing
let RTSstate = {
    score: 0,
    state: 'IDLE',
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
        // Call true then settimout false for how many seconds needed to animate?
        APPLAUSE_GOOD: false, // Applause
        APPLAUSE_BAD: false, // Boos
        CHEAT_GOOD: false, // Host Animate (Happy)
        CHEAT_BAD: false, // Host Animate (Mad)
        PODIUM_1_GOOD: false, // Green Light & Contestant (Happy)
        PODIUM_1_BAD: false, // Red Light Contestant (Sad)
        PODIUM_2_GOOD: false,
        PODIUM_2_BAD: false,
        PODIUM_3_GOOD: false,
        PODIUM_3_BAD: false,
        PODIUM_4_GOOD: false,
        PODIUM_4_BAD: false, // ^^^
        LEVER_INITIAL: null,
        LEVER_POS: null, // Zoom Dial Rotating
        JOYSTICK_POS: 0,
        JOYSTICK_GOOD: false, // Spotlight is Green
        JOYSTICK_BAD: false, // Spotlight is Red
    },
};


// II. Initialize objects/variables for assets
// Tip for II-B: Spritesheets are calculated by a single frame's width & height, how many rows and columns a sheet has, and indexing the current frame
//      A. Regular Assets
//              1. Idle/Onboarding
const idleOnboarding = {
    idle: "",
    onboarding: "",
    onboarding_playing: false,
    easy: "",
    medium: "",
    hard: "",
}
//              2. Playing 
const assets = {
    audience: "",
    background: "",
    cheat: "",
    hands: "",
    podium1: "",
    podium2: "",
    podium3: "",
    podium4: "",
    score: "",
    spotlight: "",
    stage: "",
    stagelights: "",
    stars: "",
    timer: "",
    levercamera:"",
}
//              3. End
const end = {
    shadow: "",
    star: "",
    emptyStar: "",
    success: "",
    middle: "",
    fail: "",
    curtains: "",
    curtainsClosed: false,
    scoreVis: false,
}
//      B. Sprite Sheets
//              1. General
const numRows = 4;
const numCols = 5;
const totalFrames = numRows * numCols;
const frameWidth = 4802 / numCols;
const frameHeight = 2162 / numRows;

let currentFrameCurtains = 0;
const numRowsCurtains = 2;
const totalFramesCurtains = numRowsCurtains * numCols;
const frameWidthCurtains = 9604 / numCols;
const frameHeightCurtains = 2162 / numRowsCurtains;
//              2. Host
let currentFrameHost = 0;
const host = {
    idle: "",
    talk: "",
    turnFL: "",
    turnLF: "",
    turnFR: "",
    turnRF: "",
    walkL: "",
    walkR: "",
};

const frameWidthAL = 4802 / numCols;
const frameHeightAL = 4324 / numRows;

const numRowsLR = 2;
const totalFramesLR = numRowsLR * numCols;
const frameHeightLR = 1081 / numRowsLR;
//              3. Contestants
const contestants = {
    idle: "",
    right: "",
    wrong: "",
}

let currentFrameContestants = 0;
let contestantFrames = [];
let currentFrameContestantsR = 0;
let contestantFramesR = [];
let currentFrameContestantsW = 0;
let contestantFramesW = [];

const numRowsRW = 8;
const totalFramesRW = numRowsRW * numCols;
const frameHeightRW = 4324 / numRowsRW;
//      C. Global Variables
//              1. Game States
let backgroundLayer;
let idleGraphicsLayer;
let onboardingGraphicsLayer;
let frameDelay = 3;
//              2. Zoom
let zoomedIn = false;
let zoom;
let zoomTimer = 0;
let zoomDuration = 30;
//              3. Timer
let countdownFont;
let countdown = 60;
let countdownTimer;


// III. Preload ALL static assets & spritesheets 
window.preload = function () {
    // A. Idle/Onboarding
    idleOnboarding.easy = loadImage('/Assets/Idle_Onboarding/LevelSelections_EASY.png');
    idleOnboarding.medium = loadImage('/Assets/Idle_Onboarding/LevelSelections_MED.png');
    idleOnboarding.hard = loadImage('/Assets/Idle_Onboarding/LevelSelections_HARD.png');
    idleOnboarding.idle = loadImage('/Assets/Idle_Onboarding/00_RTS_Splash.gif');
    // B. Playing
    //      1. Background & Podiums
    assets.background = loadImage('/Assets/Background/MainBackground.png');
    assets.stage = loadImage('/Assets/Background/Stage.png');
    assets.stagelights = loadImage('/Assets/Background/StageLights.png');
    assets.audience = loadImage('/Assets/Background/Audience.png');
    assets.applause = loadImage('/Assets/Background/Applause_OFF.png');
    assets.podium1 = loadImage('/Assets/Background/PodiumYellow_Resized0.png');
    assets.podium2 = loadImage('/Assets/Background/PodiumWhite_Resized0.png');
    assets.podium3 = loadImage('/Assets/Background/PodiumRed_Resized0.png');
    assets.podium4 = loadImage('/Assets/Background/PodiumBlue_Resized0.png');
    //      2. HUD
    assets.stars = loadImage('/Assets/Background/StarRatings.png');
    assets.timer = loadImage('/Assets/Background/Timer.png');
    assets.score = loadImage('/Assets/Background/PointTrack.png')
    countdownFont = loadFont('/Assets/Fonts/SourceCodePro-Bold.ttf');
    //      3. Cues & Feedback
    assets.cheat = loadImage('/Assets/Interactions/Cheat/CheatingHand-01.png');
    assets.applauseon = loadImage('/Assets/Interactions/Applause/Applause_ON.png');
    assets.podiumlit1 = loadImage('/Assets/Interactions/Podiums/1light_WhitePodium.png');
    assets.podiumlit2 = loadImage('/Assets/Interactions/Podiums/2light_YellowPodium.png');
    assets.podiumlit3 = loadImage('/Assets/Interactions/Podiums/3light_BluePodium.png');
    assets.podiumlit4 = loadImage('/Assets/Interactions/Podiums/4light_RedPodium.png');
    assets.levercamera = loadImage('/Assets/Interactions/Lever/ZoomFeature.png')

    assets.rightLit = loadImage('/Assets/Interactions/Podiums/ContestantRight.png');
    assets.wrongLit = loadImage('/Assets/Interactions/Podiums/ContestantWrong.png');
    assets.hands = loadImage('/Assets/Interactions/Applause/StaticApplause.png');
    assets.spotlight = loadImage('/Assets/Interactions/Joystick/HostSpotlight.png');
    //      4. Host (Sprite Sheets)
    host.idle = loadImage('/Assets/SpriteSheets/Host/AL_idle.png');
    host.talk = loadImage('/Assets/SpriteSheets/Host/AL_Talk.png');
    host.turnFL = loadImage('/Assets/SpriteSheets/Host/AL_TurnF_to_L.png');
    host.turnFR = loadImage('/Assets/SpriteSheets/Host/AL_TurnF_to_R.png');
    host.turnLF = loadImage('/Assets/SpriteSheets/Host/AL_TurnL_to_F.png');
    host.turnRF = loadImage('/Assets/SpriteSheets/Host/AL_TurnR_to_F.png');
    host.walkL = loadImage('/Assets/SpriteSheets/Host/AL_Walk_L.png');
    host.walkR = loadImage('/Assets/SpriteSheets/Host/AL_Walk_R.png');
    //      5. Contestants (Sprite Sheets & Initialization)
    const animationConfigs = [
        { key: 'Idle', frameCount: totalFrames, height: frameHeight, collection: contestantFrames },
        { key: 'Right', frameCount: totalFramesRW, height: frameHeightRW, collection: contestantFramesR },
        { key: 'Wrong', frameCount: totalFramesRW, height: frameHeightRW, collection: contestantFramesW },
    ];
    for (const config of animationConfigs) {
        contestants[`contestants${config.name}`] = [];
        loadContestantAnimation(config.key, config.frameCount, config.height, config.collection);
    }
    
    // C. End
    end.shadow = loadImage('/Assets/EndState/EndStates_Shadow.png');
    end.star = loadImage('/Assets/EndState/SingleStar.png');
    end.emptyStar = loadImage('/Assets/EndState/EmptyStar.png');
    end.success = loadImage('Assets/EndState/EndStates_NoStars-02.png');
    end.middle = loadImage('Assets/EndState/EndStates_NoStars-04.png');
    end.fail = loadImage('Assets/EndState/EndStates_NoStars-01.png');
    end.curtains = loadImage('Assets/SpriteSheets/Misc/CurtainsClose.png');
}


// IV. Setup canvas, frame rate, timer, graphic layers, onboard video, and sync (30 ms)
window.setup = async function () {
    // 16:9 aspect ratio with slight padding
    createCanvas(assets.background.width / 6, assets.background.height / 6);
    frameRate(30);
    countdownTimer = countdown;
    backgroundLayer = createGraphics(width, height);
    idleGraphicsLayer = createGraphics(width, height);
    onboardingGraphicsLayer = createGraphics(width, height)

    idleOnboarding.onboarding = createVideo('/Assets/Idle_Onboarding/Full Onboarding Thingy.mp4')
    idleOnboarding.onboarding.hide();

    //syncStateLoop();
}

/*
const syncStateLoop = async () => {
    try {
        const res = await fetch('/getState');
        const state = await res.json();

        lastRTSstate = RTSstate;
        RTSstate = state.state;
    } catch (err) {
        console.error('Error syncing state:', err);
    }
    setTimeout(syncStateLoop, 30);
}
*/

// V. Draw depends on sync and utilizes functions below it to show game state
window.draw = function () {
    backgroundLayer.background(255);

    //Debugging Playing State
    RTSstate.state = 'PLAYING'

    if (RTSstate.state === 'IDLE') { // A. Idle/Onboarding
        idleOnboarding.onboarding.stop()
        idleGraphicsLayer.image(idleOnboarding.idle, 0, 0, width, height);
        image(idleGraphicsLayer, 0, 0)
    } else if (RTSstate.state === 'ONBOARDING') {
        if (!idleOnboarding.onboarding_playing) {
            idleOnboarding.onboarding.play()
            idleOnboarding.onboarding_playing = true
        }
        onboardingGraphicsLayer.image(idleOnboarding.onboarding, 0, 0)
        image(onboardingGraphicsLayer, 0, 0)
    } else if (RTSstate.state === 'PLAYING') { // B. Playing
        // Background Setup & Countdown Logic
        idleOnboarding.onboarding.stop()
        drawBackground();
        if (frameCount % 30 === 0 && countdownTimer > 0) {
            updateCountdown();
        }

        //Draw Podiums
        drawPodiums();
        
        // Zoom Camera Transactions
        // TODO: when zoom change event trigger, set zoomTimer to 0
        if (zoomedIn) {
            if (zoomTimer <= zoomDuration) {
                zoom = changeZoom(0, 0, 175, 125, width, width * 3 / 4, height, height * 3 / 4, zoomTimer, zoomDuration)
                zoomTimer++
            }
        }
        if (!zoomedIn) {
            if (zoomTimer <= zoomDuration) {
                zoom = changeZoom(175, 125, 0, 0, width * 3 / 4, width, height * 3 / 4, height, zoomTimer, zoomDuration)
                zoomTimer++
            }
        }
        image(backgroundLayer, 0, 0, width, height, zoom.x, zoom.y, zoom.w, zoom.h)

        // Applause Visuals & Feedback
        drawApplause();
        drawAudience();

        //HUD & Debug Info
        drawHUD();
        text(`FPS: ${frameRate().toFixed(2)}`, width - 120, 150); //FPS ON SCREEN
    } else if (RTSstate.state === 'END') { // C. End
        idleOnboarding.onboarding.stop()
        drawCurtainClose()
        if (end.curtainsClosed && !end.scoreVis) {
            drawScore()
            end.scoreVis = true
        }
    }
}

/*
// VI. Functions below each responsible for particular asset

function drawSpritesHost(sx,sy) {
    let hostX = 100;
    const hostY = 100;
    let scaleFactor = 0.3;

    switch (hostState) {
        case "idle":
            hostSpriteSheet = al;
            scaleFactor = 0.5;
            break;
        case "talkL":
            hostSpriteSheet = alTalkL;
            break;
        case "talkR":
            hostSpriteSheet = alTalkR;
            break;
        case "walkL":
            hostSpriteSheet = alWalkL;
             hostX -= 0.1; // Walk left
            break;
        case "walkR":
            hostSpriteSheet = alWalkR;
            hostX += 0.1; // Walk right
            break;
        case "turnL":
            hostSpriteSheet = alTurnL;
            break;
        case "turnR":
            hostSpriteSheet = alTurnR;
            break;
    }

    // Calculate frame for animation (loop through totalFrames)
   // let row = Math.floor(currentFrameHost / numCols);
    //let col = currentFrameHost % numCols;

    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightAL;

    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightAL * scaleFactor;

    image(
        hostSpriteSheet,
        hostX,
        hostY,
        alWidth,
        alHeight,
        sx,
        sy,
        frameWidthAL,
        frameHeightAL
    );

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFrames;
    }
}

function drawHostIdle(sx, sy) {
    //8*5
    //if host is in idle then call idle positions and state
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.7;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightAL * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightAL;//frameHeight;

    //anim
    backgroundLayer.image(host.idle, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightAL);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFrames;
    }
}
function drawHostTalk(sx, sy) {
    //4*5
    //if host is in idle then call idle positions and state
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.7;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightRW * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightRW;//frameHeight;

    //anim
    backgroundLayer.image(host.talk, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightRW);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFrames;
    }
}
function drawHostTurnLF(sx, sy) {
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.32;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightLR * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightLR;//frameHeight;

    //anim
    backgroundLayer.image(host.turnLF, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightLR);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFramesLR;
    }

}
function drawHostTurnFL(sx, sy) {
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.52;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightLR * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightLR;//frameHeight;

    //anim
    backgroundLayer.image(host.turnFL, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightLR);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFramesLR;
    }

}
function drawHostTurnRF(sx, sy) {
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.52;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightLR * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightLR;//frameHeight;

    //anim
    backgroundLayer.image(host.turnRF, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightLR);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFramesLR;
    }

}
function drawHostTurnFR(sx, sy) {
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.52;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightLR * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightLR;//frameHeight;

    //anim
    backgroundLayer.image(host.turnFR, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightLR);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFramesLR;
    }
}
function drawHostWalkL(sx, sy) {
    //if host is in idle then call idle positions and state
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.52;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightLR * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightLR;//frameHeight;

    //anim
    backgroundLayer.image(host.walkL, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightLR);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFramesLR;
    }
}
function drawHostWalkR(sx, sy) {
    //if host is in idle then call idle positions and state
    let x = 100;
    const y = height / 2;
    //const spacing = 160;
    let scaleFactor = 0.52;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidthAL * scaleFactor;
    const alHeight = frameHeightLR * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
    sx = (currentFrameHost % numCols) * frameWidthAL;
    sy = Math.floor(currentFrameHost / numCols) * frameHeightLR;//frameHeight;

    //anim
    backgroundLayer.image(host.walkR, x, y, alWidth, alHeight, sx, sy, frameWidthAL, frameHeightLR);

    if (frameCount % frameDelay === 0) {
        currentFrameHost = (currentFrameHost + 1) % totalFramesLR;
    }

    x += hostSpeed;

    if (x + alWidth > width || x < 0) {
        hostSpeed *= -1;
    }
}
*/

// PRELOAD Functions in order
function loadContestantAnimation(type, frameCount, frameHeight, frameCollection) {
    for (let i = 1; i <= 4; i++) {
        let sheet = loadImage(`/Assets/SpriteSheets/p${i}/P${i}_${type}.png`);
        contestants[`contestants${type}`]?.push(sheet);  // if collection exists
        let frames = [];
        for (let frame = 0; frame < frameCount; frame++) {
            let row = Math.floor(frame / numCols);
            let col = frame % numCols;
            frames.push({
                sx: col * frameWidth,
                sy: row * frameHeight,
                sheet,
            });
        }
        frameCollection.push(frames);
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
function updateCountdown() {
    if (countdownTimer > 0) {
        countdownTimer -= 1; // Decrease by one second
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
function drawHUD() {
    if (assets.timer) {
        image(assets.timer, -20, 60, assets.timer.width / 5, assets.timer.height / 5);
        drawCountdown();
    }
    if (assets.stars) {
        let x = 10
        let y = -10

        fill('#d9d9d9')
        rect(x + 15, y + 70, 250 * 2 / 3 + 70, 50 * 2 / 3)
        fill('#dc4042')
        let ratings = 0
        if (ratings > 250) ratings = 250
        rect(x + 15, y + 70, ratings * 2 / 3, 50 * 2 / 3)
        image(assets.stars, x, y, width / 5, height / 5);
    }
    if (assets.score) {
        image(assets.score, width - 250, -22, assets.score.width / 5, assets.score.height / 5);
    }
}
function drawCountdown() {
    let safeCountdown = countdownTimer || 0;
    let minutes = Math.floor(safeCountdown / 60);
    let seconds = safeCountdown % 60;
    let timeString = nf(minutes, 2) + ':' + nf(seconds, 2);

    fill('black');
    textFont(countdownFont);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(timeString, 112, 148);
}

// Game (Playing State) Cues
// Applause
function drawApplauseON() {
    if (assets.applauseon) {
        image(assets.applauseon, width / 2 - 150, -55, width / 4, height / 4);
    }
}
// Cheat
function drawCheat() {
    if (assets.cheat) {
        image(assets.cheat, 0, 100, width / 3, height / 1.5);
    }
}
// Joystick
function spotlight() {
    let newJoystickPosition = map(RTSstate.feedback.JOYSTICK_POS, -50, 50, 0, width);
    if (assets.spotlight) {
        backgroundLayer.image(assets.spotlight, newJoystickPosition - (width / 4), 100, width / 2, height);
    }
    console.log("Light pos", newJoystickPosition);
}
// Lever
function drawLeverCue(){
    backgroundLayer.image(assets.levercamera, 0, 0, width, height);
}
// Podiums
function podiumLight1() {
    if (assets.podiumlit1) {
        backgroundLayer.image(assets.podiumlit1, 345, -50, width / 3, height)
    }
}
function podiumLight2() {
    if (assets.podiumlit2) {
        backgroundLayer.image(assets.podiumlit2, 241, -50, width / 3, height)
    }
}
function podiumLight3() {
    if (assets.podiumlit3) {
        backgroundLayer.image(assets.podiumlit3, 635, -50, width / 3, height)
    }
}
function podiumLight4() {
    if (assets.podiumlit4) {
        backgroundLayer.image(assets.podiumlit4, 565, -50, width / 3, height)
    }
}

// Game (Playing State) Feedback
// Applause
function drawHands() {
    if (assets.hands) {
        image(assets.hands, width / 10 - 150, height / 2 + 50, width, height / 2);
    }
}
// Cheat: No Assets - Host is supposed to be happy/mad
// Joystick: No Assets - Change color of spotlight to flash green/red for feedback?
// Lever
function changeZoom(oldX, oldY, newX, newY, oldWidth, newWidth, oldHeight, newHeight, timer, duration) {
    let amount = timer / duration
    let x = lerp(oldX, newX, amount)
    let y = lerp(oldY, newY, amount)
    let w = lerp(oldWidth, newWidth, amount)
    let h = lerp(oldHeight, newHeight, amount)
    return { x, y, w, h }
}
// Podiums
function drawRLight(x) {
    //X-Coordinates for each podium
    //(243), (393), (563), (707)
    backgroundLayer.image(assets.rightLit, x, 100, width / 3, height / 1.5);
}
function drawWLight(x) {
    //X-Coordinates for each podium
    //(243), (393), (563), (707)
    backgroundLayer.image(assets.wrongLit, x, 123, width / 3, height / 1.5);
}

// Game (Playing State) Sprite Sheets
// Host
// Contestants
function drawContestant() {
    let x = 309;
    const y = 290;
    const spacing = 158;
    let scaleFactor = 0.32;

    assets.contestants.forEach((sheet, index) => {
        let frame = contestantFrames[index][currentFrameContestants];

        if (frame && frame.sheet) {
            image(
                frame.sheet,
                x + index * spacing, y, // Destination position
                frameWidth * scaleFactor, frameHeight * scaleFactor, // Destination size
                frame.sx, frame.sy,
                frameWidth, frameHeight // Source position & size from sprite sheet
            );
        }
    });

    // Update frame only every few draw cycles
    if (frameCount % frameDelay === 0) {
        currentFrameContestants = (currentFrameContestants + 1) % totalFrames;
    }
}
function drawContestantW() {
    let x = 309;
    const y = 290;
    const spacing = 158;
    let scaleFactor = 0.32;

    assets.contestantsW.forEach((frameW, index) => {
        let frame = contestantFramesW[index][currentFrameContestantsW];

        if (frame && frame.sheet) {
            const drawWidth = frameWidth * scaleFactor;
            const drawHeight = frameHeightRW * scaleFactor;

            image(
                frame.sheet,
                x + index * spacing, y, // Destination position
                drawWidth, drawHeight, // Destination size
                frame.sx, frame.sy, frameWidth, frameHeightRW // Source position & size from sprite sheet
            );
        }
    });

    // Update frame only every few draw cycles
    if (frameCount % frameDelay === 0) {
        currentFrameContestantsW = (currentFrameContestantsW + 1) % totalFramesRW;
    }
}
function drawContestantR() {
    let x = 309;
    const y = 290;
    const spacing = 158;
    let scaleFactor = 0.32;

    assets.contestantsR.forEach((frameR, index) => {
        let frame = contestantFramesR[index][currentFrameContestantsR];

        if (frame && frame.sheet) {
            const drawWidth = frameWidth * scaleFactor;
            const drawHeight = frameHeightRW * scaleFactor;

            backgroundLayer.image(
                frame.sheet,
                x + index * spacing, y, // Destination position
                drawWidth, drawHeight, // Destination size
                frame.sx, frame.sy, frameWidth, frameHeightRW // Source position & size from sprite sheet
            );
        }
    });

    // Update frame only every few draw cycles
    if (frameCount % frameDelay === 0) {
        currentFrameContestantsR = (currentFrameContestantsR + 1) % totalFramesRW;
    }
}

// DRAW Functions in order (End)
function drawCurtainClose() {
    let x = 0;
    const y = 0;
    let sx;
    let sy;

    // if the curtains aren't closed, draw the animation 
    if (!end.curtainsClosed) {
        sx = (currentFrameCurtains % numCols) * frameWidthCurtains;
        sy = Math.floor(currentFrameCurtains / numCols) * frameHeightCurtains;

        console.log(currentFrameCurtains)

        if (frameCount % frameDelay === 0) {
            currentFrameCurtains = (currentFrameCurtains + 1) % totalFramesCurtains;
            if (currentFrameCurtains === 0) end.curtainsClosed = true;
        }
    }
    // else hardcoded to closed position 
    else {
        sx = numCols * frameWidthCurtains;
        sy = frameHeight
    }

    //anim
    image(end.curtains, x, y, width, height, sx, sy, frameWidthCurtains, frameHeight);
}
function drawScore() {
    if (RTSstate.score) {
        image(end.shadow, 0, 0, width, height)
        // change values based on score 
        if (RTSstate.score > 250) {
            image(end.success, 0, 0, width, height)

            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    drawStar(i, i <= 5)
                }, 100 * i)
            }
        }
        else if (RTSstate.score > 200) {
            image(end.success, 0, 0, width, height)
            
            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    drawStar(i, i <= 4)
                }, 100 * i)
            }
        }
        else if (RTSstate.score > 150) {
            image(end.middle, 0, 0, width, height)
            
            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    drawStar(i, i <= 3)
                }, 100 * i)
            }
        }
        else if (RTSstate.score > 100) {
            image(end.middle, 0, 0, width, height)
            
            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    drawStar(i, i <= 2)
                }, 100 * i)
            }
        }
        else if (RTSstate.score > 50) {
            image(end.fail, 0, 0, width, height)
            
            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    drawStar(i, i <= 1)
                }, 100 * i)
            }
        }
        else {
            image(end.fail, 0, 0, width, height)
            
            for (let i = 1; i <= 5; i++) {
                setTimeout(() => {
                    drawStar(i, i <= 0)
                }, 100 * i)
            }
        }

        // Draw numerical value 
        push()

        fill('black');
        textFont(countdownFont);
        textSize(64);
        textAlign(CENTER, CENTER);
        text(RTSstate.score, 670, 380);

        pop()
    }
}
function drawStar(index, filledIn) {
    switch (index) {
        case 1:
            image(filledIn ? end.star : end.emptyStar, 485, 274, 140, 140)
            break;
        case 2:
            image(filledIn ? end.star : end.emptyStar, 543, 254, 140, 140)
            break
        case 3:
            image(filledIn ? end.star : end.emptyStar, 602, 246, 140, 140)
            break
        case 4:
            image(filledIn ? end.star : end.emptyStar, 661, 254, 140, 140)
            break
        case 5:
            image(filledIn ? end.star : end.emptyStar, 720, 269, 140, 140)
            break
    }
}
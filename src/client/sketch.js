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
const defaultSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 4,
    sheetWidth: 4082,
    sheetHeight: 2162,
};
const smallSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 2,
    sheetWidth: 4082,
    sheetHeight: 1081,
};
const bigSpriteSheetConfig = {
    totalColumns: 5,
    totalRows: 8,
    sheetWidth: 4082,
    sheetHeight: 4324,
};
//              2. Host
const host = {
    idle: { file: "AL_idle", config: bigSpriteSheetConfig, frames: []},
    talk: { file: "AL_Talk", config: defaultSpriteSheetConfig, frames: []},
    turnForLeft: { file: "AL_TurnF_to_L", config: smallSpriteSheetConfig, frames: []},
    turnForRight: { file: "AL_TurnF_to_R", config: smallSpriteSheetConfig, frames: []},
    turnLeftFor: { file: "AL_TurnL_to_F", config: smallSpriteSheetConfig, frames: []},
    turnRightFor: { file: "AL_TurnR_to_F", config: smallSpriteSheetConfig, frames: []},
    walkLeft: { file: "AL_Walk_L", config: smallSpriteSheetConfig, frames: []},
    walkRight: { file: "AL_Walk_R", config: smallSpriteSheetConfig, frames: []}
};
//              3. Contestants
const contestants = {
    1: {
      name: "P1",
      animations: {
        idle: { file: "P1_Idle", config: defaultSpriteSheetConfig, frames: []},
        right: { file: "P1_Right", config: bigSpriteSheetConfig, frames: []},
        wrong: { file: "P1_Wrong", config: bigSpriteSheetConfig, frames: []}
      }
    },
    2: {
      name: "P2",
      animations: {
        idle: { file: "P2_Idle", config: defaultSpriteSheetConfig, frames: []},
        right: { file: "P2_Right", config: bigSpriteSheetConfig, frames: []},
        wrong: { file: "P2_Wrong", config: bigSpriteSheetConfig, frames: []}
      }
    },
    3: {
      name: "P3",
      animations: {
        idle: { file: "P3_Idle", config: defaultSpriteSheetConfig, frames: []},
        right: { file: "P3_Right", config: bigSpriteSheetConfig, frames: []},
        wrong: { file: "P3_Wrong", config: bigSpriteSheetConfig,frames: []},
      }
    },
    4: {
      name: "P4",
      animations: {
        idle: { file: "P4_Idle", config: defaultSpriteSheetConfig, frames: []},
        right: { file: "P4_Right", config: bigSpriteSheetConfig, frames: []},
        wrong: { file: "P4_Wrong", config: bigSpriteSheetConfig, frames: []},
      }
    }
};
//      C. Global Variables
//              1. Game States
let previousState = RTSstate.state;
let backgroundLayer;
let idleGraphicsLayer;
let onboardingGraphicsLayer;
let currentFrame = 0;
let frameDelay = 6;
//              2. Zoom
let zoomedIn = false;
let zoom;
let zoomTimer = 0;
let zoomDuration = 30;
//              3. Timer
let countdownFont;
let countdown = 60;
let countdownTimer;
//              4. Podiums
const podiumOffsets = {
    1: 345,
    2: 241,
    3: 635,
    4: 565,
};
//      D. Classes
//              1. Sprite Animator
class SpriteAnimator {
    constructor(animations, defaultAnim = 'idle', frameDelay = 3) {
        this.animations = animations;
        this.currentAnim = defaultAnim;
        this.frameDelay = frameDelay;
        this.currentFrame = 0;
        this.lastSwitchFrame = 0;
        this.isPlaying = true;
    }
    setAnimation(name, frameDelay = null, loop = true, onComplete = null) {
        if (this.currentAnim !== name || !this.isPlaying) {
            this.currentAnim = name;
            this.currentFrame = 0;
            this.lastSwitchFrame = frameCount;
            if (frameDelay !== null) this.frameDelay = frameDelay;
            this.isPlaying = loop;
            this.onComplete = onComplete;
        }
    }
    play() {
        this.isPlaying = true;
    }
    stop() {
        this.isPlaying = false;
    }
    update() {
        if (!this.isPlaying) return;
        const anim = this.animations[this.currentAnim];
        if (!anim || anim.frames.length === 0) return;
        const totalFrames = anim.frames.length;
        if ((frameCount - this.lastSwitchFrame) % this.frameDelay === 0) {
            if (this.currentFrame < totalFrames - 1) {
                this.currentFrame++;
            } else if (this.isPlaying) {
                this.currentFrame = 0;
            } else {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
        }
    }
    draw(x, y, scale = 1) {
        const anim = this.animations[this.currentAnim];
        const frame = anim.frames[this.currentFrame];
        const [sx, sy, sw, sh] = frame;
        backgroundLayer.image(anim.image, x, y, sw * scale, sh * scale, sx, sy, sw, sh);
    }
}


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
    Object.entries(host).forEach(([key, anim]) => {
        anim.image = loadImage(`/Assets/SpriteSheets/Host/${anim.file}.png`);
        populateFrames(anim.config, anim.frames);
    });
    host.animator = new SpriteAnimator(host);
    host.animator.setAnimation("idle");
    //      5. Contestants (Sprite Sheets)
    Object.values(contestants).forEach(contestant => {
        Object.values(contestant.animations).forEach(anim => {
          anim.image = loadImage(`/Assets/SpriteSheets/${contestant.name}/${anim.file}.png`);
          populateFrames(anim.config, anim.frames);
        });
        contestant.animator = new SpriteAnimator(contestant.animations);
        contestant.animator.setAnimation("idle");
    });
    // C. End
    end.shadow = loadImage('/Assets/EndState/EndStates_Shadow.png');
    end.star = loadImage('/Assets/EndState/SingleStar.png');
    end.emptyStar = loadImage('/Assets/EndState/EmptyStar.png');
    end.success = loadImage('Assets/EndState/EndStates_NoStars-02.png');
    end.middle = loadImage('Assets/EndState/EndStates_NoStars-04.png');
    end.fail = loadImage('Assets/EndState/EndStates_NoStars-01.png');
    end.curtains = loadImage('Assets/SpriteSheets/Misc/CurtainsClose.png');
}

function populateFrames(animConfig, framesArray) {
    const { totalColumns, totalRows, sheetWidth, sheetHeight } = animConfig;
    const frameWidth = sheetWidth / totalColumns;
    const frameHeightAnim = sheetHeight / totalRows;
    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < totalColumns; col++) {
            framesArray.push([col * frameWidth, row * frameHeightAnim, frameWidth, frameHeightAnim]);
        }
    }
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
    if (RTSstate.state === 'PLAYING' && previousState !== 'PLAYING') {
        countdownTimer = countdown; // Reset to 60
    }
    previousState = RTSstate.state;
    const contestantXPositions = [
        width / 4,
        width / 2.6,
        width / 1.8,
        width / 1.3
    ];

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

        //Contestant Idle Animations
        Object.values(contestants).forEach((contestant, index) => {
            contestant.animator.update();
            contestant.animator.draw(contestantXPositions[index], height/3, 0.4);
        });

        // Draw Podiums
        drawPodiums();

        //Host Animations should go here?
        
        // Zoom Camera Transactions
        // TODO: when zoom change event trigger, set zoomTimer to 0
        /*if (zoomedIn) {
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
        image(backgroundLayer, 0, 0, width, height, zoom.x, zoom.y, zoom.w, zoom.h)*/
        image(backgroundLayer, 0, 0); // Temporary

        // Applause Visuals & Feedback
        drawApplause();
        drawAudience();

        //HUD & Debug Info
        drawHUD();
        text(`FPS: ${frameRate().toFixed(2)}`, width - 120, 150);
    } else if (RTSstate.state === 'END') { // C. End
        idleOnboarding.onboarding.stop()
        drawCurtainClose()
        if (end.curtainsClosed && !end.scoreVis) {
            drawScore()
            end.scoreVis = true
        }
    }
}

// VI. Functions below each responsible for particular asset

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
        rect(x + 15, y + 70, 250 * 2 / 3 + 70, 50 * 2 / 3);
        fill('#dc4042')
        //Map the ranges here from 0-250
        rect(x + 25, y + 70, RTSstate.score * 5/6, 50 * 2 / 3);
        image(assets.stars, x, y, width / 5, height / 5);
    }
    if (assets.score) {
        image(assets.score, width - 250, -22, assets.score.width / 5, assets.score.height / 5);
        //Let's make this look better
        fill('#000000');
        textSize(60);
        scale(1.3, 1);
        text(nf(RTSstate.score * 10, 4), width - 398.5, 60);
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
function drawSpotlight() {
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
function drawPodiumLight(podiumNumber) {
    const asset = assets[`podiumlit${podiumNumber}`];
    const x = podiumOffsets[podiumNumber];

    if (asset && x !== undefined) {
        backgroundLayer.image(asset, x, -50, width / 3, height);
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
function drawRightLight(x) {
    //X-Coordinates for each podium
    //(243), (393), (563), (707)
    backgroundLayer.image(assets.rightLit, x, 100, width / 3, height / 1.5);
}
function drawWrongLight(x) {
    //X-Coordinates for each podium
    //(243), (393), (563), (707)
    backgroundLayer.image(assets.wrongLit, x, 123, width / 3, height / 1.5);
}

// Draw Sprite Animations
function drawSprite(animations, x, y, scale = 1, frameIndex) {
    const anim = animations;
    const [sx, sy, sw, sh] = anim.frames[frameIndex];
    image(anim.image, x, y, sw * scale, sh * scale, sx, sy, sw, sh);
}

// DRAW Functions (End)
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
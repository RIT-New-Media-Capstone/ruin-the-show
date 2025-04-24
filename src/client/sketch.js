"use strict";

// PLAN B: 
const keyboardInputs = false
const keyboardMapping = {
    applause: 'q',
    cheat: 'e',
    joystickLeft: 'a',
    joystickRight: 'd',
    leverUp: 'w',
    leverDown: 's',
    podium_1: '1',
    podium_2: '2',
    podium_3: '3',
    podium_4: '4',
    rfid_scan: ' '
}

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
    feedback: { //Call true then settimout false for how many seconds needed to animate?
        APPLAUSE_GOOD: 'applause-good', //Applause
        APPLAUSE_BAD: 'applause-bad', //Boos
        CHEAT_GOOD: 'cheat-good', // Host Animate (Happy)
        CHEAT_BAD: 'cheat-bad', // Host Animate (Mad)
        PODIUM_GOOD: 'podium-good', // Green Light & Contestant (Happy)
        PODIUM_BAD: 'podium-bad', // Red Light Contestant (Sad)
        LEVER_INITIAL: null,
        LEVER_POS: null, // Zoom Dial Rotating
        JOYSTICK_POS: 0,
        JOYSTICK_GOOD: 'joystick-good', // Spotlight is Green
        JOYSTICK_BAD: 'joystick-bad', // Spotlight is Red
    }
};

let RTSmessages = []


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
    background: { idle: { file: "RTS Background", config: bigSpriteSheetConfig, frames: [] } },
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
    staticbackground: "",
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
let previousCue = RTSstate.cues
let previousFeedback = RTSstate.feedback
let backgroundLayer;
let onboardingGraphicsLayer;
let currentFrame = 0;
let frameDelay = 6;
// -Zoom
const zoom = {
    previousZoomPos: 0,
    zoomPos: 0,
    targetZoomPos: 0,
    timer: 0,
    lerpTotalTime: 60,
    minLerpTime: 15,
    maxLerpTime: 60,
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    minWidth: 0,
    minHeight: 0,
    maxWidth: 0,
    maxHeight: 0,
    minPos: 1,
    maxPos: 100,
    previousLeverPos: null,
}
const dial = {
    shouldTintGreen: false,
    shouldTintRed: false,
    isVisible: false,
}
// -Timer/Score
let scoreFont;
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
}
// -Applause 
const applause = {
    shouldHands: false,
    shouldStars: false,
    applauseActive: false,
    drawCue: false,
    interval: null
}
// -Light
const light = {
    shouldTintGreen: false,
    shouldTintRed: false,
    isVisible: false
}
const cheat = {
    shouldGreen: false,
    shouldRed: false,
    isVisible: false,
    offScreenXPos: -400,
    targetXPos: 0,
    currentXPos: 0,
    timer: 0,
    lerpTotalTime: 24,
}

// Audio assets
const audio = {
    playing: "",
    idle: "",
    end: null,
    onboard: null,
    playingVolume: 0.5,
    idleVolume: 0.5,
}
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
        this.shouldLoop = true
    }
    setAnimation(name, frameDelay = null, loop = true, onComplete = null) {
        if (this.currentAnim !== name || !this.isPlaying) {
            this.currentAnim = name;
            this.currentFrame = 0;
            this.lastSwitchFrame = frameCount;
            if (frameDelay !== null) this.frameDelay = frameDelay;
            this.isPlaying = true;
            this.shouldLoop = loop
            this.onComplete = onComplete;
        } else {
            if (frameDelay !== null) this.frameDelay = frameDelay;
            this.isPlaying = true;
            this.shouldLoop = loop
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
            } else if (this.shouldLoop) {
                this.currentFrame = 0;
            } else {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
        }
    }
    draw(x, y, scale = 1, widthOverride = null, heightOverride = null) {
        const anim = this.animations[this.currentAnim];
        const frame = anim.frames[this.currentFrame];
        const [sx, sy, sw, sh] = frame;
        backgroundLayer.image(anim.image, x, y, widthOverride ? widthOverride : sw * scale, heightOverride ? heightOverride : sh * scale, sx, sy, sw, sh);
    }
}


// III. Preload ALL static assets & spritesheets 
window.preload = function () {
    // Idle/Onboarding
    idleOnboarding.easy = loadImage('/Assets/Idle_Onboarding/LevelSelections_EASY.png');
    idleOnboarding.medium = loadImage('/Assets/Idle_Onboarding/LevelSelections_MED.png');
    idleOnboarding.hard = loadImage('/Assets/Idle_Onboarding/LevelSelections_HARD.png');
    idleOnboarding.idle = loadImage('/Assets/Idle_Onboarding/00_RTS_Splash.gif');
    // Playing
    // -Background & Podiums
    assets.staticbackground = loadImage('/Assets/Background/MainBackground.png');
    assets.background.idle.image = loadImage('/Assets/SpriteSheets/Misc/RTS Background.png');
    populateFrames(assets.background.idle.config, assets.background.idle.frames);
    assets.background.animator = new SpriteAnimator({ idle: assets.background.idle });
    assets.background.animator.setAnimation("idle");

    assets.stage = loadImage('/Assets/Background/Stage.png');
    assets.stagelights = loadImage('/Assets/Background/StageLights.png');
    assets.audience = loadImage('/Assets/Background/Audience.png');
    assets.applause = loadImage('/Assets/Background/Applause_OFF.png');
    assets.podium1 = loadImage('/Assets/Background/PodiumYellow_Resized0.png');
    assets.podium2 = loadImage('/Assets/Background/PodiumWhite_Resized0.png');
    assets.podium3 = loadImage('/Assets/Background/PodiumRed_Resized0.png');
    assets.podium4 = loadImage('/Assets/Background/PodiumBlue_Resized0.png');
    // -HUD
    assets.stars = loadImage('/Assets/Background/StarRatings.png');
    assets.timer = loadImage('/Assets/Background/Timer.png');
    assets.score = loadImage('/Assets/Background/PointTrack.png')
    countdownFont = loadFont('/Assets/Fonts/SourceCodePro-Bold.ttf');
    scoreFont = loadFont('/Assets/Fonts/SourceCodePro-Medium.ttf');
    // -Cues & Feedback
    assets.cheat = loadImage('/Assets/Interactions/Cheat/CheatingHand-01.png');
    assets.applauseon = loadImage('/Assets/Interactions/Applause/Applause_ON.png');
    assets.podiumlit2 = loadImage('/Assets/Interactions/Podiums/1light_WhitePodium.png');
    assets.podiumlit1 = loadImage('/Assets/Interactions/Podiums/2light_YellowPodium.png');
    assets.podiumlit4 = loadImage('/Assets/Interactions/Podiums/3light_BluePodium.png');
    assets.podiumlit3 = loadImage('/Assets/Interactions/Podiums/4light_RedPodium.png');
    assets.levercamera = loadImage('/Assets/Interactions/Lever/ZoomFeature.png')
    assets.leverdial = loadImage('/Assets/Interactions/Lever/ZoomDial.png')

    assets.rightLit = loadImage('/Assets/Interactions/Podiums/ContestantRight.png');
    assets.wrongLit = loadImage('/Assets/Interactions/Podiums/ContestantWrong.png');

    assets.hands.idle.image = loadImage('Assets/SpriteSheets/Misc/Audience Reaction.png');
    populateFrames(assets.hands.idle.config, assets.hands.idle.frames);
    assets.hands.animator = new SpriteAnimator({ idle: assets.hands.idle });
    assets.hands.animator.setAnimation("idle", null, false);

    assets.handstars.idle.image = loadImage('Assets/SpriteSheets/Misc/RTS_Stars.png');
    populateFrames(assets.handstars.idle.config, assets.handstars.idle.frames);
    assets.handstars.animator = new SpriteAnimator({ idle: assets.handstars.idle });
    assets.handstars.animator.setAnimation("idle", null, false);

    assets.spotlight = loadImage('/Assets/Interactions/Joystick/HostSpotlight.png');
    // -Host (Sprite Sheets)
    Object.entries(host).forEach(([key, anim]) => {
        anim.image = loadImage(`/Assets/SpriteSheets/Host/${anim.file}.png`);
        populateFrames(anim.config, anim.frames);
    });
    host.animator = new SpriteAnimator(host);
    host.animator.setAnimation("idle");
    // -Contestants (Sprite Sheets)
    Object.values(contestants).forEach(contestant => {
        Object.values(contestant.animations).forEach(anim => {
            anim.image = loadImage(`/Assets/SpriteSheets/${contestant.name}/${anim.file}.png`);
            populateFrames(anim.config, anim.frames);
        });
        contestant.animator = new SpriteAnimator(contestant.animations);
        contestant.animator.setAnimation("idle");
    });
    // End
    end.shadow = loadImage('/Assets/EndState/EndStates_Shadow.png');
    end.star = loadImage('/Assets/EndState/SingleStar.png');
    end.emptyStar = loadImage('/Assets/EndState/EmptyStar.png');
    end.success = loadImage('Assets/EndState/EndStates_NoStars-02.png');
    end.middle = loadImage('Assets/EndState/EndStates_NoStars-04.png');
    end.fail = loadImage('Assets/EndState/EndStates_NoStars-01.png');

    end.curtains.idle.image = loadImage('Assets/SpriteSheets/Misc/CurtainsClose.png');
    populateFrames(end.curtains.idle.config, end.curtains.idle.frames)
    end.curtains.animator = new SpriteAnimator({ idle: end.curtains.idle })
    end.curtains.animator.setAnimation("idle", null, false, () => {
        end.curtainsClosed = true
    })

    // Audio preload
    audio.playing = loadSound('Assets/Audio/playing-state-music.mp3')
    audio.playing.setLoop(true)
    audio.playing.stop()
    audio.playing.setVolume(audio.playingVolume)

    audio.idle = loadSound('Assets/Audio/idle-state-music.mp3')
    audio.idle.setLoop(true)
    audio.idle.stop()
    audio.idle.setVolume(audio.idleVolume)
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
    createCanvas(assets.staticbackground.width / 6, assets.staticbackground.height / 6);
    frameRate(30);
    angleMode(DEGREES)
    backgroundLayer = createGraphics(width, height);
    onboardingGraphicsLayer = createGraphics(width, height)

    idleOnboarding.onboarding = createVideo('/Assets/Idle_Onboarding/NEW ONBOARDING w Captions.mp4')
    idleOnboarding.onboarding.hide();
    idleOnboarding.onboarding.volume(0);
    idleOnboarding.onboarding.size(width, height)

    // Set default zoom values 
    zoom.minWidth = width
    zoom.minHeight = height
    zoom.maxWidth = zoom.minWidth * 3 / 4
    zoom.maxHeight = zoom.minHeight * 3 / 4

    zoom.minX = 0
    zoom.minY = 0
    zoom.maxX = (zoom.minWidth / 2) - (zoom.maxWidth / 2)
    zoom.maxY = (zoom.minHeight / 2) - (zoom.maxHeight / 2)

    zoom.zoomX = zoom.minX
    zoom.zoomY = zoom.minY
    zoom.zoomWidth = zoom.minWidth
    zoom.zoomHeight = zoom.minHeight

    syncStateLoop();
}

const syncStateLoop = async () => {
    previousState = RTSstate.state;
    previousCue = RTSstate.cues
    previousFeedback = RTSstate.feedback

    try {
        const res = await fetch('/getState');
        const state = await res.json();
        RTSstate = state.state;
        RTSmessages = state.messages
        if (RTSmessages) {
            RTSmessages.forEach(message => changeAnimations(message))
        }
    } catch (err) {
        console.error('Error syncing state:', err);
    }
    setTimeout(syncStateLoop, 50);
}

function changeAnimations(message) {
    const target = message.target
    const animation = message.name
    if (target && animation) {
        if (target === 'al') {
            host.animator.setAnimation(animation)
        }
        else if (contestants[target]) {
            contestants[target].animator.setAnimation(animation);
        }
        else if (target === 'podium') {
            if (animation === 'green') podiumLights[message.location].shouldGreen = true
            else if (animation === 'red') podiumLights[message.location].shouldRed = true
        }
        else if (target === 'audience') {
            if (animation === 'stars') applause.shouldStars = true;
            applause.shouldHands = true;
        }
        else if (target === 'light') {
            if (animation === 'green') light.shouldTintGreen = true;
            else if (animation === 'red') light.shouldTintRed = true;
            light.isVisible = true;
        }
        else if (target === 'dial') {
            if (animation === 'green') dial.shouldTintGreen = true;
            else if (animation === 'red') dial.shouldTintRed = true;
        }
        else if (target === 'screen') {
            if (animation === 'green') cheat.shouldGreen = true;
            else if (animation === 'red') cheat.shouldRed = true;
            cheat.isVisible = true
        }
        else {
            console.log(`Target: ${target}, Animation: ${animation}`)
        }
    }
    else {
        console.log('Invalid message: ', message)
    }
}


// V. Draw depends on sync and utilizes functions below it to show game state
window.draw = function () {
    // backgroundLayer.background(255);
    if (RTSstate.state === 'PLAYING' && previousState !== 'PLAYING') {
        timerStart = millis();
        timerActive = true;
    }

    const contestantXPositions = [
        width / 5,
        width / 3.14,
        width / 2.25,
        width / 1.78
    ];

    //Debugging Particular States
    // RTSstate.state = 'PLAYING'

    if (RTSstate.state === 'IDLE') { // Idle/Onboarding
        idleOnboarding.onboarding.stop()
        idleOnboarding.onboarding_playing = false

        // Audio
        if(audio.idle.isLoaded()) {
            if(!audio.idle.isPlaying()) audio.idle.play()
        }

        end.curtainsClosed = false
        end.scoreVis = false
        end.curtains.animator.currentFrame = 0

        image(idleOnboarding.idle, 0, 0, width, height);
    } else if (RTSstate.state === 'ONBOARDING') {
        if(audio.idle.isPlaying()) audio.idle.stop()

        idleOnboarding.onboarding.volume(1)
        if (!idleOnboarding.onboarding_playing) {
            idleOnboarding.onboarding.play()
            idleOnboarding.onboarding_playing = true
        }
        onboardingGraphicsLayer.image(idleOnboarding.onboarding, 0, 0)
        image(onboardingGraphicsLayer, 0, 0)
    } else if (RTSstate.state === 'PLAYING') { // Playing
        if (previousState !== 'PLAYING'){
            // Background Setup & Countdown Logic
            idleOnboarding.onboarding.stop()
            idleOnboarding.onboarding_playing = false
            idleOnboarding.onboarding.volume(0)
        }
        // Audio
        if(audio.playing.isLoaded()) {
            if(!audio.playing.isPlaying()) audio.playing.play()
        }

        drawBackground();

        // Contestant Idle Animations
        Object.values(contestants).forEach((contestant, index) => {
            contestant.animator.update();
            contestant.animator.draw(contestantXPositions[index], height / 3.1, 0.4);
        });

        // Podium Feedback 
        for (let i = 1; i <= 4; i++) {
            if (podiumLights[i].shouldGreen) {
                drawRightLight(i);
                setTimeout(() => {
                    podiumLights[i].shouldGreen = false
                }, 4 * 1000) // turn off after 4 second 
            }
            else if (podiumLights[i].shouldRed) {
                drawWrongLight(i);
                setTimeout(() => {
                    podiumLights[i].shouldRed = false
                }, 4 * 1000) // turn off after 4 second 
            }
        }

        // Draw Podiums
        drawPodiums();

        // Podium Cue
        for (let i = 1; i <= 4; i++) {
            if (RTSstate.cues[`PODIUM_${i}_CUE`]) {
                drawPodiumLight(i);
            }
        }

        //Host Animations
        host.animator.play()
        host.animator.update();
        host.animator.draw(map(RTSstate.host.POSITION, RTSstate.host.MIN, RTSstate.host.MAX, -300, width - 500), height / 2.4, 0.75);

        if (RTSstate.cues.JOYSTICK_CUE) {
            light.isVisible = true
        }

        if (light.isVisible) drawSpotlight()

        // Applause Feedback (Could probably go in its own function)
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

        // Hands draw if active
        if (applause.applauseActive) {
            assets.hands.animator.update();
            assets.hands.animator.draw(30, 30, 1.3);
            assets.handstars.animator.update();
            assets.handstars.animator.draw(150, 400, 0.5);
            assets.handstars.animator.draw(450, 380, 0.5);
            assets.handstars.animator.draw(800, 380, 0.5);
            assets.handstars.animator.draw(1050, 400, 0.5);
            if (!assets.hands.animator.isPlaying) {
                applause.applauseActive = false;
            }
        }

        // Cheat feedback
        if (cheat.isVisible) {
            drawCheatFeedback()
        }

        // Draw zoom 
        if (RTSstate.feedback.LEVER_POS === zoom.previousLeverPos && zoom.timer === 0) {
            zoom.previousZoomPos = zoom.zoomPos;
            zoom.targetZoomPos = RTSstate.feedback.LEVER_POS;

            // Dynamically calculate lerp time based on distance
            const zoomDistance = Math.abs(zoom.targetZoomPos - zoom.previousZoomPos);
            const maxDistance = zoom.maxPos - zoom.minPos;
            zoom.lerpTotalTime = floor(map(zoomDistance, 0, maxDistance, zoom.minLerpTime, zoom.maxLerpTime));

            // Start lerping
            zoom.timer = 1;
        }

        if (zoom.timer > 0) {
            changeZoom();
        }

        zoom.previousLeverPos = RTSstate.feedback.LEVER_POS

        // Draw the background layer to the canvas
        image(backgroundLayer, 0, 0, width, height, zoom.zoomX, zoom.zoomY, zoom.zoomWidth, zoom.zoomHeight);

        // Applause Visuals
        drawApplause();

        // Applause Cue
        if (RTSstate.cues.APPLAUSE_CUE) {
            if (!previousCue.APPLAUSE_CUE) startApplauseFlash()
            if (applause.drawCue) drawApplauseON();
        } else {
            if (previousCue.APPLAUSE_CUE) stopApplauseFlash()
        }

        // Audience Heads
        drawAudience();

        // Cheat Cue
        if (!RTSstate.cues.CHEAT_CUE && previousCue.CHEAT_CUE) {
            cheat.timer = 1
        }
        if (RTSstate.cues.CHEAT_CUE) {
            // if the cue is just starting
            if (!previousCue.CHEAT_CUE) {
                // start lerp 
                cheat.timer = 1
            }
            // cue in
            if (cheat.timer > 0) animateCheat('right')
            drawCheat();
        }
        else if (cheat.timer > 0) {
            animateCheat('left')
            drawCheat()
        }

        //HUD
        drawHUD();

        // Zoom Cue
        if (RTSstate.cues.LEVER_CUE) {
            dial.isVisible = true
        }
        if (dial.isVisible) {
            drawLeverCue();
            drawLeverFeedback()
        }

    } else if (RTSstate.state === 'END') { // End
        light.isVisible = false
        zoom.isVisible = false
        dial.isVisible = false
        if(audio.playing.isPlaying()) audio.playing.stop()

        // Close curtains 
        if (!end.curtainsClosed) {
            end.curtains.animator.play()
            end.curtains.animator.update();
            end.curtains.animator.draw(0, 0, 1, width, height);
            image(backgroundLayer, 0, 0);
        }

        // When curtains are closed, draw score 
        if (end.curtainsClosed && !end.scoreVis) {
            drawScore()
            end.scoreVis = true
        }
    }
}

// VI. Functions below each responsible for particular asset

// DRAW Functions (Playing)
function drawBackground() {
    assets.background.animator.play();
    assets.background.animator.update();
    assets.background.animator.draw(0, 0, 1, width, height);
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
        rect(x + 25, y + 70, min(RTSstate.score * 5 / 6, 200), 50 * 2 / 3);
        image(assets.stars, x, y, width / 5, height / 5);
    }
    if (assets.score) {
        push()
        image(assets.score, width - 250, -22, assets.score.width / 5, assets.score.height / 5);
        //Let's make this look better
        fill('#000000');
        textFont(scoreFont);
        textSize(60);
        scale(1.3, 1);
        text(nf(RTSstate.score * 10, 4), width - 398.5, 60);
        pop()
    }
}
function drawCountdown() {
    if (timerActive) {
        let remaining = getTimeRemaining();
        let seconds = floor(remaining / 1000);
        seconds = `0${floor(seconds / 60)}:${nf(seconds % 60, 2)}`
        fill('black');
        textFont(countdownFont);
        textSize(32);
        textAlign(CENTER, CENTER);
        text(seconds, 112, 148);

        if (remaining === 0) {
            timerActive = false;
            // trigger timeout behavior
        }
    }
}
function getTimeRemaining() {
    if (!timerActive) return timerDuration;
    let elapsed = millis() - timerStart;
    return max(0, timerDuration - elapsed);
}

// Game (Playing State) Cues
// Applause
function drawApplauseON() {
    if (assets.applauseon) {
        image(assets.applauseon, width / 2 - 148, -50, width / 4, height / 4);
    }
}

function startApplauseFlash() {
    if (applause.interval) return;
    applause.drawCue = true;
    applause.interval = setInterval(() => {
        applause.drawCue = !applause.drawCue;
    }, 250);
}

function stopApplauseFlash() {
    clearInterval(applause.interval);
    applause.interval = null;
    applause.drawCue = false;
}
// Cheat
function animateCheat(direction) {
    if (cheat.timer <= cheat.lerpTotalTime) {
        if (direction === 'right') {
            cheat.currentXPos = lerp(
                cheat.offScreenXPos,
                cheat.targetXPos,
                cheat.timer / cheat.lerpTotalTime
            )
        }
        else if (direction === 'left') {
            cheat.currentXPos = lerp(
                cheat.targetXPos,
                cheat.offScreenXPos,
                cheat.timer / cheat.lerpTotalTime
            )
        }
        cheat.timer++
    }
    else {
        cheat.timer = 0
    }
}
function drawCheat() {
    if (assets.cheat) {
        image(assets.cheat, cheat.currentXPos, 100, width / 3, height / 1.5);
    }
}
function drawCheatFeedback() {
    push()
    let c = color(0, 0, 0, 0)
    if (cheat.shouldGreen) {
        c = color(25, 161, 129, 100);
        setTimeout(() => {
            cheat.shouldGreen = false
            cheat.isVisible = false
        }, 1000)

    } else if (cheat.shouldRed) {
        c = color(213, 55, 50, 100);
        setTimeout(() => {
            cheat.shouldRed = false
            cheat.isVisible = false
        }, 1000)
    }
    backgroundLayer.fill(c)
    backgroundLayer.rect(0, 0, width, height)
    pop()
}
// Joystick
function drawSpotlight() {
    let newJoystickPosition = map(RTSstate.feedback.JOYSTICK_POS, -50, 50, 0, width);
    if (assets.spotlight) {
        if (light.shouldTintGreen) {
            backgroundLayer.tint(25, 161, 129);
            setTimeout(() => {
                light.shouldTintGreen = false
                light.isVisible = false
            }, 1000)

        } else if (light.shouldTintRed) {
            backgroundLayer.tint(213, 55, 50);
            setTimeout(() => {
                light.shouldTintRed = false
                light.isVisible = false
            }, 1000)
        } else {
            backgroundLayer.noTint();
        }
        backgroundLayer.image(assets.spotlight, newJoystickPosition - (width / 4), 150, width / 2, height);
        backgroundLayer.noTint();
    }
}
// Lever
function drawLeverCue() {
    if (assets.levercamera) {
        if (dial.shouldTintGreen) {
            tint(25, 161, 129);
            setTimeout(() => {
                dial.shouldTintGreen = false
                dial.isVisible = false
            }, 1000)

        } else if (dial.shouldTintRed) {
            tint(213, 55, 50);
            setTimeout(() => {
                dial.shouldTintRed = false
                dial.isVisible = false
            }, 1000)
        } else {
            noTint();
        }
        image(assets.levercamera, 0, 0, width, height);
        noTint();
    }
}

function drawLeverFeedback() {
    if (assets.leverdial) {
        push()
        let x = width / 1.05;
        let y = height / 2;

        translate(x, y);
        let dialRotation = map(RTSstate.feedback.LEVER_POS, 1, 100, -45, 45)
        rotate(dialRotation)
        imageMode(CENTER)
        if (dial.shouldTintGreen) {
            tint(25, 161, 129);
        }
        else if (dial.shouldTintRed) {
            tint(213, 55, 50);
        }
        else noTint()
        image(assets.leverdial, 0, 0, assets.leverdial.width / 7, assets.leverdial.height / 7)
        noTint()
        pop()
    }
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
// Applause - Animated with Spritesheets
// Cheat: No Assets - Host is supposed to be happy/mad
// Joystick: No Assets - Change color of spotlight to flash green/red for feedback
// Lever
function changeZoom() {
    if (zoom.timer <= zoom.lerpTotalTime) {
        const zoomAmt = lerp(
            zoom.previousZoomPos,
            zoom.targetZoomPos,
            zoom.timer / zoom.lerpTotalTime
        );

        zoom.zoomX = map(zoomAmt, zoom.minPos, zoom.maxPos, zoom.minX, zoom.maxX);
        zoom.zoomY = map(zoomAmt, zoom.minPos, zoom.maxPos, zoom.minY, zoom.maxY);
        zoom.zoomWidth = map(zoomAmt, zoom.minPos, zoom.maxPos, zoom.minWidth, zoom.maxWidth);
        zoom.zoomHeight = map(zoomAmt, zoom.minPos, zoom.maxPos, zoom.minHeight, zoom.maxHeight);
        zoom.zoomPos = zoomAmt;

        zoom.timer++;
    } else {
        zoom.timer = 0; // Done lerping
    }
}
// Podiums
function drawRightLight(index) {
    let x = 0
    switch (index) {
        case 1:
            x = 243
            break;

        case 2:
            x = 393
            break;

        case 3:
            x = 563
            break;

        case 4:
            x = 707
            break;
    }
    backgroundLayer.image(assets.rightLit, x, 100, width / 3, height / 1.5);
}
function drawWrongLight(index) {
    let x = 0
    switch (index) {
        case 1:
            x = 243
            break;

        case 2:
            x = 393
            break;

        case 3:
            x = 563
            break;

        case 4:
            x = 707
            break;
    }
    backgroundLayer.image(assets.wrongLit, x, 123, width / 3, height / 1.5);
}

// DRAW Functions (End)
function drawScore() {
    if (RTSstate.score >= 0) {
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
        textFont(scoreFont);
        textSize(64);
        textAlign(CENTER, CENTER);
        text(RTSstate.score * 10, 670, 380);

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

window.keyPressed = function () {
    if (keyboardInputs) {
        let event = null
        let data = {}

        switch (key) {
            case keyboardMapping.applause:
                event = 'applause-button-pressed'
                break

            case keyboardMapping.cheat:
                event = 'cheat-button-pressed'
                break

            case keyboardMapping.joystickLeft:
                event = 'joystick-moved'
                data = {dir: 1}
                break

            case keyboardMapping.joystickRight:
                event = 'joystick-moved'
                data = {dir: -1}
                break

            case keyboardMapping.leverUp:
                event = 'lever-moved'
                data = {value: 100}
                break

            case keyboardMapping.leverDown:
                event = 'lever-moved'
                data = {value: 1}
                break

            case keyboardMapping.podium_1:
                event = 'podium-button-pressed'
                data = {num: 1}
                break

            case keyboardMapping.podium_2:
                event = 'podium-button-pressed'
                data = {num: 2}
                break

            case keyboardMapping.podium_3:
                event = 'podium-button-pressed'
                data = {num: 3}
                break

            case keyboardMapping.podium_4:
                event = 'podium-button-pressed'
                data = {num: 4}
                break

            case keyboardMapping.rfid_scan:
                event = 'rfid-scan'
                break

            default:
                console.log(key)
                break
        }

        if (event) {
            fetch('/setState', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event, data })
            })
            .then(res => res.json())
            .then(console.log)
            .catch(console.error);
          }
    }
}
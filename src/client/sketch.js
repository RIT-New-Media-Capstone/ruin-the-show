let RTSstate = {};

let backgroundLayer;

let zoomedIn = false; // for lever
let zoom;
let zoomTimer = 0;
let zoomDuration = 30

//Sprite Sheet Animation Variables for Contestants
let al;
let alTalk;
let alTurnFL;
let alTurnFR;
let alTurnLF;
let alTurnRF;
let alTurnR;
let alWalkL;
let alWalkR;

/*
let hostState;//; // idle, talkL, talkR, walkL, walkR, turnL, turnR
let hostSpriteSheet;
let hostFrames = [];
*/

//host animation 
let host = {
    idle: null,
    talk: null,
    turnFL: null,
    turnLF: null,
    turnFR: null,
    turnRF: null,
    walkL: null,
    walkR: null,
};

//manage states
let contestantStates = ['idle', 'right', 'wrong'];
let currentContestantState = 'idle';

let contestantFrames = [];
let contestantFramesR = [];
let contestantFramesW = [];

let currentFrameHost = 0;
let currentFrameContestants = 0;
let currentFrameContestantsR = 0;
let currentFrameContestantsW = 0;

let frameDelay = 3; // Change frame every 3 draw cycles (for ~10fps)

const numRows = 4;//4; // idle + al
const numRowsLR = 2;
const numRowsRW = 8; // number of rows for right + wrong
const numCols = 5;

const totalFrames = numRows * numCols;
const totalFramesRW = numRowsRW * numCols;
const totalFramesLR = numRowsLR * numCols;

const frameWidth = 4802 / numCols; //      old dimensions (al) 7688/ 4 = 1920/2 = 960  7126
const frameHeightLR = 1081 / numRowsLR;
const frameHeight = 2162 / numRows; // idle->  2162 / numRows; // (al) 5410/5 = 1080/2 = 540
const frameHeightRW = 4324 / numRowsRW;
const frameWidthAL = 4802 / numCols;
const frameHeightAL = 4324 / numRows;

//Countdown Timer (Possibly Temporary)
let countdownFont;
let countdown = 60;
let countdownTimer;

const assets = {
    audience: "",
    background: "",
    contestants: "",
    contestantsW: "",
    contestantR: "",
    cheat: "",
    curtains: "",
    hands: "",
    podium1: "",
    podium2: "",
    podium3: "",
    podium4: "",
    spotlight: "",
    stage: "",
    stagelights: "",
    stars: "",
    timer: "",
    score: "",

}

window.preload = function () {
    //BACKGROUND
    assets.background = loadImage('/Assets/Background/MainBackground.png');
    assets.stage = loadImage('/Assets/Background/Stage.png');
    assets.stagelights = loadImage('/Assets/Background/StageLights.png');
    assets.audience = loadImage('/Assets/Background/Audience.png');
    assets.applause = loadImage('/Assets/Background/Applause_OFF.png');

    //podiums are in front of animated contestants
    assets.podium1 = loadImage('/Assets/Background/PodiumYellow_Resized0.png');
    assets.podium2 = loadImage('/Assets/Background/PodiumWhite_Resized0.png');
    assets.podium3 = loadImage('/Assets/Background/PodiumRed_Resized0.png');
    assets.podium4 = loadImage('/Assets/Background/PodiumBlue_Resized0.png');

    //HUD (timer & score)
    assets.stars = loadImage('/Assets/Background/StarRatings.png');
    assets.timer = loadImage('/Assets/Background/Timer.png');
    assets.score = loadImage('/Assets/Background/PointTrack.png')
    countdownFont = loadFont('/Assets/Fonts/SourceCodePro-Bold.ttf');

    //AL 
    host.idle = loadImage('/Assets/SpriteSheets/Host/AL_idle.png');
    host.talk = loadImage('/Assets/SpriteSheets/Host/AL_Talk.png'); 
    host.turnFL = loadImage('/Assets/SpriteSheets/Host/AL_TurnF_to_L.png'); 
    host.turnFR= loadImage('/Assets/SpriteSheets/Host/AL_TurnF_to_R.png'); 
    host.turnLF = loadImage('/Assets/SpriteSheets/Host/AL_TurnL_to_F.png'); 
    host.turnRF = loadImage('/Assets/SpriteSheets/Host/AL_TurnR_to_F.png'); 
    host.walkL = loadImage('/Assets/SpriteSheets/Host/AL_Walk_L.png')
    host.walkR = loadImage('/Assets/SpriteSheets/Host/AL_Walk_R.png')



    //CONTESTANT ANIMATIONS WRONG
    assets.contestantsW = [];
    contestantFramesW = [];


    for (let i = 1; i <= 4; i++) {

        let sheet = loadImage(`/Assets/SpriteSheets/p${i}/P${i}_Wrong.png`);
        assets.contestantsW.push(sheet);

        // Preload frames for smoother animation
        let framesW = [];
        for (let frameW = 0; frameW < totalFramesRW; frameW++) {
            let row = Math.floor(frameW / numCols);
            let col = frameW % numCols;
            framesW.push({
                sx: col * frameWidth,
                sy: row * frameHeightRW,
                sheet,
            });
        }
        contestantFramesW.push(framesW);
    }

    //CONTESTANT ANIMATIONS RIGHT


    assets.contestantsR = [];
    contestantFramesR = [];


    for (let i = 1; i <= 4; i++) {

        let sheet = loadImage(`/Assets/SpriteSheets/p${i}/P${i}_Right.png`);
        assets.contestantsR.push(sheet);

        // Preload frames for smoother animation
        let framesR = [];
        for (let frameR = 0; frameR < totalFramesRW; frameR++) {
            let row = Math.floor(frameR / numCols);
            let col = frameR % numCols;
            framesR.push({
                sx: col * frameWidth,
                sy: row * frameHeightRW,
                sheet,
            });
        }
        contestantFramesR.push(framesR);
    }


    // CONTESTANT IDLE // 


    assets.contestants = [];
    contestantFrames = [];

    for (let i = 1; i <= 4; i++) {
        let sheet = loadImage(`/Assets/SpriteSheets/p${i}/P${i}_Idle.png`);
        assets.contestants.push(sheet);

        // Preload frames for smoother animation
        let frames = [];
        for (let frame = 0; frame < totalFrames; frame++) {
            let row = Math.floor(frame / numCols);
            let col = frame % numCols;
            frames.push({
                sx: col * frameWidth,
                sy: row * frameHeight,
                sheet,
            });
        }
        contestantFrames.push(frames);
    }

    //CUE
    assets.cheat = loadImage('/Assets/Interactions/Cheat/CheatingHand-01.png');
    assets.applauseon = loadImage('/Assets/Interactions/Applause/Applause_ON.png');
    assets.podiumlit1 = loadImage('/Assets/Interactions/Podiums/1light_WhitePodium.png');
    assets.podiumlit2 = loadImage('/Assets/Interactions/Podiums/2light_YellowPodium.png');
    assets.podiumlit3 = loadImage('/Assets/Interactions/Podiums/3light_BluePodium.png');
    assets.podiumlit4 = loadImage('/Assets/Interactions/Podiums/4light_RedPodium.png');

    //FEEEDBACK
    assets.rightLit = loadImage('/Assets/Interactions/Podiums/ContestantRight.png');
    assets.wrongLit = loadImage('/Assets/Interactions/Podiums/ContestantWrong.png');
    assets.hands = loadImage('/Assets/Interactions/Applause/StaticApplause.png');
    assets.spotlight = loadImage('/Assets/Interactions/Joystick/HostSpotlight.png');

    //GAMEOVER
    // assets.curtains = loadImage('/assets/Background/Curtains-02 1.png');




}

window.setup = async function () {
    // 16:9 aspect ratio with slight padding
    createCanvas(assets.background.width / 6, assets.background.height / 6);
    frameRate(30);
    countdownTimer = countdown;
    backgroundLayer = createGraphics(width, height)
    syncStateLoop();
}

window.draw = function () {
    console.log(RTSstate.state);
    backgroundLayer.background(255);
    drawBackground();
    if (frameCount % 30 === 0 && countdownTimer > 0) {
        updateCountdown();
    }

    /*if( state.right){

         // drawContestantR();
         // draw light feedback?
    } if(state.wrong){

           //drawContestantW();

    }*/

    //drawContestant();

    drawContestantR();
    //drawRWLight();
    drawPodiums();

    //podiumLight1();
    //podiumLight2();
    //podiumLight3();
    //podiumLight4();
    spotlight();

    //drawHost("al");
    //drawSpriteAnimation(al, currentFrameHost, frameWidthAL, frameHeightAL, 100, 100);

    //hostState = "talkR";
    //drawSpritesHost(hostState)
    //drawHostWalkR()
    //drawHostWalkL()
    //drawHostTurnFL()
    //drawHostTurnLF()
    //drawHostTurnFR()
    //drawHostTurnRF()
    //drawHostIdle()
    drawHostTalk()

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

    drawCheat();

    drawApplause();
    drawApplauseON();

    drawHands();
    drawAudience();

    drawHUD();

    text(`FPS: ${frameRate().toFixed(2)}`, width - 120, 150); //FPS ON SCREEN
    //image(assets.curtains, 0, 0, width, height)
}

const syncStateLoop = async () => {
    try {
        const res = await fetch('/getState');
        const state = await res.json();
        RTSstate = state.state;
    } catch (err) {
        console.error('Error syncing state:', err);
    }
    setTimeout(syncStateLoop, 1000);
}

function changeZoom(oldX, oldY, newX, newY, oldWidth, newWidth, oldHeight, newHeight, timer, duration) {
    let amount = timer / duration
    let x = lerp(oldX, newX, amount)
    let y = lerp(oldY, newY, amount)
    let w = lerp(oldWidth, newWidth, amount)
    let h = lerp(oldHeight, newHeight, amount)
    return { x, y, w, h }
}

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

function drawAudience() {
    if (assets.audience) {
        image(assets.audience, 0, 100, width, height);
    }
}

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

// heads up display
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
function updateCountdown() {
    if (countdownTimer > 0) {
        countdownTimer -= 1; // Decrease by one second
    }
}

//display right wrong light
function drawRWLight(x, y) {
    //X-Coordinates for each podium
    //(243), (393), (563), (707)
    image(assets.rightLit, 393, 100, width / 3, height / 1.5);
    image(assets.wrongLit, 243, 123, width / 3, height / 1.5);

}

// displays cheat asset
function drawCheat() {
    if (assets.cheat) {
        image(assets.cheat, 0, 100, width / 3, height / 1.5);
    }
}

function drawApplause() {
    if (assets.applause) {
        image(assets.applause, width / 2 - 150, -55, width / 4, height / 4);
    }
}
function drawApplauseON() {
    if (assets.applauseon) {
        image(assets.applauseon, width / 2 - 150, -55, width / 4, height / 4);
    }
}

function drawHands() {
    if (assets.hands) {
        image(assets.hands, width / 10 - 150, height / 2 + 50, width, height / 2);
    }
}

/*

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
}*/

//draw host sprite and calls animations based of state
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
function drawHostTalk(sx,sy){
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
function drawHostTurnLF(sx,sy){
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
function drawHostTurnFL(sx,sy){
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
function drawHostTurnRF(sx,sy){
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
function drawHostTurnFR(sx,sy){
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

function drawHostWalkL(sx, sy){
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
}

function spotlight() {
    if (assets.spotlight) {
        backgroundLayer.image(assets.spotlight, 120, 100, width / 2, height)
    }
}

function podiumLight1() {
    if (assets.podiumlit1) {
        image(assets.podiumlit1, 345, -50, width / 3, height)
    }
}
function podiumLight2() {
    if (assets.podiumlit2) {
        image(assets.podiumlit2, 241, -50, width / 3, height)
    }
}
function podiumLight3() {
    if (assets.podiumlit3) {
        image(assets.podiumlit3, 635, -50, width / 3, height)
    }
}
function podiumLight4() {
    if (assets.podiumlit4) {
        image(assets.podiumlit4, 565, -50, width / 3, height)
    }
}
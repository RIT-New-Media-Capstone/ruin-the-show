let state;

//Sprite Sheet Animation Variables for Contestants
let al;
let p1idleSS;
let p2idleSS;
let p3idleSS;
let p4idleSS;
let frameWidth = 1922;
let frameHeight = 1082;
let cols = 5;
let rows = 4;
let totalFrames = cols * rows;
let currentFrame = 0;
let frameRateSpeed = 10;
const scaleFactor = 0.2;

const assets = {

    background: "",
    stage: "",
    stagelights: "",
    podium1: "",
    podium2: "",
    podium3: "",
    podium4: "",
    stars: "",
    timer: "",
}

import {
    getState
} from "./utils.js";
  
window.preload = function () {
    //BACKGROUND
    assets.background = loadImage('/assets/Background/MainBackground.png');
    assets.stage = loadImage('/assets/Background/Stage.png');
    assets.stagelights = loadImage('/assets/Background/StageLights.png');
    //podiums are in front of animated contestants
    assets.podium1 = loadImage('/assets/Background/PodiumYellow Resized0.png');
    assets.podium2 = loadImage('/assets/Background/PodiumWhite Resized0.png');
    assets.podium3 = loadImage('/assets/Background/PodiumRed Resized0.png');
    assets.podium4 = loadImage('/assets/Background/PodiumBlue Resized0.png');
    //HUD (timer & score)
    assets.stars = loadImage('/assets/Background/StarRatings.png');
    assets.timer = loadImage('/assets/Background/Timer.png');

    //AL 
    al = loadImage('/assets/SpriteSheets/AL/AL_idleState.png');
    //CONTESTANT ANIMATIONS
    p1idleSS = loadImage('/assets/SpriteSheets/p1/P1_Idle.png');
    p2idleSS = loadImage('/assets/SpriteSheets/p2/P2_Idle.png');
    p3idleSS = loadImage('/assets/SpriteSheets/p3/P3_Idle.png');
    p4idleSS = loadImage('/assets/SpriteSheets/p4/P4_Idle.png')
}

window.setup = function () {
    // 16:9 aspect ratio with slight padding
    createCanvas(assets.background.width / 6, assets.background.height / 6);
    frameRate(frameRateSpeed);
    state = getState();
}

window.draw = function () {
    background(255);
    drawBackground();

    let row = currentFrame % rows;
    let col = Math.floor(currentFrame / rows);
    let sx = col * frameWidth;
    let sy = row * frameHeight;
    let newWidth = frameWidth * scaleFactor;
    let newHeight = frameHeight * scaleFactor;
    image(al, 250,250, newWidth, newHeight, sx, sy, frameWidth, frameHeight)
    image(p1idleSS, 270, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    image(p2idleSS, 300, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    image(p3idleSS, 320, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    image(p4idleSS, 340, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    currentFrame = (currentFrame + 1) % totalFrames; // Looping Animation

    syncGameState();

    //draw rest of background here
    drawPodiums();
    drawHUD();
}

const syncGameState = async () => {
    // Sync variables with gamestate
}

function drawBackground() {
    if (assets.background) {
        image(assets.background, 0, 0, width, height);
    }
    if (assets.stage) {                  
        image(assets.stage, width/10, height/1.75, width/1.25, height/2);
    }
    if (assets.stagelights) {
        image(assets.stagelights, 0, -45, width, height/3);
    }
}

function drawPodiums() {
    if (assets.podium1) {
        image(assets.podium1, width/4.5, height/2 + 20, width/4, height/4);
    }
    if (assets.podium2) {
        image(assets.podium2, width/3, height/2 + 20, width/4, height/4);
    }
    if (assets.podium3) {
        image(assets.podium3, width/2.2, height/2 + 20, width/4, height/4);
    }
    if (assets.podium4) {
        image(assets.podium4, width/1.75, height/2 + 20, width/4, height/4);
    }
}

// heads up display
function drawHUD() {
    if(assets.stars) {
        image(assets.stars, width - 350, -20, width/4, height/4);
    }
    if(assets.timer) {
        image(assets.timer, -20, -40, width/4, height/4);
    }
}

//function drawApplause(){

//}
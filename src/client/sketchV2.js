let state = {
    cheat: {
        cheatOn: false
    },
    cheatVis: false,
    applauseVis: false,
    ratings: 0,
    // ... add anything else your UI checks
};

//Sprite Sheet Animation Variables for Contestants
let al;
let contestantFrames = [];
let currentFrame = 0;
let frameDelay = 3; // Change frame every 3 draw cycles (for ~10fps)
const numRows = 5;
const numCols = 4;
const totalFrames = numRows * numCols;
const frameWidth = 7688 / numCols;
const frameHeight = 5410 / numRows;
//Countdown Timer (Possibly Temporary)
let countdownFont;
let countdown = 60;
let countdownTimer;

const assets = {
    audience: "",
    background: "",
    contestants: "",
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
    
}

import {
    getState,
    hideCheat,
    hideApplause,
    updateLightPosition,
    showCheat,
    showApplause,
} from "./utils.js";
  
window.preload = function () {
    //BACKGROUND
    assets.background = loadImage('/assets/Background/MainBackground.png');
    assets.stage = loadImage('/assets/Background/Stage.png');
    assets.stagelights = loadImage('/assets/Background/StageLights.png');
    assets.audience = loadImage('/assets/Background/audience.png');
    
    //podiums are in front of animated contestants
    assets.podium1 = loadImage('/assets/Background/PodiumYellow Resized0.png');
    assets.podium2 = loadImage('/assets/Background/PodiumWhite Resized0.png');
    assets.podium3 = loadImage('/assets/Background/PodiumRed Resized0.png');
    assets.podium4 = loadImage('/assets/Background/PodiumBlue Resized0.png');
    
    //HUD (timer & score)
    assets.stars = loadImage('/assets/Background/StarRatings.png');
    assets.timer = loadImage('/assets/Background/Timer.png');
    countdownFont = loadFont('/assets/Fonts/Poppins-ExtraLight.ttf');

    //AL 
    al = loadImage('/assets/SpriteSheets/AL/AL_idle.png'); 
    
    //CONTESTANT ANIMATIONS
    assets.contestants = [];
    contestantFrames = [];
    for (let i = 1; i <= 4; i++) {
        let sheet = loadImage(`/assets/SpriteSheets/p${i}/P${i}_Idle.png`);
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
    assets.cheat = loadImage('/assets/Interactions/cheat/CheatingHand-01.png');
    assets.applause = loadImage('/assets/Interactions/applause/applause_OFF.png');
    assets.applauseon = loadImage('/assets/Interactions/applause/applause_ON.png');
    assets.podiumlit1 = loadImage('/assets/Interactions/podiums/1light_WhitePodium.png');
    assets.podiumlit2 = loadImage('/assets/Interactions/podiums/2light_YellowPodium.png');
    assets.podiumlit3 = loadImage('/assets/Interactions/podiums/3light_BluePodium.png');
    assets.podiumlit4 = loadImage('/assets/Interactions/podiums/4light_RedPodium.png');

    //FEEEDBACK
    assets.rightLit = loadImage('/assets/Interactions/podiums/ContestantRight.png');
    assets.wrongLit = loadImage('/assets/Interactions/podiums/ContestantWrong.png');
    assets.hands = loadImage('/assets/Interactions/applause/StaticApplause.png');
    assets.spotlight = loadImage('/assets/Interactions/joystick/HostSpotlight.png');

    //GAMEOVER
    assets.curtains = loadImage('/assets/Background/Curtains-02 1.png');
}

window.setup = async function () {
    // 16:9 aspect ratio with slight padding
    createCanvas(assets.background.width / 6, assets.background.height / 6);
    frameRate(30);
    state = await getState(); // <- WAIT for the promise to resolve
    countdownTimer = countdown;
}

window.draw = function () {
    background(255);
    drawBackground();
    syncGameState();

    drawContestant();
    drawRWLight();
    drawPodiums();
    drawHUD();

    podiumLight1();
    podiumLight2();
    podiumLight3();
    podiumLight4()
    spotlight();

    drawHost();
    //if(state.cheatVis) drawCheat();
    drawApplause();
    if(state.applauseVis) drawApplauseON();

    //CUE CARD FOR CHEAT
    drawCheat();

    drawHands();
    drawAudience();

    text(`FPS: ${frameRate().toFixed(2)}`, width - 120, 150); //FPS ON SCREEN
    //if(state.isGameOver) image(assets.curtains, 0, 0, width, height)
}

const syncGameState = async () => {
    // Sync variables with gamestate
    if (frameCount % 30 === 0) { // Update twice per second
        getState().then(newState => {
            state = {
                ...state,
                ...newState,
                cheat: {
                    ...state.cheat,
                    ...newState.cheat
                }
            };
        });
    }
    updateLightPosition()
    if (frameCount % 30 === 0 && countdownTimer > 0) { 
        updateCountdown();
    }
    updateCheat()
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

function drawAudience() {
    if(assets.audience) {
        image(assets.audience, 0, 100, width, height);
    }
}

function drawContestant() {
    let x = 270;
    const y = 240;
    const spacing = 160;
    let scaleFactor = 0.20;
    assets.contestants.forEach((sheet, index) => {
        let frame = contestantFrames[index][currentFrame];

        if (frame && frame.sheet) {
            image(
                frame.sheet,
                x + index * spacing, y, // Destination position
                frameWidth * scaleFactor, frameHeight * scaleFactor, // Destination size
                frame.sx, frame.sy, frameWidth, frameHeight // Source position & size from sprite sheet
            );
        }
    });

    // Update frame only every few draw cycles
    if (frameCount % frameDelay === 0) {
        currentFrame = (currentFrame + 1) % totalFrames;
    }
}

function drawPodiums() {
    if (assets.podium1) {
        image(assets.podium1, width/4.5, height/2 + 20, width/4, height/4);
    }
    if (assets.podium2) {
        image(assets.podium2, width/2.93, height/2 + 20, width/4, height/4);
    }
    if (assets.podium3) {
        image(assets.podium3, width/2.16, height/2 + 20, width/4, height/4);
    }
    if (assets.podium4) {
        image(assets.podium4, width/1.74, height/2 + 20, width/4, height/4);
    }
}

// heads up display
function drawHUD() {
    if(assets.stars) {
        fill('#d9d9d9')
        rect(width - 285, 60, 250 * 2/3 + 70, 50 * 2/3)
        fill('#dc4042')
        let ratings = state.ratings || 0
        if (ratings > 250) ratings = 250
        rect(width - 285, 60, ratings * 2/3, 50 * 2/3)
        image(assets.stars, width - 300, -10, width/5, height/5);
    }
    if(assets.timer) {
        image(assets.timer, -20, -40, width/4, height/4);
        drawCountdown();
    }
}

function drawCountdown() {
    let safeCountdown = countdownTimer || 0;
    let minutes = Math.floor(safeCountdown / 60);
    let seconds = safeCountdown % 60;
    let timeString = nf(minutes, 2) + ':' + nf(seconds, 2);

    fill('black');
    textFont(countdownFont);
    textSize(40);
    textAlign(CENTER, CENTER);
    text(timeString, 160, 67); 
}

function updateCountdown() {
    if (countdownTimer > 0) {
        countdownTimer -= 1; // Decrease by one second
    }
}

//display right wrong light
function drawRWLight(x,y){
    //X-Coordinates for each podium
    //(243), (393), (563), (707)
    image(assets.rightLit, 393, 100, width/3, height/1.5);
    image(assets.wrongLit, 243, 123, width/3, height/1.5);

}

// displays cheat asset
function drawCheat(){
    if (assets.cheat && state?.cheat?.cheatOn) {
        image(assets.cheat, 0, 100, width/3, height/1.5);
    }
}

function drawApplause(){
    if(assets.applause){
        image(assets.applause, width/2 - 150, -55, width/4, height/4);
    }
}

function drawApplauseON(){
    if(assets.applauseon){
        image(assets.applauseon, width/2 - 150, -55, width/4, height/4);
    }
}

function drawHands() {
    if(assets.hands) {
        image(assets.hands, width/10 - 150, height/2 + 50, width, height/2);
    }
}

function updateCheat() {
    if (state.cheatVis) { showCheat()}
    if (!state.cheatVis ) { hideCheat()}
}
 
  
//draw host sprite and calls animations based of state
function drawHost(sx, sy){
    //if host is in idle then call idle positions and state
    let x = 100;
    const y = height/2.4;
    //const spacing = 160;
    let scaleFactor = 0.38;
    let frameSpeed = 2
    //const alY = height / 2.25
    const alWidth = frameWidth * scaleFactor;
    const alHeight = frameHeight * scaleFactor;

    ///currentFrame = Math.floor(frameCount / frameSpeed) % totalFrames;
     sx = (currentFrame % numCols) * frameWidth;
     sy = Math.floor(currentFrame / numCols) * frameHeight;


    image(al, x, y, alWidth, alHeight, sx, sy, frameWidth, frameHeight);
   
    if (frameCount % frameDelay === 0) {
        currentFrame = (currentFrame + 1) % totalFrames;
    }
}

function drawZoom() {
    textSize(48);
    fill("black");
    if (state.zoom) text(`Zoom: ${state.zoom}`, windowWidth - 350, 75);
}

function spotlight(){
    if(assets.spotlight){
        image(assets.spotlight, 120,100, width/2, height)
    }
}

function podiumLight1(){
    if(assets.podiumlit1){
        image(assets.podiumlit1, 345,-50, width/3, height)
    }
}
function podiumLight2(){
    if(assets.podiumlit2){
        image(assets.podiumlit2, 241,-50, width/3, height)
    }
}
function podiumLight3(){
    if(assets.podiumlit3){
        image(assets.podiumlit3, 635,-50, width/3, height)
    }
}
function podiumLight4(){
    if(assets.podiumlit4){
    image(assets.podiumlit4, 565,-50, width/3, height)
    }
}

/*
function drawRatings(x, y) {
    let ratingsFilled = state.rating || 10
    if (ratingsFilled > 200) ratingsFilled = 200
  
    noStroke()
    fill('#d9d9d9')
    rect(x - 20, y - 25, 200, 50)
  
    fill('#fff7c2')
    rect(x - 20, y - 25, ratingsFilled, 50)
    image(assets.stars, x - 30, y - 25, 220, 50)
  
} */
let state;

//Sprite Sheet Animation Variables for Contestants
let al;
let hostXPos = 0;
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
const scaleFactor = 0.25;
let startTime;
let timerDuration;
let elaspedTime;

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
    cheat: "",
    curtains: "",
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
    //podiums are in front of animated contestants
    assets.podium1 = loadImage('/assets/Background/PodiumYellow Resized0.png');
    assets.podium2 = loadImage('/assets/Background/PodiumWhite Resized0.png');
    assets.podium3 = loadImage('/assets/Background/PodiumRed Resized0.png');
    assets.podium4 = loadImage('/assets/Background/PodiumBlue Resized0.png');
    //HUD (timer & score)
    assets.stars = loadImage('/assets/Background/StarRatings.png');
    assets.timer = loadImage('/assets/Background/Timer.png');

    //AL 
    al = loadImage('/assets/SpriteSheets/AL/AL_Talk_R.png'); // should be idle sprite but its not working
    
    
    //CONTESTANT ANIMATIONS
    p1idleSS = loadImage('/assets/SpriteSheets/p1/P1_Idle.png');
    p2idleSS = loadImage('/assets/SpriteSheets/p2/P2_Idle.png');
    p3idleSS = loadImage('/assets/SpriteSheets/p3/P3_Idle.png');
    p4idleSS = loadImage('/assets/SpriteSheets/p4/P4_Idle.png');

    assets.cheat = loadImage('/assets/Interactions/cheat/CheatingHand-01.png');
    assets.applause = loadImage('/assets/Interactions/applause/AudiencePopIn_OFF.png');
    assets.applauseon = loadImage('/assets/Interactions/applause/AudiencePopIn_ON.png');
    assets.podiumlit1 = loadImage('/assets/Interactions/podiums/1light_WhitePodium.png');
    assets.podiumlit2 = loadImage('/assets/Interactions/podiums/2light_YellowPodium.png');
    assets.podiumlit3 = loadImage('/assets/Interactions/podiums/3light_BluePodium.png');
    assets.podiumlit3 = loadImage('/assets/Interactions/podiums/4light_RedPodium.png');
    assets.curtains = loadImage('/assets/Background/Curtains-02 1.png');
}

window.setup = function () {
    // 16:9 aspect ratio with slight padding
    createCanvas(assets.background.width / 6, assets.background.height / 6);
    frameRate(frameRateSpeed);
    state = getState();
    let startTime = millis();
    timerDuration = 60;
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
   
    image(p1idleSS, 270, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    image(p2idleSS, 400, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    image(p3idleSS, 600, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    image(p4idleSS, 750, 250, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
    currentFrame = (currentFrame + 1) % totalFrames; // Looping Animation

    syncGameState();

    //draw rest of background here
    drawPodiums();
    drawHUD();
    if(state.cheatVis) drawCheat();
    drawApplause()
    if(state.applauseVis) drawApplauseON()
    
    updateCheat()


    //drawHost()
    // podiumLight1()
    // podiumLight2()
    // podiumLight3()
    // podiumLight4()
    //displayTimer();
    if(state.isGameOver) image(assets.curtains, 0, 0, width, height)
}

const syncGameState = async () => {
    // Sync variables with gamestate
    updateLightPosition()
    if (frameCount % 60 === 0) { // Every second
        state = await getState();
    }
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
        fill('#d9d9d9')
        rect(width - 325, 50, 250, 50)
        fill('#fff7c2')
        let ratings = state.ratings || 0
        if (ratings > 250) ratings = 250
        rect(width - 325, 50, ratings, 50)
        image(assets.stars, width - 350, -20, width/4, height/4);
    }
    // if(assets.timer) {
    //     image(assets.timer, -20, -40, width/4, height/4);
    // }
}


function drawCheat(){
    if(state.cheatVis){
        if(assets.cheat) {
            image(assets.cheat, 100, 100, width/4, height/4);
        }
    }
    
}

function drawApplause(){
 if(assets.applause){
    image(assets.applause,width/2, -50, width/4, height/4)
 }
}

function drawApplauseON(){
    if(assets.applauseon){
        image(assets.applauseon, width/2,-50, width/4, height/4)
    }
}

function updateCheat() {
    showCheat()
}
 
  
/*
function drawHost(sx, sy){
    const alY = height / 2.25
    const alWidth = frameWidth * scaleFactor;
    const alHeight = frameHeight * scaleFactor;

    image(al, hostXPos, alY, alWidth, alHeight, sx, sy, frameWidth, frameHeight);
   
    hostXPos += speed;
  
    // Reverse direction 
    if (hostXPos >= width + alWidth || hostXPos <= 0 - alWidth) {
      speed *= -1;  // Flip the direction
    }

    //image(al, 180,500, newWidth, newHeight, sx, sy, frameWidth, frameHeight)
}*/

/*
function drawContestant(sx,sy){

   let x = 275
   const y = 250
   const spacing = 150
   const contestantWidth = frameWidth * scaleFactor * 0.75
   const contestantHeight = frameHeight * scaleFactor * 0.75
   
   assets.contestants.forEach(contestant => {
        image(contestant, x, y, contestantWidth, contestantHeight, sx, sy, frameWidth, frameHeight)
    
        const podiumWidth = assets.podium.width / 4
        const podiumHeight = assets.podium.height / 4
        const podiumX = x + contestantWidth / 3 + 10
        const podiumY = y + contestantHeight - 25

        image(assets.podium, podiumX, podiumY, podiumWidth, podiumHeight)
   });
}*/

function drawZoom() {
    textSize(48);
    fill("black");
    if (state.zoom) text(`Zoom: ${state.zoom}`, windowWidth - 350, 75);
  }

  /*
  function drawLights(){

   const lightWidth = assets.light.width / 4
   const lightHeight = assets.light.height / 4
   if (state.lightPosX) image(assets.light, state.lightPosX, height / 4, lightWidth, lightHeight)
   else image(assets.light, -300, (height / 3) - 75, lightWidth, lightHeight)
  }*/

// function podiumLight1(){
//     if(assets.podiumlit1){
//         image(assets.podiumlit1, 80,40, width/4, height/4)
//     }
// }
// function podiumLight2(){
//     if(assets.podiumlit2){
//         image(assets.podiumlit1, 100,40, width/4, height/4)
//     }
    
// }
// function podiumLight3(){
//     if(assets.podiumlit3){
//         image(assets.podiumlit3, 120,40, width/4, height/4)
//     }
    
// }
// function podiumLight4(){
//     if(assets.podiumlit4){
//         image(assets.podiumlit4, 180,40, width/4, height/4)
//     }
    
// }
function drawRatings(x, y) {
    let ratingsFilled = state.rating || 10
    if (ratingsFilled > 200) ratingsFilled = 200
  
    noStroke()
    fill('#d9d9d9')
    rect(x - 20, y - 25, 200, 50)
  
    fill('#fff7c2')
    rect(x - 20, y - 25, ratingsFilled, 50)
    image(assets.stars, x - 30, y - 25, 220, 50)
  
  }
  
  //TODO check again
  function drawStar(x, y, size, fillAmount) {
    push();
    translate(x, y);
    stroke(0);
    fill(fillAmount > 0 ? color(255, 204, 0) : 255); // Fill yellow if filled
    beginShape();
    for (let i = 0; i < 10; i++) {
      let angle = PI / 5 * i;
      let radius = (i % 2 === 0) ? size / 2 : size / 4;
      let sx = cos(angle) * radius;
      let sy = sin(angle) * radius;
      vertex(sx, sy);
    }
    endShape(CLOSE);
    pop();
  }
 
/*
function displayTimer(){
   
     //}  
      elapsedTime = (millis() - startTime) / 1000;

      remainingTime = max(timerDuration - elapsedTime, 0); // no neg vals
     console.log(elapsedTime);
     console.log(timerDuration);
     console.log(remainingTime);
     fill(0);
     textSize(30);
     textAlign(CENTER, CENTER)
     text(remainingTime.toFixed(1), -20 , -40);
     if(remainingTime <= 0){
          text("Time's up!", -20, -40);
         }
     
  }*/
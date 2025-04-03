//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )



//variables 
let hostPos = 0; // initial host position
let speed = 3 // speed of host
let alWalkingSS; //al walking 
let p1idleSS; // player 1 idle 
let p2idleSS; // player 2 idle 
let p3idleSS; // player3idle
let p4idleSS;
let frameWidth = 1922; // Original sprite width
let frameHeight = 1082; // Original sprite height
let cols = 6;
let rows = 9;
let totalFrames = cols * rows;
let currentFrame = 0;
let frameRateSpeed = 10; // Adjust speed
const scaleFactor = 0.2; // Scale factor for resizing

let state;

const assets = {
  contestants: [],
  applause: "",
  audience: "",
  al: "",
  podium: "",
  stars: "",
  stage: "",
  background: "",
  light: "",
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
  alWalkingSS = loadImage("/assets/SpriteSheets/AlWalking.png");
  p1idleSS = loadImage("/assets/SpriteSheets/player1idle.png");
  p2idleSS = loadImage("/assets/SpriteSheets/player2idle.png");
  p3idleSS = loadImage("/assets/SpriteSheets/player3idle.png");
  p4idleSS = loadImage("/assets/SpriteSheets/player4idle.png");

  assets.applause = loadImage('/assets/Off Air Screen copy 8 1.png')
  assets.audience = loadImage('/assets/audience.png')
  assets.al = loadImage('/assets/FullBodyAL.png')
  assets.podium = loadImage('/assets/Podium.png');
  assets.light = loadImage('/assets/lightShine.png');

  assets.stars = loadImage('/assets/stars.png');

  assets.stage = loadImage('/assets/Stage_UnderPodiums.png');
  assets.background = loadImage('/assets/Background.png');




}

window.setup = function () {
  // 16:9 aspect ratio with slight padding
  createCanvas(assets.background.width / 6, assets.background.height / 6);
  frameRate(frameRateSpeed);
  //calculateScale();
  state = getState()
}

window.draw = function () {
  background(255);
  drawBackground()

  let row = currentFrame % rows; // Frames go top to bottom
  let col = Math.floor(currentFrame / rows); // Move horizontally

  let sx = col * frameWidth;
  let sy = row * frameHeight;

  let newWidth = frameWidth * scaleFactor;
  let newHeight = frameHeight * scaleFactor;

 // image(alWalkingSS, 0, 0, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
  image(p1idleSS, 0, 0, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
  image(p2idleSS, 0, 0, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
  image(p3idleSS, 0, 0, newWidth, newHeight, sx, sy, frameWidth, frameHeight);
  image(p4idleSS, 0, 0, newWidth, newHeight, sx, sy, frameWidth, frameHeight);

  currentFrame = (currentFrame + 1) % totalFrames; // Loop animation

  syncGameState()


  // Draw game elements
  drawLights()
  // drawCheat()
  drawRatings(30, 30, 5)
  drawContestant()
  drawHost()
  drawVolume()
  drawAudience()

  if (state.applauseVis) drawApplause()
  if (! state.applauseVis) hideApplause()
  

  // Update game elements
  // May move out of this file into utils.js
  updateCheat()
}
/*
// Recalculate scale when window resizes
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateScale();
}

// Scale the sprite to fit the screen
function calculateScale() {
  let scaleX = windowWidth / frameWidth;
  let scaleY = windowHeight / frameHeight;
  scaleFactor = min(scaleX, scaleY); // Maintain aspect ratio
}*/

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
    image(assets.stage, 0, 0, width, height);
  }

}

function updateCheat() {
  showCheat()
}

function drawCheat() {
  if (state.cheatVis) {
    fill(255, 0, 0)
    ellipse(state.cheatX, 100, 100, 100)
  }
}

function drawHost() {
  let row = currentFrame % rows; // Frames go top to bottom
  let col = Math.floor(currentFrame / rows); // Move horizontally

  let sx = col * frameWidth;
  let sy = row * frameHeight;

  let newWidth = frameWidth * scaleFactor;
  let newHeight = frameHeight * scaleFactor;

  image(alWalkingSS, 0, 0, newWidth, newHeight, sx, sy, frameWidth, frameHeight);

  const yPos = height / 2.25

  // resizing consistently 
  const alWidth = assets.al.width / 2.75
  const alHeight = assets.al.height / 2.75

  // // draw al facing the direction he's walking
  // if (speed < 0) image(assets.al, hostPos, yPos, alWidth, alHeight)
  // else {
  //   push()
  //   scale(-1, 1)
  //   image(assets.al, -hostPos, yPos, alWidth, alHeight)
  //   pop()
  // }

  hostPos += speed;

  // Reverse direction 
  if (hostPos >= width + alWidth || hostPos <= 0 - alWidth) {
    speed *= -1;  // Flip the direction
  }
}
function drawAudience() {
  const audienceTextureWidth = assets.audience.width
  const audienceTextureHeight = assets.audience.height

  // constrains to bottom of the screen
  image(assets.audience, 0, 0, width, height, 0, 0, audienceTextureWidth, audienceTextureHeight, CONTAIN);

  showApplause()
}

function drawApplauseOn(){
  if(state.applause){
    image(assets.applauseon, 0, 0, width, height)
  }
}

function drawApplauseOff(){
  if(!state.applause){
    image(assets.applauseoff, 0, 0, width, height)
  }
}



//light producer has to host with light, producer cannot move host
//key controls

function drawLights() {
  const lightWidth = assets.light.width / 4
  const lightHeight = assets.light.height / 4
  if (state.lightPosX) image(assets.light, state.lightPosX, height / 4, lightWidth, lightHeight)
  else image(assets.light, -300, (height / 3) - 75, lightWidth, lightHeight)
}


// contestant podium lights up 
function drawContestant() {
  let x = width / 4
  const y = height / 2.5
  const spacing = 200

  assets.contestants.forEach(contestant => {
    const contestantWidth = contestant.width / 6
    const contestantHeight = contestant.height / 6

    image(contestant, x, y, contestantWidth, contestantHeight)

    const podiumWidth = assets.podium.width / 4
    const podiumHeight = assets.podium.height / 4
    const podiumX = x + 2
    const podiumY = y + contestantHeight - 25

    image(assets.podium, podiumX, podiumY, podiumWidth, podiumHeight)

    x += spacing
  })

}

function drawVolume() {
  textSize(48);
  fill("black")
  if (state.volume) text(`Volume: ${state.volume}`, windowWidth - 350, 75);
}

// DELETE - testing only  
window.keyPressed = function () {
  let lightSpeed = 25;

  if (keyCode === LEFT_ARROW) {
    console.log("Left arrow pressed");
    if (state.lightPosX) state.lightPosX += lightSpeed
  } else if (keyCode === RIGHT_ARROW) {
    console.log("Right arrow pressed");
    if (state.lightPosX) state.lightPosX += lightSpeed; // Move right
  } else if (key === 'a') {
    hideApplause()
  } else if (key === 'c') {
    hideCheat()
  }
}

function drawRatings(x, y, numStars) {
  let starSize = 30;
  let spacing = 40;
  let maxRating = 100;
  let currentRatings = state.ratings || 0
  let filledStars = (currentRatings / maxRating) * numStars; // Convert value to star count

  image(assets.stars, x - 30, y - 25, 220, 50)
  console.log(state.ratings)

  for (let i = 0; i < numStars; i++) {
    // constrain(value, min, max) limit to specified range
    let fillAmount = constrain(filledStars - i, 0, 1); // 1 = full star, 0.5 = half star, etc.
    drawStar(x + i * spacing, y, starSize, fillAmount);
  }
}

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
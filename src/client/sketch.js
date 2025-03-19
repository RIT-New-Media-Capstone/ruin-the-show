//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )

//variables 
let hostPos = 0; // initial host position
let speed = 3 // speed of host

let state;

const assets = {
  contestants: [],
  applause: "",
  audience: "", 
  al: "",
  meterBack: "",
  spinner: "", 
  podium: "", 
}

import {
  getState,
  hideCheat,
  hideApplause,
  updateLightPosition,
  moveAndShowCheat,
  showApplause,
} from "./utils.js";

window.preload = function () {
  assets.contestants.push(loadImage('/assets/1contestant.png'))
  assets.contestants.push(loadImage('/assets/2contestant.png'))
  assets.contestants.push(loadImage('/assets/3contestant.png'))
  assets.contestants.push(loadImage('/assets/4contestant.png'))

  assets.applause = loadImage('/assets/Off Air Screen copy 8 1.png')
  assets.audience = loadImage('/assets/audience.png')
  assets.al = loadImage('/assets/FullBodyAL.png')
  assets.meterBack = loadImage('/assets/Applause-O-Meter.png')
  assets.spinner = loadImage('/assets/Spinner.png')
  assets.podium = loadImage('/assets/Podium.png');

  // ^^ use this format to load images 
}

window.setup = function () {
  // 16:9 aspect ratio with slight padding
  createCanvas(windowWidth - 50, (windowWidth - 50) * 9 / 16);
  state = getState()
}

window.draw = function () {
  background(220);

  syncGameState()


  // Draw game elements
  drawAudience()
  drawHost()
  drawLights()
  drawCheat()
  drawRatings(30, 30, 5)
  drawContestant()
  drawVolume()
  if (state.applauseVis) drawApplause()

  // Update game elements
  // May move out of this file into utils.js
  updateCheat()
}

const syncGameState = async () => {
  // Sync variables with gamestate
  updateLightPosition()
  if (frameCount % 60 === 0) { // Every second
    state = await getState();
  }
}

function updateCheat() {
  moveAndShowCheat()
}

function drawCheat() {
  if (state.cheatVis) {
    fill(255, 0, 0)
    ellipse(state.cheatX, 100, 100, 100)
  }
}

function drawAudience() {
  const audienceTextureWidth = assets.audience.width
  const audienceTextureHeight = assets.audience.height

  // constrains to bottom of the screen
  image(assets.audience, 0, 0, width, height, 0, 0, audienceTextureWidth, audienceTextureHeight, CONTAIN);

  showApplause()
}

function drawApplause() {
  const applauseY = height / 2
  fill(255)
  if(state.applauseX) ellipse(state.applauseX, applauseY, 30, 30)
}

//light producer has to host with light, producer cannot move host
//key controls

function drawLights() {
  fill("orange")
  if(state.lightPosX) ellipse(state.lightPosX, 300, 50, 50)
}

// host moves on his own he should also pause every now and then
function drawHost() {
  fill("yellow"); // Set fill color to yellow
  ellipse(hostPos, height / 2, 50, 50); // Draw the circle host bobble head 

  hostPos += speed;

  // Reverse direction 
  if (hostPos >= width || hostPos <= 0) {
    speed *= -1;  // Flip the direction
  }
}

// contestant podium lights up 
function drawContestant() {
  fill(233);
  rect(width / 3, 350, 50, 90);
  rect(width / 3 + 200, 350, 50, 90);
  rect(width / 3 + 260, 350, 50, 90);

}

function drawVolume() {
  textSize(48);
  fill("black")
  if(state.volume) text(`Volume: ${state.volume}`, windowWidth - 350, 75);
}

// DELETE - testing only  
window.keyPressed = function () {
  let lightSpeed = 25;

  if (keyCode === LEFT_ARROW) {
    console.log("Left arrow pressed");
    if(state.lightPosX) state.lightPosX += lightSpeed
  } else if (keyCode === RIGHT_ARROW) {
    console.log("Right arrow pressed");
    if(state.lightPosX) state.lightPosX += lightSpeed; // Move right
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
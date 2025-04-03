//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )



//variables 
let hostXPos = 0; // initial host position
let speed = 3 // speed of host
const frameWidth = 1922; // Original sprite width
const frameHeight = 1082; // Original sprite height
const cols = 6;
const rows = 9;
const totalFrames = cols * rows;
let currentFrame = 0;
const frameRateSpeed = 10; // Adjust speed
const scaleFactor = 0.25; // Scale factor for resizing

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
  assets.al = loadImage("/assets/SpriteSheets/AlWalking.png");

  assets.contestants.push({src: loadImage("/assets/SpriteSheets/player1idle.png"), cols: 6, rows: 9, maxFrames: (6 * 9) - 4});
  assets.contestants.push({src: loadImage("/assets/SpriteSheets/player2idle.png"), cols: 7, rows: 11, maxFrames: (7 * 11) - 8});
  assets.contestants.push({src: loadImage("/assets/SpriteSheets/player3idle.png"), cols: 6, rows: 11, maxFrames: (6 * 11) - 4});
  assets.contestants.push({src: loadImage("/assets/SpriteSheets/player4idle.png"), cols: 6, rows: 9, maxFrames: (6 * 9) - 5});

  assets.applause = loadImage('/assets/Off Air Screen copy 8 1.png')
  assets.audience = loadImage('/assets/audience.png')
  assets.podium = loadImage('/assets/Podium.png');
  assets.light = loadImage('/assets/lightShine.png');

  assets.stars = loadImage('/assets/stars.png');

  assets.stage = loadImage('/assets/Stage_UnderPodiums.png');
  assets.background = loadImage('/assets/Background.png');

  assets.curtains = loadImage('/assets/Curtains-02 1.png');

}

window.setup = function () {
  // 16:9 aspect ratio with slight padding
  createCanvas(assets.background.width / 6, assets.background.height / 6);
  frameRate(frameRateSpeed);
  state = getState()
}

window.draw = function () {
  background(255);
  drawBackground()

  let row = currentFrame % rows; // Frames go top to bottom
  let col = Math.floor(currentFrame / rows); // Move horizontally

  let sx = col * frameWidth;
  let sy = row * frameHeight;

  currentFrame = (currentFrame + 1) % totalFrames; // Loop animation

  // Run every second - sync state
  setInterval(syncGameState, 1000);


  // Draw game elements
  drawLights()
  // drawCheat()
  drawRatings(30, 30, 5)
  drawContestant(sx, sy)
  drawHost(sx, sy)
  drawZoom()
  drawAudience()
  // if (state.applauseVis) drawApplause()

  // Update game elements
  // May move out of this file into utils.js
  updateCheat()

  // If gameover, show curtains 
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

function drawHost(sx, sy) {
  const alY = height / 2.25

  // resizing consistently 
  const alWidth = frameWidth * scaleFactor;
  const alHeight = frameHeight * scaleFactor;

  // // draw al facing the direction he's walking
  // if (speed < 0) image(assets.al, hostPos, yPos, alWidth, alHeight)
  // else {
  //   push()
  //   scale(-1, 1)
  //   image(assets.al, -hostPos, yPos, alWidth, alHeight)
  //   pop()
  // }

  image(assets.al, hostXPos, alY, alWidth, alHeight, sx, sy, frameWidth, frameHeight);
  
  hostXPos += speed;

  // Reverse direction 
  if (hostXPos >= width + alWidth || hostXPos <= 0 - alWidth) {
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

function drawApplause() {
  const applauseY = height / 2
  fill(255)
  if (state.applauseX) ellipse(state.applauseX, applauseY, 30, 30)
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
function drawContestant(sx, sy) {
  let x = 275
  const y = 250
  const spacing = 150
  const contestantWidth = frameWidth * scaleFactor * 0.75
  const contestantHeight = frameHeight * scaleFactor * 0.75

  assets.contestants.forEach(contestant => {
    image(contestant.src, x, y, contestantWidth, contestantHeight, sx, sy, frameWidth, frameHeight)

    const podiumWidth = assets.podium.width / 4
    const podiumHeight = assets.podium.height / 4
    const podiumX = x + contestantWidth / 3 + 10
    const podiumY = y + contestantHeight - 25

    image(assets.podium, podiumX, podiumY, podiumWidth, podiumHeight)

    x += spacing
  })

}

function drawZoom() {
  textSize(48);
  fill("black")
  if (state.zoom) text(`Volume: ${state.zoom}`, windowWidth - 350, 75);
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

function drawRatings(x, y) {
  // let starSize = 30;
  // let spacing = 40;
  // let maxRating = 100;
  // let currentRatings = state.ratings || 0
  // let filledStars = (currentRatings / maxRating) * numStars; // Convert value to star count

  let ratingsFilled = state.rating || 10
  if (ratingsFilled > 200) ratingsFilled = 200

  noStroke()
  fill('#d9d9d9')
  rect(x - 20, y - 25, 200, 50)

  fill('#fff7c2')
  rect(x - 20, y - 25, ratingsFilled, 50)
  image(assets.stars, x - 30, y - 25, 220, 50)
  // console.log(state.ratings)

  // for (let i = 0; i < numStars; i++) {
  //   // constrain(value, min, max) limit to specified range
  //   let fillAmount = constrain(filledStars - i, 0, 1); // 1 = full star, 0.5 = half star, etc.
  //   drawStar(x + i * spacing, y, starSize, fillAmount);
  // }


}

// function drawStar(x, y, size, fillAmount) {
//   push();
//   translate(x, y);
//   stroke(0);
//   fill(fillAmount > 0 ? color(255, 204, 0) : 255); // Fill yellow if filled
//   beginShape();
//   for (let i = 0; i < 10; i++) {
//     let angle = PI / 5 * i;
//     let radius = (i % 2 === 0) ? size / 2 : size / 4;
//     let sx = cos(angle) * radius;
//     let sy = sin(angle) * radius;
//     vertex(sx, sy);
//   }
//   endShape(CLOSE);
//   pop();
// }
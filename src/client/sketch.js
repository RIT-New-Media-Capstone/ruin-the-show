//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )

//variables 
let lightPosX = 0; // initial light position 
let hostPos = 0;// initial host position
let speed = 3 // speed of 
let ratings = 10 //getRatings

function setup() {
  createCanvas(windowWidth - 50, (windowWidth - 50) * 9 / 16);
  // resizeCanvas(windowWidth - 20, windowHeight - 20)
}

/*

*/
function draw() {
  background(220);
  hostInteract()
  audience()
  drawContestant()
  drawStars(30,30,5, ratings)
  drawLights()
  cheater()
  if(applauseVis) drawApplause()
    

  
}


//May go into classes 
// Host  will be moving back and forth 
// random cheat button
const cheat = () => {
  fill("red"); // Set fill color to red
 // ellipse(hostPos, height, 50, 50); 
}


function cheater(){
  
  const chanceCheat = 0.5;
  const cheating = random()

  fill("red");
  drawCheat()

  // if chance of it happening within bounds to trigger and 
  // state that it just move 
  //if not true sets visible to true 
  if(cheating < chanceCheat && !cheatVis ){
    moveCheat()
  }
  
}

let cheatX = 0
let cheatVis = false // is cheat visible

function drawCheat() {
  fill(255,0,0)
  ellipse(cheatX, 0, 100 , 100) 
}

function moveCheat() {
    cheatX = random(80, 250);
    cheatVis = true;
}

const hideCheat = () => {
   cheatVis = false;
}

// Audience applause when board lights up same as speech bubble 
// Over random audience member for the list 
function audience(){
  fill(0,0,0)
  rect(0 , 500 ,width,150);

  let speed = 0.5;
  const chanceApplause = 0.5;
  const applause = random()

  // if chance of it happening within bounds to trigger and 
  // state that it just move 
  //if not true sets visible to true 
  if(applause < chanceApplause && !applauseVis ){
    moveApplause()
  }
}

let applauseX = 0
let applauseVis = false // is applause visible

function drawApplause() {
  fill(255)
  ellipse(applauseX, height/2, 30 , 30) 
}

function moveApplause() {
    applauseX = random(100, 250);
    applauseVis = true;
}

const hideApplause = () => {
  applauseVis = false
}

//light producer has to host with light, producer cannot move host
//key controls

function drawLights(){
  fill("orange")
   ellipse(lightPosX,300,50,50)
}




// host moves on his own he should also pause every now and then
function hostInteract(){
  fill("yellow"); // Set fill color to yellow
  ellipse(hostPos, height / 2, 50, 50); // Draw the circle host bobble head 
  
  hostPos += speed; 
  
  // Reverse direction 
  if (hostPos >= width || hostPos <= 0) {
    speed *= -1;  // Flip the direction
  }

  
}
// contestant podium lights up 
function drawContestant(){
  fill(233);
  rect(width/2 ,350,50,90);
  rect(width/2+ 200,350,50,90);
  rect(width/2+ 260,350,50,90);

}



// need to figure out a way to wire 
function keyPressed() {
  let lightSpeed  = 25; 
   
  if (keyCode === LEFT_ARROW) {
    console.log("Left arrow pressed");
    lightPosX -= lightSpeed; // Move left

  } else if (keyCode === RIGHT_ARROW) {
    console.log("Right arrow pressed");
    lightPosX += lightSpeed; // Move right

  } else if (key === 'a') {
    hideApplause()
  } else if (key === 'c') {
    cheater()
    
  }
}

//Rating visualization
let rating = 100; 

function drawStars(x, y, numStars, value) {
  let starSize = 30;
  let spacing = 40;
  let maxRating = 100;
  let filledStars = (value / maxRating) * numStars; // Convert value to star count

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
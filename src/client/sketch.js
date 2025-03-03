//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )

//variables 
let lightPos = 0 // initial light position
let speed = 3 // speed of 
let score = 10 //getScore

function setup() {
  createCanvas(400, 400);
  resizeCanvas(windowWidth - 20, windowHeight - 20)
}

/*

*/
function draw() {
  background(220);
  lightInteract()
  audience()
  drawContestant()
  drawStars(30,30,5, score)
  if(applauseVis) drawApplause()

  
}


//May go into classes 
// Host  will be moving back and forth 
// random cheat button
const cheat = () => {
  fill("red"); // Set fill color to red
  ellipse(lightPos, height, 50, 50); 
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

function drawHost(){
   ellipse(10,0,50,50)
}

function hostPos(){

}


// light moves with keys 
function lightInteract(){
  fill("yellow"); // Set fill color to yellow
  ellipse(lightPos, height / 2, 50, 50); // Draw the circle host bobble head 
  
  lightPos += speed; 
  
  // Reset position when it goes off screen
  if (lightPos > width) {
    lightPos = 0;
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
  if (keyCode === LEFT_ARROW) {
    console.log("Left arrow pressed");
  } else if (keyCode === RIGHT_ARROW) {
    console.log("Right arrow pressed");
  } else if (key === 'a') {
    hideApplause()
  } else if (key === 'c') {
    cheat()
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
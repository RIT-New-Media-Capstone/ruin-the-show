//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )

//variables 
let host = 0 // initial x position
let speed = 3 // speed of 

function setup() {
  createCanvas(400, 400);
  resizeCanvas(windowWidth - 20, windowHeight - 20)
}

function draw() {
  background(220);
  hostInteract()
  audience()
  contestantInteract()
  if(applauseVis) drawApplause()

  
}

//May go into classes 
// Host  will be moving back and forth 
// random cheat button
const cheat = () => {
  fill(0, 102, 255); // Set fill color to blue
  ellipse(host, height, 50, 50); 
}
// Audience applause when board lights up same as speech bubble 
// Over random audience member for the list 
function audience(){
  fill(0,0,0)
  rect(0 , 500 ,width,150);

  let speed = 0.5;
  const chanceApplause = .05;
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
  ellipse(applauseX, height, 30 , 30) 
}

function moveApplause() {
    applauseX = randomGaussian(50, width - 50);
    applauseVis = true;
}

const hideApplause = () => {
  applauseVis = false
}

// contestant podium lights up 
function contestantInteract(){
  fill(233);
  rect(width/2 ,350,50,90);
  rect(width/2+ 200,350,50,90);
  rect(width/2+ 260,350,50,90);

}

// edit to oscilate  based direction
function hostInteract(){
  fill(0, 102, 255); // Set fill color to blue
  ellipse(host, height / 2, 50, 50); // Draw the circle host bobble head 
  
  host += speed; 
  
  // Reset position when it goes off screen
  if (host > width) {
    host = 0;
  }
}

// need to figure out a way to wire 

// module.exports = { cheat, hideApplause }
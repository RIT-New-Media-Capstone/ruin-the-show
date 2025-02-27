//variables 
let host = 0 // initial x position
let speed = 3 // speed of 

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  hostInteract()
  
}

//May go into classes 
// Host  will be moving back and forth 
// random cheat button
function cheat(){
  
}
// Audience applause 
function audience(){
  fill()

}

// edit to oscilate
function hostInteract(){
  fill(0, 102, 255); // Set fill color to blue
  ellipse(host, height / 2, 50, 50); // Draw the circle host bobble head 
  
  host += speed; 
  
  // Reset position when it goes off screen
  if (host > width) {
    host = 0;
  }
}
//events set up  with arduino and visual back 
// fill out function interaction animation 
//linke to events ( mouse pressed etc )

//variables 
let host = 0 // initial x position
let speed = 3 // speed of 

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  hostInteract()
  audience()
  
}

//May go into classes 
// Host  will be moving back and forth 
// random cheat button
function cheat(){
  fill(0, 102, 255); // Set fill color to blue
  ellipse(host, height, 50, 50); 
}
// Audience applause when board lights up same as speech bubble 
// Over random audience member for the list 
function audience(){
  fill(0,0,0)
  rect(0 , 325 ,width,75);

  let rContest =  random(0, width);
  let speed = 0.5;
  let chance = .5;

  if(chance < 1){
    fill(255)
    ellipse(rContest, 300, 30 , 30) 

  }
  

}


// contestant podium lights up 
function contestantInteract(){
  rect(50,150,50,50);
  rect(50,50,250,50);
  rect(50,60,50,50);

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

//host introduction sequence
// display applause screen, if app

//screen variables 
let applauseBtnScr; // image variables
let hostJstkScr;
let cheatScr
let contestantBtnScr;
let splashScr; 

//user inputs 
let hostJstk;
let curtainLever;
let smBtn1; 
let smBtn2;
let smBtn3;
let smBtn4;
let cheatBtn;
let applauseBtn;
let currentScr;
let currentBtn;

window.preload = function () {

    // replace with screen videos or images 
    assets.contestants.push(loadImage('/assets/.png'))
    assets.contestants.push(loadImage('/assets/.png'))
    assets.contestants.push(loadImage('/assets/.png'))
    assets.contestants.push(loadImage('/assets/.png'))
  
    assets.applause = loadImage('/assets/.png')
    assets.audience = loadImage('/assets/.png')
    assets.al = loadImage('/assets/.png')
    assets.podium = loadImage('/assets/.png');
    assets.light = loadImage('/assets/.png');
  
    assets.stars = loadImage('/assets/.png');
  
    assets.stage = loadImage('/assets/.png');
    assets.background = loadImage('/assets/.png');
  
    // ^^ use this directory to load images 
  }
   function setup(){

   }

   function draw(){

    if((currentScr == splashScr) ){
        console.log("ready to start")
    }

    //edit to check for button inputs 
    if ((currentScr == applauseBtnScr) && (currentBtn == applauseBtn)){
        //switch screen
        currentScr = hostJstkScr;
    }

    if ((currentScr == hostJstkScr) && (currentBtn == hostJstk)){
        //switch screen
        currentScr = contestantBtnScr;
    }


    if ((currentScr == contestantBtnScr)){
    // make sure the user presses all 4 buttons 
        currentScr = hostJstkScr
    }

    if((currentScr == cheatScr)){
        
    }

   }


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

window.setup = async function () {
    createCanvas(assets.background.width / 6, assets.background.height / 6);
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("THIS IS SCORE.JS!", width / 2, height / 2);
}
const audio = {
    applause,
    buzzerCorrect,
    buzzerEnd,
    buzzerWrong,
    cheat,
    ratingsUp,
    ratingsDown
}

window.preload = function () {
    audio.applause.push = loadImage("assets/Audio/RTS_SFX/")
    audio.buzzerCorrect.push = loadImage("assets/Audio/RTS_SFX/Buzzers/correct_buzzer.mp3");
    audio.buzzerEnd.push = loadImage("assets/Audio/RTS_SFX/Buzzers/winner-bell-game-show.mp3");
    audio.buzzerWrong.push = loadImage("assets/Audio/RTS_SFX/Buzzers/wrong_buzzer.mp3")
    //cheat
    audio.ratingsUp.push = loadImage("assets/Audio/RTS_SFX/Ratings/Ratings3.mp3")
    //ratings down
}

export { audio }
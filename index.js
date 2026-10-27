var images = [
    "assets/akatsuki.png",
    "assets/blackcat.png",
    "assets/shin.png",
    "assets/joestarr.png",
    "assets/ichi.png",
    "assets/sun.png",
    "assets/pochita.png",
    "assets/deadpool.png",
];

var STAGES = [2, 4, 8, 8];   // pairs per stage (stage 4 = timed 4x4)
var TIME_LIMIT = 40;         // seconds for the final stage
var stage = 0;

var firstcard = null;
var secondcard = null;
var canflip = true;
var gameOver = false;
var matches = 0;
var moves = 0;
var seconds = 0;
var timerrunning = false;
var timerinterval;

var matchSound = new Audio("assets/match.mp3");
var wrongSound = new Audio("assets/wrong.mp3");
matchSound.volume = 0.3;
wrongSound.volume = 0.3;


var loseSound = new Audio("assets/lose.mp3");
var winSound = new Audio("assets/winn.wav");
loseSound.volume = 0.3;
winSound.volume = 0.3;


function playSound(sound) {
    sound.currentTime = 0;               // restart if it's still playing
    sound.play().catch(function () {});
}


function totalPairs() {
    return STAGES[stage];
}

function isTimed() {
    return stage === STAGES.length - 1;
}

function startGame() {
    var gameBoard = document.getElementById("gameBoard");
    gameBoard.innerHTML = "";
    gameBoard.dataset.stage = stage + 1;
    document.getElementById("stageLabel").textContent =
        isTimed() ? "Final Stage! Try to beat the time!" : "Stage " + (stage + 1);

    var picked = images.slice().sort(function () {
        return Math.random() - 0.5;
    }).slice(0, totalPairs());

    var cardImages = picked.concat(picked);
    cardImages.sort(function () {
        return Math.random() - 0.5;
    });

    for (var i = 0; i < cardImages.length; i++) {
        var card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<div class="card-front"><img src="assets/cardlogo.png" alt="Card logo"></div>
    <div class="card-back"><img src="${cardImages[i]}" alt=""></div> `
        card.onclick = flipCard;
        card.dataset.image = cardImages[i];
        gameBoard.appendChild(card);
    }

    firstcard = null;
    secondcard = null;
    canflip = true;
    gameOver = false;
    matches = 0;
    moves = 0;
    seconds = isTimed() ? TIME_LIMIT : 0;   // countdown vs count-up
    timerrunning = false;

    clearInterval(timerinterval);
    updateStats();
}

function flipCard() {
    if (!canflip || gameOver) return;
    if (this.classList.contains("flipped")) return;
    if (this.classList.contains("matched")) return;

    if (!timerrunning) {
        startTimer();
    }

    this.classList.add("flipped");

    if (firstcard == null) {
        firstcard = this;
    } else {
        secondcard = this;
        canflip = false;
        moves++;
        updateStats();
        checkMatch();
    }
}

function checkMatch() {
    var a = firstcard;
    var b = secondcard;
    var match = a.dataset.image === b.dataset.image;

    if (match) {
        setTimeout(() => {
            if (gameOver) return;
            a.classList.add("matched");
            b.classList.add("matched");
            burst(a);
            burst(b);
            playSound(matchSound);
            matches++;
            updateStats();
            resetCards();

            if (matches === totalPairs()) {
                endGame();
            }
        }, 600);
    } else {
        // shake once the flip animation has finished
        setTimeout(() => {
            if (gameOver) return;
            a.classList.add("wrong");
            b.classList.add("wrong");
            playSound(wrongSound);
        }, 600);

        setTimeout(() => {
            a.classList.remove("flipped", "wrong");
            b.classList.remove("flipped", "wrong");
            if (gameOver) return;
            resetCards();
        }, 1100);
    }
}

function burst(card) {
    var r = card.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var colors = ["#ffd166", "#ff98ba", "#98d8c8", "#ffffff"];
    var count = 12;

    for (var i = 0; i < count; i++) {
        var p = document.createElement("div");
        var angle = (Math.PI * 2 / count) * i;
        var dist = 50 + Math.random() * 40;

        p.className = "spark";
        p.style.left = cx + "px";
        p.style.top = cy + "px";
        p.style.background = colors[i % colors.length];
        p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
        p.addEventListener("animationend", function () {
            this.remove();
        });
        document.body.appendChild(p);
    }
}

function resetCards() {
    firstcard = null;
    secondcard = null;
    canflip = true;
}

function startTimer() {
    timerrunning = true;
    timerinterval = setInterval(() => {
        if (isTimed()) {
            seconds--;
            updateStats();
            if (seconds <= 0) {
                loseGame();
            }
        } else {
            seconds++;
            updateStats();
        }
    }, 1000);
}

function updateStats() {
    document.getElementById("moves").textContent = moves;
    document.getElementById("matches").textContent = matches + "/" + totalPairs();

    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (secs < 10) {
        secs = "0" + secs;
    }

    var timeEl = document.getElementById("time");
    timeEl.textContent = mins + ":" + secs;
    // turn red in the last 10 seconds of the timed stage
    timeEl.classList.toggle("warning", isTimed() && seconds <= 10);
}

function endGame() {
    gameOver = true;
    clearInterval(timerinterval);

    var last = stage === STAGES.length - 1;
    if (last) playSound(winSound); 

    document.getElementById("winTitle").textContent = last ? "You Win!" : "Stage Complete!";
    document.getElementById("nextBtn").style.display = last ? "none" : "";
    document.getElementById("restartAllBtn").style.display = last ? "" : "none";

    document.getElementById("finalMoves").textContent = moves;
    document.getElementById("finalTime").textContent = document.getElementById("time").textContent;
    document.getElementById("winModel").classList.add("show");
}

function loseGame() {
    gameOver = true;
    canflip = false;
    clearInterval(timerinterval);
      playSound(loseSound);
    document.getElementById("loseModel").classList.add("show");
}

function newGame() {          // replays the CURRENT stage
    document.getElementById("winModel").classList.remove("show");
    document.getElementById("loseModel").classList.remove("show");
    clearInterval(timerinterval);
    startGame();
}

function nextStage() {
    stage++;
    newGame();
}

function restartAll() {       // back to stage 1
    stage = 0;
    newGame();
}

var bgm = document.getElementById("bgm");
bgm.volume = 0.4;            // 0 to 1
var musicOn = true;

function startMusic() {
    if (musicOn && bgm.paused) {
        bgm.play().catch(function () {});
    }
}
// browsers only allow audio after a click, so start on the first one
document.addEventListener("click", startMusic, { once: true });

function toggleMusic() {
    musicOn = !musicOn;
    if (musicOn) {
        bgm.play().catch(function () {});
    } else {
        bgm.pause();
    }
    document.getElementById("muteBtn").textContent =
        musicOn ? "Music: On" : "Music: Off";
}


startGame();
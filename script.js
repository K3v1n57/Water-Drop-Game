const gameContainer = document.getElementById("game-container");
const bucket = document.getElementById("bucket");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const difficultySelect = document.getElementById("difficulty-select");
const dingSound = document.getElementById("ding-sound");

// --- State
let score = 0;
let timeLeft = 60;
let gameInterval = null;
let dropInterval = null;
let gameRunning = false;
let dropSpeed = 4;          // pixels per tick
let dropIntervalTime = 1000; // ms between spawns

// --- Ensure variables are defined before use
function applyDifficultySettings() {
  const diff = difficultySelect ? difficultySelect.value : "medium";
  if (diff === "easy") {
    dropSpeed = 3;
    dropIntervalTime = 1200;
    timeLeft = 60;
  } else if (diff === "medium") {
    dropSpeed = 5;
    dropIntervalTime = 900;
    timeLeft = 60;
  } else if (diff === "hard") {
    dropSpeed = 8;
    dropIntervalTime = 500;
    timeLeft = 60;
  } else if (diff === "impossible") {
    dropSpeed = 10;
    dropIntervalTime = 200;
    timeLeft = 60;
  }
}

// Apply initial difficulty so values exist before start
applyDifficultySettings();

// --- Difficulty change handler
if (difficultySelect) {
  difficultySelect.addEventListener("change", () => {
    applyDifficultySettings();
    // if game running, restart drop spawn interval with new rate
    if (gameRunning) {
      clearInterval(dropInterval);
      dropInterval = setInterval(createDrop, dropIntervalTime);
    }
  });
}

// --- Start / Reset
if (startBtn) startBtn.addEventListener("click", startGame);
if (resetBtn) resetBtn.addEventListener("click", resetGame);

function startGame() {
  if (gameRunning) return;
  gameRunning = true;

  // apply difficulty to ensure timeLeft and speeds are set
  applyDifficultySettings();

  score = 0;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;

  startBtn.classList.add("hidden");
  resetBtn.classList.add("hidden");
  document.getElementById("difficulty").classList.add("hidden");

  // timer and drops
  gameInterval = setInterval(() => {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    if (timeLeft <= 0) 
      endGame();
  }, 1000);

  // spawn drops using current dropIntervalTime
  dropInterval = setInterval(createDrop, dropIntervalTime);
}

function resetGame() {
  // stop intervals and clear drops
  clearInterval(gameInterval);
  clearInterval(dropInterval);
  document.querySelectorAll(".drop").forEach(d => d.remove());
  gameRunning = false;

  // reset UI
  score = 0;
  timeLeft = 60;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  resetBtn.classList.add("hidden");
  startBtn.classList.remove("hidden");

  // reapply difficulty defaults (in case select changed while playing)
  applyDifficultySettings();
}

// --- Create & animate a drop
function createDrop() {
  // guard
  if (!gameRunning) return;

  const drop = document.createElement("div");
  drop.className = "drop";
  drop.textContent = "💧";
  // start position
  drop.style.left = Math.random() * (gameContainer.clientWidth - 30) + "px";
  drop.style.top = "-30px"; // start above visible area
  gameContainer.appendChild(drop);

  // animate by moving top every tick
  const tickMs = 20;
  const fall = setInterval(() => {
    // element may be removed externally; guard
    if (!document.body.contains(drop)) {
      clearInterval(fall);
      return;
    }

    const newTop = drop.offsetTop + dropSpeed;
    drop.style.top = newTop + "px";

    // check collision
    if (checkCatch(drop)) {
      // caught
      score++;
      scoreDisplay.textContent = score;
      playDing();
      checkMilestones();
      drop.remove();
      clearInterval(fall);
    } else if (newTop > gameContainer.clientHeight - 20) {
      // missed - remove
      drop.remove();
      clearInterval(fall);
    }
  }, tickMs);
}

// --- Collision detection
function checkCatch(drop) {
  if (!drop || !bucket) return false;
  const dropRect = drop.getBoundingClientRect();
  const bucketRect = bucket.getBoundingClientRect();
  return !(
    dropRect.bottom < bucketRect.top ||
    dropRect.top > bucketRect.bottom ||
    dropRect.right < bucketRect.left ||
    dropRect.left > bucketRect.right
  );
}

// --- Movement: keyboard & mouse
window.addEventListener("keydown", (e) => {
  if (!bucket) return;
  const moveBy = 30;
  const left = bucket.offsetLeft;
  if (e.key === "ArrowLeft" && left > 0) bucket.style.left = left - moveBy + "px";
  if (e.key === "ArrowRight" && left < gameContainer.clientWidth - bucket.offsetWidth)
    bucket.style.left = left + moveBy + "px";
});

gameContainer.addEventListener("mousemove", (e) => {
  if (!gameRunning) return;
  const rect = gameContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const max = gameContainer.clientWidth - bucket.offsetWidth;
  bucket.style.left = Math.max(0, Math.min(x - bucket.offsetWidth / 2, max)) + "px";
});

// --- End game
function endGame() {
  clearInterval(gameInterval);
  clearInterval(dropInterval);
  gameRunning = false;
  resetBtn.classList.remove("hidden");
  document.getElementById("difficulty").classList.remove("hidden");

  // confetti simple
  const conf = document.createElement("div");
  conf.className = "confetti";
  conf.textContent = "🎉 🎉 🎉";
  document.body.appendChild(conf);

  const gameOverMsg = document.createElement("div");
  gameOverMsg.className = "game-over";
  gameOverMsg.textContent = `💧 Game Over! Your Score: ${score}`;
  document.body.appendChild(gameOverMsg);
  alert("💧 Game Over! Your score: " + score);
  setTimeout(() => {
    conf.remove();
    gameOverMsg.remove();
  }, 2500);
}




// --- Sound (WebAudio)
let _audioCtx;
let _dingLast = 0;
function playDing() {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume().catch(()=>{});
    const now = performance.now();
    if (now - _dingLast < 80) return;
    _dingLast = now;

    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    // fallback: try playing <audio> element if exists
    if (dingSound) {
      try {
        dingSound.currentTime = 0;
        dingSound.play().catch(()=>{});
      } catch(e){}
    }
  }
}

// --- Milestones
function checkMilestones() {
  const messages = {
    10: "💧 Great job!",
    25: "🌊 Awesome! You're helping bring clean water!",
    50: "🚀 Incredible! You're making a big impact!",
    100: "🏆 Legend! You are the King of Water!"
  };
  
  if (messages[score]) {
    // Create milestone pop-up (same style as confetti)
    const milestone = document.createElement("div");
    milestone.classList.add("milestone");
    milestone.textContent = messages[score];
    document.body.appendChild(milestone);

    // Remove after animation
    setTimeout(() => milestone.remove(), 3000);
  }
}

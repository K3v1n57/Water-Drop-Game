const gameContainer = document.getElementById("game-container");
const bucket = document.getElementById("bucket");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const dingSound = document.getElementById("ding-sound");

let score = 0;
let timeLeft = 60;
let gameInterval;
let dropInterval;
let gameRunning = false;

// ✅ Start the game
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  startBtn.classList.add("hidden");
  resetBtn.classList.add("hidden");
  score = 0;
  timeLeft = 60;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;

  // Start countdown
  gameInterval = setInterval(updateTimer, 1000);
  // Create falling drops
  dropInterval = setInterval(createDrop, 800);
}

// ✅ Timer countdown
function updateTimer() {
  timeLeft--;
  timeDisplay.textContent = timeLeft;

  if (timeLeft <= 0) {
    endGame();
  }
}

// ✅ End game with celebration
function endGame() {
  clearInterval(gameInterval);
  clearInterval(dropInterval);
  gameRunning = false;
  resetBtn.classList.remove("hidden");

  // 🎉 Celebration animation
  const confetti = document.createElement("div");
  confetti.classList.add("confetti");
  confetti.textContent = "🎉🎉🎉";
  document.body.appendChild(confetti);

  setTimeout(() => confetti.remove(), 3000);

  alert("💧 Game Over! Your score: " + score);
}

// ✅ Reset game (fully functional)
function resetGame() {
  document.querySelectorAll(".drop").forEach(d => d.remove()); // remove drops
  score = 0;
  timeLeft = 60;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;

  // Hide reset, show start again
  startBtn.classList.remove("hidden");
  resetBtn.classList.add("hidden");

  // Clean up any leftover confetti
  document.querySelectorAll(".confetti").forEach(c => c.remove());
}

// ✅ Create a raindrop (💧)
function createDrop() {
  const drop = document.createElement("div");
  drop.classList.add("drop");
  drop.textContent = "💧";
  drop.style.left = Math.random() * (gameContainer.offsetWidth - 30) + "px";
  drop.style.top = "0px";
  gameContainer.appendChild(drop);

  let fallInterval = setInterval(() => {
    const dropTop = drop.offsetTop + 5;
    drop.style.top = dropTop + "px";

    if (checkCatch(drop)) {
      score++;
      scoreDisplay.textContent = score;
      dingSound.play();
      drop.remove();
      clearInterval(fallInterval);
    } else if (dropTop > gameContainer.offsetHeight - 30) {
      drop.remove();
      clearInterval(fallInterval);
    }
  }, 20);
}

// ✅ Check if drop hits the bucket
function checkCatch(drop) {
  const dropRect = drop.getBoundingClientRect();
  const bucketRect = bucket.getBoundingClientRect();
  return !(
    dropRect.bottom < bucketRect.top ||
    dropRect.top > bucketRect.bottom ||
    dropRect.right < bucketRect.left ||
    dropRect.left > bucketRect.right
  );
}

// ✅ Move bucket with arrow keys
window.addEventListener("keydown", e => {
  const bucketLeft = bucket.offsetLeft;
  const moveBy = 30;

  if (e.key === "ArrowLeft" && bucketLeft > 0) {
    bucket.style.left = bucketLeft - moveBy + "px";
  } else if (
    e.key === "ArrowRight" &&
    bucketLeft < gameContainer.offsetWidth - bucket.offsetWidth
  ) {
    bucket.style.left = bucketLeft + moveBy + "px";
  }
});

// ✅ Move bucket with mouse or touch
gameContainer.addEventListener("mousemove", e => {
  if (gameRunning) {
    const x = e.clientX - gameContainer.getBoundingClientRect().left;
    const max = gameContainer.offsetWidth - bucket.offsetWidth;
    bucket.style.left = Math.max(0, Math.min(x - bucket.offsetWidth / 2, max)) + "px";
  }
});

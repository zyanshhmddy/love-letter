const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gridSize = 8;
const tileSize = canvas.width / gridSize;

let notesCollected = 0;

const ambientMusic = document.getElementById("ambientMusic");

const messageOverlay = document.getElementById("messageOverlay");
const photoPopup = document.getElementById("photoPopup");
const photoImg = document.getElementById("photoImage");
const closePopupBtn = document.getElementById("closeButton"); // fixed ID
const blurOverlay = document.getElementById("blurOverlay");
const gameContainer = document.getElementById("gameContainer");

let gamePaused = false; // track if message/photo is showing

const messages = [
  "you're my favorite person to get lost with.",
  "thank you for being the light.",
  "every moment with you is worth it.",
  "you make even the smallest moments unforgettable.",
  "you're the reason behind why i keep fighting for us.",
  "forever with you sounds perfect to me."
];

// Player logical position (grid coords)
let player = { x: 0, y: 0 };

// For smooth animation - actual pixel position of player
let drawX = player.x * tileSize;
let drawY = player.y * tileSize;
let targetX = drawX;
let targetY = drawY;

// Speed of sliding animation (pixels per frame)
const slideSpeed = 8;

// Heart image for player
const heartImg = new Image();
heartImg.src = "heart.png";

heartImg.onload = () => {
  // Start drawing after heart image loads
  drawGrid();
  requestAnimationFrame(animate);
};

// Helper to get random position excluding some
function getRandomPosition(excludePositions) {
  while (true) {
    const pos = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    if (!excludePositions.some(p => p.x === pos.x && p.y === pos.y)) return pos;
  }
}

// Generate all note positions avoiding player start
const occupiedPositions = [{ x: player.x, y: player.y }];
const allNotePositions = [];
for (let i = 0; i < 6; i++) {
  const pos = getRandomPosition(occupiedPositions);
  occupiedPositions.push(pos);
  allNotePositions.push(pos);
}

// Current note index & note data
let currentNoteIndex = 0;
let currentNote = {
  x: allNotePositions[0].x,
  y: allNotePositions[0].y,
  img: `img1.jpg`,
  collected: false
};

// Draw grid and note (yellow circle)
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#3a3a3a" : "#2e2e2e";
      ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    }
  }

  if (!currentNote.collected) {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(
      currentNote.x * tileSize + tileSize / 2,
      currentNote.y * tileSize + tileSize / 2,
      tileSize / 5,
      0, 2 * Math.PI
    );
    ctx.fill();
  }
}

// Draw player image at current drawn position (for sliding)
function drawPlayerImage() {
  ctx.drawImage(heartImg, drawX, drawY, tileSize, tileSize);
}

// Variables to control sliding animation
let sliding = false;

// Animate function called every frame
function animate() {
  if (sliding) {
    if (Math.abs(drawX - targetX) < slideSpeed) {
      drawX = targetX;
    } else {
      drawX += (drawX < targetX) ? slideSpeed : -slideSpeed;
    }
    if (Math.abs(drawY - targetY) < slideSpeed) {
      drawY = targetY;
    } else {
      drawY += (drawY < targetY) ? slideSpeed : -slideSpeed;
    }

    if (drawX === targetX && drawY === targetY) {
      sliding = false;
      collectNotes();
    }
  }

  drawGrid();
  drawPlayerImage();

  requestAnimationFrame(animate);
}

// Show image first (fade+zoom), then show blur+message+x button
function showMessageAndPhoto(text, imgSrc) {
  gamePaused = true;

  photoPopup.classList.add("visible");
  photoImg.classList.remove("visible");
  photoImg.style.opacity = 0;
  photoImg.style.transform = "scale(0.8)";
  photoImg.src = imgSrc;

  messageOverlay.classList.remove("visible");
  closePopupBtn.classList.remove("visible");
  blurOverlay.classList.remove("visible");

  photoImg.onload = () => {
    setTimeout(() => {
      photoImg.classList.add("visible");
    }, 50);

    setTimeout(() => {
      blurOverlay.classList.add("visible");
      document.getElementById("messageText").textContent = text; // set text inside <p>
      messageOverlay.classList.add("visible");
      closePopupBtn.classList.add("visible");
    }, 400);
  };
}

// Hide popup and resume game, or show final appreciation if done
function hideMessageAndPhoto() {
  messageOverlay.classList.remove("visible");
  closePopupBtn.classList.remove("visible");
  blurOverlay.classList.remove("visible");
  photoPopup.classList.remove("visible");
  gamePaused = false;

  notesCollected++;

  if (notesCollected >= 6) {
    showFinalAppreciation();
  } else {
    drawGrid();
  }
}

// Close button event
closePopupBtn.addEventListener("click", () => {
  hideMessageAndPhoto();

  currentNoteIndex++;
  if (currentNoteIndex < 6) {
    currentNote = {
      x: allNotePositions[currentNoteIndex].x,
      y: allNotePositions[currentNoteIndex].y,
      img: `img${currentNoteIndex + 1}.jpg`,
      collected: false
    };
    drawGrid();
  }
});

// Check if player collected note
function collectNotes() {
  if (gamePaused) return;
  if (!currentNote.collected && player.x === currentNote.x && player.y === currentNote.y) {
    currentNote.collected = true;
    showMessageAndPhoto(messages[currentNoteIndex], currentNote.img);
  }
}

// Move player with smooth sliding
function movePlayer(dx, dy) {
  if (gamePaused || sliding) return;

  const newX = player.x + dx;
  const newY = player.y + dy;

  if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
    player.x = newX;
    player.y = newY;

    targetX = player.x * tileSize;
    targetY = player.y * tileSize;

    sliding = true;
  }
}

// Keyboard input
document.addEventListener("keydown", e => {
  if (gamePaused || sliding) return;
  switch (e.key) {
    case "ArrowUp": movePlayer(0, -1); break;
    case "ArrowDown": movePlayer(0, 1); break;
    case "ArrowLeft": movePlayer(-1, 0); break;
    case "ArrowRight": movePlayer(1, 0); break;
  }
});

// Fix mobile button event listeners to handle both touch and click
function bindMobileButton(id, dx, dy) {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    movePlayer(dx, dy);
  }, { passive: false });

  btn.addEventListener("click", e => {
    e.preventDefault();
    movePlayer(dx, dy);
  });
}

// Bind mobile control buttons
bindMobileButton("upBtn", 0, -1);
bindMobileButton("downBtn", 0, 1);
bindMobileButton("leftBtn", -1, 0);
bindMobileButton("rightBtn", 1, 0);

// Prevent scrolling on touch devices
window.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

// --- Final appreciation popup elements ---

// Create carousel container and elements dynamically
const carouselContainer = document.createElement("div");
carouselContainer.style.position = "fixed";
carouselContainer.style.top = "50%";
carouselContainer.style.left = "50%";
carouselContainer.style.transform = "translate(-50%, -50%)";
carouselContainer.style.background = "rgba(0,0,0,0.8)";
carouselContainer.style.border = "3px solid pink";
carouselContainer.style.borderRadius = "15px";
carouselContainer.style.padding = "20px";
carouselContainer.style.zIndex = "1000";
carouselContainer.style.width = "300px";
carouselContainer.style.textAlign = "center";
carouselContainer.style.color = "white";
carouselContainer.style.display = "none";
carouselContainer.style.userSelect = "none";

const carouselImage = document.createElement("img");
carouselImage.style.width = "250px";
carouselImage.style.height = "250px";
carouselImage.style.borderRadius = "12px";
carouselImage.style.objectFit = "cover";
carouselImage.style.marginBottom = "15px";

const carouselText = document.createElement("p");
carouselText.textContent = "this is an appreciation for you. thank you for always being here. i love you! :D ";
carouselText.style.fontSize = "18px";
carouselText.style.marginBottom = "15px";

const closeFinalBtn = document.createElement("button");
closeFinalBtn.textContent = "Close";
closeFinalBtn.style.padding = "8px 16px";
closeFinalBtn.style.fontSize = "16px";
closeFinalBtn.style.cursor = "pointer";
closeFinalBtn.style.borderRadius = "8px";
closeFinalBtn.style.border = "none";
closeFinalBtn.style.background = "pink";
closeFinalBtn.style.color = "white";

carouselContainer.appendChild(carouselImage);
carouselContainer.appendChild(carouselText);
carouselContainer.appendChild(closeFinalBtn);
document.body.appendChild(carouselContainer);

let carouselIndex = 0;
let carouselInterval;

function startCarousel() {
  carouselImage.src = `img${carouselIndex + 1}.jpg`;
  carouselInterval = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % 6;
    carouselImage.src = `img${carouselIndex + 1}.jpg`;
  }, 3000); // change image every 3 seconds
}

function stopCarousel() {
  clearInterval(carouselInterval);
}

// Show final popup with blur overlay
function showFinalAppreciation() {
  blurOverlay.style.display = "block";
  blurOverlay.style.backdropFilter = "blur(10px) brightness(0.4)";
  carouselContainer.style.display = "block";
  startCarousel();
  gamePaused = true; // pause game input
}

// Hide final popup and remove blur
function hideFinalAppreciation() {
  blurOverlay.style.display = "none";
  blurOverlay.style.backdropFilter = "none";
  carouselContainer.style.display = "none";
  stopCarousel();
  gamePaused = false;
  // Optionally reset the game or leave as is
}

// Close final popup button event
closeFinalBtn.addEventListener("click", () => {
  hideFinalAppreciation();
});

// Game State Management Module
// Handles game state, transitions, and core game loop

// Game state constants
const GameState = {
  MENU: "menu",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "gameOver"
};

// Current game state
let gameState = GameState.MENU;

// Game timing variables
let gameStartTime = 0;
let startTime = 0;

// Score tracking
let score = 0;
let totalEnemiesKilled = 0; // Total enemies killed across all waves
let waveEnemiesKilled = 0; // Enemies killed in the current wave

// Wave management
let currentWave = 1;

// Camera and view management
let cameraOffsetX = 0;
let cameraOffsetY = 0;
let cameraZoom = 0;
let isDragging = false;
let prevMouseX, prevMouseY;

// Game state management functions
function startGame() {
  gameState = GameState.PLAYING;
  gameStartTime = frameCount;
  score = 0;
  totalEnemiesKilled = 0;
  waveEnemiesKilled = 0;
  currentWave = 1;
}

function pauseGame() {
  if (gameState === GameState.PLAYING) {
    gameState = GameState.PAUSED;
    // Additional pause logic can be added here
  }
}

function resumeGame() {
  if (gameState === GameState.PAUSED) {
    gameState = GameState.PLAYING;
    // Additional resume logic can be added here
  }
}

function endGame() {
  gameState = GameState.GAME_OVER;
  // Additional game over logic can be added here
}

function resetGame() {
  // Reset game state and variables
  gameState = GameState.MENU;
  score = 0;
  totalEnemiesKilled = 0;
  waveEnemiesKilled = 0;
  currentWave = 1;
  
  // Additional reset logic can be added here
}

// Camera control functions
function setupCamera(offsetX, offsetY, zoom) {
  cameraOffsetX = offsetX;
  cameraOffsetY = offsetY;
  cameraZoom = zoom;
}

function updateCamera() {
  // Apply camera transformations
  translate(cameraOffsetX, cameraOffsetY, cameraZoom);
}

// Mouse and touch interaction for camera control
function handleCameraControls() {
  // Handle mouse drag for camera movement
  if (mouseIsPressed && (mouseButton === RIGHT || (mouseButton === LEFT && keyIsDown(SHIFT)))) {
    if (!isDragging) {
      isDragging = true;
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    } else {
      // Calculate the difference in mouse position
      const dx = mouseX - prevMouseX;
      const dy = mouseY - prevMouseY;
      
      // Update camera offset based on mouse movement
      cameraOffsetX += dx;
      cameraOffsetY += dy;
      
      // Update previous mouse position
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    }
  } else {
    isDragging = false;
  }
  
  // Handle mouse wheel for camera zoom
  if (typeof mouseWheel === 'function') {
    mouseWheel = function(event) {
      // Adjust zoom based on wheel direction
      cameraZoom += event.delta;
      
      // Constrain zoom to reasonable limits
      cameraZoom = constrain(cameraZoom, MIN_ZOOM, MAX_ZOOM);
      
      // Prevent default behavior
      return false;
    };
  }
}

// Window resize handler
function handleWindowResize() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Update perspective
  perspective(PI / 4, width / height, 0.1, 5000);
  
  // Reposition UI elements if needed
  if (typeof repositionUI === 'function') {
    repositionUI();
  }
}
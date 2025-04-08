// UI Module
// Handles creation and management of UI elements

// UI elements
let statusBoard;
let technicalBoard;
let menuElement;
let pauseElement;
let resumeElement;
let gameOverElement;
let controlsContainer;
let dPad;
let skillBar;
let soundToggleButton;

// Directional controls state
let activeDirections = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Initialize all UI elements
function initializeUI() {
  createUiUsingDomElements();
  createPerformanceSettingsUI();
}

// Create UI using DOM elements
function createUiUsingDomElements() {
  // Create the HUD DOM elements
  createStatusBoardElements();
  createTechnicalBoardElements();
  // Create Menu - Control
  createMenuElement();
  createPauseElement();
  createResumeElement();
  createGameOverElement();
  // Create container for controls
  createControlsContainer();
  // Create skill bar and d-pad inside the container
  createDirectionalPadElement();
  createSkillBarElement();
  // Create sound toggle button but don't initialize sounds yet
  createSoundToggleButton();
}

// Create a styled container
function createStyledContainer(x, y, width, options = {}) {
  const container = createDiv("");
  container.position(x, y);
  
  // Default container styles
  const containerStyles = {
    width: width + "px",
    padding: "10px",
    ...options.styles
  };

  applyCommonStyles(container, containerStyles);

  if (options.id) {
    container.id(options.id);
  }

  return container;
}

// Apply common styles to an element
function applyCommonStyles(element, styles) {
  for (const [property, value] of Object.entries(styles)) {
    element.style(property, value);
  }
}

// Create a styled button
function createStyledButton(label, x, y, options = {}) {
  const button = createButton(label);
  button.position(x, y);
  
  // Default button styles
  const buttonStyles = {
    backgroundColor: "rgba(50, 50, 50, 0.8)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    transition: "background-color 0.3s",
    ...options.styles
  };

  applyCommonStyles(button, buttonStyles);

  if (options.id) {
    button.id(options.id);
  }

  if (options.onClick) {
    button.mousePressed(options.onClick);
  }

  return button;
}

// Create status board elements
function createStatusBoardElements() {
  statusBoard = createStyledContainer(20, 20, 200, {
    id: "status-board",
    styles: {
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "white",
      borderRadius: "10px",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      lineHeight: "1.5",
      display: "none"
    }
  });
}

// Create technical board elements
function createTechnicalBoardElements() {
  technicalBoard = createStyledContainer(20, 150, 200, {
    id: "technical-board",
    styles: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "white",
      borderRadius: "10px",
      fontFamily: "monospace",
      fontSize: "12px",
      lineHeight: "1.2",
      display: "none"
    }
  });
}

// Create menu element
function createMenuElement() {
  menuElement = createStyledContainer(width / 2 - 150, height / 2 - 100, 300, {
    id: "menu",
    styles: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      borderRadius: "10px",
      textAlign: "center",
      padding: "20px"
    }
  });

  const title = createElement("h1", "SQUAD");
  title.style("margin", "0 0 20px 0");
  title.style("color", "#00ff00");
  menuElement.child(title);

  const startButton = createStyledButton("START GAME", 0, 0, {
    styles: {
      backgroundColor: "#00aa00",
      padding: "15px 30px",
      fontSize: "18px",
      margin: "10px auto",
      display: "block",
      width: "80%"
    },
    onClick: function() {
      startGame();
      menuElement.style("display", "none");
    }
  });
  menuElement.child(startButton);

  // Add instructions
  const instructions = createP("Use WASD or arrow keys to move<br>Click or Space to shoot<br>1-8 or QWER/ASDF for skills");
  instructions.style("margin", "20px 0");
  menuElement.child(instructions);
}

// Create pause element
function createPauseElement() {
  pauseElement = createStyledContainer(width / 2 - 150, height / 2 - 100, 300, {
    id: "pause-menu",
    styles: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      borderRadius: "10px",
      textAlign: "center",
      padding: "20px",
      display: "none"
    }
  });

  const title = createElement("h2", "GAME PAUSED");
  title.style("margin", "0 0 20px 0");
  title.style("color", "#ffff00");
  pauseElement.child(title);

  const resumeButton = createStyledButton("RESUME", 0, 0, {
    styles: {
      backgroundColor: "#00aa00",
      padding: "15px 30px",
      fontSize: "18px",
      margin: "10px auto",
      display: "block",
      width: "80%"
    },
    onClick: function() {
      resumeGame();
      pauseElement.style("display", "none");
    }
  });
  pauseElement.child(resumeButton);

  const menuButton = createStyledButton("MAIN MENU", 0, 0, {
    styles: {
      backgroundColor: "#aa0000",
      padding: "15px 30px",
      fontSize: "18px",
      margin: "10px auto",
      display: "block",
      width: "80%"
    },
    onClick: function() {
      resetGame();
      pauseElement.style("display", "none");
      menuElement.style("display", "block");
    }
  });
  pauseElement.child(menuButton);
}

// Create resume element
function createResumeElement() {
  resumeElement = createStyledButton("RESUME", width / 2 - 60, 20, {
    id: "resume-button",
    styles: {
      backgroundColor: "#00aa00",
      padding: "10px 20px",
      fontSize: "16px",
      display: "none"
    },
    onClick: function() {
      resumeGame();
      resumeElement.style("display", "none");
    }
  });
}

// Create game over element
function createGameOverElement() {
  gameOverElement = createStyledContainer(width / 2 - 150, height / 2 - 100, 300, {
    id: "game-over",
    styles: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      color: "white",
      borderRadius: "10px",
      textAlign: "center",
      padding: "20px",
      display: "none"
    }
  });

  const title = createElement("h2", "GAME OVER");
  title.style("margin", "0 0 20px 0");
  title.style("color", "#ff0000");
  gameOverElement.child(title);

  const scoreDisplay = createP("Score: 0");
  scoreDisplay.id("final-score");
  scoreDisplay.style("font-size", "18px");
  scoreDisplay.style("margin", "10px 0");
  gameOverElement.child(scoreDisplay);

  const restartButton = createStyledButton("PLAY AGAIN", 0, 0, {
    styles: {
      backgroundColor: "#00aa00",
      padding: "15px 30px",
      fontSize: "18px",
      margin: "10px auto",
      display: "block",
      width: "80%"
    },
    onClick: function() {
      startGame();
      gameOverElement.style("display", "none");
    }
  });
  gameOverElement.child(restartButton);

  const menuButton = createStyledButton("MAIN MENU", 0, 0, {
    styles: {
      backgroundColor: "#aa0000",
      padding: "15px 30px",
      fontSize: "18px",
      margin: "10px auto",
      display: "block",
      width: "80%"
    },
    onClick: function() {
      resetGame();
      gameOverElement.style("display", "none");
      menuElement.style("display", "block");
    }
  });
  gameOverElement.child(menuButton);
}

// Create controls container
function createControlsContainer() {
  controlsContainer = createDiv("");
  controlsContainer.id("controls-container");
  controlsContainer.position(0, height - 250);
  controlsContainer.style("width", "100%");
  controlsContainer.style("display", "flex");
  controlsContainer.style("justify-content", "space-between");
  controlsContainer.style("align-items", "flex-end");
  controlsContainer.style("padding", "0 20px");
  controlsContainer.style("box-sizing", "border-box");
  controlsContainer.style("pointer-events", "none"); // Container itself doesn't capture events
  controlsContainer.style("visibility", "hidden");
  controlsContainer.style("opacity", "0");
  controlsContainer.style("transition", "opacity 0.3s ease-in-out");
}

// Create directional pad element
function createDirectionalPadElement() {
  // Create D-pad container
  dPad = createDiv("");
  dPad.id("d-pad");
  dPad.style("display", "grid");
  dPad.style("grid-template-columns", "repeat(3, 1fr)");
  dPad.style("grid-template-rows", "repeat(3, 1fr)");
  dPad.style("gap", "5px");
  dPad.style("width", "150px");
  dPad.style("height", "150px");
  dPad.style("pointer-events", "auto");
  dPad.style("visibility", "hidden");
  
  // Add to controls container
  controlsContainer.child(dPad);
  
  // Create directional buttons
  const buttonSize = "45px";
  const buttonStyles = {
    width: buttonSize,
    height: buttonSize,
    backgroundColor: "rgba(50, 50, 50, 0.8)",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.1s, background-color 0.2s",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)"
  };
  
  // Create up button
  const upButton = createDiv("↑");
  upButton.style("grid-column", "2");
  upButton.style("grid-row", "1");
  applyCommonStyles(upButton, buttonStyles);
  dPad.child(upButton);
  setupDirectionalButton(upButton, "up");
  
  // Create left button
  const leftButton = createDiv("←");
  leftButton.style("grid-column", "1");
  leftButton.style("grid-row", "2");
  applyCommonStyles(leftButton, buttonStyles);
  dPad.child(leftButton);
  setupDirectionalButton(leftButton, "left");
  
  // Create right button
  const rightButton = createDiv("→");
  rightButton.style("grid-column", "3");
  rightButton.style("grid-row", "2");
  applyCommonStyles(rightButton, buttonStyles);
  dPad.child(rightButton);
  setupDirectionalButton(rightButton, "right");
  
  // Create down button
  const downButton = createDiv("↓");
  downButton.style("grid-column", "2");
  downButton.style("grid-row", "3");
  applyCommonStyles(downButton, buttonStyles);
  dPad.child(downButton);
  setupDirectionalButton(downButton, "down");
}

// Create skill bar element
function createSkillBarElement() {
  // Create skill bar container
  skillBar = createDiv("");
  skillBar.id("skill-bar");
  skillBar.style("display", "flex");
  skillBar.style("flex-direction", "column");
  skillBar.style("justify-content", "flex-end");
  skillBar.style("width", "300px");
  skillBar.style("pointer-events", "auto");
  
  // Add to controls container
  controlsContainer.child(skillBar);
  
  // Skill button size and spacing
  const skillButtonSize = 50;
  const skillMargin = "5px";
  const rowSpacing = "10px";
  const skillFontSize = "20px";
  const skillNameFontSize = "12px";
  
  // Create rows for skills
  const topRow = createDiv("");
  topRow.style("display", "flex");
  topRow.style("justify-content", "space-around");
  topRow.style("margin-bottom", rowSpacing);
  topRow.style("width", "100%");
  
  const bottomRow = createDiv("");
  bottomRow.style("display", "flex");
  bottomRow.style("justify-content", "space-around");
  bottomRow.style("width", "100%");
  
  // Add rows to skill bar
  skillBar.child(topRow);
  skillBar.child(bottomRow);
  
  // Create individual skill elements
  for (let i = 1; i <= 8; i++) {
    const skillDiv = createDiv("");
    skillDiv.id(`skill${i}`);
    skillDiv.style("text-align", "center");
    skillDiv.style("margin", skillMargin);
    skillDiv.style("position", "relative");
    skillDiv.style("height", skillButtonSize + "px");
    skillDiv.style("width", skillButtonSize + "px");
    skillDiv.style("background-color", "rgba(50, 50, 50, 0.8)");
    skillDiv.style("border-radius", "10px");
    skillDiv.style("cursor", "pointer");
    skillDiv.style("transition", "transform 0.1s, background-color 0.2s");
    skillDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
    skillDiv.style("user-select", "none");
    skillDiv.style("-webkit-tap-highlight-color", "transparent");
    skillDiv.style("flex", "1"); // Allow buttons to grow to fill available space
    skillDiv.style("min-width", skillButtonSize + "px"); // Set minimum width
    skillDiv.style("max-width", skillButtonSize * 1.2 + "px"); // Set maximum width
    
    skillDiv.html(`
      <div id="skillName${i}" style="font-size: ${skillNameFontSize}; font-weight: bold; position: absolute; top: -15px; left: 50%; transform: translateX(-50%); z-index: 1; white-space: nowrap;">${getSkillName(i)}</div>
      <div id="skillKey${i}" style="font-size: ${skillFontSize}; font-weight: bold; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1;">${getSkillKey(i)}</div>
      <div id="needle${i}" style="position: absolute; top: 50%; left: 50%; width: 2px; height: ${skillButtonSize}px; background-color: transparent; transform-origin: bottom center; transform: translate(-50%, -100%) rotate(0deg); z-index: 2;"></div>
      <div id="overlay${i}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: conic-gradient(rgba(0, 0, 0, 0.5) 0deg, rgba(0, 0, 0, 0.5) 0deg, transparent 0deg, transparent 360deg); z-index: 0; border-radius: 10px;"></div>
    `);
    
    // Add click/touch event handler to activate the skill
    const skillNumber = i; // Capture the current skill number
    
    // Visual feedback on mouse/touch down
    skillDiv.mousePressed(function () {
      if (gameState === "playing") {
        // Visual feedback - scale down slightly and change background
        this.style("transform", "scale(0.95)");
        this.style("background-color", "rgba(80, 80, 80, 0.9)");
        
        // Activate the skill
        activateSkill(skillNumber);
        
        // Reset visual state after a short delay
        setTimeout(() => {
          this.style("transform", "scale(1.0)");
          this.style("background-color", "rgba(50, 50, 50, 0.8)");
        }, 150);
      }
    });
    
    // Add touch event handler for mobile devices
    skillDiv.touchStarted(function () {
      if (gameState === "playing") {
        // Visual feedback - scale down slightly and change background
        this.style("transform", "scale(0.95)");
        this.style("background-color", "rgba(80, 80, 80, 0.9)");
        
        // Activate the skill
        activateSkill(skillNumber);
        
        // Reset visual state after a short delay
        setTimeout(() => {
          this.style("transform", "scale(1.0)");
          this.style("background-color", "rgba(50, 50, 50, 0.8)");
        }, 150);
        
        return false; // Prevent default touch behavior
      }
    });
    
    // Add to the appropriate row based on index
    // Q, W, E, R (skills 5-8) go in top row
    // A, S, D, F (skills 1-4) go in bottom row
    if (i >= 5) {
      // Q, W, E, R (skills 5-8)
      topRow.child(skillDiv);
    } else {
      // A, S, D, F (skills 1-4)
      bottomRow.child(skillDiv);
    }
  }
  skillBar.style("visibility", "hidden");
}

// Create sound toggle button
function createSoundToggleButton() {
  // Create button with initial state based on current mute setting
  const buttonLabel = soundSettings.muted ? "🔇" : "🔊";

  soundToggleButton = createStyledButton(buttonLabel, width - 120, 20, {
    id: "sound-toggle-button",
    styles: {
      borderRadius: "50%",
      width: "40px",
      height: "40px",
      fontSize: "20px",
      padding: "0",
      textAlign: "center",
      lineHeight: "40px"
    },
    onClick: toggleSoundState
  });

  // Function to handle sound toggle
  function toggleSoundState() {
    // Initialize sound system if this is the first interaction
    if (
      typeof initSounds === "function" &&
      typeof soundSystemInitialized !== "undefined" &&
      !soundSystemInitialized
    ) {
      initSounds();

      // Resume AudioContext if it exists
      if (typeof getAudioContext === "function") {
        try {
          const audioContext = getAudioContext();
          if (audioContext && audioContext.state !== "running") {
            audioContext.resume().then(() => {
              console.log(
                "AudioContext resumed by user interaction with sound toggle"
              );
            });
          }
        } catch (e) {
          console.warn("Error accessing AudioContext:", e);
        }
      }
    }

    const isMuted = toggleMute();
    soundToggleButton.html(isMuted ? "🔇" : "🔊");

    if (isMuted) {
      stopAllSounds();
    }

    // Prevent default to avoid double triggering
    return false;
  }
}

// Create UI for performance settings
function createPerformanceSettingsUI() {
  // Create a container for performance settings
  const perfContainer = createStyledContainer(width - 180, 70, 160, {
    id: "performance-settings",
    styles: {
      fontSize: "12px",
      display: "none" // Hidden by default
    }
  });

  // Add a title
  const title = createElement("h3", "Performance");
  title.style("margin", "0 0 10px 0");
  title.style("color", "white");
  perfContainer.child(title);

  // Create radio buttons for performance levels
  const levels = [
    { value: "auto", label: "Auto" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" }
  ];

  for (const level of levels) {
    const label = createDiv("");
    label.style("margin", "5px 0");
    label.style("color", "white");
    label.style("cursor", "pointer");
    label.style("display", "flex");
    label.style("align-items", "center");

    const radio = createRadio();
    radio.attribute("type", "radio");
    radio.attribute("name", "performance");
    radio.attribute("value", level.value);
    radio.style("margin-right", "5px");
    
    if (level.value === performanceMode) {
      radio.attribute("checked", true);
    }

    radio.changed(() => {
      performanceMode = level.value;
      setPerformanceLevel();
      PerformanceManager.applyWebGLSettings();
    });

    const text = createSpan(level.label);
    
    label.child(radio);
    label.child(text);
    perfContainer.child(label);
  }

  // Add a close button
  const closeButton = createStyledButton("Close", 0, 0, {
    styles: {
      padding: "5px 10px",
      fontSize: "12px",
      marginTop: "10px"
    },
    onClick: function() {
      perfContainer.style("display", "none");
    }
  });
  perfContainer.child(closeButton);
}

// Update status board with game information
function updateStatusBoard() {
  if (gameState === "playing") {
    statusBoard.style("display", "block");
    
    // Update status board content
    statusBoard.html(`
      <div style="font-weight: bold; margin-bottom: 5px;">Wave: ${currentWave}</div>
      <div>Score: ${score}</div>
      <div>Enemies Killed: ${totalEnemiesKilled}</div>
      <div>Squad Size: ${squad.length}/${SQUAD_SIZE}</div>
      <div>Squad Health: ${squad.length > 0 ? squad[0].health : 0}</div>
      <div>Weapon: ${currentWeapon}</div>
    `);
  } else {
    statusBoard.style("display", "none");
  }
}

// Update technical board with performance information
function updateTechnicalBoard() {
  if (gameState === "playing" && frameCount % 30 === 0) { // Update every 30 frames
    technicalBoard.style("display", "block");
    
    // Calculate FPS
    const currentFPS = frameRate();
    
    // Update FPS history
    PerformanceManager.updateFPSHistory(currentFPS);
    
    // Get memory usage if available
    let memoryInfo = "";
    if (window.performance && window.performance.memory) {
      const usedMemory = (window.performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      const totalMemory = (window.performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(1);
      memoryInfo = `Memory: ${usedMemory}MB / ${totalMemory}MB`;
    }
    
    // Update technical board content
    technicalBoard.html(`
      <div>FPS: ${currentFPS.toFixed(1)}</div>
      <div>Objects: ${squad.length + enemies.length + projectiles.length + effects.length}</div>
      <div>Performance: ${currentPerformanceLevel}</div>
      <div>${memoryInfo}</div>
    `);
  } else if (gameState !== "playing") {
    technicalBoard.style("display", "none");
  }
}

// Update skill bar cooldowns and visibility
function updateSkillBar() {
  if (gameState != "playing") {
    return;
  }

  // Make sure the skill bar is visible
  skillBar.style("visibility", "visible");

  // Update each skill cooldown
  for (let i = 1; i <= 8; i++) {
    const skillKey = `skill${i}`;
    const skillElement = select(`#skill${i}`);
    
    if (!skillElement) continue;
    
    // Get the overlay element
    const overlayElement = select(`#overlay${i}`);
    
    // Calculate cooldown progress
    const cooldown = skills[skillKey].cooldown;
    const lastUsed = skills[skillKey].lastUsed;
    const cooldownRemaining = cooldown - (frameCount - lastUsed);
    
    if (cooldownRemaining > 0 && lastUsed > 0) {
      // Skill is on cooldown
      const progress = (cooldownRemaining / cooldown) * 360;
      
      // Update the conic gradient to show cooldown
      overlayElement.style("background", `conic-gradient(rgba(0, 0, 0, 0.5) 0deg, rgba(0, 0, 0, 0.5) ${progress}deg, transparent ${progress}deg, transparent 360deg)`);
      
      // Show cooldown text
      const cooldownSeconds = Math.ceil(cooldownRemaining / 60);
      select(`#skillKey${i}`).html(cooldownSeconds);
    } else {
      // Skill is ready
      overlayElement.style("background", "transparent");
      
      // Show the skill key
      select(`#skillKey${i}`).html(getSkillKey(i));
    }
    
    // Update active skill visual feedback
    if (skills[skillKey].active) {
      skillElement.style("background-color", "rgba(0, 150, 255, 0.8)");
      skillElement.style("box-shadow", "0 0 15px rgba(0, 150, 255, 0.7)");
    } else {
      skillElement.style("background-color", "rgba(50, 50, 50, 0.8)");
      skillElement.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
    }
  }
}

// Update directional pad visibility and apply movement
function updateDirectionalPad() {
  // Show/hide based on game state
  if (gameState === "playing") {
    // Make sure the controls container is visible
    controlsContainer.style("display", "flex");
    controlsContainer.style("visibility", "visible");
    controlsContainer.style("opacity", "1");
    controlsContainer.style("margin", "0 auto");

    // Make sure the D-pad is visible
    dPad.style("visibility", "visible");
    dPad.style("display", "block");

    // Apply movement based on active directions
    if (activeDirections.up) {
      moveSquad(0, -squadSpeed);
    }
    if (activeDirections.down) {
      moveSquad(0, squadSpeed);
    }
    if (activeDirections.left) {
      moveSquad(-squadSpeed, 0);
    }
    if (activeDirections.right) {
      moveSquad(squadSpeed, 0);
    }
  } else {
    controlsContainer.style("visibility", "hidden");
    controlsContainer.style("display", "none");

    // Reset all directions when not playing
    activeDirections.up = false;
    activeDirections.down = false;
    activeDirections.left = false;
    activeDirections.right = false;
  }
}

// Update sound toggle button visibility
function drawSoundToggleButton() {
  if (soundToggleButton) {
    // Always show the sound toggle button regardless of game state
    soundToggleButton.style("display", "block");
    soundToggleButton.style("visibility", "visible");

    // Reposition in case of window resize
    soundToggleButton.position(width - 120, 20);
  }
}

// Helper function to set up event handlers for directional buttons
function setupDirectionalButton(button, direction) {
  // Mouse down event - start moving in that direction
  button.mousePressed(function () {
    if (gameState === "playing") {
      activeDirections[direction] = true;

      // Visual feedback
      this.style("transform", "scale(0.95)");
      this.style("background-color", "rgba(100, 100, 255, 0.9)");
    }
  });

  // Mouse up event - stop moving in that direction
  button.mouseReleased(function () {
    activeDirections[direction] = false;

    // Reset visual state
    this.style("transform", "scale(1.0)");
    this.style("background-color", "rgba(50, 50, 50, 0.8)");
  });

  // Touch events for mobile
  button.touchStarted(function () {
    if (gameState === "playing") {
      activeDirections[direction] = true;

      // Visual feedback
      this.style("transform", "scale(0.95)");
      this.style("background-color", "rgba(100, 100, 255, 0.9)");

      return false; // Prevent default
    }
  });

  button.touchEnded(function () {
    activeDirections[direction] = false;

    // Reset visual state
    this.style("transform", "scale(1.0)");
    this.style("background-color", "rgba(50, 50, 50, 0.8)");

    return false; // Prevent default
  });
}

// Helper function to get skill name
function getSkillName(skillNumber) {
  const skillNames = [
    "Star Blast", // Skill 1
    "Machine Gun", // Skill 2
    "Shield", // Skill 3
    "Freeze", // Skill 4
    "Atomic", // Skill 5
    "Barrier", // Skill 6
    "Speed", // Skill 7
    "Heal" // Skill 8
  ];
  
  return skillNames[skillNumber - 1] || `Skill ${skillNumber}`;
}

// Helper function to get skill key
function getSkillKey(skillNumber) {
  if (skillNumber <= 4) {
    // A, S, D, F for skills 1-4
    return String.fromCharCode(64 + skillNumber); // A=65, S=83, etc.
  } else {
    // Q, W, E, R for skills 5-8
    return String.fromCharCode(80 + skillNumber); // Q=81, W=87, etc.
  }
}

// Update all UI elements
function updateUI() {
  updateStatusBoard();
  updateTechnicalBoard();
  updateSkillBar();
  updateDirectionalPad();
  drawSoundToggleButton();
  
  // Update game state specific UI
  switch (gameState) {
    case GameState.MENU:
      menuElement.style("display", "block");
      pauseElement.style("display", "none");
      resumeElement.style("display", "none");
      gameOverElement.style("display", "none");
      break;
    case GameState.PLAYING:
      menuElement.style("display", "none");
      pauseElement.style("display", "none");
      resumeElement.style("display", "none");
      gameOverElement.style("display", "none");
      break;
    case GameState.PAUSED:
      menuElement.style("display", "none");
      pauseElement.style("display", "block");
      resumeElement.style("display", "block");
      gameOverElement.style("display", "none");
      break;
    case GameState.GAME_OVER:
      menuElement.style("display", "none");
      pauseElement.style("display", "none");
      resumeElement.style("display", "none");
      gameOverElement.style("display", "block");
      
      // Update final score
      select("#final-score").html(`Score: ${score}`);
      break;
  }
}

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Reposition UI elements
  if (controlsContainer) {
    controlsContainer.position(0, height - 250);
  }
  
  if (menuElement) {
    menuElement.position(width / 2 - 150, height / 2 - 100);
  }
  
  if (pauseElement) {
    pauseElement.position(width / 2 - 150, height / 2 - 100);
  }
  
  if (resumeElement) {
    resumeElement.position(width / 2 - 60, 20);
  }
  
  if (gameOverElement) {
    gameOverElement.position(width / 2 - 150, height / 2 - 100);
  }
  
  if (soundToggleButton) {
    soundToggleButton.position(width - 120, 20);
  }
}
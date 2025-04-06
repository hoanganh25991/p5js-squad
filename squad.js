// Squad Survival Game
// A 3D p5.js game with squad-based combat

// Game states
let gameState = "menu"; // menu, playing, paused, gameOver
let currentWave = 1;
let score = 0;
let gameStartTime = 0;
let startTime = 0;
let totalEnemiesKilled = 0; // Total enemies killed across all waves
let waveEnemiesKilled = 0; // Enemies killed in the current wave

// Font
let gameFont;

const MIN_ZOOM = 400 * 0;
const MAX_ZOOM = 1200 * 5;
let isDragging = false;
let prevMouseX, prevMouseY;

// Game dimensions
const BRIDGE_LENGTH = 1000;
const BRIDGE_WIDTH = 400 * 2;
const POWER_UP_LANE_WIDTH = 150;
const TOTAL_WIDTH = BRIDGE_WIDTH + POWER_UP_LANE_WIDTH;

// Camera settings
const CAMERA_OFFSET_X = -(POWER_UP_LANE_WIDTH / 2);
const CAMERA_OFFSET_Y = 0;
const CAMERA_OFFSET_Z = 800;

// Debug mode for testing
const DEBUG_MODE = false; // Set to true for easier testing, false for normal gameplay

// Configurable game parameters
const SQUAD_HEALTH = DEBUG_MODE ? 500 : 100; // Higher health in debug mode
const MAX_SQUAD_MEMBERS_PER_ROW = 9; // Number of squad members in a row before stacking vertically
const BRIDGE_LENGTH_MULTIPLIER = 6; // Make bridge take full screen height
const ENEMIES_TO_KILL_FOR_NEXT_WAVE = DEBUG_MODE ? 10 : 30; // Fewer enemies needed in debug mode
const MIRROR_POWERUP_SPAWN_RATE = DEBUG_MODE ? 30 : 10; // Frames between mirror power-up spawns (0.5s in debug)
const MAX_POWER_UPS = 20; // Maximum number of power-ups allowed on screen

const ENEMY_FIGHT_DISTANCE_THRESHOLD =
  (BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 20;

// Colors
const BRIDGE_COLOR = [150, 150, 150];
const POWER_UP_LANE_COLOR = [100, 200, 250];
const SQUAD_COLOR = [0, 200, 0];
const ENEMY_COLORS = {
  standard: [255, 0, 0],
  elite: [255, 100, 0],
  boss1: [200, 0, 100],
  boss2: [150, 0, 150],
  boss3: [100, 0, 200],
};
const WEAPON_COLORS = {
  blaster: [0, 255, 0],
  thunderbolt: [255, 255, 0],
  inferno: [255, 100, 0],
  frostbite: [0, 200, 255],
  vortex: [150, 0, 255],
  plasma: [255, 0, 255],
  photon: [200, 255, 200],
  mirror: [255, 255, 255], // Add mirror type
};

// Squad properties
let SQUAD_SIZE = 30;
let MAX_SQUAD_SIZE = 9; // Maximum number of squad members
let squad = [];
let squadSpeed = 10;
let squadFireRate = 30; // frames between shots (faster firing rate)
let lastFireTime = 0;

// Skill upgrade tracking
let fireRateBoost = DEBUG_MODE ? 10 : 0; // Reduces time between shots (starts with some in debug mode)
let damageBoost = DEBUG_MODE ? 10 : 0; // Increases damage (starts with some in debug mode)
let aoeBoost = DEBUG_MODE ? 10 : 0; // Increases area of effect (starts with some in debug mode)
let cameraOffsetX = CAMERA_OFFSET_X;
let cameraOffsetY = CAMERA_OFFSET_Y;
let cameraZoom = CAMERA_OFFSET_Z;

// Enemy properties
let enemies = [];
let lastEnemySpawn = 0;

const ENEMY_SPAWN_RATE = 45; // frames between spawns (much faster)
const STANDARD_ENEMY_SIZE = 25;
const ELITE_ENEMY_SIZE = 35;
const BOSS_SIZES = [50, 70, 90];
const ENEMIES_PER_ROW = 5 * 2; // Number of enemies per row when spawning

// Projectiles
let projectiles = [];
const PROJECTILE_SPEED = 12 * 1.5; // Faster projectiles
const PROJECTILE_SIZE = STANDARD_ENEMY_SIZE * 1.2;

// Visual effects
let effects = [];
const EFFECT_DURATION = 30 * 0.5; // frames

// Power-ups
let powerUps = [];
const POWER_UP_SIZE = 60;
const POWER_UP_SPAWN_RATE = 90 * 1; // frames between power-up spawns (continuous spawning)
const WEAPON_SPAWN_CHANCE = DEBUG_MODE ? 1 : 0.1; // chance for weapon
const SKILL_SPAWN_CHANCE = 0.3; // chance for skill
let lastPowerUpSpawn = 0;
const POWER_UP_SPEED = 3 * 2; // Speed at which power-ups move down the lane

// Weapons inventory (false means locked, true means available)
let weapons = {
  thunderbolt: true,
  blaster: false,
  inferno: false,
  frostbite: false,
  vortex: false,
  plasma: false,
  photon: false,
};

const WEAPON_TYPES = Object.keys(weapons);
const SKILL_TYPES = ["fire_rate", "damage", "aoe"];

// Currently equipped weapon
let currentWeapon = WEAPON_TYPES[0];

// Skills cooldowns in frames
let skills = {
  skill1: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
  skill2: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0, active: false, activeDuration: 300, endTime: 0 }, // Machine gun skill with duration (5 seconds = 300 frames at 60fps)
  skill3: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
  skill4: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
  skill5: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
  skill6: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
  skill7: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
  skill8: { cooldown: 600 * (1 + currentWave / 5), lastUsed: 0 },
};

let squadLeader = {
  x: 0,
  y: 0, // Starting near the bottom of extended bridge
  z: 0,
  size: SQUAD_SIZE,
  health: SQUAD_HEALTH * 10, // Use configurable health
  weapon: currentWeapon,
  id: Date.now(), // Unique ID for reference
};

// Font loading
function preload() {
  // Load a default system font
  gameFont = loadFont(
    "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf"
  );
}

// Game setup
// Track and manage memory issues
let lastMemoryWarning = 0;
let memoryWarningShown = false;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  // Set the font for all text
  textFont(gameFont);

  // Initialize the squad with a single member
  squad.push(squadLeader);

  // Set perspective for better 3D view
  perspective(PI / 3.0, width / height, 0.1, 5000);

  // Enable depth testing for proper 3D rendering but disable depth sort for transparent objects
  // This can improve performance in some cases
  setAttributes('antialias', true);

  // Disable texture mipmapping to save memory
  textureMode(NORMAL);

  // Set lower precision to improve performance
  setAttributes('perPixelLighting', false);

  // Auto-start the game (no need to press enter)
  // resetGame();
  gameStartTime = frameCount;

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
  createDirectionalPadElement(); // Add directional pad for touch/click movement
  createSkillBarElement();

  // Purge any old references
  setTimeout(function() {
    // Clear arrays just in case
    effects = [];
    projectiles = [];
    projectilePool = [];

    // Attempt to trigger garbage collection
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        // Ignore if gc is not available
      }
    }
  }, 1000);
}

// Memory warning overlay
let memoryWarningOverlay = null;

function checkMemoryUsage() {
  // Check if we need to create memory warning
  if (!memoryWarningOverlay && window.performance && window.performance.memory) {
    memoryWarningOverlay = createDiv("");
    memoryWarningOverlay.position(width/2 - 150, 50);
    memoryWarningOverlay.style("background-color", "rgba(255, 0, 0, 0.7)");
    memoryWarningOverlay.style("color", "white");
    memoryWarningOverlay.style("padding", "10px");
    memoryWarningOverlay.style("border-radius", "5px");
    memoryWarningOverlay.style("width", "300px");
    memoryWarningOverlay.style("text-align", "center");
    memoryWarningOverlay.style("font-family", "monospace");
    memoryWarningOverlay.style("z-index", "2000");
    memoryWarningOverlay.style("display", "none");
  }

  // Check for high memory usage
  if (memoryWarningOverlay && window.performance && window.performance.memory) {
    const currentMemory = window.performance.memory.usedJSHeapSize / (1024 * 1024);
    
    // Show warning if memory usage is too high
    if (currentMemory > 800 && !memoryWarningShown) {
      memoryWarningShown = true;
      memoryWarningOverlay.html(`
        <h3>HIGH MEMORY USAGE!</h3>
        <p>Game is using ${currentMemory.toFixed(1)} MB</p>
        <p>Consider refreshing</p>
      `);
      memoryWarningOverlay.style("display", "block");
      
      // Emergency cleanup
      projectiles = [];
      projectilePool = [];
      effects = [];
      
      // Reduce enemies to essential minimum
      if (enemies.length > 20) {
        enemies.splice(20, enemies.length - 20);
      }
    }
    
    // Hide warning if memory usage drops
    if (currentMemory < 600 && memoryWarningShown) {
      memoryWarningShown = false;
      memoryWarningOverlay.style("display", "none");
    }
  }
}

function draw() {
  // Check memory usage each frame
  checkMemoryUsage();

  background(0);
  ambientLight(200); // Higher value for more brightness

  // Optimize lighting - only one light source to save performance
  directionalLight(255, 255, 255, 0, -1, -1);

  // Apply camera transformations
  translate(cameraOffsetX, -cameraOffsetY, -cameraZoom);
  rotateX(PI / 4); // Angle the view down to see the bridge

  // 3D
  drawGame();

  if (gameState == "playing") {
    updateGame();
  }

  // DOM
  drawMenu();
  drawPauseContainer();
  drawResumeContainer();
  drawGameOverContainer();
  updateDirectionalPad(); // Update the directional pad visibility and state

  // Periodically try to clear memory
  if (frameCount % 900 === 0) { // Every 15 seconds
    // Delete unused references that might be causing memory leaks
    fpsHistory = fpsHistory.slice(-5); // Keep only last 5 samples
    memoryUsageSamples = memoryUsageSamples.slice(-3); // Keep only last 3 samples

    // Force texture cache cleanup if possible
    if (typeof p5 !== 'undefined' && p5._renderer) {
      try {
        p5._renderer._clearTextures();
      } catch (e) {
        // Ignore if method doesn't exist
      }
    }
  }
}

// Memory leak tracking and prevention
let lastMemoryCleanup = 0;
const MEMORY_CLEANUP_INTERVAL = 300; // Run garbage collection helper every 5 seconds (300 frames at 60fps)
const MAX_OBJECTS = 500; // Maximum total number of game objects

// Memory cleanup helper function
function cleanupMemory() {
  // Only run cleanup at specified intervals to avoid performance impact
  if (frameCount - lastMemoryCleanup < MEMORY_CLEANUP_INTERVAL) return;
  
  lastMemoryCleanup = frameCount;
  
  // Calculate total objects
  const totalObjects = squad.length + enemies.length + projectiles.length + powerUps.length + effects.length;
  
  // If too many objects, aggressively reduce all arrays
  if (totalObjects > MAX_OBJECTS) {
    // Keep this limited to prevent memory buildup
    const excessRatio = MAX_OBJECTS / totalObjects;
    
    // Don't reduce squad (important for gameplay)
    
    // Reduce projectiles if too many (keep newest ones - most important)
    if (projectiles.length > MAX_PROJECTILES / 2) {
      projectiles.splice(0, projectiles.length - MAX_PROJECTILES / 2);
    }
    
    // Reduce effects (visual only, won't affect gameplay)
    if (effects.length > MAX_EFFECTS / 2) {
      effects.splice(0, effects.length - MAX_EFFECTS / 2);
    }
    
    // // Reduce power-ups if excessive
    // if (powerUps.length > MAX_POWER_UPS) {
    //   powerUps.splice(0, powerUps.length - MAX_POWER_UPS);
    // }
    
    // Only reduce enemies as a last resort (important for gameplay)
    if (totalObjects > MAX_OBJECTS && enemies.length > 50) {
      // Remove enemies that are farthest away from the player
      enemies.sort((a, b) => {
        // Find distance from first squad member
        if (squad.length === 0) return 0;
        
        const mainMember = squad[0];
        const distA = Math.pow(a.x - mainMember.x, 2) + Math.pow(a.y - mainMember.y, 2);
        const distB = Math.pow(b.x - mainMember.x, 2) + Math.pow(b.y - mainMember.y, 2);
        
        // Sort by distance (descending - farthest first)
        return distB - distA;
      });
      
      // Remove farthest enemies
      enemies.splice(50, enemies.length - 50);
    }
    
    // Clear object pools when they get too large
    while (projectilePool.length > 30) projectilePool.pop();
  }
  
  // Force release of any references that might be causing memory leaks
  if (frameCount % 1800 === 0) { // Every 30 seconds
    projectilePool.length = 0; // Clear the pool completely
  }
}

// Main game logic functions
function updateGame() {
  spawnEnemies();
  spawnPowerUps();

  updateSquad();
  updateProjectiles();
  updateEnemies();
  updatePowerUps();

  applyEffects();
  applyEnemyEffects();

  checkCollisions();
  checkWaveCompletion();
  
  // Run memory cleanup
  cleanupMemory();

  updateHUD();
}

function drawGame() {
  drawMainLane();

  drawPowerUpLane();

  drawSquad();

  drawEnemies();

  drawProjectiles();

  drawEffects();

  drawPowerUps();
}

function drawMainLane() {
  // Draw the bridge (main lane) - extending from bottom to top of screen
  push();
  translate(0, 0, 0);
  fill(...BRIDGE_COLOR);
  box(BRIDGE_WIDTH, BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER, 10); // Increased bridge length to cover full screen
  pop();
}

function drawPowerUpLane() {
  // Draw the power-up lane (extended to match main bridge)
  push();
  translate(BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2, 0, 0);
  
  // Use a slightly different fill color for better contrast
  fill(...POWER_UP_LANE_COLOR);
  
  // Draw the base power-up lane
  box(POWER_UP_LANE_WIDTH, BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER, 10);
  
  // Add lane markers/decorations for better visual guidance
  const laneMarkers = 20; // Number of lane markers
  const stepSize = (BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / laneMarkers;
  
  // Draw lane markers
  for (let i = 0; i < laneMarkers; i++) {
    const yPos = -BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER/2 + i * stepSize + stepSize/2;
    push();
    translate(0, yPos, 5.1); // Position slightly above the lane
    fill(180, 220, 255, 150); // Lighter blue with transparency
    box(POWER_UP_LANE_WIDTH - 20, 5, 1); // Thin horizontal marker
    pop();
  }
  
  // Draw a more visible edge between main bridge and power-up lane for clarity
  push();
  translate(-POWER_UP_LANE_WIDTH/2, 0, 5.1);
  fill(200, 230, 255, 200); // Bright edge color
  box(2, BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER, 1);
  pop();
  
  pop();
}

function drawSquad() {
  // Draw squad members
  for (let i = 0; i < squad.length; i++) {
    const member = squad[i];
    push();
    translate(member.x, member.y, member.z + 40);

    // Rotate the member to stand upright
    rotateX(-HALF_PI); // Rotate 90 degrees to make the box stand upright

    // Draw a simple human figure
    drawHuman(member.size, i === 0);

    // Draw health bar above squad member
    push(); // Save the current transformation state
    translate(0, -member.size * 1.5, 0); // Position bar directly above member
    const healthBarWidth = member.size * 1.2;
    const healthBarHeight = 5;
    const healthPercentage = member.health / 100;

    // Background of health bar
    fill(100, 100, 100);
    box(healthBarWidth, healthBarHeight, 2);

    // Health indicator
    fill(0, 255 * healthPercentage, 0);
    translate(-(healthBarWidth - healthBarWidth * healthPercentage) / 2, 0, 1);
    box(healthBarWidth * healthPercentage, healthBarHeight, 3);
    pop(); // Restore the transformation state
    pop();
  }
}

function drawHuman(size, isLeader) {
  // Head
  push();
  translate(0, -size * 0.75, 0);
  fill(200, 150, 150);
  sphere(size * 0.25);
  pop();

  // Hat
  push();
  translate(0, -size * 0.95, 0);
  noStroke(); // Remove stroke from the hat
  isLeader ? fill(255, 215, 0) : fill(50, 50, 50); // Gold for leader, dark gray for others
  cylinder(size * 0.3, size * 0.1);
  pop();

  // Body
  push();
  translate(0, -size * 0.25, 0);
  fill(0, 255, 0); // Green shirt
  box(size * 0.5, size, size * 0.3);
  pop();

  // Arms raised holding a gun
  push();
  translate(-size * 0.4, -size * 0.25, 0);
  fill(0, 255, 0); // Green sleeves
  rotateZ(-PI / 4);
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  push();
  translate(size * 0.4, -size * 0.25, 0);
  fill(0, 255, 0); // Green sleeves
  rotateZ(-PI / 4);
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  // Gun rotated 90 degrees towards the top of the screen
  push();
  translate(size * 0.6, -size * 0.5, 0);
  fill(50); // Gun color
  rotateY(HALF_PI); // Rotate the gun 90 degrees
  box(size * 0.5, size * 0.1, size * 0.1);
  pop();

  // Legs
  push();
  translate(-size * 0.2, size * 0.5, 0);
  fill(128, 128, 128); // Gray pants
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  push();
  translate(size * 0.2, size * 0.5, 0);
  fill(128, 128, 128); // Gray pants
  box(size * 0.1, size * 0.5, size * 0.1);
  pop();

  // Bullet belt
  push();
  translate(0, 0, -size * 0.2);
  fill(255, 223, 0); // Bullet belt color
  rotateY(PI / 4);
  cylinder(size * 0.05, size);
  pop();
}

function drawEnemies() {
  // Draw enemies with distance-based LOD (Level of Detail)
  for (let enemy of enemies) {
    // Find distance to camera/player for LOD calculations
    let distToCamera = 0;
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = enemy.x - mainMember.x;
      const dy = enemy.y - mainMember.y;
      distToCamera = dx*dx + dy*dy; // Squared distance - no need for sqrt
    }
    
    push();
    translate(enemy.x, enemy.y, enemy.z + enemy.size / 2);
    
    // Apply distance-based LOD
    if (distToCamera > 800*800) {
      // Very distant enemies - ultra simplified rendering
      fill(...ENEMY_COLORS[enemy.type]);
      sphere(enemy.size / 2);
      
      // Skip health bar for very distant enemies
      pop();
      continue;
    }
    
    fill(...ENEMY_COLORS[enemy.type]);

    // Draw different shapes for different enemy types
    if (enemy.type.includes("boss")) {
      // Boss enemies are important - always full detail
      sphere(enemy.size / 2);
    } else if (enemy.type === "elite") {
      // Elite enemies are pyramids
      cone(enemy.size / 2, enemy.size);
    } else {
      // Standard enemies - simplify for medium distances
      if (distToCamera > 400*400) {
        // Medium distance - use simpler shape
        sphere(enemy.size / 2);
      } else {
        // Close enough for full detail
        box(enemy.size, enemy.size, enemy.size);
      }
    }

    // Only draw health bars for enemies within reasonable distance
    if (distToCamera < 600*600) {
      // Draw health bar above enemy
      const maxHealth = getEnemyMaxHealth(enemy.type);
      const healthPercentage = enemy.health / maxHealth;

      translate(0, 0, enemy.size);
      const healthBarWidth = enemy.size * 1.2;
      const healthBarHeight = 5;

      // Background of health bar
      fill(100, 100, 100);
      box(healthBarWidth, healthBarHeight, 2);

      // Health indicator
      fill(255 * (1 - healthPercentage), 255 * healthPercentage, 0);
      translate(-(healthBarWidth - healthBarWidth * healthPercentage) / 2, 0, 1);
      box(healthBarWidth * healthPercentage, healthBarHeight, 3);
    }
    
    pop();
  }
}

function drawProjectiles() {
  // Draw projectiles with performance optimizations
  for (let proj of projectiles) {
    // Distance-based Level of Detail
    let distToCamera = 0;
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = proj.x - mainMember.x;
      const dy = proj.y - mainMember.y;
      distToCamera = dx*dx + dy*dy; // Squared distance
    }
    
    push();
    translate(proj.x, proj.y, proj.z);

    // Use custom color if defined, otherwise use weapon color
    let projColor = proj.color ? [...proj.color] : [...(WEAPON_COLORS[proj.weapon] || [255, 255, 255])];

    // Enhanced visuals based on power-up levels
    let enhancedSize = 1.0;
    let hasGlowEffect = false;
    
    // Check if this is a machine gun projectile
    const isMachineGunProjectile = skills.skill2.active && proj.color && 
                                 proj.color[0] === 255 && proj.color[1] === 215 && proj.color[2] === 0;

    // Modify projectile appearance based on power-ups
    if (damageBoost > 5) {
      // Add red glow for high damage
      projColor[0] = min(255, projColor[0] + 50);
      enhancedSize *= 1.2;
      hasGlowEffect = true;
    }
    if (fireRateBoost > 5) {
      // Add green glow for high fire rate
      projColor[1] = min(255, projColor[1] + 50);
      enhancedSize *= 1.1;
      hasGlowEffect = true;
    }
    if (aoeBoost > 5) {
      // Add blue glow for high AOE
      projColor[2] = min(255, projColor[2] + 100);
      enhancedSize *= 1.3;
      hasGlowEffect = true;
    }

    // For very distant projectiles, use simple rendering
    if (distToCamera > 800*800) {
      fill(projColor[0], projColor[1], projColor[2]);
      sphere(proj.size);
      pop();
      continue;
    }

    // Add glow effect for enhanced projectiles (but only at medium-close distances)
    if (hasGlowEffect && distToCamera < 500*500) {
      // Outer glow
      push();
      noStroke();
      fill(projColor[0], projColor[1], projColor[2], 150);
      sphere(proj.size * 1.5 * enhancedSize);
      pop();

      // Add trail effect (only for medium-close distances)
      if (distToCamera < 300*300) {
        push();
        translate(0, PROJECTILE_SPEED * 0.5, 0); // Position behind bullet
        fill(projColor[0], projColor[1], projColor[2], 100);
        sphere(proj.size * 1.2 * enhancedSize);
        pop();

        // For very powerful bullets, add an additional effect (only for close distances)
        if (damageBoost + fireRateBoost + aoeBoost > 15 && distToCamera < 200*200) {
          push();
          translate(0, PROJECTILE_SPEED * 1.0, 0); // Further behind
          fill(projColor[0], projColor[1], projColor[2], 70);
          sphere(proj.size * 0.9 * enhancedSize);
          pop();
        }
      }
    }

    // Main projectile with enhanced color
    fill(projColor[0], projColor[1], projColor[2]);

    // Different projectile shapes based on weapon type and distance
    // For medium-range and farther projectiles, use simplified rendering
    if (distToCamera > 400*400) {
      // Simplified rendering for distant projectiles
      sphere(proj.size);
    } else if (proj.weapon === "blaster") {
      // Enhanced Green laser beam with a glowing effect - fewer effects at distance
      const detailLevel = distToCamera < 200*200 ? 3 : 1;
      for (let i = 0; i < detailLevel; i++) {
        push();
        rotateX(frameCount * 0.1 + i);
        rotateY(frameCount * 0.1 + i);
        torus(proj.size * enhancedSize, proj.size * 0.1);
        pop();
      }
    } else if (proj.weapon === "thunderbolt") {
      // Thunder projectile with a zigzag pattern - simplified at distance
      stroke(255, 255, 0);
      strokeWeight(2);
      noFill();
      beginShape();
      let x = 0, y = 0, z = 0;
      // Fewer vertices for distant projectiles
      const vertexCount = distToCamera < 200*200 ? 10 : 5;
      for (let i = 0; i < vertexCount; i++) {
        vertex(x, y, z);
        x += random(-5, 5);
        y += random(-5, 5);
        z += random(5, 15);
      }
      endShape();
    } else if (proj.weapon === "inferno") {
      // Fire projectile with a dynamic flame effect - fewer particles at distance
      const particleCount = distToCamera < 200*200 ? 5 : 2;
      for (let i = 0; i < particleCount; i++) {
        push();
        translate(random(-5, 5), random(-5, 5), random(-5, 5));
        rotateY(frameCount * 0.1);
        cone(proj.size * 0.5, proj.size * enhancedSize);
        pop();
      }
    } else if (proj.weapon === "frostbite") {
      // Ice projectile with crystal spikes - fewer spikes at distance
      const spikeCount = distToCamera < 200*200 ? 6 : 3;
      for (let i = 0; i < spikeCount; i++) {
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        translate(0, 0, proj.size * 0.4);
        box(proj.size * 0.2, proj.size * 0.2, proj.size * 0.8);
        pop();
      }
    } else if (proj.weapon === "vortex") {
      // Vortex projectile with swirling rings - fewer rings at distance
      const ringCount = distToCamera < 200*200 ? 3 : 1;
      for (let i = 0; i < ringCount; i++) {
        push();
        rotateX(frameCount * 0.1 + i);
        rotateY(frameCount * 0.1 + i);
        torus(proj.size * 0.8, proj.size * 0.1);
        pop();
      }
    } else if (proj.weapon === "plasma") {
      // Plasma projectile with a pulsating effect - fewer pulses at distance
      const pulseCount = distToCamera < 200*200 ? 3 : 1;
      for (let i = 0; i < pulseCount; i++) {
        push();
        translate(random(-5, 5), random(-5, 5), random(-5, 5));
        sphere(proj.size * (0.8 + sin(frameCount * 0.2 + i) * 0.2));
        pop();
      }
    } else if (proj.weapon === "photon") {
      // Photon projectile with a rotating disc - fewer discs at distance
      const discCount = distToCamera < 200*200 ? 3 : 1;
      for (let i = 0; i < discCount; i++) {
        push();
        rotateX(frameCount * 0.1 + i);
        rotateY(frameCount * 0.1 + i);
        cylinder(proj.size * 0.5, proj.size * 0.2);
        pop();
      }
    } else if (isMachineGunProjectile) {
      // Special rendering for machine gun projectiles
      // Elongated bullet shape for machine gun projectiles
      push();
      // Rotate to face direction of travel
      rotateX(HALF_PI);
      
      // Bullet body (cylinder)
      fill(255, 215, 0);
      cylinder(proj.size * 0.4, proj.size * 1.5);
      
      // Bullet tip (cone)
      translate(0, proj.size * 0.8, 0);
      fill(255, 200, 50);
      cone(proj.size * 0.4, proj.size * 0.5);
      
      // Bullet trail/muzzle flash (only for close projectiles)
      if (distToCamera < 300*300) {
        translate(0, -proj.size * 2, 0);
        fill(255, 150, 0, 150);
        cone(proj.size * 0.3, proj.size * 0.7);
      }
      pop();
    } else {
      // Default sphere
      sphere(proj.size);
    }
    pop();
  }
}

function drawEffects() {
  // Draw visual effects - optimized with distance culling
  for (let effect of effects) {
    // Skip rendering effects too far from the player (distance culling)
    // Find closest squad member to use as reference
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = effect.x - mainMember.x;
      const dy = effect.y - mainMember.y;
      
      // Skip distance culling for effects that should always render in detail
      const forceDetailedRendering = effect.forceRenderDetail || 
                                    effect.type === "atomicBomb" || 
                                    effect.type === "atomicExplosion" || 
                                    effect.type === "atomicFlash";
      
      // Fast distance check - if effect is far away AND not forced to render in detail, skip detailed rendering
      if (!forceDetailedRendering && dx*dx + dy*dy > 500*500) {
        // Draw simplified version for distant effects
        push();
        translate(effect.x, effect.y, effect.z);
        const effectColor = effect.color || [255, 255, 255];
        fill(...effectColor, 200 * (effect.life / EFFECT_DURATION));
        sphere(effect.size * 0.5);
        pop();
        continue;
      }
    }
    
    push();
    translate(effect.x, effect.y, effect.z);

    // Default color if effect.color is undefined
    const effectColor = effect.color || [255, 255, 255];
    
    // Apply LOD (Level of Detail) based on effect life
    // Less particles as effect fades away
    const detailLevel = effect.life > EFFECT_DURATION/2 ? 1.0 : 0.5;
    const particleCount = Math.ceil(detailLevel * 10);

    if (effect.type === "explosion") {
      // Explosion effect
      fill(...effectColor, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count based on detail level
      for (let i = 0; i < particleCount; i++) {
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        translate(random(-20, 20), random(-20, 20), random(-20, 20));
        sphere(effect.size * 0.2);
        pop();
      }
      // Reduce secondary particles even more
      for (let i = 0; i < Math.ceil(particleCount/2); i++) {
        push();
        rotateX(random(TWO_PI));
        rotateY(random(TWO_PI));
        translate(random(-30, 30), random(-30, 30), random(-30, 30));
        cone(effect.size * 0.1, effect.size * 0.5);
        pop();
      }
    } else if (effect.type === "hit") {
      // Hit effect - simplified
      fill(...effectColor, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const hitParticles = Math.min(8, Math.ceil(detailLevel * 8));
      for (let i = 0; i < hitParticles; i++) {
        push();
        translate(random(-10, 10), random(-10, 10), random(-10, 10));
        box(effect.size * 0.2);
        pop();
      }
      // Skip secondary particles when low detail
      if (detailLevel > 0.7) {
        for (let i = 0; i < 2; i++) {
          push();
          translate(random(-15, 15), random(-15, 15), random(-15, 15));
          cone(effect.size * 0.1, effect.size * 0.3);
          pop();
        }
      }
    } else if (effect.type === "fire") {
      // Fire effect - simplified
      fill(255, 100 + random(155), 0, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const fireParticles = Math.ceil(detailLevel * 5);
      for (let i = 0; i < fireParticles; i++) {
        push();
        translate(random(-10, 10), random(-10, 10), random(0, 20));
        sphere(5 + random(5));
        pop();
      }
      // Fewer secondary particles
      if (detailLevel > 0.6) {
        for (let i = 0; i < 2; i++) {
          push();
          translate(random(-10, 10), random(-10, 10), random(0, 20));
          cylinder(3 + random(3), 10);
          pop();
        }
      }
    } else if (effect.type === "ice") {
      // Enhanced Ice effect - simplified
      fill(200, 200, 255, 255 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const iceParticles = Math.ceil(detailLevel * 10);
      for (let i = 0; i < iceParticles; i++) {
        push();
        translate(random(-15, 15), random(-15, 15), random(-15, 15));
        box(effect.size * 0.1, effect.size * 0.1, effect.size * 0.5);
        pop();
      }
      // Skip secondary particles when low detail
      if (detailLevel > 0.7) {
        for (let i = 0; i < 3; i++) {
          push();
          translate(random(-20, 20), random(-20, 20), random(-20, 20));
          cone(effect.size * 0.1, effect.size * 0.3);
          pop();
        }
      }
    } else if (effect.type === "thunder") {
      // Realistic Thunder effect - simplified
      stroke(255, 255, 0, 255 * (effect.life / EFFECT_DURATION));
      strokeWeight(3);
      // Reduce lightning bolts
      const thunderLines = Math.ceil(detailLevel * 3);
      for (let i = 0; i < thunderLines; i++) {
        push();
        translate(0, -50, 0); // Start from above
        beginShape();
        let x = 0, y = 0, z = 0;
        // Simplified lightning path
        const points = Math.max(5, Math.ceil(detailLevel * 10));
        for (let j = 0; j < points; j++) {
          vertex(x, y, z);
          x += random(-10, 10);
          y += random(5, 15); // Move downwards
          z += random(-10, 10);
        }
        endShape();
        pop();
      }
    } else if (effect.type === "vortex") {
      // Vortex effect - simplified
      rotateZ(frameCount * 0.1);
      fill(150, 0, 255, 200 * (effect.life / EFFECT_DURATION));
      // Reduce torus count
      const torusCount = Math.ceil(detailLevel * 5);
      for (let i = 0; i < torusCount; i++) {
        push();
        rotateX(frameCount * 0.05);
        rotateY(frameCount * 0.05);
        torus(30 * (1 - effect.life / EFFECT_DURATION), 5);
        pop();
      }
    } else if (effect.type === "plasma") {
      // Plasma effect - simplified
      fill(255, 0, 255, 200 * (effect.life / EFFECT_DURATION));
      // Reduce particle count
      const plasmaParticles = Math.ceil(detailLevel * 4);
      for (let i = 0; i < plasmaParticles; i++) {
        push();
        translate(random(-20, 20), random(-20, 20), random(0, 10));
        rotateX(frameCount * 0.03);
        rotateY(frameCount * 0.03);
        ellipsoid(5 + random(5), 3 + random(3), 3 + random(3));
        pop();
      }
    } else if (effect.type === "shield") {
      // Shield effect - always needed at full detail for gameplay
      noFill();
      stroke(0, 150, 255, 100 * (effect.life / EFFECT_DURATION)); 
      strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        push();
        rotateX(frameCount * 0.02 + i);
        rotateY(frameCount * 0.02 + i);
        sphere(effect.size * 0.8);
        pop();
      }

      fill(0, 150, 255, 30 * (effect.life / EFFECT_DURATION));
      for (let i = 0; i < 2; i++) {
        push();
        rotateX(frameCount * 0.05 + i);
        rotateY(frameCount * 0.05 + i);
        torus(effect.size * 0.6, 3);
        pop();
      }
    } else if (effect.type === "machineGun") {
      // Machine Gun effect - visual indicator for active machine gun skill
      // Follow the squad member if reference exists
      if (effect.member) {
        effect.x = effect.member.x;
        effect.y = effect.member.y;
        effect.z = effect.member.z;
      }
      
      // Pulsing yellow/orange aura with occasional muzzle flashes
      const pulseRate = frameCount % 10;
      const flashIntensity = pulseRate < 3 ? 1 : 0.5; // Brighter during "flash" frames
      
      // Main aura
      noFill();
      stroke(255, 200 * flashIntensity, 0, 150 * (effect.life / skills.skill2.activeDuration));
      strokeWeight(2);
      sphere(effect.size * 0.9);
      
      // Inner glow
      fill(255, 200 * flashIntensity, 0, 30 * (effect.life / skills.skill2.activeDuration));
      for (let i = 0; i < 2; i++) {
        push();
        // Rotate based on squad member position and frame count
        const rotAngle = atan2(effect.y, effect.x) + frameCount * 0.1;
        rotateZ(rotAngle + i * PI/4);
        
        // Draw "barrel" indicators in front of the member
        translate(0, -effect.size * 0.8, 0); // Position in front
        cylinder(effect.size * 0.15, effect.size * 0.5);
        pop();
      }
      
      // Add small particles for "shell casings" occasionally
      if (frameCount % 5 === 0) {
        push();
        fill(200, 150, 0, 150);
        translate(random(-effect.size/2, effect.size/2), 
                 -effect.size * 0.6, 
                 random(-effect.size/2, effect.size/2));
        box(3, 6, 3);
        pop();
      }
    } else if (effect.type === "atomicBomb") {
      // Render falling bomb with elaborate trail
      push();
      
      // Update position as it falls from sky to target using consistent timing
      if (effect.endPos) {
        const progress = 1 - (effect.life / ATOMIC_BOMB_FALL_DURATION); // 0 to 1 as it falls
        effect.z = 800 - (800 - effect.endPos.z) * progress; // Linear interpolation from 800 to ground
        
        // Record current position for trail (less frequent for slower fall)
        if (frameCount % 8 === 0 && effect.trail) { // Every 8 frames (was 3)
          effect.trail.push({
            x: effect.x,
            y: effect.y,
            z: effect.z,
            age: 0
          });
          
          // Limit trail length
          if (effect.trail.length > 10) { // Reduced from 20 to 10 for cleaner trail
            effect.trail.shift();
          }
        }
        
        // Age trail points
        if (effect.trail) {
          for (let point of effect.trail) {
            point.age++;
          }
        }
      }
      
      // Bomb body - fixed orientation pointing downward in player view
      fill(50, 50, 50); // Dark gray
      rotateX(HALF_PI); // Align bomb with player view
      // Fixed rotation angle rather than changing each frame for consistent orientation
      rotateZ(effect.fallStartTime * 0.1); // Fixed rotation based on start time
      
      // Main bomb shape - "Little Boy" style atomic bomb with enhanced visibility
      push();
      // Main body - slightly larger and more metallic color
      fill(60, 60, 70); // More bluish metallic color
      cylinder(effect.size / 2.3, effect.size * 1.6); // Slightly larger
      
      // Nose cone - more prominent (pointing toward the ground in player view)
      push();
      fill(80, 80, 90); // Lighter color for nose
      translate(0, effect.size * 0.8, 0); // In rotated space: Y+ is down toward ground
      rotateX(PI); // Rotate cone to point downward
      cone(effect.size / 2.3, effect.size * 0.7); // Slightly larger
      pop();
      
      // Tail fins - more visible (adjusted for player view)
      fill(90, 90, 100); // Lighter color for fins
      for (let i = 0; i < 4; i++) {
        push();
        rotateZ(i * PI/2);
        translate(effect.size * 0.6, -effect.size * 0.5, 0); // Y- is up in rotated space
        
        // Trapezoidal fin shape (aligned with player view)
        beginShape();
        vertex(0, 0, 0);
        vertex(effect.size * 0.45, -effect.size * 0.3, 0); // Horizontal spread
        vertex(effect.size * 0.45, effect.size * 0.4, 0); // Horizontal spread
        vertex(0, effect.size * 0.7, 0); // Extend back along Y axis
        endShape(CLOSE);
        pop();
      }
      
      // More prominent bomb casing stripes (oriented for player view)
      push();
      fill(180, 20, 20); // Brighter red stripes
      stroke(200, 200, 200); // Add silver outline
      strokeWeight(1);
      // No need for additional rotation - already in rotated space
      for (let i = 0; i < 3; i++) {
        push();
        translate(0, -effect.size * 0.5 + i * effect.size * 0.5, 0); // Position along rotated Y axis
        rotateY(PI/2); // Rotate torus to encircle the cylinder
        torus(effect.size/2.3 + 0.1, effect.size/15); // Slightly larger
        pop();
      }
      
      // Add warning markings (oriented for player view)
      push();
      fill(220, 220, 40); // Bright yellow
      
      // Warning triangle on the side of the bomb
      const triangleSize = effect.size * 0.5;
      rotateZ(PI/4); // Rotate triangle for better visibility
      translate(effect.size/2.3 * 0.8, 0, 0); // Position on the side of the bomb
      
      // Draw triangle perpendicular to bomb surface
      beginShape();
      vertex(0.1, -triangleSize/2, -triangleSize/2);
      vertex(0.1, -triangleSize/2, triangleSize/2);
      vertex(0.1, triangleSize/2, 0);
      endShape(CLOSE);
      pop();
      pop();
      pop();
      
      // Draw trail of previous positions
      if (effect.trail) {
        for (let i = 0; i < effect.trail.length; i++) {
          const point = effect.trail[i];
          const trailFade = 1 - (point.age / 60); // Fade based on age
          
          if (trailFade > 0) {
            // Main smoke trail
            push();
            translate(point.x - effect.x, point.y - effect.y, point.z - effect.z);
            
            // Minimal smoke puffs for better bomb visibility
            fill(230, 230, 230, 80 * trailFade); // Much more transparent smoke
            for (let j = 0; j < 2; j++) { // Reduced from 5 to 2 puffs
              push();
              const spread = effect.size * (0.5 + (point.age / 20)); // Less spread
              translate(
                random(-spread, spread),
                random(-spread, spread),
                random(-spread, spread)
              );
              const smokeSize = random(effect.size/6, effect.size/2) * (1 + point.age/40); // Smaller puffs
              sphere(smokeSize * trailFade);
              pop();
            }
            
            // Add fire particles for recent trail points
            if (point.age < 10) {
              for (let j = 0; j < 3; j++) {
                push();
                fill(255, random(100, 200), 0, 200 * trailFade);
                translate(
                  random(-effect.size/2, effect.size/2),
                  random(-effect.size/2, effect.size/2),
                  random(-effect.size/2, effect.size/2)
                );
                sphere(random(effect.size/6, effect.size/3));
                pop();
              }
            }
            
            pop();
          }
        }
      }
      
      // Add minimal fire effect at the bomb's current position (reduced smoke for visibility)
      push();
      // Fire at the tail - smaller and fewer flames
      for (let i = 0; i < 5; i++) { // Reduced from 10 to 5 flames
        push();
        fill(255, random(150, 250), 0, random(180, 255)); // Brighter flames
        translate(
          random(-effect.size/4, effect.size/4),
          random(-effect.size/4, effect.size/4),
          effect.size * 0.7 + random(0, effect.size/3)
        );
        sphere(random(effect.size/6, effect.size/3)); // Smaller flames
        pop();
      }
      
      // Minimal smoke trail for better bomb visibility
      for (let i = 0; i < 6; i++) { // Reduced from 15 to 6 smoke puffs
        push();
        const smokeGray = random(180, 240); // Lighter smoke
        fill(smokeGray, smokeGray, smokeGray, random(50, 100)); // More transparent smoke
        translate(
          random(-effect.size/2, effect.size/2), // Less spread
          random(-effect.size/2, effect.size/2), // Less spread
          effect.size + random(0, effect.size) // Less tail length
        );
        sphere(random(effect.size/5, effect.size/2)); // Smaller smoke puffs
        pop();
      }
      pop();
      
      pop();
    } else if (effect.type === "atomicExplosion") {
      // Render atomic explosion with mushroom cloud effect
      push();
      
      // Use custom color if defined
      const explosionColor = effect.color || [255, 200, 50];
      const alpha = 255 * (effect.life / 120); // Fade out based on life
      
      // Draw based on which layer of the explosion this is
      const layer = effect.layer || 0;
      
      if (layer === 0) { // Central bright flash
        // Central bright core
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha);
        sphere(effect.size * 0.8);
        
        // Add random particles for initial explosion
        for (let i = 0; i < 10; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.5, effect.size * 1.2);
          translate(
            cos(angle) * radius,
            sin(angle) * radius,
            random(-effect.size/2, effect.size/2)
          );
          fill(255, 255, 200, random(100, 200));
          sphere(random(5, 15));
          pop();
        }
      } else if (layer === 1) { // Fire layer
        // Fire sphere
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha);
        sphere(effect.size * 0.9);
        
        // Add flame effects
        for (let i = 0; i < 15; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.8, effect.size * 1.1);
          translate(
            cos(angle) * radius,
            sin(angle) * radius,
            random(-effect.size/2, effect.size)
          );
          fill(255, random(100, 200), random(0, 100), random(150, 255));
          rotateX(random(TWO_PI));
          rotateY(random(TWO_PI));
          cone(random(5, 15), random(20, 40));
          pop();
        }
      } else if (layer === 2) { // Mushroom stem
        // Draw mushroom stem with correct orientation for player view
        push();
        // Rotate to align with player view
        rotateX(HALF_PI);
        
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha);
        // Place stem along Y-axis after rotation
        translate(0, effect.size * 0.3, 0);
        cylinder(effect.size * 0.4, effect.size * 1.5);
        pop();
        
        // Draw base spheroid with correct orientation
        push();
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha * 0.7);
        sphere(effect.size * 0.7);
        pop();
      } else if (layer === 3) { // Mushroom cap
        // Mushroom cap with correct orientation
        push();
        // Rotate to align with player view
        rotateX(HALF_PI);
        
        fill(explosionColor[0], explosionColor[1], explosionColor[2], alpha * 0.8);
        // Place cap along Y-axis after rotation
        translate(0, effect.size * 1.2, 0);
        
        // Mushroom cap top
        push();
        scale(1.2, 1.2, 0.7); // Flattened sphere for mushroom cap
        sphere(effect.size * 0.9);
        pop();
        
        // Add smoke/debris effects around the cap with correct orientation
        for (let i = 0; i < 20; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.8, effect.size * 1.4);
          const height = random(effect.size * 0.1, effect.size * 0.5);
          // After rotation, debris should spread in X-Z plane with NEGATIVE Y as height (to be on top)
          translate(
            cos(angle) * radius,
            height,
            sin(angle) * radius
          );
          fill(100, 100, 100, random(50, 150));
          sphere(random(5, 20));
          pop();
        }
        pop();
      } else if (layer === 4) { // Outer smoke/debris
        // Large smoke cloud with correct orientation
        push();
        // Rotate to align with player view
        rotateX(HALF_PI);
        
        noFill();
        stroke(explosionColor[0], explosionColor[1], explosionColor[2], alpha * 0.5);
        strokeWeight(2);
        
        // Draw smoke cloud as a series of perturbed spheres
        for (let i = 0; i < 15; i++) {
          push();
          // In rotated space: X is right/left, Y is up/down, Z is forward/back
          translate(
            random(-effect.size, effect.size), // Spread horizontally (left/right)
            random(effect.size * 0.8, effect.size * 1.6), // Height (up from ground)
            random(-effect.size, effect.size)  // Spread horizontally (forward/back)
          );
          sphere(random(effect.size * 0.2, effect.size * 0.5));
          pop();
        }
        
        // Add debris particles with correct orientation
        for (let i = 0; i < 25; i++) {
          push();
          const angle = random(TWO_PI);
          const radius = random(effect.size * 0.8, effect.size * 1.8);
          const height = random(0, effect.size * 2);
          translate(
            cos(angle) * radius,  // X (horizontal spread after rotation)
            height,              // Up in Y direction (after rotation)
            sin(angle) * radius   // Z (horizontal spread after rotation)
          );
          fill(200, 200, 200, random(30, 80));
          box(random(3, 10));
          pop();
        }
        pop(); // Close the rotateX transformation
      }
      
      pop();
    } else if (effect.type === "atomicFlash") {
      // Full screen bright flash effect
      push();
      
      // Create a fullscreen flash effect that covers everything
      // This is rendered as a large sphere that encompasses the camera
      noStroke();
      
      // Fade based on life
      const flashOpacity = effect.life / 40; // Fades from 1 to 0
      
      // Use custom color if provided
      const flashColor = effect.color || [255, 255, 255];
      fill(flashColor[0], flashColor[1], flashColor[2], 255 * flashOpacity);
      
      // Position in front of camera - follow camera position
      translate(cameraOffsetX, -cameraOffsetY, -cameraZoom + 100);
      
      // Large enough to cover the view
      sphere(10000); // Much larger to ensure full coverage
      
      // Add additional inner flash layers for more intensity
      push();
      fill(255, 255, 255, 200 * flashOpacity);
      sphere(5000);
      pop();
      
      // Add lens flare effect
      if (flashOpacity > 0.5) {
        for (let i = 0; i < 6; i++) {
          push();
          fill(255, 255, 255, 150 * flashOpacity);
          translate(
            random(-500, 500),
            random(-500, 500),
            random(-100, 100)
          );
          sphere(random(100, 300));
          pop();
        }
      }
      
      pop();
    }

    pop();
  }
} 

function drawPowerUps() {
  // Clear any remaining visual artifacts at the beginning of each frame
  // by drawing a clean overlay over the power-up lane
  push();
  translate(BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2, 0, -1); // Position just behind the power-up lane
  fill(...POWER_UP_LANE_COLOR);
  box(POWER_UP_LANE_WIDTH + 2, BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER, 8); // Slightly narrower than the lane
  pop();
  
  // Draw power-ups with proper depth testing
  for (let powerUp of powerUps) {
    // Distance-based Level of Detail
    let distToCamera = 0;
    if (squad.length > 0) {
      const mainMember = squad[0];
      const dx = powerUp.x - mainMember.x;
      const dy = powerUp.y - mainMember.y;
      distToCamera = dx*dx + dy*dy; // Squared distance
    }
    
    push();
    translate(powerUp.x, powerUp.y, powerUp.z + POWER_UP_SIZE / 2);
    
    // Rotate slowly to make power-ups look interesting
    let rotationAmount = powerUp.rotation || 0;
    rotationAmount += powerUp.rotationSpeed || 0.02;
    powerUp.rotation = rotationAmount; // Store updated rotation
    
    rotateX(rotationAmount);
    rotateY(rotationAmount * 0.7);
    
    // Add a slight hover effect
    const hoverOffset = sin(frameCount * 0.05 + (powerUp.pulsePhase || 0)) * 3;
    translate(0, 0, hoverOffset);

    // Different shapes for different power-up types - with simplified rendering for distant power-ups
    if (distToCamera > 800*800) {
      // Very distant power-ups - ultra simplified
      if (powerUp.type === "mirror") {
        fill(WEAPON_COLORS.mirror); 
        box(POWER_UP_SIZE);
      } else if (powerUp.type === "fire_rate" || powerUp.type === "damage" || powerUp.type === "aoe") {
        // Skill power-ups - use distinctive colors
        const color = powerUp.type === "fire_rate" ? [50, 255, 50] : 
                     powerUp.type === "damage" ? [255, 50, 50] : [50, 50, 255];
        fill(...color);
        sphere(POWER_UP_SIZE / 2);
      } else {
        // Weapon power-ups
        const powerUpColor = WEAPON_COLORS[powerUp.type] || [200, 200, 200];
        fill(...powerUpColor);
        cylinder(POWER_UP_SIZE / 2, POWER_UP_SIZE);
      }
    } else {
      // Fully detailed power-ups for nearby ones
      if (powerUp.type === "mirror") {
        // Mirror - white cube with sparkle effect
        fill(WEAPON_COLORS.mirror);
        box(POWER_UP_SIZE, POWER_UP_SIZE, POWER_UP_SIZE);
        
        // Add sparkle effect
        if (distToCamera < 500*500) {
          push();
          noStroke();
          fill(255, 255, 255, 150 + sin(frameCount * 0.1) * 50);
          for (let i = 0; i < 3; i++) {
            push();
            rotateX(frameCount * 0.1 + i * TWO_PI/3);
            rotateY(frameCount * 0.15 + i * TWO_PI/3);
            translate(0, 0, POWER_UP_SIZE/2 + 5);
            sphere(3);
            pop();
          }
          pop();
        }
      } else if (powerUp.type === "fire_rate") {
        // Fire rate boost - green sphere
        fill(50, 255, 50);
        
        // Add a pulsating effect
        const pulseScale = 1 + sin(frameCount * 0.1) * 0.1;
        sphere(POWER_UP_SIZE / 2 * pulseScale);
        
        // Add value text
        if (distToCamera < 400*400) {
          push();
          rotateX(-PI/4);
          fill(255);
          textSize(16);
          textAlign(CENTER, CENTER);
          text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
          pop();
        }
      } else if (powerUp.type === "damage") {
        // Damage boost - red cube
        fill(255, 50, 50);
        
        // Add a rotating effect
        box(POWER_UP_SIZE * (1 + sin(frameCount * 0.05) * 0.1));
        
        // Add value text
        if (distToCamera < 400*400) {
          push();
          rotateX(-PI/4);
          fill(255);
          textSize(16);
          textAlign(CENTER, CENTER);
          text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
          pop();
        }
      } else if (powerUp.type === "aoe") {
        // Area effect boost - blue pyramid
        fill(50, 50, 255);
        
        // Add a subtle rotation
        cone(POWER_UP_SIZE, POWER_UP_SIZE * 1.5);
        
        // Add value text
        if (distToCamera < 400*400) {
          push();
          rotateX(-PI/4);
          fill(255);
          textSize(16);
          textAlign(CENTER, CENTER);
          text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
          pop();
        }
      } else {
        // Weapon power-ups - use default color if type not found
        const powerUpColor = WEAPON_COLORS[powerUp.type] || [200, 200, 200];
        fill(...powerUpColor);
        
        // Add interesting shape with orbital effect
        cylinder(POWER_UP_SIZE / 2, POWER_UP_SIZE);
        
        // Add orbital particles
        if (distToCamera < 600*600 && powerUp.orbitals > 0) {
          push();
          noStroke();
          fill(...powerUpColor, 200);
          const orbitalCount = Math.min(3, powerUp.orbitals || 0);
          for (let i = 0; i < orbitalCount; i++) {
            push();
            const angle = frameCount * 0.05 + i * TWO_PI/orbitalCount;
            const orbitalRadius = POWER_UP_SIZE * 0.8;
            translate(cos(angle) * orbitalRadius, sin(angle) * orbitalRadius, 0);
            sphere(4);
            pop();
          }
          pop();
        }
      }
    }
    pop();
  }
}

// Helper function to move the squad in a specific direction
function moveSquad(deltaX, deltaY) {
  if (squad.length == 0) {
    return;
  }

  let mainMember = squad[0];
  mainMember.x += deltaX;
  mainMember.y += deltaY;

  // Apply constraints immediately to prevent going out of bounds
  const leftBound = -BRIDGE_WIDTH / 2;
  const rightBound = BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH;
  const topBound = (-BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2;
  const bottomBound = (BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2;

  mainMember.x = constrain(mainMember.x, leftBound, rightBound);
  mainMember.y = constrain(mainMember.y, topBound, bottomBound);
}

// Squad Movement and Controls
function updateSquad() {
  if (squad.length == 0) {
    return;
  }
  // Control main squad member (first in the array)

  let mainMember = squad[0];

  // Arrow key movement
  if (keyIsDown(LEFT_ARROW)) {
    moveSquad(-squadSpeed, 0);
  }
  if (keyIsDown(RIGHT_ARROW)) {
    moveSquad(squadSpeed, 0);
  }
  if (keyIsDown(UP_ARROW)) {
    moveSquad(0, -squadSpeed);
  }
  if (keyIsDown(DOWN_ARROW)) {
    moveSquad(0, squadSpeed);
  }

  // Bridge boundaries are now handled in the moveSquad function

  // Define boundary constraints for the squad
  const leftBound = -BRIDGE_WIDTH / 2;
  const rightBound = BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH;
  const topBound = (-BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2;
  const bottomBound = (BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2;

  // Formation - arrange other squad members around the leader
  if (squad.length > 0) {
    const spacing = SQUAD_SIZE * 1.3; // Spacing between members

    // Position all members in grid formation
    for (let i = 0; i < squad.length; i++) {
      // Calculate row and column for each member
      const row = Math.floor(i / MAX_SQUAD_MEMBERS_PER_ROW);
      const col = i % MAX_SQUAD_MEMBERS_PER_ROW;

      // For the leader, we don't change position (controlled by arrow keys)
      // For other members, we position them relative to the leader
      if (i === 0) {
        // The leader's position is already set by arrow key movement
        // Don't override it here or movement will break
      } else {
        // Calculate offset from leader's actual position
        const leaderX = mainMember.x;
        const leaderY = mainMember.y;

        // Position based on row and column but relative to leader's actual position
        squad[i].x = leaderX + col * spacing;
        squad[i].y = leaderY + row * spacing;

        // Constrain other members to stay on the bridge
        squad[i].x = constrain(squad[i].x, leftBound, rightBound);
        squad[i].y = constrain(squad[i].y, topBound, bottomBound);
      }
    }
  }

  // Auto-firing with machine gun skill check
  if (frameCount - lastFireTime > squadFireRate) {
    for (let member of squad) {
      fireWeapon(member);
      
      // If machine gun skill is active, create small muzzle flash effect
      if (skills.skill2.active) {
        createHitEffect(
          member.x, 
          member.y - 10, // Position in front of squad member
          member.z + member.size / 2,
          [255, 200, 0],
          member.size / 3 // Smaller effect size
        );
      }
    }
    lastFireTime = frameCount;
  }
  
  // Check if machine gun skill duration has ended
  if (skills.skill2.active && frameCount >= skills.skill2.endTime) {
    // Reset to normal fire rate
    squadFireRate = 30; // Normal fire rate
    skills.skill2.active = false;
  }
}

function fireWeapon(squadMember) {
  // Check if machine gun skill is active
  const isMachineGunActive = skills.skill2.active;
  
  // Use projectile from object pool if available (object reuse)
  let projectile;
  
  if (projectilePool.length > 0) {
    // Reuse a projectile from the pool
    projectile = projectilePool.pop();
    
    // Reset properties
    projectile.x = squadMember.x;
    projectile.y = squadMember.y;
    projectile.z = squadMember.z + squadMember.size / 2;
    projectile.weapon = currentWeapon;
    
    // Modify projectile properties if machine gun is active
    if (isMachineGunActive) {
      projectile.speed = PROJECTILE_SPEED * 1.3; // Faster bullets
      projectile.damage = getWeaponDamage(currentWeapon) * 0.6; // Less damage per bullet but fires much faster
      projectile.size = PROJECTILE_SIZE * 0.75; // Smaller bullets
      projectile.color = [255, 215, 0]; // Gold/yellow color for machine gun bullets
    } else {
      projectile.speed = PROJECTILE_SPEED;
      projectile.damage = getWeaponDamage(currentWeapon);
      projectile.size = PROJECTILE_SIZE;
      projectile.color = undefined; // Use default color
    }
  } else {
    // Create a new projectile if pool is empty
    projectile = {
      x: squadMember.x,
      y: squadMember.y,
      z: squadMember.z + squadMember.size / 2,
      weapon: currentWeapon,
      speed: PROJECTILE_SPEED,
      damage: getWeaponDamage(currentWeapon),
      size: PROJECTILE_SIZE,
    };
    
    // Modify projectile properties if machine gun is active
    if (isMachineGunActive) {
      projectile.speed = PROJECTILE_SPEED * 1.3; // Faster bullets
      projectile.damage = getWeaponDamage(currentWeapon) * 0.6; // Less damage per bullet but fires much faster
      projectile.size = PROJECTILE_SIZE * 0.75; // Smaller bullets
      projectile.color = [255, 215, 0]; // Gold/yellow color for machine gun bullets
    }
  }

  // Add slight randomization to machine gun fire direction
  if (isMachineGunActive) {
    // Add random spread to create a machine gun effect
    projectile.x += random(-10, 10);
    projectile.z += random(-5, 5);
  }

  projectiles.push(projectile);
  
  // If machine gun is active, create an additional projectile for spread effect (one burst = multiple bullets)
  if (isMachineGunActive && random() > 0.5) { // 50% chance for an extra bullet
    // Create a second projectile with slight offset
    let secondProjectile = { ...projectile };
    secondProjectile.x += random(-15, 15);
    secondProjectile.z += random(-10, 10);
    
    // Use slightly different properties
    secondProjectile.damage *= random(0.8, 1.2); // Random damage variation
    
    projectiles.push(secondProjectile);
  }
}

function getWeaponDamage(weapon) {
  let baseDamage = 0;
  switch (weapon) {
    case "blaster":
      baseDamage = 20;
      break; // Base damage
    case "thunderbolt":
      baseDamage = 45;
      break;
    case "inferno":
      baseDamage = 30;
      break; // Plus DoT effect
    case "frostbite":
      baseDamage = 30;
      break; // Plus CC effect
    case "vortex":
      baseDamage = 40;
      break; // AoE damage
    case "plasma":
      baseDamage = 60;
      break; // Spread damage
    case "photon":
      baseDamage = 80;
      break; // High precision
    default:
      baseDamage = 20;
  }

  // Apply damage boost from power-ups
  return baseDamage + damageBoost;
}

// Maximum number of projectiles to maintain performance
const MAX_PROJECTILES = 200;
let projectilePool = [];

function updateProjectiles() {
  // Move projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.y -= proj.speed; // Move upward (toward enemies)

    // Remove projectiles that go off-screen (adjusted for longer bridge)
    if (proj.y < (-BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2) {
      // Add to object pool for reuse instead of garbage collection
      if (projectilePool.length < 50) { // Limit pool size
        projectilePool.push(proj);
      }
      projectiles.splice(i, 1);
    }
  }
  
  // Limit total projectiles to avoid performance issues
  if (projectiles.length > MAX_PROJECTILES) {
    // Remove oldest projectiles when exceeding limit
    const excessCount = projectiles.length - MAX_PROJECTILES;
    projectiles.splice(0, excessCount);
  }
}

// Enemy spawning and movement
function spawnEnemies() {
  if (frameCount - lastEnemySpawn > ENEMY_SPAWN_RATE) {
    // Always spawn enemies (no chance check, continuous spawning)
    // Sometimes spawn rows of enemies
    const spawnRow = random() < 0.8;

    if (spawnRow) {
      // Spawn a row of enemies
      spawnEnemyRow();
    } else {
      // Spawn a single enemy
      spawnSingleEnemy();
    }

    lastEnemySpawn = frameCount;
  }
}

function spawnEnemyRow() {
  // Spawn a row of enemies across the main lane
  const spacing = BRIDGE_WIDTH / ENEMIES_PER_ROW;
  // const spacing = STANDARD_ENEMY_SIZE * 1.2;

  for (let i = 0; i < ENEMIES_PER_ROW; i++) {
    const x = -BRIDGE_WIDTH / 2 + spacing / 2 + i * spacing;

    enemies.push({
      x: x,
      y: (-BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2 + 100, // Near the top of extended bridge
      z: 0,
      size: STANDARD_ENEMY_SIZE,
      type: "standard", // Rows are always standard enemies
      health: 20, // Easier to defeat in rows
      speed: 3 * 1.2, // Fast moving rows
    });
  }
}

function spawnSingleEnemy() {
  const enemyTypes = ["standard", "standard", "standard", "elite"];
  // Add boss types in later waves
  if (currentWave >= 5 && currentWave % 5 === 0) {
    enemyTypes.push("boss1");
  }
  if (currentWave >= 10 && currentWave % 10 === 0) {
    enemyTypes.push("boss2");
  }
  if (currentWave >= 15 && currentWave % 15 === 0) {
    enemyTypes.push("boss3");
  }

  // Add more elite enemies as waves progress
  if (currentWave >= 3) {
    enemyTypes.push("elite");
  }

  const type = random(enemyTypes);

  // Determine size based on type
  let size = STANDARD_ENEMY_SIZE * 2;
  let health = 30;

  if (type === "elite") {
    size = ELITE_ENEMY_SIZE;
    health = 60;
  } else if (type === "boss1") {
    size = BOSS_SIZES[0];
    health = 150;
  } else if (type === "boss2") {
    size = BOSS_SIZES[1];
    health = 300;
  } else if (type === "boss3") {
    size = BOSS_SIZES[2];
    health = 500;
  }

  // Scale health with wave number for increasing difficulty but keep it easier
  health = Math.floor(health * (1 + currentWave * 0.05 * 10));

  // Enemies mostly spawn in the main lane, occasionally in power-up lane
  const spawnInPowerUpLane = random() < 0.1; // Less likely to spawn in power-up lane
  const x = spawnInPowerUpLane
    ? random(BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH)
    : random(-BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2);

  enemies.push({
    x: x,
    y: (-BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2 + 100, // Near the top of extended bridge
    z: 0,
    size: size,
    type: type,
    health: health,
    speed: type.includes("boss") ? 1.5 : 3, // Faster enemies for more action
  });
}

function updateEnemies() {
  // Find the closest squad member to use as a target
  let targetX = 0;
  let targetY = BRIDGE_LENGTH / 2 - 100;
  if (squad.length > 0) {
    // Find the average position of squad members as target
    let avgX = 0;
    let avgY = 0;
    for (let member of squad) {
      avgX += member.x;
      avgY += member.y;
    }
    targetX = avgX / squad.length;
    targetY = avgY / squad.length;
  }

  // Find the shield effect
  let shieldEffect = effects.find((effect) => effect.type === "shield");
  let shieldX = shieldEffect ? shieldEffect.x : targetX;
  let shieldY = shieldEffect ? shieldEffect.y : targetY;
  let shieldRadius = shieldEffect ? shieldEffect.size : 0; // Adjust size factor as needed

  for (let enemy of enemies) {
    // Check if enemy is close to the squad
    const distanceToSquadY = Math.abs(targetY - enemy.y);

    if (distanceToSquadY < ENEMY_FIGHT_DISTANCE_THRESHOLD) {
      // When close to squad, directly target the squad at consistent speed
      // Calculate vector to target
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Normalize and apply speed consistently (no acceleration)
      if (dist > 0) {
        enemy.x += (dx / dist) * enemy.speed * 2;
        enemy.y += (dy / dist) * enemy.speed * 2;
      }
    } else {
      // Regular downward movement when far from squad
      enemy.y += enemy.speed;

      // Only bosses have side-to-side movement when far away
      if (enemy.type.includes("boss")) {
        enemy.x += sin(frameCount * 0.05) * 1;
      }
    }

    // Check if enemy is within the shield radius
    const distanceToShield = Math.sqrt(
      Math.pow(enemy.x - shieldX, 2) + Math.pow(enemy.y - shieldY, 2)
    );

    if (distanceToShield < shieldRadius) {
      // Push enemy out of the shield
      const pushFactor = (shieldRadius - distanceToShield) / distanceToShield;
      enemy.x += (enemy.x - shieldX) * pushFactor;
      enemy.y += (enemy.y - shieldY) * pushFactor;
    }

    // Keep within bridge boundaries
    const leftBound = -BRIDGE_WIDTH / 2;
    const rightBound =
      BRIDGE_WIDTH / 2 +
      (enemy.type.includes("boss") ? POWER_UP_LANE_WIDTH : 0);
    enemy.x = constrain(enemy.x, leftBound, rightBound);
  }
}

// Power-up system
function spawnPowerUps() {
  // Regular power-ups on a timer
  if (frameCount - lastPowerUpSpawn > POWER_UP_SPAWN_RATE) {
    // Check if we're under the limit to avoid too many power-ups
    // if (powerUps.length < MAX_POWER_UPS) {
      // Determine power-up type based on probability
      const rand = random();
      let type = "mirror";
  
      if (rand < WEAPON_SPAWN_CHANCE) {
        // Weapon power-up
        type = random(WEAPON_TYPES);
      } else if (rand < SKILL_SPAWN_CHANCE) {
        // Skill power-up (fire_rate, damage, or aoe)
        type = random(SKILL_TYPES);
      }
  
      // Add value for skill power-ups
      let value = 1; // Default value
      if (type === "fire_rate") value = 3; // +3 fire rate
      if (type === "damage") value = 4; // +4 damage
      if (type === "aoe") value = 2; // +2 area effect
  
      // Calculate position in the center of power-up lane
      const x = BRIDGE_WIDTH / 2 + POWER_UP_LANE_WIDTH / 2; // Center of power-up lane
  
      // Start position at the far end of the bridge (where enemies spawn)
      let y = (-BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2 + 100; // Start at the very beginning of bridge
  
      // Use object from pool if available to reduce memory allocations
      powerUp = {
        x: x,
        y: y,
        z: 0,
        type: type,
        value: value,
        speed: POWER_UP_SPEED + random(-0.5, 1), // Slightly varied speeds
        size: type === "mirror" ? POWER_UP_SIZE * 1.2 : POWER_UP_SIZE, // Slightly larger for mirrors
        rotation: random(0, TWO_PI), // Random starting rotation
        rotationSpeed: type === "mirror" ? 0.03 : random(0.01, 0.05), // How fast it rotates
        stackLevel: 1, // Power-ups of same type can stack
        pulsePhase: random(0, TWO_PI), // For pulsing effect
        orbitals: type === "mirror" ? 3 : type.includes("weapon") ? 3 : 1, // Small orbiting particles
      };

      powerUps.push(powerUp);
    // }
    
    lastPowerUpSpawn = frameCount;
  }
}

function updatePowerUps() {
  // Move power-ups down the lane
  const bottomBound = (BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER) / 2 + POWER_UP_SIZE;
  
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];
    
    // Update rotation and animation states
    powerUp.rotation = (powerUp.rotation || 0) + (powerUp.rotationSpeed || 0.02);
    powerUp.pulsePhase = (powerUp.pulsePhase || 0) + 0.01;
    
    // Move down the lane at varying speeds
    powerUp.y += powerUp.speed;

    // Remove power-ups that go off-screen 
    if (powerUp.y > bottomBound) {
      powerUps.splice(i, 1);
    }
  }
}

// Collision detection - optimized with squared distance calculations
function checkCollisions() {
  // Projectile-Enemy Collisions
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];

    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      
      // Skip collision checks for distant objects (culling optimization)
      if (Math.abs(proj.y - enemy.y) > 100) continue;
      
      // Fast squared distance check (avoids expensive sqrt operation)
      const dx = proj.x - enemy.x;
      const dy = proj.y - enemy.y;
      const dz = proj.z - enemy.z;
      const squaredDist = dx*dx + dy*dy + dz*dz;
      const squaredThreshold = Math.pow(enemy.size/2 + PROJECTILE_SIZE, 2);
      
      if (squaredDist < squaredThreshold) {
        // Apply damage
        enemy.health -= proj.damage;

        // Add hit effect
        createHitEffect(proj.x, proj.y, proj.z, WEAPON_COLORS[proj.weapon]);

        // Apply special effects based on weapon
        if (proj.weapon === "inferno") {
          // DoT effect - additional damage over time
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.burning = { duration: 180, damage: 2 };
          // Fire effect
          createFireEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "frostbite") {
          // CC effect - slow movement
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.frozen = { duration: 120, slowFactor: 0.5 };
          enemy.speed *= 0.5;
          // Ice effect
          createIceEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "thunderbolt") {
          // Thunder effect
          createThunderEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "vortex") {
          // Vortex effect optimized to avoid nested loop
          createVortexEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === "plasma") {
          // Plasma shotgun spread effect
          createPlasmaEffect(enemy.x, enemy.y, enemy.z);
        }

        // Remove the projectile
        projectiles.splice(i, 1);

        // Check if enemy is defeated
        if (enemy.health <= 0) {
          // Add score based on enemy type
          if (enemy.type === "standard") score += 10;
          else if (enemy.type === "elite") score += 25;
          else if (enemy.type === "boss1") score += 100;
          else if (enemy.type === "boss2") score += 250;
          else if (enemy.type === "boss3") score += 500;

          // Increment enemies killed counter
          waveEnemiesKilled++;
          totalEnemiesKilled++;

          // Create explosion effect
          createExplosion(enemy.x, enemy.y, enemy.z, ENEMY_COLORS[enemy.type]);

          enemies.splice(j, 1);
        }

        break; // Projectile hit something, move to next projectile
      }
    }
  }

  // Squad-PowerUp Collisions - using squared distance
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];

    for (let squadMember of squad) {
      // Skip collision checks for distant power-ups (culling optimization)
      if (Math.abs(powerUp.y - squadMember.y) > 100) continue;
      
      // Fast squared distance calculation
      const dx = powerUp.x - squadMember.x;
      const dy = powerUp.y - squadMember.y;
      const dz = powerUp.z - squadMember.z;
      const squaredDist = dx*dx + dy*dy + dz*dz;
      const squaredThreshold = Math.pow(squadMember.size/2 + POWER_UP_SIZE/2, 2);
      
      if (squaredDist < squaredThreshold) {
        // Apply power-up effect
        if (powerUp.type === "mirror") {
          // Add a new squad member
          if (squad.length < MAX_SQUAD_SIZE) {
            // Configurable max squad size
            // Calculate position for new squad member
            // Arrange in horizontal rows first (up to MAX_SQUAD_MEMBERS_PER_ROW per row)
            // then stack vertically
            const squadRow = Math.floor(
              squad.length / MAX_SQUAD_MEMBERS_PER_ROW
            );
            const squadCol = squad.length % MAX_SQUAD_MEMBERS_PER_ROW;

            // Space to use is 2/3 of bridge width
            const usableWidth = (BRIDGE_WIDTH * 2) / 3;
            const spacing = usableWidth / MAX_SQUAD_MEMBERS_PER_ROW;

            // Calculate position (centered within usable width)
            const startX = -usableWidth / 2 + spacing / 2;
            const newX = startX + squadCol * spacing;
            const newY = BRIDGE_LENGTH / 2 - 100 - squadRow * SQUAD_SIZE * 1.2; // Slight spacing between rows

            squad.push({
              x: newX,
              y: newY,
              z: 0,
              size: SQUAD_SIZE,
              health: SQUAD_HEALTH, // Use configurable health
              weapon: currentWeapon,
              id: Date.now() + squad.length, // Unique ID for reference
            });
          }
        } else if (powerUp.type === "fire_rate") {
          // Accumulate fire rate boost
          fireRateBoost += powerUp.value;
          // Create a visual effect
          createEffect(
            "boost",
            squadMember.x,
            squadMember.y,
            squadMember.z,
            [50, 255, 50]
          );
          // Update score
          score += 100;
        } else if (powerUp.type === "damage") {
          // Accumulate damage boost
          damageBoost += powerUp.value;
          // Create a visual effect
          createEffect(
            "boost",
            squadMember.x,
            squadMember.y,
            squadMember.z,
            [255, 50, 50]
          );
          // Update score
          score += 100;
        } else if (powerUp.type === "aoe") {
          // Accumulate area of effect boost
          aoeBoost += powerUp.value;
          // Create a visual effect
          createEffect(
            "boost",
            squadMember.x,
            squadMember.y,
            squadMember.z,
            [50, 50, 255]
          );
          // Update score
          score += 100;
        } else {
          // Unlock weapon
          weapons[powerUp.type] = true;
          // Equip the new weapon
          currentWeapon = powerUp.type;
          for (let member of squad) {
            member.weapon = currentWeapon;
          }
        }

        // Remove the power-up
        powerUps.splice(i, 1);
        break;
      }
    }
  }

  // Enemy-Squad Collisions - using squared distance
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];

    for (let j = squad.length - 1; j >= 0; j--) {
      let member = squad[j];
      
      // Skip collision checks for distant objects (culling optimization)
      if (Math.abs(enemy.y - member.y) > 100) continue;
      
      // Fast squared distance calculation
      const dx = enemy.x - member.x;
      const dy = enemy.y - member.y;
      const dz = enemy.z - member.z;
      const squaredDist = dx*dx + dy*dy + dz*dz;
      const squaredThreshold = Math.pow(enemy.size/2 + member.size/2, 2);
      
      if (squaredDist < squaredThreshold) {
        // Squad member takes damage
        member.health -= 20;

        if (member.health <= 0) {
          // Squad member is defeated
          squad.splice(j, 1);

          // Game over if all squad members are defeated
          if (squad.length === 0) {
            gameState = "gameOver";
          }
        }

        // Enemy also takes damage in collision
        enemy.health -= 30;
        if (enemy.health <= 0) {
          enemies.splice(i, 1);
        }

        break;
      }
    }
  }
}

// Game progression
function checkWaveCompletion() {
  // Wave is complete when enough enemies are defeated or all enemies are defeated after minimum time
  // Track number of enemies killed in the wave
  const waveTime = DEBUG_MODE ? 10 * 60 : 60 * 60; // 10 seconds in debug mode, 60 seconds normally
  const timeInWave = frameCount - gameStartTime;

  // Require all enemies to be gone AND minimum time to pass
  if (
    waveEnemiesKilled >= ENEMIES_TO_KILL_FOR_NEXT_WAVE ||
    (enemies.length === 0 && timeInWave > waveTime)
  ) {
    // Reset the enemies killed counter for next wave
    waveEnemiesKilled = 0;
    currentWave++;
    gameStartTime = frameCount;

    // Spawn some power-ups as rewards
    // TODO
  }
}

// Atomic bomb constants for consistent timing
const ATOMIC_BOMB_FALL_DURATION = 150; // 2.5 seconds at 60fps
const ATOMIC_BOMB_FALL_DURATION_MS = ATOMIC_BOMB_FALL_DURATION * (1000 / 60); // in milliseconds

// Skill system
function activateSkill(skillNumber) {
  // Handle both string and number formats
  let skillKey;
  if (typeof skillNumber === "string" && skillNumber.startsWith("skill")) {
    skillKey = skillNumber;
    skillNumber = parseInt(skillNumber.replace("skill", ""));
  } else {
    skillKey = `skill${skillNumber}`;
  }

  // In debug mode, ignore cooldowns; in normal mode, check cooldowns
  if (
    !DEBUG_MODE &&
    frameCount - skills[skillKey].lastUsed < skills[skillKey].cooldown
  ) {
    // Skill on cooldown (only in non-debug mode)
    return;
  }

  // Apply skill effect with accumulative power-ups
  switch (skillNumber) {
    case 1: // Area damage - damages all enemies in view
      // TODO: better skill effect as area damage
      // For now, help to next weapon for testing
      currentWeapon = getNextItem(
        WEAPON_TYPES,
        WEAPON_TYPES.indexOf(currentWeapon)
      );
      for (let member of squad) {
        member.weapon = currentWeapon;
      }
      break;

    case 2: // Machine Gun - fire much faster for 5 seconds for each squad member
      // Store the normal fire rate to restore later
      let normalFireRate = squadFireRate;
      
      // Activate machine gun mode
      skills.skill2.active = true;
      skills.skill2.endTime = frameCount + skills.skill2.activeDuration;
      
      // Set the much faster fire rate (machine gun speed)
      squadFireRate = 5; // Fire every 5 frames instead of 30 (6x faster)
      
      // Visual effect for all squad members
      for (let member of squad) {
        createHitEffect(member.x, member.y, member.z, [255, 255, 0]);
        
        // Create persistent effect around each squad member to show machine gun mode
        effects.push({
          x: member.x,
          y: member.y,
          z: member.z,
          type: "machineGun",
          size: member.size * 1.2,
          life: skills.skill2.activeDuration,
          member: member, // reference to follow the member
          color: [255, 255, 0], // Yellow for machine gun mode
        });
      }
      
      // Schedule deactivation after duration
      setTimeout(() => {
        // Only restore fire rate if machine gun mode is still active
        // (prevents conflicts with other skills that might have changed fire rate)
        if (skills.skill2.active) {
          squadFireRate = normalFireRate;
          skills.skill2.active = false;
        }
      }, skills.skill2.activeDuration * (1000 / 60)); // Convert frames to ms
      break;

    case 3: // Shield - temporary invulnerability with enhanced durability
      let shieldStrength = 100 + damageBoost * 10; // Shield strength enhanced by damage boost
      let shieldDuration = 300 + fireRateBoost * 30; // Duration enhanced by fire rate (5s + boost)

      for (let member of [squad[0]]) {
        member.shielded = true;
        member.shieldHealth = shieldStrength;

        // Visual shield effect
        effects.push({
          x: member.x,
          y: member.y,
          z: member.z,
          type: "shield",
          size: member.size * (1.5 + aoeBoost * 0.1) * 5, // Shield size enhanced by AOE
          life: shieldDuration * 5,
          member: member, // reference to follow the member
        });
      }

      // Remove shields after duration
      setTimeout(() => {
        for (let member of squad) {
          member.shielded = false;
          member.shieldHealth = 0;
        }
      }, shieldDuration * (1000 / 60)); // Convert frames to ms
      break;

    case 4: // Freeze all enemies with enhanced duration/effect
      let freezeDuration = 180 + fireRateBoost * 15; // Base 3s + 0.25s per fire rate boost
      let freezeStrength = 0.2 - aoeBoost * 0.02; // More slowdown with AOE boost

      for (let enemy of enemies) {
        if (!enemy.effects) enemy.effects = {};
        enemy.effects.frozen = {
          duration: freezeDuration,
          slowFactor: max(0.05, freezeStrength), // Min 5% of normal speed
        };
        enemy.speed *= enemy.effects.frozen.slowFactor;
        createIceEffect(enemy.x, enemy.y, enemy.z);
      }
      break;

    case 5: // Heal all squad members with enhanced healing
      let healAmount = 50 + damageBoost * 5; // Base 50 + 5 per damage boost

      for (let member of squad) {
        member.health = min(SQUAD_HEALTH, member.health + healAmount); // Use configurable SQUAD_HEALTH instead of hardcoded 100
        createHitEffect(member.x, member.y, member.z, [0, 255, 0]);
      }
      break;

    case 6: // Damage boost for 10 seconds with enhanced effect
      let damageBoostBase = 2; // Double damage
      let damageBoostAdditional = 0.2 * damageBoost; // 20% more per damage boost
      let damageBoostTotalMultiplier = damageBoostBase + damageBoostAdditional;
      let damageBoostDuration = DEBUG_MODE ? 1800 : 600 + fireRateBoost * 60; // 30s in debug mode, 10s + 1s per fire rate in normal mode

      // Store original damage multiplier
      let originalDamageMultiplier = {};
      for (let member of squad) {
        originalDamageMultiplier[member.id] = member.damageBoost || 1;
        member.damageBoost = damageBoostTotalMultiplier;
        createHitEffect(member.x, member.y, member.z, [255, 0, 0]);
      }

      // Reset after duration
      setTimeout(() => {
        for (let member of squad) {
          if (member && originalDamageMultiplier[member.id]) {
            member.damageBoost = originalDamageMultiplier[member.id];
          } else if (member) {
            member.damageBoost = 1;
          }
        }
      }, damageBoostDuration * (1000 / 60)); // Convert frames to ms
      break;

    case 7: // Speed boost for squad with enhanced effect
      let baseSpeedBoost = 1.5; // 50% faster
      let additionalSpeedBoost = 0.1 * fireRateBoost; // 10% more per fire rate boost
      let totalSpeedMultiplier = baseSpeedBoost + additionalSpeedBoost;
      let speedBoostDuration = 480 + fireRateBoost * 30; // 8s + 0.5s per fire rate

      let oldSpeed = squadSpeed;
      squadSpeed *= totalSpeedMultiplier;

      // Visual effect
      for (let member of squad) {
        createHitEffect(member.x, member.y, member.z, [0, 255, 255]);
      }

      // Reset after duration
      setTimeout(() => {
        squadSpeed = oldSpeed;
      }, speedBoostDuration * (1000 / 60)); // Convert frames to ms
      break;

    case 8: // Atomic Bomb - devastating explosion that obliterates enemies
      // Get bomb drop point - farther ahead of the player for better visibility
      let bombCenter = { x: 0, y: 0, z: 0 };
      if (squad.length > 0) {
        bombCenter = { 
          x: squad[0].x, 
          y: squad[0].y - 900, // Drop much farther ahead of the squad
          z: squad[0].z 
        };
      }
      
      // Create initial bomb drop effect (small object falling from sky)
      const bombObj = {
        x: bombCenter.x,
        y: bombCenter.y,
        z: 800, // Start higher in the sky for more dramatic effect
        type: "atomicBomb",
        size: 30, // Slightly larger bomb
        life: ATOMIC_BOMB_FALL_DURATION, // Use consistent duration constant
        endPos: {...bombCenter, z: bombCenter.z}, // Where it will land
        trail: [], // Store trail points
        fallStartTime: frameCount, // When bomb started falling
        forceRenderDetail: true // Force detailed rendering regardless of distance
      };
      
      effects.push(bombObj);
      
      // Create atomic explosion after delay (when bomb hits ground)
      setTimeout(() => {
        // Enhanced damage based on accumulated damage boost - extremely powerful
        let atomicDamage = 2000 + damageBoost * 100; // Devastating damage that ensures total destruction
        
        // Create massive atomic explosion
        for (let i = 0; i < 5; i++) { // Multiple explosion layers
          setTimeout(() => {
            // Create expanding shockwave effect - enormous explosion sizes
            const explosionSize = 400 + i * 200; // Truly massive explosion visuals
            const explosionColors = [
              [255, 255, 220], // bright flash
              [255, 200, 50],  // orange fire
              [150, 75, 0],    // brown/orange
              [50, 50, 50],    // dark smoke
              [200, 200, 200]  // light smoke
            ];
            
            // Create expanding explosion at bomb position
            effects.push({
              x: bombCenter.x,
              y: bombCenter.y,
              z: bombCenter.z,
              type: "atomicExplosion",
              size: explosionSize,
              life: 120 - i * 10, // Longer life for first explosion layers
              color: explosionColors[i],
              layer: i,
              forceRenderDetail: true // Always render at full detail regardless of distance
            });
            
            // Add bright flash during initial explosion
            if (i === 0) {
              // Create blinding white flash effect covering the screen temporarily
              effects.push({
                x: bombCenter.x,
                y: bombCenter.y,
                z: bombCenter.z,
                type: "atomicFlash",
                size: 5000, // Massive flash size
                life: 40, // Longer flash duration
                color: [255, 255, 255],
                forceRenderDetail: true // Always render at full detail regardless of distance
              });
              
              // Add secondary radiation flash
              setTimeout(() => {
                effects.push({
                  x: bombCenter.x,
                  y: bombCenter.y,
                  z: bombCenter.z,
                  type: "atomicFlash",
                  size: 3000,
                  life: 30,
                  color: [255, 255, 200], // Slightly yellow tint
                  forceRenderDetail: true // Always render at full detail regardless of distance
                });
              }, 300);
            }
            
            // Apply damage to enemies with distance falloff
            for (let enemy of enemies) {
              // Calculate distance from explosion center
              const dx = enemy.x - bombCenter.x;
              const dy = enemy.y - bombCenter.y;
              const dz = enemy.z - bombCenter.z;
              const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
              
              // Apply damage with more gradual distance falloff for wider effect
              // Enormous blast radius of 5000 units (covers entire bridge from any position)
              const damageMultiplier = Math.max(0.7, 1 - (distance / 5000)); // Minimum 70% damage even at extreme range
              const damage = atomicDamage * damageMultiplier;
              
              // Apply damage to enemy
              enemy.health -= damage;
              
              // Create explosion effects at all enemy positions for dramatic effect
              if (i === 0) {
                createExplosion(enemy.x, enemy.y, enemy.z, [255, 200, 50]);
                
                // Create additional effects for distant enemies to show shockwave reaching them
                if (distance > 500) {
                  setTimeout(() => {
                    createExplosion(enemy.x, enemy.y, enemy.z, [255, 150, 50]);
                  }, distance * 0.1); // Delayed explosions based on distance
                }
              }
            }
          }, i * 200); // Stagger explosion layers
        }
      }, ATOMIC_BOMB_FALL_DURATION_MS); // Delay matches the bomb fall duration
      
      break;
  }

  // Set cooldown
  skills[skillKey].lastUsed = frameCount;
}

function getNextItem(list, currentIndex) {
  // Ensure the list is not empty
  if (list.length === 0) {
    throw new Error("The list is empty.");
  }

  // Calculate the next index using modulo to loop back to the start
  const nextIndex = (currentIndex + 1) % list.length;

  // Return the item at the next index
  return list[nextIndex];
}

function drawMenu() {
  gameState == "menu" ? menuContainer.show() : menuContainer.hide();
}

function drawPauseContainer() {
  gameState == "playing" ? pauseContainer.show() : pauseContainer.hide();
}

function pauseGame() {
  gameState = "paused";
}

// Draw resume button in top right corner
function drawResumeContainer() {
  gameState == "paused" ? resumeContainer.show() : resumeContainer.hide();
}

function resumeGame() {
  gameState = "playing";
}

function drawGameOverContainer() {
  // Set the HTML content of the game over screen
  gameState == "gameOver" ? gameOverContainer.show() : gameOverContainer.hide();
}

// Create DOM elements for HUD - optimized with update frequency control
let lastStatusUpdateTime = 0;
const STATUS_UPDATE_INTERVAL = 5; // Update every 5 frames instead of every frame

function createStatusBoardElements() {
  // Create status board element
  statusBoard = createDiv("");
  statusBoard.id("status-board");
  statusBoard.position(10, 10);
  statusBoard.style("color", "white");
  statusBoard.style("padding", "10px");
  statusBoard.style("border-radius", "5px");
  statusBoard.style("width", "250px");
  statusBoard.style("font-family", "monospace");
  statusBoard.style("z-index", "1000");
  statusBoard.style("use-select", "none");
}

function updateStatusBoard() {
  // Only update DOM elements every few frames for better performance
  if (frameCount - lastStatusUpdateTime < STATUS_UPDATE_INTERVAL) {
    return;
  }
  
  lastStatusUpdateTime = frameCount;
  
  // Calculate average health
  const avgHealth =
    squad.length > 0
      ? squad.reduce((sum, member) => sum + member.health, 0) / squad.length
      : 0;
  const healthColor =
    avgHealth > 50 ? "lime" : avgHealth > 25 ? "yellow" : "red";

  // Update status board with HTML content
  statusBoard.html(`
    <h3 style="margin: 0 0 10px 0;">STATUS BOARD</h3>
    <div>Wave: ${currentWave}</div>
    <div>Score: ${score}</div>
    <div>Weapon: ${currentWeapon}</div>
    <div>Squad: ${squad.length}/${MAX_SQUAD_SIZE}</div>
    <div>Total Kills: ${totalEnemiesKilled}</div>
    <div>Wave Kills: ${waveEnemiesKilled}/${ENEMIES_TO_KILL_FOR_NEXT_WAVE}</div>
    <div style="color: ${healthColor};">Health: ${Math.floor(avgHealth)}%</div>
  `);
}

let lastTechUpdateTime = 0;
const TECH_UPDATE_INTERVAL = 15; // Update tech stats less frequently (every 15 frames)

function createTechnicalBoardElements() {
  // Create technical board element
  techBoard = createDiv("");
  techBoard.id("tech-board");
  techBoard.position(windowWidth - 270, 10);
  techBoard.style("color", "white");
  techBoard.style("padding", "10px");
  techBoard.style("border-radius", "5px");
  techBoard.style("width", "250px");
  techBoard.style("font-family", "monospace");
  techBoard.style("z-index", "1000");
  techBoard.style("text-align", "right");
  techBoard.style("use-select", "none");
}

// FPS smoothing for more stable display
let fpsHistory = [];
const FPS_HISTORY_LENGTH = 10;

// Track actual memory usage over time
let memoryUsageSamples = [];
const MAX_MEMORY_SAMPLES = 5;
let peakMemoryUsage = 0;

function updateTechnicalBoard() {
  // Only update DOM elements every few frames for better performance
  if (frameCount - lastTechUpdateTime < TECH_UPDATE_INTERVAL) {
    return;
  }
  
  lastTechUpdateTime = frameCount;
  
  // Record current FPS for averaging
  fpsHistory.push(frameRate());
  if (fpsHistory.length > FPS_HISTORY_LENGTH) {
    fpsHistory.shift(); // Remove oldest value
  }
  
  // Calculate average FPS for smoother display
  const avgFPS = fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;
  
  // Calculate time elapsed
  const elapsedSeconds = Math.floor((millis() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  // Calculate total objects (game complexity metric)
  const objectCount =
    squad.length + enemies.length + projectiles.length + powerUps.length + effects.length;
  
  // Memory usage tracking - attempt to get actual heap size if available
  let memoryUsage = 0;
  
  // Try to get accurate memory usage if performance.memory is available
  if (window.performance && window.performance.memory) {
    memoryUsage = window.performance.memory.usedJSHeapSize / (1024 * 1024);
    memoryUsageSamples.push(memoryUsage);
    
    // Keep a rolling window of samples
    if (memoryUsageSamples.length > MAX_MEMORY_SAMPLES) {
      memoryUsageSamples.shift();
    }
    
    // Track peak memory
    if (memoryUsage > peakMemoryUsage) {
      peakMemoryUsage = memoryUsage;
    }
  } else {
    // Fallback to estimation
    memoryUsage = (objectCount * 0.5).toFixed(1);
  }
  
  // Calculate average memory usage for smoother display
  const avgMemory = memoryUsageSamples.length > 0 
    ? memoryUsageSamples.reduce((sum, mem) => sum + mem, 0) / memoryUsageSamples.length 
    : memoryUsage;
  
  // Memory usage warning
  const memoryColor = avgMemory > 500 ? "red" : avgMemory > 200 ? "yellow" : "white";
  
  // Add debug mode indicator if needed
  const debugModeText = DEBUG_MODE
    ? '<div style="color: cyan;">⚡ DEBUG MODE ACTIVE</div>'
    : "";

  // Update technical board with HTML content
  techBoard.html(`
    <h3 style="margin: 0 0 10px 0;">TECHNICAL BOARD</h3>
    ${debugModeText}
    <div>FPS: ${Math.floor(avgFPS)}</div>
    <div>Objects: ${objectCount}</div>
    <div style="color: ${memoryColor};">Memory: ~${avgMemory.toFixed(1)} MB</div>
    <div>Peak Mem: ${peakMemoryUsage.toFixed(1)} MB</div>
    <div>Time: ${minutes}m ${seconds}s</div>
    <div>Camera: x=${Math.floor(cameraOffsetX)}, y=${Math.floor(
    cameraOffsetY
  )}, z=${Math.floor(cameraZoom)}</div>
  `);
  
  // Force garbage collection attempt (not guaranteed to work, but might help signal)
  if (frameCount % 600 === 0) { // Every 10 seconds
    if (window.gc) {
      try {
        window.gc();
      } catch (e) {
        // Ignore if gc is not available
      }
    }
  }
}

function createMenuElement() {
  // Create menu container element
  menuContainer = createDiv("");
  menuContainer.id("menu-container");
  menuContainer.position(width / 2 - 175, height / 2 - 180); // Center the menu, slightly larger
  menuContainer.style("background-color", "rgba(0, 0, 0, 0.7)");
  menuContainer.style("color", "white");
  menuContainer.style("padding", "20px");
  menuContainer.style("border-radius", "10px");
  menuContainer.style("width", "350px");
  menuContainer.style("font-family", "monospace");
  menuContainer.style("text-align", "center");
  menuContainer.style("z-index", "1000");
  menuContainer.style("cursor", "pointer"); // Add pointer cursor

  // Add a start button for touch devices
  const startButtonDiv = createDiv("TAP TO START");
  startButtonDiv.style("background-color", "rgba(0, 200, 0, 0.7)");
  startButtonDiv.style("color", "white");
  startButtonDiv.style("font-size", "24px");
  startButtonDiv.style("padding", "15px");
  startButtonDiv.style("margin", "10px auto 20px auto");
  startButtonDiv.style("border-radius", "10px");
  startButtonDiv.style("width", "80%");
  startButtonDiv.style("text-align", "center");
  startButtonDiv.style("cursor", "pointer");
  startButtonDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  startButtonDiv.style("user-select", "none");
  startButtonDiv.style("-webkit-tap-highlight-color", "transparent");

  // Add event handlers to start the game
  startButtonDiv.mousePressed(startGame);
  startButtonDiv.touchStarted(startGame);

  menuContainer.html(`
    <h2 style="margin: 0 0 20px 0;">SQUAD SURVIVAL</h2>
    <p style="font-size: 24px; margin: 0 0 20px 0;">Press ENTER or Tap Below</p>
  `);

  // Add the start button to the menu
  menuContainer.child(startButtonDiv);

  // Add the rest of the menu content
  const controlsDiv = createDiv(`
    <h3 style="margin: 10px 0; color: #aaffaa;">KEYBOARD CONTROLS</h3>
    <p style="font-size: 16px; margin: 0 0 5px 0;">Arrow Keys: Move Squad</p>
    <p style="font-size: 16px; margin: 0 0 5px 0;">A/S/D/F/Q/W/E/R: Activate Skills</p>
    <p style="font-size: 16px; margin: 0 0 15px 0;">Mouse Scroll: Zoom / Mouse Drag: Move Camera</p>

    <h3 style="margin: 10px 0; color: #aaffaa;">TOUCH CONTROLS</h3>
    <p style="font-size: 16px; margin: 0 0 5px 0;"><strong>D-Pad: Move Squad</strong></p>
    <p style="font-size: 16px; margin: 0 0 5px 0;"><strong>Touch Skills: Activate Skills</strong></p>
    <p style="font-size: 16px; margin: 0 0 5px 0;">Pinch: Zoom / Drag: Move Camera</p>
  `);

  menuContainer.child(controlsDiv);

  // Add click/touch event to the entire menu to start the game
  menuContainer.mousePressed(startGame);
  menuContainer.touchStarted(startGame);
}

// Function to start the game
function startGame() {
  if (gameState === "menu" || gameState === "gameOver") {
    // Reset game state
    gameState = "playing";
    currentWave = 1;
    score = 0;
    gameStartTime = frameCount;
    startTime = millis();
    totalEnemiesKilled = 0;
    waveEnemiesKilled = 0;

    // Reset squad
    squad = [];
    squad.push(squadLeader);

    // Reset enemies
    enemies = [];

    // Reset projectiles
    projectiles = [];

    // Reset effects
    effects = [];

    // Reset power-ups
    powerUps = [];

    // Reset weapons
    weapons = {
      thunderbolt: true,
      blaster: false,
      inferno: false,
      frostbite: false,
      vortex: false,
      plasma: false,
      photon: false,
    };

    // Reset current weapon
    currentWeapon = WEAPON_TYPES[0];

    // Reset skill upgrades
    fireRateBoost = DEBUG_MODE ? 10 : 0;
    damageBoost = DEBUG_MODE ? 10 : 0;
    aoeBoost = DEBUG_MODE ? 10 : 0;

    // Reset skills cooldowns
    for (let skillName in skills) {
      skills[skillName].lastUsed = 0;
      if (skills[skillName].active) {
        skills[skillName].active = false;
      }
    }

    // Reset camera
    cameraOffsetX = CAMERA_OFFSET_X;
    cameraOffsetY = CAMERA_OFFSET_Y;
    cameraZoom = CAMERA_OFFSET_Z;

    // Hide menu
    menuContainer.style("display", "none");

    // Hide game over screen
    gameOverContainer.style("display", "none");

    // Show controls container with skill bar and D-pad
    if (controlsContainer) {
      controlsContainer.style("display", "flex");
      controlsContainer.style("visibility", "visible");
      controlsContainer.style("opacity", "1");
      controlsContainer.position(0, height - 250); // Ensure correct position
      // controlsContainer.style("max-width", "1200px");
      controlsContainer.style("margin", "0 auto");

      // Make sure D-pad is visible
      if (dPad) {
        dPad.style("visibility", "visible");
        dPad.style("display", "block");
        dPad.style("opacity", "1");
      }

      // Reset all direction states
      activeDirections.up = false;
      activeDirections.down = false;
      activeDirections.left = false;
      activeDirections.right = false;

      // Log to console for debugging
      console.log("Game started, controls container should be visible");
      console.log("D-pad element:", dPad);
      console.log("Skill bar element:", skillBar);
    }

    // Reset memory warning
    memoryWarningShown = false;
    if (memoryWarningOverlay) {
      memoryWarningOverlay.style("display", "none");
    }

    return false; // Prevent default behavior
  }
}

function createPauseElement() {
  pauseContainer = createDiv("");
  pauseContainer.id("pause-screen");
  pauseContainer.position(width - 60, 10); // Position in the top right corner
  pauseContainer.style("background-color", "rgba(50, 50, 50, 0.8)");
  pauseContainer.style("border-radius", "5px");
  pauseContainer.style("padding", "1rem");
  pauseContainer.style("cursor", "pointer");
  pauseContainer.style("z-index", "1000");
  pauseContainer.html(`
    <div style="display: flex; gap: 6px; align-items: center; justify-content: center">
      <div style="background-color: white; width: 7px; height: 30px;"></div>
      <div style="background-color: white; width: 7px; height: 30px;"></div>
    </div>
  `);
  pauseContainer.mousePressed(pauseGame);
}

function createResumeElement() {
  // Create resume button element
  resumeContainer = createDiv("");
  resumeContainer.id("resume-button");
  resumeContainer.position(width - 60, 10); // Position in the top right corner
  resumeContainer.style("background-color", "rgba(50, 50, 50, 0.8)");
  resumeContainer.style("border-radius", "5px");
  resumeContainer.style("padding", "1rem");
  resumeContainer.style("cursor", "pointer");
  resumeContainer.style("z-index", "1000");
  resumeContainer.html(`
    <div style="width: 0; height: 0; border-left: 20px solid white; border-top: 15px solid transparent; border-bottom: 15px solid transparent;"></div>
  `);
  resumeContainer.mousePressed(resumeGame);
}

function createGameOverElement() {
  // Create game over screen element
  gameOverContainer = createDiv("");
  gameOverContainer.id("game-over-screen");
  gameOverContainer.position(width / 2 - 150, height / 2 - 100); // Center the screen
  gameOverContainer.style("background-color", "rgba(0, 0, 0, 0.8)");
  gameOverContainer.style("color", "white");
  gameOverContainer.style("padding", "20px");
  gameOverContainer.style("border-radius", "10px");
  gameOverContainer.style("width", "300px");
  gameOverContainer.style("text-align", "center");
  gameOverContainer.style("font-family", "monospace");
  gameOverContainer.style("z-index", "1000");
  gameOverContainer.style("cursor", "pointer"); // Add pointer cursor

  // Create HTML content
  gameOverContainer.html(`
    <h2 style="color: red; margin: 0;">GAME OVER</h2>
    <div style="margin-top: 20px;">Wave Reached: <span id="wave-reached">0</span></div>
    <div>Final Score: <span id="final-score">0</span></div>
  `);

  // Add a restart button for touch devices
  const restartButtonDiv = createDiv("TAP TO RESTART");
  restartButtonDiv.style("background-color", "rgba(200, 0, 0, 0.7)");
  restartButtonDiv.style("color", "white");
  restartButtonDiv.style("font-size", "20px");
  restartButtonDiv.style("padding", "15px");
  restartButtonDiv.style("margin", "20px auto 10px auto");
  restartButtonDiv.style("border-radius", "10px");
  restartButtonDiv.style("width", "80%");
  restartButtonDiv.style("text-align", "center");
  restartButtonDiv.style("cursor", "pointer");
  restartButtonDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  restartButtonDiv.style("user-select", "none");
  restartButtonDiv.style("-webkit-tap-highlight-color", "transparent");

  // Add event handlers to restart the game
  restartButtonDiv.mousePressed(startGame);
  restartButtonDiv.touchStarted(startGame);

  // Add the restart button to the game over screen
  gameOverContainer.child(restartButtonDiv);

  // Add click/touch event to the entire game over screen to restart the game
  gameOverContainer.mousePressed(startGame);
  gameOverContainer.touchStarted(startGame);
}

function createSkillBarElement() {
  // Create skill bar container
  skillBar = createDiv("");
  skillBar.id("skill-bar");
  skillBar.style("background-color", "rgba(50, 50, 50, 0.8)");
  skillBar.style("color", "white");
  skillBar.style("padding", "10px");
  skillBar.style("border-radius", "5px");
  skillBar.style("flex", "0 0 auto"); // Don't grow, don't shrink, auto basis
  skillBar.style("width", "280px"); // Fixed width for the skill bar
  skillBar.style("height", "220px"); // Match height with d-pad
  skillBar.style("display", "flex");
  skillBar.style("flex-direction", "column"); // Stack rows vertically
  skillBar.style("justify-content", "center"); // Center vertically
  skillBar.style("font-family", "monospace");
  skillBar.style("box-sizing", "border-box");
  skillBar.style("margin-left", "10px"); // Add margin on left side
  skillBar.style("border", "1px solid rgba(100, 100, 100, 0.5)"); // Add border for visibility

  // Add skill bar to the controls container
  controlsContainer.child(skillBar);

  // Create top row (Q, W, E, R) and bottom row (A, S, D, F) containers
  const topRow = createDiv("");
  topRow.style("display", "flex");
  topRow.style("justify-content", "space-around");
  topRow.style("margin-bottom", "20px");

  const bottomRow = createDiv("");
  bottomRow.style("display", "flex");
  bottomRow.style("justify-content", "space-around");

  // Add rows to skill bar
  skillBar.child(topRow);
  skillBar.child(bottomRow);

  // Create individual skill elements
  for (let i = 1; i <= 8; i++) {
    const skillDiv = createDiv("");
    skillDiv.id(`skill${i}`);
    skillDiv.style("text-align", "center");
    skillDiv.style("margin", "0 5px"); // More margin between buttons
    skillDiv.style("position", "relative");
    skillDiv.style("height", "80px"); // Slightly shorter for two rows
    skillDiv.style("width", "60px"); // Wider for better touch targets
    skillDiv.style("background-color", "rgba(50, 50, 50, 0.8)");
    skillDiv.style("border-radius", "10px"); // Maintain radius
    skillDiv.style("cursor", "pointer"); // Add pointer cursor to indicate clickability
    skillDiv.style("transition", "transform 0.1s, background-color 0.2s"); // Add transition for visual feedback
    skillDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)"); // Add shadow for depth
    skillDiv.style("user-select", "none"); // Prevent text selection
    skillDiv.style("-webkit-tap-highlight-color", "transparent"); // Remove tap highlight on mobile

    skillDiv.html(`
      <div id="skillName${i}" style="font-size: 0.8rem; font-weight: bold; position: absolute; top: -15px; left: 50%; transform: translateX(-50%); z-index: 1; white-space: nowrap;">${getSkillName(
      i
    )}</div>
      <div id="skillKey${i}" style="font-size: 2.2rem; font-weight: bold; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1;">${getSkillKey(
      i
    )}</div>
      <div id="needle${i}" style="position: absolute; top: 50%; left: 50%; width: 2px; height: 80px; background-color: transparent; transform-origin: bottom center; transform: translate(-50%, -100%) rotate(0deg); z-index: 2;"></div>
      <div id="overlay${i}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: conic-gradient(rgba(0, 0, 0, 0.5) 0deg, rgba(0, 0, 0, 0.5) 0deg, transparent 0deg, transparent 360deg); z-index: 0; border-radius: 10px;"></div>
    `);

    // Add click/touch event handler to activate the skill
    const skillNumber = i; // Capture the current skill number

    // Visual feedback on mouse/touch down
    skillDiv.mousePressed(function() {
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
    skillDiv.touchStarted(function() {
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

function updateSkillBar() {
  if (gameState != "playing") {
    return;
  }

  skillBar.style("visibility", "visible");
  for (let i = 1; i <= 8; i++) {
    const skillKey = `skill${i}`;
    const cooldownRemaining =
      skills[skillKey].cooldown - (frameCount - skills[skillKey].lastUsed);
    const cooldownPercent =
      max(0, cooldownRemaining) / skills[skillKey].cooldown;
    
    // Get skill element and check for active state
    const skillDiv = select(`#skill${i}`);
    
    // Check if skills are active
    const isSkillActive = (i === 2 && skills.skill2.active);
    const isAtomicBombActive = (i === 8 && frameCount - skills.skill8.lastUsed < 120); // Show atomic effect for 2 seconds after activation
    
    // Update active skill appearance
    if (skillDiv) {
      if (isSkillActive) {
        // Pulsing yellow/gold background for active machine gun skill
        const pulseIntensity = (frameCount % 20) < 10 ? 1.0 : 0.7;
        skillDiv.style("background-color", `rgba(255, 215, 0, ${pulseIntensity})`);
        skillDiv.style("box-shadow", "0 0 10px rgba(255, 215, 0, 0.8)");
        
        // Calculate remaining time percentage for active skill
        const activeTimeRemaining = skills.skill2.endTime - frameCount;
        const activeTimePercent = activeTimeRemaining / skills.skill2.activeDuration;
        
        // Add a timer overlay for active duration
        select(`#skillName${i}`).html(`${getSkillName(i)} (${Math.ceil(activeTimeRemaining/60)}s)`);
        
        // Skill key should appear in bright yellow/gold
        select(`#skillKey${i}`).style("color", "rgba(255, 215, 0, 1.0)");
      } else if (isAtomicBombActive) {
        // Atomic bomb explosion effect in skill bar
        // Rapidly flashing red/orange/yellow background
        const explosionPhase = frameCount % 6; // Create a rapid flashing effect
        let bgColor;
        
        // Cycle through explosion colors
        if (explosionPhase < 2) {
          bgColor = "rgba(255, 255, 220, 0.9)"; // Bright flash
        } else if (explosionPhase < 4) {
          bgColor = "rgba(255, 150, 50, 0.8)"; // Orange fire
        } else {
          bgColor = "rgba(150, 50, 0, 0.7)"; // Dark red/brown
        }
        
        // Apply explosion styles
        skillDiv.style("background-color", bgColor);
        skillDiv.style("box-shadow", "0 0 20px rgba(255, 100, 0, 0.9)");
        
        // Create pulsing size effect
        const pulseScale = 1.0 + 0.1 * Math.sin(frameCount * 0.5);
        skillDiv.style("transform", `scale(${pulseScale})`);
        
        // Mushroom cloud icon on the skill
        select(`#skillKey${i}`).html("☢");
        select(`#skillKey${i}`).style("color", "rgba(255, 50, 0, 1.0)");
        select(`#skillKey${i}`).style("text-shadow", "0 0 10px white");
        
        // Add explosion text effect
        select(`#skillName${i}`).html("☢ BOOM! ☢");
        select(`#skillName${i}`).style("color", "rgba(255, 50, 0, 1.0)");
      } else {
        // Reset to normal appearance
        skillDiv.style("background-color", "rgba(50, 50, 50, 0.8)");
        skillDiv.style("box-shadow", "none");
        skillDiv.style("transform", "scale(1.0)");
        
        // Reset the skill name to normal
        select(`#skillName${i}`).html(getSkillName(i));
        select(`#skillName${i}`).style("color", "white");
        
        // Reset key display
        if (i === 8) {
          select(`#skillKey${i}`).html("R");
        }
        
        // Reset key color
        select(`#skillKey${i}`).style("color", "white");
        select(`#skillKey${i}`).style("text-shadow", "none");
      }
    }

    // Update needle rotation
    const needleDiv = select(`#needle${i}`);
    const overlayDiv = select(`#overlay${i}`);
    if (needleDiv && overlayDiv) {
      const rotationDegree = 360 * (1 - cooldownPercent); // Counterclockwise rotation
      needleDiv.style(
        "transform",
        `translate(-50%, -100%) rotate(${rotationDegree}deg)`
      );
      needleDiv.style("opacity", cooldownPercent > 0 ? 1 : 0); // Hide needle when cooldown is complete

      // Update overlay gradient - special color for active skills
      if (isSkillActive) {
        // Active machine gun skill gets a yellow/gold overlay instead of black
        overlayDiv.style(
          "background",
          `conic-gradient(rgba(255, 215, 0, 0.3) ${rotationDegree}deg, rgba(255, 215, 0, 0.3) ${rotationDegree}deg, transparent ${rotationDegree}deg, transparent 360deg)`
        );
        overlayDiv.style("border-radius", "10px"); // Maintain border radius
      } else if (isAtomicBombActive) {
        // Atomic bomb gets a red/orange overlay with animated effect
        const explosionPhase = frameCount % 6; // Match the flash effect
        let overlayColor;

        if (explosionPhase < 2) {
          overlayColor = "rgba(255, 255, 50, 0.4)"; // Bright yellow
        } else if (explosionPhase < 4) {
          overlayColor = "rgba(255, 100, 0, 0.4)"; // Orange
        } else {
          overlayColor = "rgba(255, 0, 0, 0.3)"; // Red
        }

        overlayDiv.style(
          "background",
          `conic-gradient(${overlayColor} ${rotationDegree}deg, ${overlayColor} ${rotationDegree}deg, transparent ${rotationDegree}deg, transparent 360deg)`
        );
        overlayDiv.style("border-radius", "10px"); // Maintain border radius
      } else {
        // Normal overlay for other skills or inactive skills
        overlayDiv.style(
          "background",
          `conic-gradient(rgba(0, 0, 0, 0.5) ${rotationDegree}deg, rgba(0, 0, 0, 0.5) ${rotationDegree}deg, transparent ${rotationDegree}deg, transparent 360deg)`
        );
        overlayDiv.style("border-radius", "10px"); // Maintain border radius
      }

      // Add visual indicator for ready skills
      const skillDiv = select(`#skill${i}`);
      if (skillDiv) {
        if (cooldownPercent <= 0) {
          // Skill is ready - add subtle pulsing effect
          const pulseScale = 1.0 + 0.03 * Math.sin(frameCount * 0.1);
          skillDiv.style("transform", `scale(${pulseScale})`);
          skillDiv.style("box-shadow", "0 4px 12px rgba(100, 255, 100, 0.4)");
        } else {
          // Skill on cooldown - normal state
          skillDiv.style("transform", "scale(1.0)");
          skillDiv.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
        }
      }
    } else {
      console.error(`Needle or overlay element for skill #${i} not found`);
    }
  }
}

// Update the content of DOM HUD elements - with optimized drawing
function updateHUD() {
  // Only update if in playing state to avoid unnecessary DOM operations
  if (gameState === "playing") {
    updateStatusBoard();
    updateTechnicalBoard();
    updateSkillBar();
  }
}

function getSkillKey(skillNumber) {
  switch (skillNumber) {
    case 1:
      return "A";
    case 2:
      return "S";
    case 3:
      return "D";
    case 4:
      return "F";
    case 5:
      return "Q";
    case 6:
      return "W";
    case 7:
      return "E";
    case 8:
      return "R";
    default:
      return "";
  }
}

function getSkillName(skillNumber) {
  switch (skillNumber) {
    case 1:
      return "Next Weapon";
    case 2:
      return "Machine Gun";
    case 3:
      return "Shield";
    case 4:
      return "Freeze";
    case 5:
      return "Heal";
    case 6:
      return "Damage+";
    case 7:
      return "Speed+";
    case 8:
      return "Atomic Bomb";
    default:
      return "";
  }
}

// Input handlers
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === "menu" || gameState === "gameOver") {
      // Start or restart game
      resetGame();
      gameState = "playing";
      gameStartTime = frameCount;
    }
  }

  // Toggle pause with Escape key
  if (key === "p" || key === "P") {
    if (gameState === "playing") {
      // Start or restart game
      pauseGame();
      gameState = "paused";
      gameStartTime = frameCount;
    } else {
      gameState = "playing";
      resetGame();
    }
  }

  // Only process skill keys during gameplay
  if (gameState === "playing") {
    // Bottom row skills (A, S, D, F)
    if (key === "a" || key === "A") {
      activateSkill(1);
    } else if (key === "s" || key === "S") {
      activateSkill(2);
    } else if (key === "d" || key === "D") {
      activateSkill(3);
    } else if (key === "f" || key === "F") {
      activateSkill(4);
    }

    // Top row skills (Q, W, E, R)
    if (key === "q" || key === "Q") {
      activateSkill(5);
    } else if (key === "w" || key === "W") {
      activateSkill(6);
    } else if (key === "e" || key === "E") {
      activateSkill(7);
    } else if (key === "r" || key === "R") {
      activateSkill(8);
    }
  }
}

function mousePressed() {
  if (mouseButton === CENTER) {
    isDragging = true;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseReleased() {
  if (mouseButton === CENTER) {
    isDragging = false;
  }
}

function mouseDragged() {
  if (isDragging) {
    cameraOffsetX += mouseX - prevMouseX;
    cameraOffsetY += mouseY - prevMouseY;
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  }
}

function mouseWheel(event) {
  // Zoom in/out with mouse wheel
  cameraZoom = constrain(cameraZoom + event.delta, MIN_ZOOM, MAX_ZOOM);
  return false; // Prevent default scrolling
}

// Reset game to initial state
function resetGame() {
  currentWave = 1;
  score = 0;
  waveEnemiesKilled = 0;
  startTime = millis();

  // Reset squad
  squad = [
    {
      x: 0,
      y: BRIDGE_LENGTH / 2 - 100,
      z: 0,
      size: SQUAD_SIZE,
      health: 100,
      weapon: "blaster",
    },
  ];

  // Reset enemies and projectiles
  enemies = [];
  projectiles = [];
  powerUps = [];

  // Reset weapons
  weapons = {
    blaster: true,
    thunderbolt: false,
    inferno: false,
    frostbite: false,
    vortex: false,
    plasma: false,
    photon: false,
  };

  // Reset skills
  for (let i = 1; i <= 8; i++) {
    skills[`skill${i}`].lastUsed = 0;
  }

  // Reset camera
  cameraOffsetX = CAMERA_OFFSET_X;
  cameraOffsetY = CAMERA_OFFSET_Y;
  cameraZoom = CAMERA_OFFSET_Z;
}

function applyEffects() {
  // Update effects lifetimes and remove dead effects
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life--;
    
    // Special handling for machine gun effects
    if (effects[i].type === "machineGun") {
      // Check if the machine gun skill is still active
      if (!skills.skill2.active) {
        effects[i].life = 0; // Force effect to end if skill is no longer active
      }
      
      // Update position to follow the squad member
      if (effects[i].member) {
        effects[i].x = effects[i].member.x;
        effects[i].y = effects[i].member.y;
        effects[i].z = effects[i].member.z;
      }
    }
    
    if (effects[i].life <= 0) {
      // Remove but don't create new objects
      effects.splice(i, 1);
    }
  }
  
  // Limit total effects to prevent memory issues
  const maxEffectsBasedOnMemory = memoryUsageSamples.length > 0 && 
    memoryUsageSamples[memoryUsageSamples.length - 1] > 300 ? 
    30 : MAX_EFFECTS;
  
  // If memory usage is high, be more aggressive with cleanup
  if (effects.length > maxEffectsBasedOnMemory) {
    // Sort effects by importance (shields and machine gun effects are most important)
    effects.sort((a, b) => {
      // Shield effects have highest priority
      if (a.type === "shield" && b.type !== "shield") return 1;
      if (b.type === "shield" && a.type !== "shield") return -1;
      
      // Machine gun effects have second highest priority
      if (a.type === "machineGun" && b.type !== "machineGun") return 1;
      if (b.type === "machineGun" && a.type !== "machineGun") return -1;
      
      // Sort by remaining life (keep ones with most life left)
      return a.life - b.life;
    });
    
    // Remove excess effects
    effects.splice(0, effects.length - maxEffectsBasedOnMemory);
  }
}

function applyEnemyEffects() {
  // Apply ongoing effects to enemies
  for (let enemy of enemies) {
    if (enemy.effects) {
      // Apply burning damage over time
      if (enemy.effects.burning) {
        enemy.effects.burning.duration--;
        enemy.health -= enemy.effects.burning.damage;

        // Create fire effect occasionally
        if (frameCount % 20 === 0) {
          createFireEffect(enemy.x, enemy.y, enemy.z);
        }

        if (enemy.effects.burning.duration <= 0) {
          delete enemy.effects.burning;
        }
      }

      // Update frozen effect
      if (enemy.effects.frozen) {
        enemy.effects.frozen.duration--;

        // Create ice effect occasionally
        if (frameCount % 30 === 0) {
          createIceEffect(enemy.x, enemy.y, enemy.z);
        }

        if (enemy.effects.frozen.duration <= 0) {
          // Reset speed when effect expires
          enemy.speed /= enemy.effects.frozen.slowFactor;
          delete enemy.effects.frozen;
        }
      }
    }

    // Check if enemy has died from effects
    if (enemy.health <= 0) {
      // Add score based on enemy type
      if (enemy.type === "standard") score += 10;
      else if (enemy.type === "elite") score += 25;
      else if (enemy.type === "boss1") score += 100;
      else if (enemy.type === "boss2") score += 250;
      else if (enemy.type === "boss3") score += 500;

      // Increment enemies killed counter
      waveEnemiesKilled++;

      // Create explosion effect
      createExplosion(enemy.x, enemy.y, enemy.z, ENEMY_COLORS[enemy.type]);

      // Remove the enemy
      const index = enemies.indexOf(enemy);
      if (index > -1) {
        enemies.splice(index, 1);
      }
    }
  }
}

// Helper function to get enemy max health for health bar calculation
function getEnemyMaxHealth(enemyType) {
  let baseHealth = 30;

  if (enemyType === "elite") {
    baseHealth = 60;
  } else if (enemyType === "boss1") {
    baseHealth = 150;
  } else if (enemyType === "boss2") {
    baseHealth = 300;
  } else if (enemyType === "boss3") {
    baseHealth = 500;
  }

  return Math.floor(baseHealth * (1 + currentWave * 0.1));
}

// Visual effects functions with object pooling optimization
let MAX_EFFECTS = 100; // Maximum number of simultaneous effects

// Create the effect or reuse an existing one from the pool
function createEffect(type, x, y, z, color, size) {
  // Check if we've reached the effect limit - if so, look for an expired effect to reuse
  if (effects.length >= MAX_EFFECTS) {
    // Find the effect with the lowest remaining life to replace
    let lowestLifeIndex = 0;
    let lowestLife = Infinity;
    
    for (let i = 0; i < effects.length; i++) {
      if (effects[i].life < lowestLife) {
        lowestLife = effects[i].life;
        lowestLifeIndex = i;
      }
    }
    
    // Update the properties of the reused effect
    effects[lowestLifeIndex] = {
      x: x,
      y: y,
      z: z,
      type: type,
      color: color || [255, 255, 255],
      size: size || 15,
      life: EFFECT_DURATION,
    };
    
    return;
  }
  
  // Otherwise create a new effect if we haven't reached the limit
  effects.push({
    x: x,
    y: y,
    z: z,
    type: type,
    color: color || [255, 255, 255],
    size: size || 15,
    life: EFFECT_DURATION,
  });
}

// Simplified effect functions that use the centralized createEffect function
function createExplosion(x, y, z, color) {
  createEffect("explosion", x, y, z, color, 30);
}

function createHitEffect(x, y, z, color, customSize) {
  // Use custom size if provided, otherwise use default size of 15
  const size = customSize || 15;
  createEffect("hit", x, y, z, color, size, EFFECT_DURATION / 2);
}

function createFireEffect(x, y, z) {
  createEffect("fire", x, y, z, null, 20);
}

function createIceEffect(x, y, z) {
  createEffect("ice", x, y, z, null, 20);
}

function createThunderEffect(x, y, z) {
  createEffect("thunder", x, y, z, null, 20);
}

function createVortexEffect(x, y, z) {
  createEffect("vortex", x, y, z, null, 20);
}

function createPlasmaEffect(x, y, z) {
  createEffect("plasma", x, y, z, null, 20);
}

// Window resize handling
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Directional pad variables
let dPad;
let upButton, downButton, leftButton, rightButton;
let activeDirections = {
  up: false,
  down: false,
  left: false,
  right: false
};

// Controls container for bottom row layout
let controlsContainer;

// Create container for controls (d-pad and skill bar)
function createControlsContainer() {
  // Create main container
  controlsContainer = createDiv("");
  controlsContainer.id("controls-container");
  controlsContainer.position(0, height - 250); // Position at bottom of screen with more space for larger d-pad
  controlsContainer.style("width", "100%");
  controlsContainer.style("height", "250px"); // Much taller for much bigger d-pad
  // controlsContainer.style("max-width", "1200px"); // Limit width on large screens
  controlsContainer.style("margin", "0 auto"); // Center horizontally
  controlsContainer.style("display", "flex");
  controlsContainer.style("flex-direction", "row");
  controlsContainer.style("align-items", "center");
  controlsContainer.style("justify-content", "space-between"); // Space between d-pad and skill bar
  controlsContainer.style("padding", "10px 20px"); // Add more horizontal padding
  controlsContainer.style("box-sizing", "border-box");
  controlsContainer.style("z-index", "1500"); // Higher z-index
  controlsContainer.style("background-color", "rgba(0, 0, 0, 0.2)"); // Slight background

  // Initially hide the container, but make it ready to be shown
  controlsContainer.style("visibility", "hidden");
  controlsContainer.style("opacity", "0");
  controlsContainer.style("transition", "opacity 0.3s ease-in-out");
}

// Create directional pad for touch/click movement
function createDirectionalPadElement() {
  // Create main d-pad container
  dPad = createDiv("");
  dPad.id("d-pad-container");
  dPad.style("width", "240px"); // Much bigger d-pad
  dPad.style("height", "240px"); // Much bigger d-pad
  dPad.style("position", "relative"); // Use relative positioning within flex container
  dPad.style("background-color", "rgba(30, 30, 30, 0.8)"); // More visible background
  dPad.style("border-radius", "120px"); // Half of width/height
  dPad.style("flex-shrink", "0"); // Prevent d-pad from shrinking
  dPad.style("border", "3px solid rgba(200, 200, 200, 0.7)"); // More visible border
  dPad.style("z-index", "1600"); // Higher z-index than the container
  dPad.style("box-shadow", "0 0 15px rgba(0, 0, 0, 0.5)"); // Add shadow for better visibility

  // Add d-pad to the controls container
  controlsContainer.child(dPad);

  // Log to console for debugging
  console.log("D-pad created and added to controls container");
  dPad.style("display", "block"); // Ensure it's displayed
  dPad.style("pointer-events", "auto"); // Ensure it receives mouse/touch events

  // Create up button
  upButton = createDiv("▲");
  upButton.id("up-button");
  upButton.style("position", "absolute");
  upButton.style("top", "20px");
  upButton.style("left", "95px");
  upButton.style("width", "60px");
  upButton.style("height", "60px");
  upButton.style("background-color", "rgba(50, 50, 50, 0.8)");
  upButton.style("color", "white");
  upButton.style("font-size", "28px");
  upButton.style("display", "flex");
  upButton.style("align-items", "center");
  upButton.style("justify-content", "center");
  upButton.style("border-radius", "15px");
  upButton.style("cursor", "pointer");
  upButton.style("user-select", "none");
  upButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  upButton.style("transition", "transform 0.1s, background-color 0.2s");
  upButton.style("-webkit-tap-highlight-color", "transparent");

  // Create down button
  downButton = createDiv("▼");
  downButton.id("down-button");
  downButton.style("position", "absolute");
  downButton.style("bottom", "20px");
  downButton.style("left", "95px");
  downButton.style("width", "60px");
  downButton.style("height", "60px");
  downButton.style("background-color", "rgba(50, 50, 50, 0.8)");
  downButton.style("color", "white");
  downButton.style("font-size", "28px");
  downButton.style("display", "flex");
  downButton.style("align-items", "center");
  downButton.style("justify-content", "center");
  downButton.style("border-radius", "15px");
  downButton.style("cursor", "pointer");
  downButton.style("user-select", "none");
  downButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  downButton.style("transition", "transform 0.1s, background-color 0.2s");
  downButton.style("-webkit-tap-highlight-color", "transparent");

  // Create left button
  leftButton = createDiv("◀");
  leftButton.id("left-button");
  leftButton.style("position", "absolute");
  leftButton.style("top", "95px");
  leftButton.style("left", "20px");
  leftButton.style("width", "60px");
  leftButton.style("height", "60px");
  leftButton.style("background-color", "rgba(50, 50, 50, 0.8)");
  leftButton.style("color", "white");
  leftButton.style("font-size", "28px");
  leftButton.style("display", "flex");
  leftButton.style("align-items", "center");
  leftButton.style("justify-content", "center");
  leftButton.style("border-radius", "15px");
  leftButton.style("cursor", "pointer");
  leftButton.style("user-select", "none");
  leftButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  leftButton.style("transition", "transform 0.1s, background-color 0.2s");
  leftButton.style("-webkit-tap-highlight-color", "transparent");

  // Create right button
  rightButton = createDiv("▶");
  rightButton.id("right-button");
  rightButton.style("position", "absolute");
  rightButton.style("top", "95px");
  rightButton.style("right", "20px");
  rightButton.style("width", "60px");
  rightButton.style("height", "60px");
  rightButton.style("background-color", "rgba(50, 50, 50, 0.8)");
  rightButton.style("color", "white");
  rightButton.style("font-size", "28px");
  rightButton.style("display", "flex");
  rightButton.style("align-items", "center");
  rightButton.style("justify-content", "center");
  rightButton.style("border-radius", "15px");
  rightButton.style("cursor", "pointer");
  rightButton.style("user-select", "none");
  rightButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  rightButton.style("transition", "transform 0.1s, background-color 0.2s");
  rightButton.style("-webkit-tap-highlight-color", "transparent");

  // Create center button (optional - can be used for special actions)
  const centerButton = createDiv("•");
  centerButton.id("center-button");
  centerButton.style("position", "absolute");
  centerButton.style("top", "95px");
  centerButton.style("left", "95px");
  centerButton.style("width", "60px");
  centerButton.style("height", "60px");
  centerButton.style("background-color", "rgba(70, 70, 70, 0.8)");
  centerButton.style("color", "white");
  centerButton.style("font-size", "32px");
  centerButton.style("display", "flex");
  centerButton.style("align-items", "center");
  centerButton.style("justify-content", "center");
  centerButton.style("border-radius", "15px");
  centerButton.style("cursor", "pointer");
  centerButton.style("user-select", "none");
  centerButton.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.3)");
  centerButton.style("transition", "transform 0.1s, background-color 0.2s");
  centerButton.style("-webkit-tap-highlight-color", "transparent");

  // Add buttons to the d-pad
  dPad.child(upButton);
  dPad.child(downButton);
  dPad.child(leftButton);
  dPad.child(rightButton);
  dPad.child(centerButton);

  // Add event handlers for buttons
  setupDirectionalButton(upButton, "up");
  setupDirectionalButton(downButton, "down");
  setupDirectionalButton(leftButton, "left");
  setupDirectionalButton(rightButton, "right");

  // Initially hide the d-pad
  dPad.style("visibility", "hidden");
}

// Helper function to set up event handlers for directional buttons
function setupDirectionalButton(button, direction) {
  // Mouse down event - start moving in that direction
  button.mousePressed(function() {
    if (gameState === "playing") {
      activeDirections[direction] = true;

      // Visual feedback
      this.style("transform", "scale(0.95)");
      this.style("background-color", "rgba(100, 100, 255, 0.9)");
    }
  });

  // Mouse up event - stop moving in that direction
  button.mouseReleased(function() {
    activeDirections[direction] = false;

    // Reset visual state
    this.style("transform", "scale(1.0)");
    this.style("background-color", "rgba(50, 50, 50, 0.8)");
  });

  // Touch events for mobile
  button.touchStarted(function() {
    if (gameState === "playing") {
      activeDirections[direction] = true;

      // Visual feedback
      this.style("transform", "scale(0.95)");
      this.style("background-color", "rgba(100, 100, 255, 0.9)");

      return false; // Prevent default
    }
  });

  button.touchEnded(function() {
    activeDirections[direction] = false;

    // Reset visual state
    this.style("transform", "scale(1.0)");
    this.style("background-color", "rgba(50, 50, 50, 0.8)");

    return false; // Prevent default
  });
}

// Update directional pad visibility and apply movement
function updateDirectionalPad() {
  // Show/hide based on game state
  if (gameState === "playing") {
    // Make sure the controls container is visible
    controlsContainer.style("display", "flex");
    controlsContainer.style("visibility", "visible");
    controlsContainer.style("opacity", "1");
    controlsContainer.position(0, height - 250); // Reposition in case of window resize
    // controlsContainer.style("max-width", "1200px");
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

    // Debug - log to console once to confirm the function is running
    if (frameCount % 300 === 0) {
      console.log("D-pad should be visible, gameState:", gameState);
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

// Handle window resizing
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Reposition UI elements
  if (controlsContainer) {
    controlsContainer.position(0, height - 250);
    controlsContainer.style("width", "100%");
    controlsContainer.style("height", "250px");
    // controlsContainer.style("max-width", "1200px");
    controlsContainer.style("margin", "0 auto");
  }

  // Force controls container to be visible if in playing state
  if (gameState === "playing" && controlsContainer) {
    controlsContainer.style("display", "flex");
    controlsContainer.style("visibility", "visible");
    controlsContainer.style("opacity", "1");

    // Log to console for debugging
    console.log("Window resized, controls container repositioned");
  }
}

// Handle keyboard input
function keyPressed() {
  // Start/restart game with ENTER key
  if (keyCode === ENTER) {
    if (gameState === "menu" || gameState === "gameOver") {
      startGame();
      return false; // Prevent default behavior
    }
  }

  // Toggle pause with ESC key
  if (keyCode === ESCAPE) {
    if (gameState === "playing") {
      pauseGame();
    } else if (gameState === "paused") {
      resumeGame();
    }
    return false; // Prevent default behavior
  }

  // Handle skill activation with keyboard shortcuts
  if (gameState === "playing") {
    // Map keys A, S, D, F, Q, W, E, R to skills 1-8
    if (key === 'a' || key === 'A') {
      activateSkill(1);
      return false;
    } else if (key === 's' || key === 'S') {
      activateSkill(2);
      return false;
    } else if (key === 'd' || key === 'D') {
      activateSkill(3);
      return false;
    } else if (key === 'f' || key === 'F') {
      activateSkill(4);
      return false;
    } else if (key === 'q' || key === 'Q') {
      activateSkill(5);
      return false;
    } else if (key === 'w' || key === 'W') {
      activateSkill(6);
      return false;
    } else if (key === 'e' || key === 'E') {
      activateSkill(7);
      return false;
    } else if (key === 'r' || key === 'R') {
      activateSkill(8);
      return false;
    }
  }

  return true; // Allow other default behaviors
}

// Global touch handler to prevent default touch behavior on skill buttons and d-pad
function touchStarted() {
  // Check if the touch is on a skill button or d-pad
  if (gameState === "playing") {
    // Get touch position
    const touchX = touches[0]?.x || mouseX;
    const touchY = touches[0]?.y || mouseY;

    // Check if touch is within skillbar area
    if (skillBar) {
      const skillBarRect = skillBar.elt.getBoundingClientRect();
      if (
        touchX >= skillBarRect.left &&
        touchX <= skillBarRect.right &&
        touchY >= skillBarRect.top &&
        touchY <= skillBarRect.bottom
      ) {
        // Prevent default touch behavior (scrolling, zooming)
        return false;
      }
    }

    // Check if touch is within d-pad area
    if (dPad) {
      const dPadRect = dPad.elt.getBoundingClientRect();
      if (
        touchX >= dPadRect.left &&
        touchX <= dPadRect.right &&
        touchY >= dPadRect.top &&
        touchY <= dPadRect.bottom
      ) {
        // Prevent default touch behavior (scrolling, zooming)
        return false;
      }
    }
  }

  // Allow default touch behavior for other areas
  return true;
}

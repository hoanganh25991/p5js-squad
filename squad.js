// Squad Survival Game
// A 3D p5.js game with squad-based combat

// Game states
let gameState = 'menu'; // menu, playing, paused, gameOver
let currentWave = 1;
let score = 0;
let gameStartTime = 0;
let startTime = 0;
let enemiesKilled = 0;

// Font
let gameFont;

// Camera settings
let cameraOffsetX = 0;
let cameraOffsetY = 0;
let cameraZoom = 800;
const MIN_ZOOM = 400;
const MAX_ZOOM = 1200;
let isDragging = false;
let prevMouseX, prevMouseY;

// Game dimensions
const BRIDGE_WIDTH = 400;
const BRIDGE_LENGTH = 1200;
const POWER_UP_LANE_WIDTH = 150;
const TOTAL_WIDTH = BRIDGE_WIDTH + POWER_UP_LANE_WIDTH;

// Debug mode for testing
const DEBUG_MODE = true; // Set to true for easier testing, false for normal gameplay

// Configurable game parameters
const SQUAD_HEALTH = DEBUG_MODE ? 500 : 100; // Higher health in debug mode
const MAX_SQUAD_MEMBERS_PER_ROW = 9; // Number of squad members in a row before stacking vertically
const BRIDGE_LENGTH_MULTIPLIER = 4.0; // Make bridge take full screen height
const ENEMIES_TO_KILL_FOR_NEXT_WAVE = DEBUG_MODE ? 10 : 30; // Fewer enemies needed in debug mode
const MIRROR_POWERUP_SPAWN_RATE = DEBUG_MODE ? 30 : 120; // Frames between mirror power-up spawns (0.5s in debug)
const MAX_POWER_UPS = 20; // Maximum number of power-ups allowed on screen

// Skill upgrade tracking
let fireRateBoost = DEBUG_MODE ? 10 : 0; // Reduces time between shots (starts with some in debug mode)
let damageBoost = DEBUG_MODE ? 10 : 0;  // Increases damage (starts with some in debug mode)
let aoeBoost = DEBUG_MODE ? 10 : 0;     // Increases area of effect (starts with some in debug mode)

// Colors
const BRIDGE_COLOR = [150, 150, 150];
const POWER_UP_LANE_COLOR = [100, 200, 250];
const SQUAD_COLOR = [0, 200, 0];
const ENEMY_COLORS = {
  standard: [255, 0, 0],
  elite: [255, 100, 0],
  boss1: [200, 0, 100],
  boss2: [150, 0, 150],
  boss3: [100, 0, 200]
};
const WEAPON_COLORS = {
  blaster: [0, 255, 0],
  thunderbolt: [255, 255, 0],
  inferno: [255, 100, 0],
  frostbite: [0, 200, 255],
  vortex: [150, 0, 255],
  plasma: [255, 0, 255],
  photon: [200, 255, 200],
  mirror: [255, 255, 255] // Add mirror type
};

// Squad properties
let SQUAD_SIZE = 30;
let MAX_SQUAD_SIZE = SQUAD_SIZE * 3; // Maximum number of squad members
let squad = [];
let squadSpeed = 5;
let squadFireRate = 30; // frames between shots (faster firing rate)
let lastFireTime = 0;

// Enemy properties
let enemies = [];
const ENEMY_SPAWN_RATE = 45; // frames between spawns (much faster)
let lastEnemySpawn = 0;
const STANDARD_ENEMY_SIZE = 25;
const ELITE_ENEMY_SIZE = 35;
const BOSS_SIZES = [50, 70, 90];
const ENEMIES_PER_ROW = 5; // Number of enemies per row when spawning

// Projectiles
let projectiles = [];
const PROJECTILE_SPEED = 12; // Faster projectiles
const PROJECTILE_SIZE = 10;

// Visual effects
let effects = [];
const EFFECT_DURATION = 30; // frames

// Power-ups
let powerUps = [];
const POWER_UP_SIZE = 20;
const POWER_UP_SPAWN_RATE = 90; // frames between power-up spawns (continuous spawning)
const MIRROR_SPAWN_CHANCE = 0.3; // 30% chance for mirror +1 to spawn
const SKILL_SPAWN_CHANCE = 0.4; // 40% chance for skill power-ups
let lastPowerUpSpawn = 0;
const POWER_UP_SPEED = 3; // Speed at which power-ups move down the lane

// Weapons inventory (false means locked, true means available)
let weapons = {
  blaster: true, // Default starter weapon
  thunderbolt: false,
  inferno: false,
  frostbite: false,
  vortex: false,
  plasma: false,
  photon: false
};

// Currently equipped weapon
let currentWeapon = 'blaster';

// Skills cooldowns in frames
let skills = {
  skill1: { cooldown: 600, lastUsed: 0 },
  skill2: { cooldown: 900, lastUsed: 0 },
  skill3: { cooldown: 1200, lastUsed: 0 },
  skill4: { cooldown: 1500, lastUsed: 0 },
  skill5: { cooldown: 1800, lastUsed: 0 },
  skill6: { cooldown: 2100, lastUsed: 0 },
  skill7: { cooldown: 2400, lastUsed: 0 },
  skill8: { cooldown: 3000, lastUsed: 0 }
};

// Font loading
function preload() {
  // Load a default system font
  gameFont = loadFont('https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf');
}

// Game setup
function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // Set the font for all text
  textFont(gameFont);
  
  // Initialize the squad with a single member
  squad.push({
    x: 0,
    y: BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER / 2 - 200, // Starting near the bottom of extended bridge
    z: 0,
    size: SQUAD_SIZE,
    health: SQUAD_HEALTH, // Use configurable health
    weapon: 'blaster',
    id: Date.now() // Unique ID for reference
  });
  
  // Set perspective for better 3D view
  perspective(PI / 3.0, width / height, 0.1, 5000);
  
  // Auto-start the game (no need to press enter)
  resetGame();
  gameState = 'playing';
  gameStartTime = frameCount;
}

function draw() {
  background(0);
  
  // Draw pause button in top right corner (screen coordinates)
  if (gameState === 'playing') {
    drawPauseButton();
  } else if (gameState === 'paused') {
    drawResumeButton();
  }
  
  // Apply camera transformations
  translate(cameraOffsetX, cameraOffsetY, -cameraZoom);
  rotateX(PI/3); // Angle the view down to see the bridge

  switch(gameState) {
    case 'menu':
      drawMenu();
      break;
    case 'playing':
      updateGame();
      drawGame();
      break;
    case 'paused':
      drawGame();
      drawPauseScreen();
      break;
    case 'gameOver':
      drawGame();
      drawGameOverScreen();
      break;
  }
}

// Main game logic functions
function updateGame() {
  moveSquad();
  updateProjectiles();
  updateEffects();
  checkCollisions();
  spawnEnemies();
  moveEnemies();
  updatePowerUps();
  applyEnemyEffects();
  checkWaveCompletion();
}

function drawGame() {
  // Draw the bridge (main lane) - extending from bottom to top of screen
  push();
  translate(0, 0, 0);
  fill(...BRIDGE_COLOR);
  box(BRIDGE_WIDTH, BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER, 10); // Increased bridge length to cover full screen
  pop();
  
  // Draw the power-up lane (extended to match main bridge)
  push();
  translate(BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2, 0, 0);
  fill(...POWER_UP_LANE_COLOR);
  box(POWER_UP_LANE_WIDTH, BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER, 10); // Increased to match main bridge length
  pop();
  
  // Draw squad members
  for (let i = 0; i < squad.length; i++) {
    const member = squad[i];
    push();
    translate(member.x, member.y, member.z + member.size/2);
    
    // Use different color for squad leader (first member)
    if (i === 0) {
      fill(255, 215, 0); // Gold color for leader
      // Draw a small crown or marker on top
      push();
      translate(0, 0, member.size/2 + 5);
      fill(255, 165, 0); // Orange crown
      rotateX(PI/4);
      cone(member.size/4, member.size/3);
      pop();
    } else {
      fill(...SQUAD_COLOR);
    }
    
    box(member.size, member.size, member.size);
    
    // Draw health bar above squad member
    translate(0, 0, member.size);
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
    pop();
  }
  
  // Draw enemies
  for (let enemy of enemies) {
    push();
    translate(enemy.x, enemy.y, enemy.z + enemy.size/2);
    fill(...ENEMY_COLORS[enemy.type]);
    
    // Draw different shapes for different enemy types
    if (enemy.type.includes('boss')) {
      sphere(enemy.size/2);
    } else if (enemy.type === 'elite') {
      // Elite enemies are pyramids
      cone(enemy.size/2, enemy.size);
    } else {
      box(enemy.size, enemy.size, enemy.size);
    }
    
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
    pop();
  }
  
  // Draw projectiles
  for (let proj of projectiles) {
    push();
    translate(proj.x, proj.y, proj.z);
    
    // Add fallback for undefined weapon colors
    let projColor = [...(WEAPON_COLORS[proj.weapon] || [255, 255, 255])];
    
    // Enhanced visuals based on power-up levels
    let enhancedSize = 1.0;
    let hasGlowEffect = false;
    
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
    
    // Add glow effect for enhanced projectiles
    if (hasGlowEffect) {
      // Outer glow
      push();
      noStroke();
      fill(projColor[0], projColor[1], projColor[2], 150);
      sphere(PROJECTILE_SIZE * 1.5 * enhancedSize);
      pop();
      
      // Add trail effect
      push();
      translate(0, PROJECTILE_SPEED * 0.5, 0); // Position behind bullet
      fill(projColor[0], projColor[1], projColor[2], 100);
      sphere(PROJECTILE_SIZE * 1.2 * enhancedSize);
      pop();
      
      // For very powerful bullets, add an additional effect
      if (damageBoost + fireRateBoost + aoeBoost > 15) {
        push();
        translate(0, PROJECTILE_SPEED * 1.0, 0); // Further behind
        fill(projColor[0], projColor[1], projColor[2], 70);
        sphere(PROJECTILE_SIZE * 0.9 * enhancedSize);
        pop();
      }
    }
    
    // Main projectile with enhanced color
    fill(projColor[0], projColor[1], projColor[2]);
    
    // Different projectile shapes based on weapon type
    if (proj.weapon === 'blaster') {
      // Green laser beam
      sphere(PROJECTILE_SIZE * enhancedSize);
    } else if (proj.weapon === 'thunderbolt') {
      // Thunder projectile
      cone(PROJECTILE_SIZE * enhancedSize, PROJECTILE_SIZE * 2 * enhancedSize);
    } else if (proj.weapon === 'inferno') {
      // Fire projectile
      box(PROJECTILE_SIZE * enhancedSize, PROJECTILE_SIZE * enhancedSize, PROJECTILE_SIZE * enhancedSize);
    } else if (proj.weapon === 'frostbite') {
      // Ice projectile
      sphere(PROJECTILE_SIZE * 0.8);
    } else if (proj.weapon === 'vortex') {
      // Vortex projectile
      torus(PROJECTILE_SIZE * 0.8, PROJECTILE_SIZE * 0.3);
    } else if (proj.weapon === 'plasma') {
      // Plasma projectile (sphere with random wobble)
      sphere(PROJECTILE_SIZE * (0.8 + sin(frameCount * 0.2) * 0.2));
    } else if (proj.weapon === 'photon') {
      // Photon projectile (cylinder)
      cylinder(PROJECTILE_SIZE * 0.5, PROJECTILE_SIZE * 2);
    } else {
      sphere(PROJECTILE_SIZE);
    }
    pop();
  }
  
  // Draw visual effects
  for (let effect of effects) {
    push();
    translate(effect.x, effect.y, effect.z);
    
    // Default color if effect.color is undefined
    const effectColor = effect.color || [255, 255, 255];
    
    if (effect.type === 'explosion') {
      // Explosion effect
      fill(...effectColor, 255 * (effect.life / EFFECT_DURATION));
      sphere(effect.size * (1 + (1 - effect.life / EFFECT_DURATION) * 2));
    } else if (effect.type === 'hit') {
      // Hit effect
      fill(...effectColor, 255 * (effect.life / EFFECT_DURATION));
      sphere(effect.size * (1 - effect.life / EFFECT_DURATION));
    } else if (effect.type === 'fire') {
      // Fire effect
      fill(255, 100 + random(155), 0, 255 * (effect.life / EFFECT_DURATION));
      for (let i = 0; i < 3; i++) {
        push();
        translate(random(-10, 10), random(-10, 10), random(0, 20));
        box(5 + random(10));
        pop();
      }
    } else if (effect.type === 'ice') {
      // Ice effect
      fill(200, 200, 255, 255 * (effect.life / EFFECT_DURATION));
      sphere(effect.size * 0.5);
    } else if (effect.type === 'thunder') {
      // Thunder effect
      stroke(255, 255, 0, 255 * (effect.life / EFFECT_DURATION));
      strokeWeight(3);
      for (let i = 0; i < 5; i++) {
        line(0, 0, 0, random(-30, 30), random(-30, 30), random(0, 30));
      }
    } else if (effect.type === 'vortex') {
      // Vortex effect
      rotateZ(frameCount * 0.1);
      fill(150, 0, 255, 200 * (effect.life / EFFECT_DURATION));
      torus(30 * (1 - effect.life / EFFECT_DURATION), 5);
    } else if (effect.type === 'plasma') {
      // Plasma effect
      fill(255, 0, 255, 200 * (effect.life / EFFECT_DURATION));
      for (let i = 0; i < 4; i++) {
        push();
        translate(random(-20, 20), random(-20, 20), random(0, 10));
        sphere(5 + random(5));
        pop();
      }
    }
    
    pop();
  }
  
  // Draw power-ups
  for (let powerUp of powerUps) {
    push();
    translate(powerUp.x, powerUp.y, powerUp.z + POWER_UP_SIZE/2);
    
    // Different shapes for different power-up types
    if (powerUp.type === 'mirror') {
      fill(WEAPON_COLORS.mirror); // Use the color from WEAPON_COLORS
      box(POWER_UP_SIZE, POWER_UP_SIZE, POWER_UP_SIZE);
    } else if (powerUp.type === 'fire_rate') {
      // Fire rate boost - green sphere
      fill(50, 255, 50);
      push();
      rotateX(frameCount * 0.05);
      rotateY(frameCount * 0.05);
      text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
      sphere(POWER_UP_SIZE/2);
      pop();
    } else if (powerUp.type === 'damage') {
      // Damage boost - red cube
      fill(255, 50, 50);
      push();
      rotateX(frameCount * 0.05);
      rotateY(frameCount * 0.05);
      text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
      box(POWER_UP_SIZE);
      pop();
    } else if (powerUp.type === 'aoe') {
      // Area effect boost - blue pyramid
      fill(50, 50, 255);
      push();
      rotateX(frameCount * 0.05);
      rotateY(frameCount * 0.05);
      text(`+${powerUp.value}`, 0, -POWER_UP_SIZE);
      cone(POWER_UP_SIZE, POWER_UP_SIZE*1.5);
      pop();
    } else {
      // Weapon power-ups - use default color if type not found
      const powerUpColor = WEAPON_COLORS[powerUp.type] || [200, 200, 200];
      fill(...powerUpColor);
      cylinder(POWER_UP_SIZE/2, POWER_UP_SIZE);
    }
    pop();
  }
  
  // Draw HUD (outside of the 3D transformation)
  drawHUD();
}

// Squad Movement and Controls
function moveSquad() {
  // Control main squad member (first in the array)
  if (squad.length > 0) {
    let mainMember = squad[0];
    
    // Arrow key movement
    if (keyIsDown(LEFT_ARROW)) {
      mainMember.x -= squadSpeed;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      mainMember.x += squadSpeed;
    }
    if (keyIsDown(UP_ARROW)) {
      mainMember.y -= squadSpeed;
    }
    if (keyIsDown(DOWN_ARROW)) {
      mainMember.y += squadSpeed;
    }
    
    // Constrain to bridge boundaries
    const leftBound = -BRIDGE_WIDTH/2;
    const rightBound = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH;
    const topBound = -BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER/2;
    const bottomBound = BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER/2;
    
    mainMember.x = constrain(mainMember.x, leftBound, rightBound);
    mainMember.y = constrain(mainMember.y, topBound, bottomBound);
    
    // Formation - arrange other squad members around the main one
    if (squad.length > 1) {
      const spacing = SQUAD_SIZE * 1.1; // Slightly closer spacing to fit 9 in a row
      
      for (let i = 1; i < squad.length; i++) {
        // Horizontal formation first, then stack vertically
        // Convert to 0-based index for calculation
        const index = i - 1;
        
        // Calculate row and column based on MAX_SQUAD_MEMBERS_PER_ROW
        const row = Math.floor(index / MAX_SQUAD_MEMBERS_PER_ROW);
        const col = index % MAX_SQUAD_MEMBERS_PER_ROW;
        
        // Calculate position: center the leader with members on both sides
        // For 9 members per row, positions would be: -4, -3, -2, -1, 0, 1, 2, 3, 4
        const colOffset = col - Math.floor(MAX_SQUAD_MEMBERS_PER_ROW / 2);
        
        // Position each member
        squad[i].x = mainMember.x + colOffset * spacing;
        squad[i].y = mainMember.y + (row + 1) * spacing;
        
        // Constrain other members as well
        squad[i].x = constrain(squad[i].x, leftBound, rightBound);
        squad[i].y = constrain(squad[i].y, topBound, bottomBound);
      }
    }
    
    // Auto-firing
    if (frameCount - lastFireTime > squadFireRate) {
      for (let member of squad) {
        fireWeapon(member);
      }
      lastFireTime = frameCount;
    }
  }
}

function fireWeapon(squadMember) {
  const weapon = squadMember.weapon || currentWeapon;
  
  let projectile = {
    x: squadMember.x,
    y: squadMember.y,
    z: squadMember.z + squadMember.size/2,
    weapon: weapon,
    speed: PROJECTILE_SPEED,
    damage: getWeaponDamage(weapon)
  };
  
  projectiles.push(projectile);
}

function getWeaponDamage(weapon) {
  let baseDamage = 0;
  switch(weapon) {
    case 'blaster': baseDamage = 20; break; // Base damage
    case 'thunderbolt': baseDamage = 45; break;
    case 'inferno': baseDamage = 30; break; // Plus DoT effect
    case 'frostbite': baseDamage = 30; break; // Plus CC effect
    case 'vortex': baseDamage = 40; break; // AoE damage
    case 'plasma': baseDamage = 60; break; // Spread damage
    case 'photon': baseDamage = 80; break; // High precision
    default: baseDamage = 20;
  }
  
  // Apply damage boost from power-ups
  return baseDamage + damageBoost;
}

function updateProjectiles() {
  // Move projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.y -= proj.speed; // Move upward (toward enemies)
    
    // Remove projectiles that go off-screen (adjusted for longer bridge)
    if (proj.y < -BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2) {
      projectiles.splice(i, 1);
    }
  }
}

// Enemy spawning and movement
function spawnEnemies() {
  if (frameCount - lastEnemySpawn > ENEMY_SPAWN_RATE) {
    // Always spawn enemies (no chance check, continuous spawning)
    // Sometimes spawn rows of enemies
    const spawnRow = random() < 0.3;
    
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
  
  for (let i = 0; i < ENEMIES_PER_ROW; i++) {
    const x = -BRIDGE_WIDTH/2 + spacing/2 + i * spacing;
    
    enemies.push({
      x: x,
      y: -BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2 + 100, // Near the top of extended bridge
      z: 0,
      size: STANDARD_ENEMY_SIZE,
      type: 'standard', // Rows are always standard enemies
      health: 20, // Easier to defeat in rows
      speed: 3.5 // Fast moving rows
    });
  }
}

function spawnSingleEnemy() {
  const enemyTypes = ['standard', 'standard', 'standard', 'elite'];
  // Add boss types in later waves
  if (currentWave >= 5 && currentWave % 5 === 0) {
    enemyTypes.push('boss1');
  }
  if (currentWave >= 10 && currentWave % 10 === 0) {
    enemyTypes.push('boss2');
  }
  if (currentWave >= 15 && currentWave % 15 === 0) {
    enemyTypes.push('boss3');
  }
  
  // Add more elite enemies as waves progress
  if (currentWave >= 3) {
    enemyTypes.push('elite');
  }
  
  const type = random(enemyTypes);
  
  // Determine size based on type
  let size = STANDARD_ENEMY_SIZE;
  let health = 30;
  
  if (type === 'elite') {
    size = ELITE_ENEMY_SIZE;
    health = 60;
  } else if (type === 'boss1') {
    size = BOSS_SIZES[0];
    health = 150;
  } else if (type === 'boss2') {
    size = BOSS_SIZES[1];
    health = 300;
  } else if (type === 'boss3') {
    size = BOSS_SIZES[2];
    health = 500;
  }
  
  // Scale health with wave number for increasing difficulty but keep it easier
  health = Math.floor(health * (1 + currentWave * 0.05));
  
  // Enemies mostly spawn in the main lane, occasionally in power-up lane
  const spawnInPowerUpLane = random() < 0.1; // Less likely to spawn in power-up lane
  const x = spawnInPowerUpLane 
    ? random(BRIDGE_WIDTH/2, BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH)
    : random(-BRIDGE_WIDTH/2, BRIDGE_WIDTH/2);
  
  enemies.push({
    x: x,
    y: -BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2 + 100, // Near the top of extended bridge
    z: 0,
    size: size,
    type: type,
    health: health,
    speed: type.includes('boss') ? 1.5 : 3 // Faster enemies for more action
  });
}

function moveEnemies() {
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
  
  for (let enemy of enemies) {
    // Check if enemy is close to the base line
    const distanceToBaseY = BRIDGE_LENGTH/2 - 100 - enemy.y;
    
    if (distanceToBaseY < 150) {
      // When close to base, directly target the squad at consistent speed
      // Calculate vector to target
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Normalize and apply speed consistently (no acceleration)
      if (dist > 0) {
        enemy.x += (dx / dist) * enemy.speed;
        enemy.y += (dy / dist) * enemy.speed;
      }
    } else {
      // Regular downward movement when far from base
      enemy.y += enemy.speed;
      
      // Only bosses have side-to-side movement when far away
      if (enemy.type.includes('boss')) {
        enemy.x += sin(frameCount * 0.05) * 1;
      }
    }
    
    // Keep within bridge boundaries
    const leftBound = -BRIDGE_WIDTH/2;
    const rightBound = BRIDGE_WIDTH/2 + (enemy.type.includes('boss') ? POWER_UP_LANE_WIDTH : 0);
    enemy.x = constrain(enemy.x, leftBound, rightBound);
  }
}

// Power-up system
function spawnPowerUps() {
  // Regular power-ups on a timer
  if (frameCount - lastPowerUpSpawn > POWER_UP_SPAWN_RATE) {
    // Always spawn power-ups (continuous spawning)
    const rand = random();
    
    // Determine power-up type based on probability
    let type;
    
    if (rand < MIRROR_SPAWN_CHANCE) {
      // Mirror power-up
      type = 'mirror';
    } else if (rand < MIRROR_SPAWN_CHANCE + SKILL_SPAWN_CHANCE) {
      // Skill power-up (fire_rate, damage, or aoe)
      const skillTypes = ['fire_rate', 'damage', 'aoe'];
      type = random(skillTypes);
    } else {
      // Weapon power-up
      const weaponTypes = [];
      if (currentWave >= 2) weaponTypes.push('thunderbolt');
      if (currentWave >= 3) weaponTypes.push('inferno');
      if (currentWave >= 5) weaponTypes.push('frostbite');
      if (currentWave >= 7) weaponTypes.push('vortex');
      if (currentWave >= 10) weaponTypes.push('plasma');
      if (currentWave >= 15) weaponTypes.push('photon');
      
      // If no weapons available yet, default to a mirror
      type = weaponTypes.length > 0 ? random(weaponTypes) : 'mirror';
    }
    
    // Add some randomness to power-up lane position
    const laneOffset = random(-POWER_UP_LANE_WIDTH/4, POWER_UP_LANE_WIDTH/4);
    const x = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2 + laneOffset;
    const y = random(-BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2 + 100, 
                      BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2 - 100);
    
    // Add value for skill power-ups
    let value = 1; // Default value
    if (type === 'fire_rate') value = 3; // +3 fire rate
    if (type === 'damage') value = 4;   // +4 damage
    if (type === 'aoe') value = 2;      // +2 area effect
    
    powerUps.push({
      x: x,
      y: y,
      z: 0,
      type: type,
      value: value,
      speed: POWER_UP_SPEED + random(-0.5, 1), // Slightly varied speeds
      size: POWER_UP_SIZE, // Base size
      rotation: random(0, TWO_PI), // Random starting rotation
      rotationSpeed: random(0.01, 0.05), // How fast it rotates
      stackLevel: 1, // Power-ups of same type can stack
      pulsePhase: random(0, TWO_PI), // For pulsing effect
      orbitals: type === 'mirror' ? 2 : (type.includes('weapon') ? 3 : 1) // Small orbiting particles
    });
    
    lastPowerUpSpawn = frameCount;
  }
  
  // Separate function for frequent mirror power-ups in debug mode
  spawnMirrorPowerUps();
}

// Function to frequently spawn mirror power-ups in the middle of power-up lane
function spawnMirrorPowerUps() {
  if (frameCount % MIRROR_POWERUP_SPAWN_RATE === 0 && powerUps.length < MAX_POWER_UPS) {
    // Mirror power-ups spawn in the middle of power-up lane
    const x = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2; // Middle of power-up lane
    
    // Distribute across the bridge length
    const spacing = BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER / 10;
    const offsetFromTop = 100; // Space from the top
    const y = -BRIDGE_LENGTH * BRIDGE_LENGTH_MULTIPLIER/2 + offsetFromTop + (frameCount % 10) * spacing;
    
    // Add the mirror power-up
    powerUps.push({
      x: x,
      y: y,
      z: 0,
      type: 'mirror',
      value: 1,
      speed: POWER_UP_SPEED,
      size: POWER_UP_SIZE * 1.2, // Slightly larger for visibility
      rotation: random(0, TWO_PI),
      rotationSpeed: 0.03,
      stackLevel: 1,
      pulsePhase: random(0, TWO_PI),
      orbitals: 3 // More orbitals for mirror power-ups
    });
  }
}

function updatePowerUps() {
  // Spawn regular power-ups
  spawnPowerUps();
  
  // Move power-ups down the lane
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].y += powerUps[i].speed;
    
    // Remove power-ups that go off-screen (adjusted for longer bridge)
    if (powerUps[i].y > BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2) {
      powerUps.splice(i, 1);
    }
  }
}

// Collision detection
function checkCollisions() {
  // Projectile-Enemy Collisions
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      
      // Simple distance-based collision
      if (dist(proj.x, proj.y, proj.z, enemy.x, enemy.y, enemy.z) < (enemy.size/2 + PROJECTILE_SIZE)) {
        // Apply damage
        enemy.health -= proj.damage;
        
        // Add hit effect
        createHitEffect(proj.x, proj.y, proj.z, WEAPON_COLORS[proj.weapon]);
        
        // Apply special effects based on weapon
        if (proj.weapon === 'inferno') {
          // DoT effect - additional damage over time
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.burning = { duration: 180, damage: 2 };
          // Fire effect
          createFireEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === 'frostbite') {
          // CC effect - slow movement
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.frozen = { duration: 120, slowFactor: 0.5 };
          enemy.speed *= 0.5;
          // Ice effect
          createIceEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === 'thunderbolt') {
          // Thunder effect
          createThunderEffect(enemy.x, enemy.y, enemy.z);
        } else if (proj.weapon === 'vortex') {
          // Vortex AoE effect - apply damage to nearby enemies
          for (let k = enemies.length - 1; k >= 0; k--) {
            let nearbyEnemy = enemies[k];
            if (dist(enemy.x, enemy.y, enemy.z, nearbyEnemy.x, nearbyEnemy.y, nearbyEnemy.z) < 100) {
              nearbyEnemy.health -= proj.damage * 0.5;
              createVortexEffect(enemy.x, enemy.y, enemy.z);
            }
          }
        } else if (proj.weapon === 'plasma') {
          // Plasma shotgun spread effect
          createPlasmaEffect(enemy.x, enemy.y, enemy.z);
        }
        
        // Remove the projectile
        projectiles.splice(i, 1);
        
        // Check if enemy is defeated
        if (enemy.health <= 0) {
          // Add score based on enemy type
          if (enemy.type === 'standard') score += 10;
          else if (enemy.type === 'elite') score += 25;
          else if (enemy.type === 'boss1') score += 100;
          else if (enemy.type === 'boss2') score += 250;
          else if (enemy.type === 'boss3') score += 500;
          
          // Increment enemies killed counter
          enemiesKilled++;
          
          // Create explosion effect
          createExplosion(enemy.x, enemy.y, enemy.z, ENEMY_COLORS[enemy.type]);
          
          enemies.splice(j, 1);
        }
        
        break; // Projectile hit something, move to next projectile
      }
    }
  }
  
  // Squad-PowerUp Collisions
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];
    
    for (let squadMember of squad) {
      if (dist(powerUp.x, powerUp.y, powerUp.z, squadMember.x, squadMember.y, squadMember.z) < (squadMember.size/2 + POWER_UP_SIZE/2)) {
        // Apply power-up effect
        if (powerUp.type === 'mirror') {
          // Add a new squad member
          if (squad.length < MAX_SQUAD_SIZE) { // Configurable max squad size
            // Calculate position for new squad member
            // Arrange in horizontal rows first (up to MAX_SQUAD_MEMBERS_PER_ROW per row)
            // then stack vertically
            const squadRow = Math.floor(squad.length / MAX_SQUAD_MEMBERS_PER_ROW);
            const squadCol = squad.length % MAX_SQUAD_MEMBERS_PER_ROW;
            
            // Space to use is 2/3 of bridge width
            const usableWidth = (BRIDGE_WIDTH * 2/3);
            const spacing = usableWidth / MAX_SQUAD_MEMBERS_PER_ROW;
            
            // Calculate position (centered within usable width)
            const startX = -usableWidth/2 + spacing/2;
            const newX = startX + (squadCol * spacing);
            const newY = BRIDGE_LENGTH/2 - 100 - (squadRow * SQUAD_SIZE * 1.2); // Slight spacing between rows
            
            squad.push({
              x: newX,
              y: newY,
              z: 0,
              size: SQUAD_SIZE,
              health: SQUAD_HEALTH, // Use configurable health
              weapon: currentWeapon,
              id: Date.now() + squad.length // Unique ID for reference
            });
          }
        } else if (powerUp.type === 'fire_rate') {
          // Accumulate fire rate boost
          fireRateBoost += powerUp.value;
          // Create a visual effect
          createEffect('boost', squadMember.x, squadMember.y, squadMember.z, [50, 255, 50]);
          // Update score
          score += 100;
        } else if (powerUp.type === 'damage') {
          // Accumulate damage boost
          damageBoost += powerUp.value;
          // Create a visual effect
          createEffect('boost', squadMember.x, squadMember.y, squadMember.z, [255, 50, 50]);
          // Update score
          score += 100;
        } else if (powerUp.type === 'aoe') {
          // Accumulate area of effect boost
          aoeBoost += powerUp.value;
          // Create a visual effect
          createEffect('boost', squadMember.x, squadMember.y, squadMember.z, [50, 50, 255]);
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
  
  // Enemy-Squad Collisions
  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    
    for (let j = squad.length - 1; j >= 0; j--) {
      let member = squad[j];
      
      if (dist(enemy.x, enemy.y, enemy.z, member.x, member.y, member.z) < (enemy.size/2 + member.size/2)) {
        // Squad member takes damage
        member.health -= 20;
        
        if (member.health <= 0) {
          // Squad member is defeated
          squad.splice(j, 1);
          
          // Game over if all squad members are defeated
          if (squad.length === 0) {
            gameState = 'gameOver';
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
  
  // In debug mode, progress after killing ENEMIES_TO_KILL_FOR_NEXT_WAVE enemies OR when all enemies are gone
  // In normal mode, require all enemies to be gone AND minimum time to pass
  if ((DEBUG_MODE && enemiesKilled >= ENEMIES_TO_KILL_FOR_NEXT_WAVE) || 
      (enemies.length === 0 && timeInWave > waveTime)) {
    // Reset the enemies killed counter for next wave
    enemiesKilled = 0;
    currentWave++;
    gameStartTime = frameCount;
    
    // Spawn some power-ups as rewards
    for (let i = 0; i < min(currentWave, 3); i++) {
      const x = random(BRIDGE_WIDTH/2 + 20, BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH - 20);
      const y = random(-BRIDGE_LENGTH/2 + 100, BRIDGE_LENGTH/2 - 100);
      
      // Mix of mirror and weapon power-ups
      const possibleTypes = ['mirror'];
      if (currentWave >= 2 && !weapons.thunderbolt) possibleTypes.push('thunderbolt');
      if (currentWave >= 3 && !weapons.inferno) possibleTypes.push('inferno');
      if (currentWave >= 5 && !weapons.frostbite) possibleTypes.push('frostbite');
      if (currentWave >= 7 && !weapons.vortex) possibleTypes.push('vortex');
      if (currentWave >= 10 && !weapons.plasma) possibleTypes.push('plasma');
      if (currentWave >= 15 && !weapons.photon) possibleTypes.push('photon');
      
      const type = random(possibleTypes);
      
      powerUps.push({
        x: x,
        y: y,
        z: 0,
        type: type
      });
    }
  }
}

// Skill system
function activateSkill(skillNumber) {
  // Handle both string and number formats
  let skillKey;
  if (typeof skillNumber === 'string' && skillNumber.startsWith('skill')) {
    skillKey = skillNumber;
    skillNumber = parseInt(skillNumber.replace('skill', ''));
  } else {
    skillKey = `skill${skillNumber}`;
  }
  
  // In debug mode, ignore cooldowns; in normal mode, check cooldowns
  if (!DEBUG_MODE && frameCount - skills[skillKey].lastUsed < skills[skillKey].cooldown) {
    // Skill on cooldown (only in non-debug mode)
    return;
  }
  
  // Apply skill effect with accumulative power-ups
  switch(skillNumber) {
    case 1: // Area damage - damages all enemies in view
      let aoeRadius = 150 + (aoeBoost * 15); // Base radius expanded by AOE boost
      let aoeDamage = 30 + (damageBoost * 2); // Damage enhanced by damage boost
      
      // Get squad center for AOE effect
      let squadCenter = {x: 0, y: 0, z: 0};
      if (squad.length > 0) {
        squadCenter = {x: squad[0].x, y: squad[0].y, z: squad[0].z};
      }
      
      // Create larger explosion based on AOE boost
      createExplosion(squadCenter.x, squadCenter.y, squadCenter.z, [255, 200, 0]);
      
      // Apply damage to all enemies in radius
      for (let enemy of enemies) {
        let distance = dist(squadCenter.x, squadCenter.y, enemy.x, enemy.y);
        if (distance <= aoeRadius) {
          enemy.health -= aoeDamage;
          createHitEffect(enemy.x, enemy.y, enemy.z, [255, 200, 0]);
        }
      }
      break;
      
    case 2: // Super shot - fewer but more powerful shots
      // Create a burst of powerful shots instead of increasing fire rate
      let superShotBaseDamage = 5; // 5x damage
      let superShotAdditionalDamage = damageBoost * 0.5; // Each damage boost adds 0.5x
      let superShotTotalMultiplier = superShotBaseDamage + superShotAdditionalDamage;
      
      // Visual effect around squad members
      for (let member of squad) {
        createHitEffect(member.x, member.y, member.z, [255, 255, 0]);
        
        // Fire a single powerful shot
        let projectile = {
          x: member.x,
          y: member.y,
          z: member.z + member.size/2,
          weapon: member.weapon || currentWeapon,
          speed: PROJECTILE_SPEED * 1.5, // Faster projectile
          damage: getWeaponDamage(member.weapon || currentWeapon) * superShotTotalMultiplier,
          size: PROJECTILE_SIZE * 2, // Larger projectile
          isSuperShot: true,
          color: [255, 255, 0] // Yellow super shot
        };
        
        projectiles.push(projectile);
      }
      break;
      
    case 3: // Shield - temporary invulnerability with enhanced durability
      let shieldStrength = 100 + (damageBoost * 10); // Shield strength enhanced by damage boost
      let shieldDuration = 300 + (fireRateBoost * 30); // Duration enhanced by fire rate (5s + boost)
      
      for (let member of squad) {
        member.shielded = true;
        member.shieldHealth = shieldStrength;
        
        // Visual shield effect
        effects.push({
          x: member.x,
          y: member.y,
          z: member.z,
          type: 'shield',
          size: member.size * (1.5 + (aoeBoost * 0.1)), // Shield size enhanced by AOE
          life: shieldDuration,
          member: member // reference to follow the member
        });
      }
      
      // Remove shields after duration
      setTimeout(() => {
        for (let member of squad) {
          member.shielded = false;
          member.shieldHealth = 0;
        }
      }, shieldDuration * (1000/60)); // Convert frames to ms
      break;
      
    case 4: // Freeze all enemies with enhanced duration/effect
      let freezeDuration = 180 + (fireRateBoost * 15); // Base 3s + 0.25s per fire rate boost
      let freezeStrength = 0.2 - (aoeBoost * 0.02); // More slowdown with AOE boost
      
      for (let enemy of enemies) {
        if (!enemy.effects) enemy.effects = {};
        enemy.effects.frozen = { 
          duration: freezeDuration, 
          slowFactor: max(0.05, freezeStrength) // Min 5% of normal speed
        };
        enemy.speed *= enemy.effects.frozen.slowFactor;
        createIceEffect(enemy.x, enemy.y, enemy.z);
      }
      break;
      
    case 5: // Heal all squad members with enhanced healing
      let healAmount = 50 + (damageBoost * 5); // Base 50 + 5 per damage boost
      
      for (let member of squad) {
        member.health = min(SQUAD_HEALTH, member.health + healAmount); // Use configurable SQUAD_HEALTH instead of hardcoded 100
        createHitEffect(member.x, member.y, member.z, [0, 255, 0]);
      }
      break;
      
    case 6: // Damage boost for 10 seconds with enhanced effect
      let damageBoostBase = 2; // Double damage
      let damageBoostAdditional = 0.2 * damageBoost; // 20% more per damage boost
      let damageBoostTotalMultiplier = damageBoostBase + damageBoostAdditional;
      let damageBoostDuration = DEBUG_MODE ? 1800 : 600 + (fireRateBoost * 60); // 30s in debug mode, 10s + 1s per fire rate in normal mode
      
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
      }, damageBoostDuration * (1000/60)); // Convert frames to ms
      break;
      
    case 7: // Speed boost for squad with enhanced effect
      let baseSpeedBoost = 1.5; // 50% faster
      let additionalSpeedBoost = 0.1 * fireRateBoost; // 10% more per fire rate boost
      let totalSpeedMultiplier = baseSpeedBoost + additionalSpeedBoost;
      let speedBoostDuration = 480 + (fireRateBoost * 30); // 8s + 0.5s per fire rate
      
      let oldSpeed = squadSpeed;
      squadSpeed *= totalSpeedMultiplier;
      
      // Visual effect
      for (let member of squad) {
        createHitEffect(member.x, member.y, member.z, [0, 255, 255]);
      }
      
      // Reset after duration
      setTimeout(() => {
        squadSpeed = oldSpeed;
      }, speedBoostDuration * (1000/60)); // Convert frames to ms
      break;
      
    case 8: // Ultimate - massive damage to all enemies and spawn power-ups
      // Enhanced damage based on accumulated damage boost
      let ultimateDamage = 100 + (damageBoost * 15);
      let ultimateAoeRadius = 400 + (aoeBoost * 20);
      
      // Enhanced explosion effect
      createExplosion(0, 0, 0, [255, 255, 255]);
      
      // Damage all enemies with enhanced damage
      for (let enemy of enemies) {
        enemy.health -= ultimateDamage;
        createExplosion(enemy.x, enemy.y, enemy.z, [255, 255, 255]);
      }
      
      // Spawn enhanced power-ups based on current boosts
      let powerUpCount = 3 + Math.floor((fireRateBoost + damageBoost + aoeBoost) / 5);
      let types = ['mirror', 'fire_rate', 'damage', 'aoe'];
      
      for (let i = 0; i < powerUpCount; i++) {
        let laneOffset = random(-POWER_UP_LANE_WIDTH/3, POWER_UP_LANE_WIDTH/3);
        let x = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2 + laneOffset;
        let y = -BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER/2 + 100 + i * (BRIDGE_LENGTH*BRIDGE_LENGTH_MULTIPLIER / (powerUpCount + 1)); // Adjusted for full bridge
        
        // Cycle through power-up types
        let type = types[i % types.length];
        let value = type === 'mirror' ? 1 : (type === 'fire_rate' ? 3 : (type === 'damage' ? 4 : 2));
        
        powerUps.push({
          x: x,
          y: y,
          z: 0,
          type: type,
          value: value,
          speed: POWER_UP_SPEED
        });
      }
      break;
  }
  
  // Set cooldown
  skills[skillKey].lastUsed = frameCount;
}

// UI Functions
function drawMenu() {
  push();
  translate(0, 0, 0);
  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255);
  text("SQUAD SURVIVAL", 0, -100);
  
  textSize(24);
  text("Press ENTER to Start", 0, 0);
  
  textSize(16);
  text("Arrow Keys: Move Squad", 0, 50);
  text("A/S/D/F/Q/W/E/R: Activate Skills", 0, 80);
  text("Mouse Scroll: Zoom", 0, 110);
  text("Mouse Drag: Move Camera", 0, 140);
  pop();
}

function drawPauseScreen() {
  push();
  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255);
  text("PAUSED", 0, 0);
  textSize(24);
  text("Press P to Resume", 0, 50);
  pop();
}

// Draw pause button in top right corner
function drawPauseButton() {
  push();
  // Reset transformations to draw in screen coordinates
  resetMatrix();
  
  // Pause button background
  fill(0, 0, 0, 150);
  rect(width - 60, 10, 50, 50, 5);
  
  // Pause icon (two vertical bars)
  fill(255);
  rect(width - 45, 20, 7, 30);
  rect(width - 32, 20, 7, 30);
  
  pop();
}

// Draw resume button in top right corner
function drawResumeButton() {
  push();
  // Reset transformations to draw in screen coordinates
  resetMatrix();
  
  // Resume button background
  fill(0, 0, 0, 150);
  rect(width - 60, 10, 50, 50, 5);
  
  // Play triangle
  fill(255);
  triangle(
    width - 45, 20,
    width - 45, 50,
    width - 20, 35
  );
  
  pop();
}

function drawGameOverScreen() {
  push();
  textSize(32);
  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  text("GAME OVER", 0, -50);
  
  textSize(24);
  fill(255);
  text(`Wave Reached: ${currentWave}`, 0, 0);
  text(`Final Score: ${score}`, 0, 30);
  
  textSize(20);
  text("Press ENTER to Restart", 0, 80);
  pop();
}

function drawHUD() {
  // Reset camera transformations for HUD
  push();
  camera();
  perspective();
  
  // Need to reset to 2D for proper text rendering
  textFont(gameFont);
  
  // Draw status board on left side
  drawStatusBoard();
  
  // Draw technical board on right side
  drawTechnicalBoard();
  
  // Skill cooldowns at bottom
  drawSkillBar();
  
  pop();
}

function drawStatusBoard() {
  // Save current style settings
  push();
  
  // Apply vibrant styling to match technical board
  stroke(0, 255, 0); // Green border
  strokeWeight(4);
  fill(30, 50, 30, 250); // Nearly opaque dark green background
  rect(20, 10, 340, 230, 15); // Left top position with rounded corners
  
  // Glow effect
  noFill();
  stroke(0, 255, 0, 150); 
  strokeWeight(8);
  rect(370, 10, 340, 230, 15);
  
  // Reset drawing settings
  strokeWeight(1);
  noStroke();
  
  // Title with high contrast
  textSize(28);
  textAlign(LEFT, TOP);
  fill(0, 255, 0); // Green text for visibility
  text("STATUS BOARD", 40, 20);
  
  // Game info with bright colors
  textSize(22);
  fill(255, 255, 255); // White text
  text(`Wave: ${currentWave}`, 40, 60);
  text(`Score: ${score}`, 40, 90);
  text(`Squad Members: ${squad.length}/${MAX_SQUAD_SIZE}`, 40, 120);
  text(`Enemies Killed: ${enemiesKilled}`, 40, 150);
  
  // Add kills needed for next wave
  fill(255, 255, 0); // Yellow text
  text(`Kills for Next Wave: ${enemiesKilled}/${ENEMIES_TO_KILL_FOR_NEXT_WAVE}`, 40, 180);
  
  // Health status with color coding
  const avgHealth = squad.length > 0 ? squad.reduce((sum, member) => sum + member.health, 0) / squad.length : 0;
  fill(avgHealth > 50 ? [0, 255, 0] : avgHealth > 25 ? [255, 255, 0] : [255, 0, 0]);
  text(`Squad Health: ${Math.floor(avgHealth)}%`, 40, 210);
  
  // Draw a health bar
  stroke(255);
  strokeWeight(1);
  noFill();
  rect(225, 210, 100, 20);
  noStroke();
  fill(avgHealth > 50 ? [0, 255, 0] : avgHealth > 25 ? [255, 255, 0] : [255, 0, 0]);
  rect(225, 210, avgHealth, 20);
  
  // Pop style settings
  pop();
}

function drawTechnicalBoard() {
  // Move to RIGHT side of screen for better visibility
  push(); // Save current style settings
  
  // Very vibrant styling
  stroke(255, 0, 255); // Magenta border
  strokeWeight(4);
  fill(30, 30, 50, 250); // Nearly opaque dark background
  rect(700, 10, 340, 230, 15); // Right side position with rounded corners
  
  // Glow effect
  noFill();
  stroke(255, 0, 255, 150);
  strokeWeight(8);
  rect(20, 220, 340, 230, 15);
  
  // Reset drawing settings
  strokeWeight(1);
  noStroke();
  
  // Title with high contrast
  textSize(28);
  textAlign(LEFT, TOP);
  fill(255, 0, 255); // Magenta text for visibility
  text("TECHNICAL BOARD", 720, 30);
  
  // Add debug mode indicator if in debug mode
  if (DEBUG_MODE) {
    fill(0, 255, 255); // Cyan for debug indicator
    textSize(22);
    text("✓ DEBUG MODE ACTIVE", 720, 65);
  }
  
  textSize(20);
  fill(255, 255, 255); // Bright white text for maximum visibility
  
  // Camera position
  text(`Camera: x=${Math.floor(cameraOffsetX)}, y=${Math.floor(cameraOffsetY)}, z=${Math.floor(cameraZoom)}`, 720, 100);
  
  // Time elapsed
  const elapsedSeconds = Math.floor((millis() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  text(`Time: ${minutes}m ${seconds}s`, 720, 130);
  
  // Frame rate
  text(`Frame Rate: ${Math.floor(frameRate())} fps`, 720, 160);
  
  // Additional useful info with bright highlighting
  fill(0, 255, 0); // Bright green for important stats
  text(`Squad Size: ${squad.length}/${MAX_SQUAD_SIZE}`, 720, 190);
  text(`Wave: ${currentWave}`, 720, 220);
  
  pop(); // Restore previous style settings
  
  // Object counts
  const objectCount = squad.length + enemies.length + projectiles.length + powerUps.length;
  text(`Objects: ${objectCount}`, width - 250, 125);
}

function drawSkillBar() {
  // Background for skill bar
  fill(0, 0, 0, 150);
  rect(10, height - 80, width - 20, 70);
  
  // Skill cooldowns
  textSize(16);
  for (let i = 1; i <= 8; i++) {
    const skillKey = `skill${i}`;
    const cooldownRemaining = skills[skillKey].cooldown - (frameCount - skills[skillKey].lastUsed);
    const cooldownPercent = max(0, cooldownRemaining) / skills[skillKey].cooldown;
    
    // Skill name
    fill(255);
    text(getSkillName(i), 20 + (i-1) * (width-40)/8, height - 75);
    
    // Draw skill icon and cooldown
    fill(50, 50, 50);
    rect(20 + (i-1) * (width-40)/8, height - 60, (width-60)/8, 40);
    
    // Cooldown overlay
    fill(0, 0, 0, 200 * cooldownPercent);
    rect(20 + (i-1) * (width-40)/8, height - 60, (width-60)/8, 40 * cooldownPercent);
    
    // Key binding
    fill(255);
    text(getSkillKey(i), 30 + (i-1) * (width-40)/8, height - 40);
  }
}

function getSkillKey(skillNumber) {
  switch(skillNumber) {
    case 1: return 'A';
    case 2: return 'S';
    case 3: return 'D';
    case 4: return 'F';
    case 5: return 'Q';
    case 6: return 'W';
    case 7: return 'E';
    case 8: return 'R';
    default: return '';
  }
}

function getSkillName(skillNumber) {
  switch(skillNumber) {
    case 1: return 'Area Damage';
    case 2: return 'Fire Rate+';
    case 3: return 'Shield';
    case 4: return 'Freeze';
    case 5: return 'Heal';
    case 6: return 'Damage+';
    case 7: return 'Speed+';
    case 8: return 'Ultimate';
    default: return '';
  }
}

// Input handlers
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'menu' || gameState === 'gameOver') {
      // Start or restart game
      resetGame();
      gameState = 'playing';
      gameStartTime = frameCount;
    }
  }
  
  // Toggle pause with Escape key
  if (keyCode === ESCAPE || key === 'p' || key === 'P') {
    togglePause();
  }
  
  // Only process skill keys during gameplay
  if (gameState === 'playing') {
    // Bottom row skills (A, S, D, F)
    if (key === 'a' || key === 'A') {
      activateSkill(1);
    } else if (key === 's' || key === 'S') {
      activateSkill(2);
    } else if (key === 'd' || key === 'D') {
      activateSkill(3);
    } else if (key === 'f' || key === 'F') {
      activateSkill(4);
    }
    
    // Top row skills (Q, W, E, R)
    if (key === 'q' || key === 'Q') {
      activateSkill(5);
    } else if (key === 'w' || key === 'W') {
      activateSkill(6);
    } else if (key === 'e' || key === 'E') {
      activateSkill(7);
    } else if (key === 'r' || key === 'R') {
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
    cameraOffsetX += (mouseX - prevMouseX);
    cameraOffsetY += (mouseY - prevMouseY);
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
  enemiesKilled = 0;
  startTime = millis();
  
  // Reset squad
  squad = [{
    x: 0,
    y: BRIDGE_LENGTH / 2 - 100,
    z: 0,
    size: SQUAD_SIZE,
    health: 100,
    weapon: 'blaster'
  }];
  
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
    photon: false
  };
  currentWeapon = 'blaster';
  
  // Reset skills
  for (let i = 1; i <= 8; i++) {
    skills[`skill${i}`].lastUsed = 0;
  }
  
  // Reset camera
  cameraOffsetX = 0;
  cameraOffsetY = 0;
  cameraZoom = 800;
}

function updateEffects() {
  // Update effects lifetimes and remove dead effects
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].life--;
    if (effects[i].life <= 0) {
      effects.splice(i, 1);
    }
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
      if (enemy.type === 'standard') score += 10;
      else if (enemy.type === 'elite') score += 25;
      else if (enemy.type === 'boss1') score += 100;
      else if (enemy.type === 'boss2') score += 250;
      else if (enemy.type === 'boss3') score += 500;
      
      // Increment enemies killed counter
      enemiesKilled++;
      
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
  
  if (enemyType === 'elite') {
    baseHealth = 60;
  } else if (enemyType === 'boss1') {
    baseHealth = 150;
  } else if (enemyType === 'boss2') {
    baseHealth = 300;
  } else if (enemyType === 'boss3') {
    baseHealth = 500;
  }
  
  return Math.floor(baseHealth * (1 + currentWave * 0.1));
}

// Visual effects functions
function createExplosion(x, y, z, color) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'explosion',
    color: color,
    size: 30,
    life: EFFECT_DURATION
  });
}

function createHitEffect(x, y, z, color) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'hit',
    color: color,
    size: 15,
    life: EFFECT_DURATION / 2
  });
}

function createFireEffect(x, y, z) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'fire',
    size: 20,
    life: EFFECT_DURATION
  });
}

function createIceEffect(x, y, z) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'ice',
    size: 20,
    life: EFFECT_DURATION
  });
}

function createThunderEffect(x, y, z) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'thunder',
    size: 20,
    life: EFFECT_DURATION
  });
}

function createVortexEffect(x, y, z) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'vortex',
    size: 20,
    life: EFFECT_DURATION
  });
}

function createPlasmaEffect(x, y, z) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: 'plasma',
    size: 20,
    life: EFFECT_DURATION
  });
}

// Generic effect creator function
function createEffect(type, x, y, z, color, size) {
  effects.push({
    x: x,
    y: y,
    z: z,
    type: type,
    color: color || [255, 255, 255],
    size: size || 15,
    life: EFFECT_DURATION
  });
}

// Window resize handling
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

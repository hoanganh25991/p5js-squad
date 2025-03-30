// Squad Survival Game
// A 3D p5.js game with squad-based combat

// Game states
let gameState = 'menu'; // menu, playing, paused, gameOver
let currentWave = 1;
let score = 0;
let gameStartTime = 0;

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
  photon: [200, 255, 200]
};

// Squad properties
let squad = [];
const SQUAD_SIZE = 30;
const SQUAD_SPEED = 5;
const SQUAD_FIRE_RATE = 60; // frames between shots
let lastFireTime = 0;

// Enemy properties
let enemies = [];
const ENEMY_SPAWN_RATE = 120; // frames between spawns
let lastEnemySpawn = 0;
const STANDARD_ENEMY_SIZE = 25;
const ELITE_ENEMY_SIZE = 35;
const BOSS_SIZES = [50, 70, 90];

// Projectiles
let projectiles = [];
const PROJECTILE_SPEED = 8;
const PROJECTILE_SIZE = 10;

// Power-ups
let powerUps = [];
const POWER_UP_SIZE = 20;
const POWER_UP_SPAWN_RATE = 600; // frames between power-up spawns
let lastPowerUpSpawn = 0;

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
    y: BRIDGE_LENGTH / 2 - 100, // Starting near the bottom
    z: 0,
    size: SQUAD_SIZE,
    health: 100,
    weapon: 'blaster'
  });
  
  // Set perspective for better 3D view
  perspective(PI / 3.0, width / height, 0.1, 5000);
}

function draw() {
  background(0);
  
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
  checkCollisions();
  spawnEnemies();
  moveEnemies();
  spawnPowerUps();
  checkWaveCompletion();
}

function drawGame() {
  // Draw the bridge (main lane)
  push();
  translate(0, 0, 0);
  fill(...BRIDGE_COLOR);
  box(BRIDGE_WIDTH, BRIDGE_LENGTH, 10);
  pop();
  
  // Draw the power-up lane
  push();
  translate(BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2, 0, 0);
  fill(...POWER_UP_LANE_COLOR);
  box(POWER_UP_LANE_WIDTH, BRIDGE_LENGTH, 10);
  pop();
  
  // Draw squad members
  for (let member of squad) {
    push();
    translate(member.x, member.y, member.z + member.size/2);
    fill(...SQUAD_COLOR);
    box(member.size, member.size, member.size);
    pop();
  }
  
  // Draw enemies
  for (let enemy of enemies) {
    push();
    translate(enemy.x, enemy.y, enemy.z + enemy.size/2);
    fill(...ENEMY_COLORS[enemy.type]);
    if (enemy.type.includes('boss')) {
      sphere(enemy.size/2);
    } else {
      box(enemy.size, enemy.size, enemy.size);
    }
    pop();
  }
  
  // Draw projectiles
  for (let proj of projectiles) {
    push();
    translate(proj.x, proj.y, proj.z);
    fill(...WEAPON_COLORS[proj.weapon]);
    sphere(PROJECTILE_SIZE);
    pop();
  }
  
  // Draw power-ups
  for (let powerUp of powerUps) {
    push();
    translate(powerUp.x, powerUp.y, powerUp.z + POWER_UP_SIZE/2);
    
    // Different shapes for different power-up types
    if (powerUp.type === 'mirror') {
      fill(255);
      box(POWER_UP_SIZE, POWER_UP_SIZE, POWER_UP_SIZE);
    } else {
      // Weapon power-ups
      fill(...WEAPON_COLORS[powerUp.type]);
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
      mainMember.x -= SQUAD_SPEED;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      mainMember.x += SQUAD_SPEED;
    }
    if (keyIsDown(UP_ARROW)) {
      mainMember.y -= SQUAD_SPEED;
    }
    if (keyIsDown(DOWN_ARROW)) {
      mainMember.y += SQUAD_SPEED;
    }
    
    // Constrain to bridge boundaries
    const leftBound = -BRIDGE_WIDTH/2;
    const rightBound = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH;
    const topBound = -BRIDGE_LENGTH/2;
    const bottomBound = BRIDGE_LENGTH/2;
    
    mainMember.x = constrain(mainMember.x, leftBound, rightBound);
    mainMember.y = constrain(mainMember.y, topBound, bottomBound);
    
    // Formation - arrange other squad members around the main one
    if (squad.length > 1) {
      const spacing = SQUAD_SIZE * 1.2;
      for (let i = 1; i < squad.length; i++) {
        // Position in a grid formation around the main member
        const row = Math.floor((i-1) / 3);
        const col = (i-1) % 3;
        squad[i].x = mainMember.x + (col - 1) * spacing;
        squad[i].y = mainMember.y + (row + 1) * spacing;
        
        // Constrain other members as well
        squad[i].x = constrain(squad[i].x, leftBound, rightBound);
        squad[i].y = constrain(squad[i].y, topBound, bottomBound);
      }
    }
    
    // Auto-firing
    if (frameCount - lastFireTime > SQUAD_FIRE_RATE) {
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
  switch(weapon) {
    case 'blaster': return 10;
    case 'thunderbolt': return 25;
    case 'inferno': return 15; // Plus DoT effect
    case 'frostbite': return 15; // Plus CC effect
    case 'vortex': return 20; // AoE damage
    case 'plasma': return 30; // Spread damage
    case 'photon': return 40; // High precision
    default: return 10;
  }
}

function updateProjectiles() {
  // Move projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let proj = projectiles[i];
    proj.y -= proj.speed; // Move upward (toward enemies)
    
    // Remove projectiles that go off-screen
    if (proj.y < -BRIDGE_LENGTH/2) {
      projectiles.splice(i, 1);
    }
  }
}

// Enemy spawning and movement
function spawnEnemies() {
  if (frameCount - lastEnemySpawn > ENEMY_SPAWN_RATE) {
    // Calculate spawn rate based on current wave
    const spawnChance = 0.5 + (currentWave * 0.05);
    
    if (random() < spawnChance) {
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
      
      // Enemies mostly spawn in the main lane, occasionally in power-up lane
      const spawnInPowerUpLane = random() < 0.2;
      const x = spawnInPowerUpLane 
        ? random(BRIDGE_WIDTH/2, BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH)
        : random(-BRIDGE_WIDTH/2, BRIDGE_WIDTH/2);
      
      enemies.push({
        x: x,
        y: -BRIDGE_LENGTH/2 + 100, // Near the top
        z: 0,
        size: size,
        type: type,
        health: health,
        speed: type.includes('boss') ? 1 : 2
      });
      
      lastEnemySpawn = frameCount;
    }
  }
}

function moveEnemies() {
  for (let enemy of enemies) {
    // Basic movement - advance toward the squad
    enemy.y += enemy.speed;
    
    // Add some side-to-side movement for elites and bosses
    if (enemy.type === 'elite' || enemy.type.includes('boss')) {
      enemy.x += sin(frameCount * 0.05) * 1;
      
      // Keep within bridge boundaries
      const leftBound = enemy.type.includes('boss') ? -BRIDGE_WIDTH/2 : -BRIDGE_WIDTH/2;
      const rightBound = BRIDGE_WIDTH/2 + (enemy.type.includes('boss') ? POWER_UP_LANE_WIDTH : 0);
      enemy.x = constrain(enemy.x, leftBound, rightBound);
    }
  }
}

// Power-up system
function spawnPowerUps() {
  if (frameCount - lastPowerUpSpawn > POWER_UP_SPAWN_RATE) {
    // Power-ups have a chance to spawn
    if (random() < 0.3) {
      // Potential power-up types
      let types = ['mirror'];
      // Add weapon power-ups once the game progresses
      if (currentWave >= 2) types.push('thunderbolt');
      if (currentWave >= 3) types.push('inferno');
      if (currentWave >= 5) types.push('frostbite');
      if (currentWave >= 7) types.push('vortex');
      if (currentWave >= 10) types.push('plasma');
      if (currentWave >= 15) types.push('photon');
      
      // Select a random type
      const type = random(types);
      
      // Power-ups mainly spawn in the power-up lane
      const x = random(BRIDGE_WIDTH/2 + 20, BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH - 20);
      const y = random(-BRIDGE_LENGTH/2 + 100, BRIDGE_LENGTH/2 - 100);
      
      powerUps.push({
        x: x,
        y: y,
        z: 0,
        type: type
      });
      
      lastPowerUpSpawn = frameCount;
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
        
        // Apply special effects based on weapon
        if (proj.weapon === 'inferno') {
          // DoT effect - additional damage over time
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.burning = { duration: 180, damage: 2 };
        } else if (proj.weapon === 'frostbite') {
          // CC effect - slow movement
          if (!enemy.effects) enemy.effects = {};
          enemy.effects.frozen = { duration: 120, slowFactor: 0.5 };
          enemy.speed *= 0.5;
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
          if (squad.length < 10) { // Limit squad size
            squad.push({
              x: squadMember.x,
              y: squadMember.y + SQUAD_SIZE,
              z: 0,
              size: SQUAD_SIZE,
              health: 100,
              weapon: currentWeapon
            });
          }
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
  // Wave is complete when all enemies are defeated
  // We'll also have a minimum time for each wave
  const waveTime = 60 * 60; // 60 seconds at 60fps
  const timeInWave = frameCount - gameStartTime;
  
  if (enemies.length === 0 && timeInWave > waveTime) {
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
  const skillKey = `skill${skillNumber}`;
  if (frameCount - skills[skillKey].lastUsed < skills[skillKey].cooldown) {
    // Skill on cooldown
    return;
  }
  
  // Apply skill effect
  switch(skillNumber) {
    case 1: // Area damage
      for (let enemy of enemies) {
        enemy.health -= 30;
      }
      break;
    case 2: // Temporary fire rate boost
      SQUAD_FIRE_RATE = 30; // Half the normal cooldown
      setTimeout(() => { SQUAD_FIRE_RATE = 60; }, 5000);
      break;
    case 3: // Shield - temporary invulnerability
      // Implementation would go here
      break;
    case 4: // Freeze all enemies
      for (let enemy of enemies) {
        if (!enemy.effects) enemy.effects = {};
        enemy.effects.frozen = { duration: 180, slowFactor: 0.2 };
        enemy.speed *= 0.2;
      }
      break;
    // More skills would be implemented here
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
  
  // Display wave number and score
  textSize(20);
  textAlign(LEFT, TOP);
  fill(255);
  text(`Wave: ${currentWave}`, 20, 20);
  text(`Score: ${score}`, 20, 50);
  
  // Display squad info
  text(`Squad Size: ${squad.length}`, 20, 80);
  
  // Current weapon
  text(`Weapon: ${currentWeapon}`, 20, 110);
  
  // Skill cooldowns
  textSize(16);
  for (let i = 1; i <= 8; i++) {
    const skillKey = `skill${i}`;
    const cooldownRemaining = skills[skillKey].cooldown - (frameCount - skills[skillKey].lastUsed);
    const cooldownPercent = max(0, cooldownRemaining) / skills[skillKey].cooldown;
    
    // Draw skill icon and cooldown
    fill(255);
    rect(20 + (i-1) * 60, height - 70, 50, 50);
    
    // Cooldown overlay
    fill(0, 0, 0, 200 * cooldownPercent);
    rect(20 + (i-1) * 60, height - 70, 50, 50 * cooldownPercent);
    
    // Key binding
    fill(255);
    text(getSkillKey(i), 40 + (i-1) * 60, height - 40);
  }
  
  pop();
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

// Input handlers
function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'menu' || gameState === 'gameOver') {
      // Start or restart game
      resetGame();
      gameState = 'playing';
      gameStartTime = frameCount;
    }
  } else if (key === 'p' || key === 'P') {
    if (gameState === 'playing') {
      gameState = 'paused';
    } else if (gameState === 'paused') {
      gameState = 'playing';
    }
  } else if (gameState === 'playing') {
    // Skill activation
    if (key === 'a' || key === 'A') activateSkill(1);
    if (key === 's' || key === 'S') activateSkill(2);
    if (key === 'd' || key === 'D') activateSkill(3);
    if (key === 'f' || key === 'F') activateSkill(4);
    if (key === 'q' || key === 'Q') activateSkill(5);
    if (key === 'w' || key === 'W') activateSkill(6);
    if (key === 'e' || key === 'E') activateSkill(7);
    if (key === 'r' || key === 'R') activateSkill(8);
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

// Window resize handling
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

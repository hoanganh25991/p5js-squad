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
let squad = [];
const SQUAD_SIZE = 30;
const SQUAD_SPEED = 5;
const SQUAD_FIRE_RATE = 30; // frames between shots (faster firing rate)
const MAX_SQUAD_SIZE = 20; // Maximum number of squad members
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
const MIRROR_SPAWN_CHANCE = 0.8; // 80% chance for mirror +1 to spawn
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
  updateEffects();
  checkCollisions();
  spawnEnemies();
  moveEnemies();
  spawnPowerUps();
  applyEnemyEffects();
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
    const projColor = WEAPON_COLORS[proj.weapon] || [255, 255, 255];
    fill(...projColor);
    
    // Different projectile shapes based on weapon type
    if (proj.weapon === 'blaster') {
      // Green laser beam
      sphere(PROJECTILE_SIZE);
    } else if (proj.weapon === 'thunderbolt') {
      // Thunder projectile
      cone(PROJECTILE_SIZE, PROJECTILE_SIZE * 2);
    } else if (proj.weapon === 'inferno') {
      // Fire projectile
      box(PROJECTILE_SIZE, PROJECTILE_SIZE, PROJECTILE_SIZE);
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
    
    if (effect.type === 'explosion') {
      // Explosion effect
      fill(...effect.color, 255 * (effect.life / EFFECT_DURATION));
      sphere(effect.size * (1 + (1 - effect.life / EFFECT_DURATION) * 2));
    } else if (effect.type === 'hit') {
      // Hit effect
      fill(...effect.color, 255 * (effect.life / EFFECT_DURATION));
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
    case 'blaster': return 20; // Increased base damage
    case 'thunderbolt': return 45; // Increased damage
    case 'inferno': return 30; // Plus DoT effect, increased damage
    case 'frostbite': return 30; // Plus CC effect, increased damage
    case 'vortex': return 40; // AoE damage, increased damage
    case 'plasma': return 60; // Spread damage, increased damage
    case 'photon': return 80; // High precision, increased damage
    default: return 20;
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
      y: -BRIDGE_LENGTH/2 + 100, // Near the top
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
    y: -BRIDGE_LENGTH/2 + 100, // Near the top
    z: 0,
    size: size,
    type: type,
    health: health,
    speed: type.includes('boss') ? 1.5 : 3 // Faster enemies for more action
  });
}

function moveEnemies() {
  for (let enemy of enemies) {
    // Straight line movement - advance toward the squad
    enemy.y += enemy.speed;
    
    // Only bosses have side-to-side movement (limited)
    if (enemy.type.includes('boss')) {
      enemy.x += sin(frameCount * 0.05) * 1;
      
      // Keep within bridge boundaries
      const leftBound = -BRIDGE_WIDTH/2;
      const rightBound = BRIDGE_WIDTH/2 + (enemy.type.includes('boss') ? POWER_UP_LANE_WIDTH : 0);
      enemy.x = constrain(enemy.x, leftBound, rightBound);
    }
  }
}

// Power-up system
function spawnPowerUps() {
  if (frameCount - lastPowerUpSpawn > POWER_UP_SPAWN_RATE) {
    // Always spawn power-ups (continuous spawning)
    // Determine if this is a mirror or other powerup
    const isMirror = random() < MIRROR_SPAWN_CHANCE;
    
    // Potential power-up types
    let types = isMirror ? ['mirror'] : [];
    // Add weapon power-ups once the game progresses if not spawning mirror
    if (!isMirror) {
      if (currentWave >= 2) types.push('thunderbolt');
      if (currentWave >= 3) types.push('inferno');
      if (currentWave >= 5) types.push('frostbite');
      if (currentWave >= 7) types.push('vortex');
      if (currentWave >= 10) types.push('plasma');
      if (currentWave >= 15) types.push('photon');
    }
    
    // Select a random type (will be mirror if isMirror is true)
    const type = isMirror ? 'mirror' : random(types);
    
    // Add some randomness to power-up lane position
    const laneOffset = random(-POWER_UP_LANE_WIDTH/4, POWER_UP_LANE_WIDTH/4);
    const x = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2 + laneOffset;
    const y = -BRIDGE_LENGTH/2 + 100; // Start at the top of the lane
    
    powerUps.push({
      x: x,
      y: y,
      z: 0,
      type: type,
      speed: POWER_UP_SPEED + random(-0.5, 1) // Slightly varied speeds
    });
    
    lastPowerUpSpawn = frameCount;
  }
  
  // Move power-ups down the lane
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].y += powerUps[i].speed;
    
    // Remove power-ups that go off-screen
    if (powerUps[i].y > BRIDGE_LENGTH/2) {
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
    case 1: // Area damage - damages all enemies in view
      for (let enemy of enemies) {
        enemy.health -= 30;
        createExplosion(enemy.x, enemy.y, enemy.z, [255, 200, 0]);
      }
      break;
      
    case 2: // Temporary fire rate boost
      const oldFireRate = SQUAD_FIRE_RATE;
      SQUAD_FIRE_RATE = Math.floor(SQUAD_FIRE_RATE / 2); // Double fire rate
      
      // Visual effect around squad members
      for (let member of squad) {
        createHitEffect(member.x, member.y, member.z, [255, 255, 0]);
      }
      
      // Reset after 5 seconds
      setTimeout(() => { 
        SQUAD_FIRE_RATE = oldFireRate; 
      }, 5000);
      break;
      
    case 3: // Shield - temporary invulnerability
      for (let member of squad) {
        member.shielded = true;
        
        // Visual shield effect
        effects.push({
          x: member.x,
          y: member.y,
          z: member.z,
          type: 'shield',
          size: member.size * 1.5,
          life: 300, // 5 seconds at 60fps
          member: member // reference to follow the member
        });
      }
      
      // Remove shields after 5 seconds
      setTimeout(() => {
        for (let member of squad) {
          member.shielded = false;
        }
      }, 5000);
      break;
      
    case 4: // Freeze all enemies
      for (let enemy of enemies) {
        if (!enemy.effects) enemy.effects = {};
        enemy.effects.frozen = { duration: 180, slowFactor: 0.2 };
        enemy.speed *= 0.2;
        createIceEffect(enemy.x, enemy.y, enemy.z);
      }
      break;
      
    case 5: // Heal all squad members
      for (let member of squad) {
        member.health = min(100, member.health + 50); // Heal 50 HP, max 100
        createHitEffect(member.x, member.y, member.z, [0, 255, 0]);
      }
      break;
      
    case 6: // Damage boost for 10 seconds
      for (let member of squad) {
        member.damageBoost = 2; // Double damage
        createHitEffect(member.x, member.y, member.z, [255, 0, 0]);
      }
      
      // Reset after 10 seconds
      setTimeout(() => {
        for (let member of squad) {
          member.damageBoost = 1;
        }
      }, 10000);
      break;
      
    case 7: // Speed boost for squad
      const oldSpeed = SQUAD_SPEED;
      SQUAD_SPEED *= 1.5;
      
      // Visual effect
      for (let member of squad) {
        createHitEffect(member.x, member.y, member.z, [0, 255, 255]);
      }
      
      // Reset after 8 seconds
      setTimeout(() => {
        SQUAD_SPEED = oldSpeed;
      }, 8000);
      break;
      
    case 8: // Ultimate - massive damage to all enemies and spawn power-ups
      // Damage all enemies heavily
      for (let enemy of enemies) {
        enemy.health -= 100;
        createExplosion(enemy.x, enemy.y, enemy.z, [255, 255, 255]);
      }
      
      // Spawn bonus power-ups
      for (let i = 0; i < 3; i++) {
        const x = BRIDGE_WIDTH/2 + POWER_UP_LANE_WIDTH/2;
        const y = -BRIDGE_LENGTH/2 + 100 + i * 100;
        
        powerUps.push({
          x: x,
          y: y,
          z: 0,
          type: 'mirror',
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
  // Left side board with game status
  fill(0, 0, 0, 150);
  rect(10, 10, 250, 200);
  
  textSize(20);
  textAlign(LEFT, TOP);
  fill(255);
  text("STATUS BOARD", 20, 20);
  
  textSize(16);
  text(`Wave: ${currentWave}`, 20, 50);
  text(`Score: ${score}`, 20, 75);
  text(`Squad Members: ${squad.length}`, 20, 100);
  text(`Enemies Killed: ${enemiesKilled}`, 20, 125);
  
  // Weapon info
  text(`Weapon: ${currentWeapon}`, 20, 150);
  const damage = getWeaponDamage(currentWeapon);
  const fireRate = SQUAD_FIRE_RATE;
  const dps = Math.floor((damage * 60) / fireRate);
  
  const weaponColor = WEAPON_COLORS[currentWeapon] || [255, 255, 255];
  fill(...weaponColor);
  text(`Damage: ${damage} | Fire Rate: ${Math.floor(60/fireRate)} | DPS: ${dps}`, 20, 175);
}

function drawTechnicalBoard() {
  // Right side with technical info
  fill(0, 0, 0, 150);
  rect(width - 260, 10, 250, 160);
  
  textSize(20);
  textAlign(LEFT, TOP);
  fill(255);
  text("TECHNICAL BOARD", width - 250, 20);
  
  textSize(16);
  // Camera position
  text(`Camera: x=${Math.floor(cameraOffsetX)}, y=${Math.floor(cameraOffsetY)}, z=${Math.floor(cameraZoom)}`, width - 250, 50);
  
  // Time elapsed
  const elapsedSeconds = Math.floor((millis() - startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  text(`Time: ${minutes}m ${seconds}s`, width - 250, 75);
  
  // Frame rate
  text(`Frame Rate: ${Math.floor(frameRate())} fps`, width - 250, 100);
  
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

// Window resize handling
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Configuration variables

// Visual Effects
let effects = [];

// Squad Mechanics
const INITIAL_SQUAD_SIZE = 1;
const MAX_SQUAD_SIZE = 100;
const SQUAD_SPACING = 25; // Space between squad members
const SQUAD_MEMBER_SIZE = 30; // Size of each squad member

// Bridge Settings
const BRIDGE_LENGTH = 1600 * 10;
const MAIN_LANE_WIDTH = 700; // Main combat area
const POWERUP_LANE_WIDTH = 200; // Wider power-up lane
const BRIDGE_WIDTH = MAIN_LANE_WIDTH + POWERUP_LANE_WIDTH; // 3x wider
const POWERUP_SPAWN_INTERVAL = 3000; // Spawn power-up every 3 seconds

// Gameplay Mechanics
const ENEMIES_TO_KILL = 1_000_000_000;
const MAX_ENEMIES = 100; // More enemies to fill the bridge
const AUTO_FIRE_RATE = 500; // Auto fire every 500ms

// Weapon Properties
const WEAPON_TYPES = {
  BASIC: { name: 'Basic Gun', fireRate: 30, damage: 10, bulletSpeed: 8, bulletSize: 5 },
  MACHINE_GUN: { name: 'Machine Gun', fireRate: 15, damage: 15, bulletSpeed: 10, bulletSize: 6 },
  CANNON: { name: 'Cannon', fireRate: 45, damage: 30, bulletSpeed: 7, bulletSize: 8 },
  LASER: { name: 'Laser Gun', fireRate: 10, damage: 20, bulletSpeed: 12, bulletSize: 4 },
  SUPER_GUN: { name: 'Super Gun', fireRate: 8, damage: 25, bulletSpeed: 15, bulletSize: 7 },
  MEGA_GUN: { name: 'Mega Gun', fireRate: 5, damage: 35, bulletSpeed: 18, bulletSize: 9 }
};

// Power-up Types
const POWERUP_TYPES = {
  MIRROR: { name: 'Mirror', effect: 'squad_size', model: 'mirror' },
  GUN_BASIC: { name: 'Basic Gun Upgrade', effect: 'weapon', nextWeapon: 'MACHINE_GUN' },
  GUN_ADVANCED: { name: 'Advanced Gun', effect: 'weapon', nextWeapon: 'CANNON' },
  GUN_SUPER: { name: 'Super Gun X', effect: 'weapon', nextWeapon: 'SUPER_GUN' },
  GUN_MEGA: { name: 'Mega Gun Y', effect: 'weapon', nextWeapon: 'MEGA_GUN' }
};

// Enemy Types
const ENEMY_TYPES = {
  SOLDIER: { health: 50, speed: 2.5, damage: 15, size: 20, points: 100, meleeRange: 50, color: [255, 50, 50] }, // Red soldier
  FAST: { health: 35, speed: 2.5, damage: 12, size: 18, points: 150, meleeRange: 40, color: [255, 100, 100] }, // Light red
  HEAVY: { health: 80, speed: 1, damage: 20, size: 25, points: 200, meleeRange: 60, color: [200, 50, 50] }, // Dark red
  BOSS1: { health: 300, speed: 0.8, damage: 25, size: 30, points: 1000, meleeRange: 80, color: [180, 0, 0] }, // Deep red
  BOSS2: { health: 500, speed: 1, damage: 30, size: 35, points: 2000, meleeRange: 90, color: [150, 0, 0] }, // Darker red
  BOSS3: { health: 1000, speed: 1.2, damage: 40, size: 40, points: 5000, meleeRange: 100, color: [120, 0, 0] } // Darkest red
};

// Movement Settings
const MIN_CAMERA_DISTANCE = 100;
const MAX_CAMERA_DISTANCE = 1000; // Maximum distance camera can be from player
const PLAYER_MOVE_SPEED = 4;
const MIN_X = -BRIDGE_WIDTH / 2 + 50; // Add margin for squad
const MAX_X = BRIDGE_WIDTH / 2 - 50; // Add margin for squad

// Visual Settings
const AIM_LINE_LENGTH = 2000;

// Camera Settings
const MIN_CAMERA_HEIGHT = -500;
const MAX_CAMERA_HEIGHT = 0;
const MIN_ZOOM_LEVEL = 0.04;
const MAX_ZOOM_LEVEL = 2;

// Game state variables
let squad = {
  x: 0,
  z: 0,
  size: INITIAL_SQUAD_SIZE,
  members: [
    { x: 0, z: 0, health: 100 }, // Leader
  ],
  weapon: WEAPON_TYPES.BASIC,
  lastFireTime: 0,
  direction: 1, // 1 for right, -1 for left
  speed: 3,
  health: 100 // Add squad health
};
squad.size = squad.members.length; // Start with 2 members

let bullets = [];
// No enemy bullets, only melee
let enemies = [];
let powerups = [];
let moving = { left: false, right: false };
let lastPowerupSpawnTime = 0;

function spawnPowerup() {
  if (millis() - lastPowerupSpawnTime > POWERUP_SPAWN_INTERVAL) {
    // Spawn in power-up lane (right side of bridge)
    const x = MAIN_LANE_WIDTH / 2 + POWERUP_LANE_WIDTH / 2; // Center of power-up lane
    const z = squad.z + random(300, 800);

    // Random power-up type
    const types = Object.keys(POWERUP_TYPES);
    const type = POWERUP_TYPES[types[floor(random(types.length))]];

    powerups.push({
      x,
      z,
      type,
      collected: false
    });

    lastPowerupSpawnTime = millis();
  }
}

function checkPowerupCollision() {
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    if (!powerup.collected) {
      const dx = squad.x - powerup.x;
      const dz = squad.z - powerup.z;
      const distance = sqrt(dx * dx + dz * dz);

      if (distance < 30) { // Collection radius
        powerup.collected = true;

        // Apply power-up effect
        if (powerup.type.effect === 'squad_size' && squad.size < MAX_SQUAD_SIZE) {
          squad.size++;
          squad.members.push({
            x: squad.x - squad.size * SQUAD_SPACING * squad.direction,
            z: squad.z,
            health: 100
          });
        } else if (powerup.type.effect === 'weapon') {
          squad.weapon = WEAPON_TYPES[powerup.type.nextWeapon];
        }

        // Remove collected powerup
        powerups.splice(i, 1);
      }
    }
  }
}

let lastSquadAddTime = 0;
const SQUAD_ADD_COOLDOWN = 0; // 2 seconds cooldown

function keyPressed() {
  if (gamePaused) {
    if (key === ' ') {
      gamePaused = !gamePaused;
    }
    return;
  }

  if (key === ' ') {
    gamePaused = !gamePaused;
  } else if ((key === 'a' || key === 'A') && millis() - lastSquadAddTime > SQUAD_ADD_COOLDOWN) {
    // Add new squad member when 'a' is pressed and cooldown is over
    if (squad.size < MAX_SQUAD_SIZE) {
      squad.size++;
      // Calculate position in circle formation
      const radius = SQUAD_SPACING;
      const angle = TWO_PI / squad.size * (squad.size - 1);
      squad.members.push({
        x: squad.x + radius * cos(angle),
        z: squad.z + radius * sin(angle),
        health: 100
      });
      // Reposition all squad members in circle
      for (let i = 0; i < squad.members.length; i++) {
        const memberAngle = TWO_PI / squad.size * i;
        squad.members[i].x = squad.x + radius * cos(memberAngle);
        squad.members[i].z = squad.z + radius * sin(memberAngle);
      }
      lastSquadAddTime = millis(); // Update last add time
    }
  } else if (keyCode === LEFT_ARROW) {
    moving.left = true;
  } else if (keyCode === RIGHT_ARROW) {
    moving.right = true;
  } else if (keyCode === UP_ARROW) {
    moving.up = true;
  } else if (keyCode === DOWN_ARROW) {
    moving.down = true;
  } else if (key.toLowerCase() === "q") {
    rotatingLeft = true;
  } else if (key.toLowerCase() === "w") {
    rotatingRight = true;
  } else if (key.toLowerCase() === "e") {
    increasingHeight = true;
  } else if (key.toLowerCase() === "r") {
    decreasingHeight = true;
  } else if (key.toLowerCase() === "t") {
    movingCloser = true;
  } else if (key.toLowerCase() === "y") {
    movingFarther = true;
  }
}

// Game progress
let enemiesKilled = 0;
let score = 0;
let currentWave = 1;
let gamePaused = true;

// Visual settings
let zoomLevel = 0.2;
let soldierSize = 75;

// Share state with window for external access
window.getState = function () {
  return {
    squadSize: squad.size,
    currentWeapon: squad.weapon.name,
    enemiesKilled: enemiesKilled,
    squadHealth: squad.members[0].health, // Use first member's health
    gamePaused: gamePaused
  };
};

let playerAngle = 0; // Player body angle
let weaponAngle = 0; // Weapon angle
let cameraAngle = 0; // Camera angle
let cameraDistance = 200; // Initial distance from the player

let targetWeaponAngle = 0;

let cameraHeight = MAX_CAMERA_HEIGHT - 112; // Initial camera height
let rotatingLeft = false;
let rotatingRight = false;
let increasingHeight = false;
let decreasingHeight = false;
let movingCloser = false;
let movingFarther = false;

let skillSoundMap = {};
let skillAngle = 0;

let shurikenModel;

let casting = {
  a: false,
  s: false,
  d: false,
  f: false,
  g: false,
  h: false,
};

let lastCastTime = {
  a: 0,
  s: 0,
  d: 0,
  f: 0,
  h: 0,
  g: 0,
};

const cooldown = {
  a: 0, // 2 seconds cooldown for spawning squad members
  s: 500,
  d: 500,
  f: 500,
  g: 500,
  h: 500,
};

window.getState = function () {
  // Calculate average health of squad members
  const avgHealth = squad.members.length > 0
    ? squad.members.reduce((sum, member) => sum + member.health, 0) / squad.members.length
    : 0;

  return {
    squadHealth: Math.round(avgHealth),
    enemiesKilled,
    squadSize: squad.size,
    currentWeapon: squad.weapon.name,
    gamePaused
  };
};

window.setState = function (newState) {
  gamePaused = newState && newState.gamePaused;
};

function preload() {
  // No textures needed for modern style
  skillSoundMap = {
    a: loadSound("steampunk-weapon-single-shot-188051.mp3"),
    s: loadSound("barrett-m107-sound-effect-245967.mp3"),
    d: loadSound("gun-shots-from-a-distance-23-39722.mp3"),
    f: loadSound("gun-shot-sound-effect-224087.mp3"),
    g: loadSound("surprise-sound-effect-99300.mp3"),
    h: loadSound("ocean-wave-fast-236009.mp3"),
  };
  myFont = loadFont("opensans-light.ttf");
  shurikenModel = loadModel("shuriken.obj", true);
  fireBall = loadModel("fireball.obj", true);
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  spawnEnemies(10); // Spawn 10 enemies
  textFont(myFont); // Set the font
  textSize(32); // Set the text size
  textAlign(CENTER, CENTER); // Align text to center
}

let bridgeTexture;

function setupBridge() {
  bridgeTexture = createBridgeTexture();
}

function createBridgeTexture() {
  let pg = createGraphics(200, 200);
  pg.background(150);

  // Add stone pattern
  pg.noStroke();
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      pg.fill(random(130, 170));
      pg.rect(i * 10, j * 10, 10, 10);
    }
  }

  // Add some noise for texture
  pg.loadPixels();
  for (let i = 0; i < pg.pixels.length; i += 4) {
    let noise = random(-10, 10);
    pg.pixels[i] = constrain(pg.pixels[i] + noise, 0, 255);
    pg.pixels[i + 1] = constrain(pg.pixels[i + 1] + noise, 0, 255);
    pg.pixels[i + 2] = constrain(pg.pixels[i + 2] + noise, 0, 255);
  }
  pg.updatePixels();
  return pg;
}

function drawBridge() {
  push();
  translate(0, 50, BRIDGE_LENGTH / 2); // Move bridge down by 50 units

  // Draw main road
  push();
  fill(200); // Light gray for the road
  noStroke();
  translate(-MAIN_LANE_WIDTH - POWERUP_LANE_WIDTH / 2, 0, 0); // Shift main lane left to make room for power-up lane
  box(MAIN_LANE_WIDTH, 1, BRIDGE_LENGTH);
  
  // Main lane coordinates
  push();
  translate(0, -10, -BRIDGE_LENGTH/2);
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(`Main Lane: x=${-MAIN_LANE_WIDTH - POWERUP_LANE_WIDTH / 2}, y=50, width=${MAIN_LANE_WIDTH}`, 0, 0);
  pop();

  // Draw power-up lane on right
  translate(MAIN_LANE_WIDTH / 2 + POWERUP_LANE_WIDTH / 2, 0, 0);
  fill(150, 200, 255); // Light blue for power-up lane
  box(POWERUP_LANE_WIDTH, 2, BRIDGE_LENGTH);
  
  // Power-up lane coordinates
  push();
  translate(0, -10, -BRIDGE_LENGTH/2);
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(`Power-up Lane: x=${-POWERUP_LANE_WIDTH/2}, y=50, width=${POWERUP_LANE_WIDTH}`, 0, 0);
  pop();
  pop();

  // Draw side barriers
  push();
  // Left barrier
  translate(-BRIDGE_WIDTH / 2, 10, 0);
  fill(150); // Gray for barriers
  box(10, 20, BRIDGE_LENGTH);

  // Right barrier
  translate(BRIDGE_WIDTH, 0, 0);
  box(10, 20, BRIDGE_LENGTH);
  pop();
  
  // Bridge dimensions text
  push();
  translate(-BRIDGE_WIDTH/2, -20, -BRIDGE_LENGTH/2);
  fill(0);
  textSize(20);
  textAlign(LEFT);
  text(`Bridge: Width=${BRIDGE_WIDTH}, Length=${BRIDGE_LENGTH}, Y=50`, 0, 0);
  
  // Add coordinate markers every 1000 units on Z-axis
  for (let z = 0; z < BRIDGE_LENGTH; z += 1000) {
    push();
    translate(0, 0, z);
    text(`Z: ${z}`, 0, 0);
    pop();
  }
  pop();

  // Draw power-ups
  for (let powerup of powerups) {
    if (!powerup.collected) {
      push();
      translate(powerup.x, -20, powerup.z - BRIDGE_LENGTH / 2);
      fill(255, 255, 0); // Yellow for power-ups
      sphere(15);
      pop();
    }
  }

  pop();
}

function draw() {
  if (gamePaused) {
    return;
  }

  background(200);
  smooth();

  // Update power-ups
  spawnPowerup();
  checkPowerupCollision();

  // Set up fixed camera view
  let camX = 0; // Fixed X position at center
  let camZ = -cameraDistance - 120; // Fixed distance behind
  camera(camX, cameraHeight - 70, camZ,
    0, cameraHeight - 70, BRIDGE_LENGTH / 2, // Look straight ahead
    0, 1, 0);

  // Update game state
  updateSquadPosition();
  updatePowerups();
  updateEnemies();
  autoFireSquad();
  checkCollisions();
  updateEffects();

  // Draw game elements
  drawBridge();
  drawSquad();
  drawBullets();
  drawEnemies();
  drawPowerups();
  drawEffects();
}

function updateSquadPosition() {
  // Calculate movement based on camera angle
  let moveX = 0;
  let moveZ = 0;
  if (moving.right) {
    moveX -= cos(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ -= sin(cameraAngle) * PLAYER_MOVE_SPEED;
  }
  if (moving.left) {
    moveX += cos(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ += sin(cameraAngle) * PLAYER_MOVE_SPEED;
  }
  if (moving.up) {
    moveX -= sin(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ += cos(cameraAngle) * PLAYER_MOVE_SPEED;
  }
  if (moving.down) {
    moveX += sin(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ -= cos(cameraAngle) * PLAYER_MOVE_SPEED;
  }

  // Update squad center position
  squad.x = constrain(squad.x + moveX, -MAIN_LANE_WIDTH / 2, MAIN_LANE_WIDTH / 2 + POWERUP_LANE_WIDTH);
  squad.z += moveZ;

  // Update squad members positions in filled circle formation
  const baseRadius = SQUAD_SPACING;
  let membersPlaced = 0;
  let ring = 0;

  while (membersPlaced < squad.members.length) {
    const radius = baseRadius * (ring + 1);
    // Calculate how many members can fit in this ring
    const membersInRing = ring === 0 ? 1 : floor(TWO_PI * radius / (SQUAD_MEMBER_SIZE * 1.2));

    // Place members in this ring
    for (let i = 0; i < membersInRing && membersPlaced < squad.members.length; i++) {
      const member = squad.members[membersPlaced];
      const memberAngle = TWO_PI / membersInRing * i;
      member.x = squad.x + radius * cos(memberAngle);
      member.z = squad.z + radius * sin(memberAngle);
      membersPlaced++;
    }
    ring++;
  }




}

function autoFireSquad() {
  // Fire more frequently
  if (millis() - squad.lastFireTime > 100) { // Reduced from 500 to 100ms
    // Each squad member fires forward
    squad.members.forEach(member => {
      // Fire multiple bullets in spread pattern
      for (let i = -1; i <= 1; i++) {
        bullets.push({
          x: member.x + i * 10,
          z: member.z,
          size: squad.weapon.bulletSize,
          speed: squad.weapon.bulletSpeed * 1.5, // 50% faster bullets
          damage: squad.weapon.damage,
          angle: i * 0.1, // Slight spread
          distance: 0
        });
      }
    });
    squad.lastFireTime = millis();
  }
}

function updatePowerups() {
  // Update powerup positions and check for collection
  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];
    powerup.z -= 2; // Move towards squad

    // Check if any squad member collects the powerup
    for (let member of squad.members) {
      if (dist(member.x, member.z, powerup.x, powerup.z) < 30) {
        // Apply powerup effect
        if (powerup.type === POWERUP_TYPES.MIRROR) {
          if (squad.size < MAX_SQUAD_SIZE) {
            squad.size++;
            squad.members.push({
              x: member.x - squad.size * SQUAD_SPACING * squad.direction,
              z: member.z,
              health: 100
            });
          }
        } else if (powerup.type.effect === 'weapon') {
          squad.weapon = WEAPON_TYPES[powerup.type.nextWeapon];
        }
        powerups.splice(i, 1);
        break;
      }
    }

    // Remove powerups that are too far behind
    if (powerup.z < squad.z - 1000) {
      powerups.splice(i, 1);
    }
  }

  // Spawn mirror powerup in the right lane
  if (frameCount % POWERUP_SPAWN_INTERVAL === 0) {
    powerups.push({
      x: BRIDGE_WIDTH / 2 + POWERUP_LANE_WIDTH / 2, // Right side power-up lane
      z: squad.z + 1000,
      speed: 2,
      size: 20,
      type: POWERUP_TYPES.MIRROR // Always spawn mirror powerup
    });
  }
  powerups = powerups.filter(powerup => {
    if (!powerup.collected) {
      powerup.z -= PLAYER_MOVE_SPEED * 0.5; // Move towards player
      return powerup.z > squad.z - 500;
    }
    return false;
  });
}

function drawPowerups() {
  powerups.forEach(powerup => {
    if (!powerup.collected) {
      push();
      translate(powerup.x, 0, powerup.z);

      // Hover animation
      translate(0, 10 + sin(frameCount * 0.05) * 5, 0);
      rotateY(frameCount * 0.02);

      // Blue powerup box with plus sign
      fill(100, 150, 255);
      box(30);

      // White plus sign
      fill(255);
      push();
      translate(0, 15.1, 0); // Slightly above the box surface
      rotateX(HALF_PI);
      // Horizontal bar
      box(20, 5, 5);
      // Vertical bar
      box(5, 5, 20);
      pop();
      pop();
    }
  });
}

function updateEffects() {
  effects = effects.filter(effect => {
    effect.life--;
    return effect.life > 0;
  });
}

function drawEffects() {
  for (let effect of effects) {
    push();
    translate(effect.x, 0, effect.z);

    if (effect.type === 'hit') {
      fill(255, 255, 0, map(effect.life, 10, 0, 255, 0));
      noStroke();
      sphere(effect.size * (1 - effect.life / 10));
    } else if (effect.type === 'explosion') {
      fill(255, 100, 0, map(effect.life, 20, 0, 255, 0));
      noStroke();
      sphere(effect.size * (1 - effect.life / 20));
    } else if (effect.type === 'melee') {
      fill(255, 0, 0, map(effect.life, 5, 0, 255, 0));
      noStroke();
      rotateX(random(TWO_PI));
      rotateY(random(TWO_PI));
      box(effect.size, effect.size / 4, effect.size / 4);
    }

    pop();
  }
}
function drawSoldier(isLeader = false) {
  push();
  // Body
  fill(100, 150, 255); // Light blue body for all soldiers
  sphere(15); // Round body

  // Hat
  translate(0, -12, 0);
  fill(isLeader ? color(255, 255, 0) : color(50, 100, 255)); // Yellow for leader, blue for others
  rotateX(PI / 6);
  cylinder(10, 8); // Baseball cap style

  // Health bar if damaged
  if (squad.health < 100) {
    translate(0, -10, 0);
    rotateX(-PI / 6);
    noStroke();
    fill(100);
    rect(-20, 0, 40, 5); // Background
    fill(0, 255, 0);
    rect(-20, 0, map(squad.health, 0, 100, 0, 40), 5); // Health
  }
  pop();
}

function drawSquad() {
  push();
  // Draw each squad member
  squad.members.forEach((member, index) => {
    push();
    translate(member.x, 10, member.z);
    noStroke();
    drawSoldier(index === 0); // First member is the leader
    
    // Add coordinates for squad leader only
    if (index === 0) {
      push();
      translate(0, 30, 0);
      fill(0);
      textSize(16);
      textAlign(LEFT);
      rotateY(-cameraAngle); // Make text face camera but maintain left-to-right
      text(`Leader: x=${Math.round(member.x)}, y=10, z=${Math.round(member.z)}`, 0, 0);
      pop();
    }
    pop();
  });
  pop();
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // Move downward towards squad
    enemy.z -= enemy.type.speed;

    // Move horizontally towards squad's x position
    let dx = squad.x - enemy.x;
    enemy.x += Math.sign(dx) * enemy.type.speed * 0.5; // Slower horizontal movement

    // Check for melee combat with squad members
    for (let member of squad.members) {
      let distance = dist(enemy.x, enemy.z, member.x, member.z);
      if (distance < enemy.type.meleeRange) {
        member.health -= enemy.type.damage * 0.1; // Reduced per-frame damage

        // Melee effect
        effects.push({
          type: 'melee',
          x: (enemy.x + member.x) / 2,
          z: (enemy.z + member.z) / 2,
          size: 15,
          life: 5
        });

        if (member.health <= 0) {
          squad.members = squad.members.filter(m => m !== member);
          squad.size--;

          // Death effect
          for (let k = 0; k < 8; k++) {
            effects.push({
              type: 'explosion',
              x: member.x + random(-15, 15),
              z: member.z + random(-15, 15),
              size: random(8, 15),
              life: 15
            });
          }

          if (squad.size <= 0) {
            gamePaused = true;
          }
          break;
        }
      }
    }

    // Check for collisions with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];
      if (dist(bullet.x, bullet.z, enemy.x, enemy.z) < enemy.type.size / 2 + bullet.size / 2) {
        // Multiple hits effect
        for (let hit = 0; hit < 3; hit++) {
          enemy.health -= bullet.damage * (hit === 0 ? 1 : 0.5); // First hit full damage, subsequent hits half damage

          // Create hit effect
          effects.push({
            type: 'hit',
            x: enemy.x + random(-10, 10),
            z: enemy.z + random(-10, 10),
            size: random(5, 10),
            life: 10
          });
        }

        bullets.splice(j, 1);

        if (enemy.health <= 0) {
          score += enemy.type.points;

          // Death effect
          for (let k = 0; k < 10; k++) {
            effects.push({
              type: 'explosion',
              x: enemy.x + random(-20, 20),
              z: enemy.z + random(-20, 20),
              size: random(10, 20),
              life: 20
            });
          }

          enemies.splice(i, 1);
          enemiesKilled++;
        }
        break;
      }
    }


    // Check for collisions with squad members
    for (let j = squad.members.length - 1; j >= 0; j--) {
      const member = squad.members[j];
      if (dist(member.x, member.z, enemy.x, enemy.z) < enemy.type.size / 2 + 20) {
        member.health -= enemy.type.damage;
        if (member.health <= 0) {
          squad.members.splice(j, 1);
          squad.size--;
          if (squad.size <= 0) {
            gamePaused = true;
          }
        }
      }
    }

    // Remove enemies that are off screen
    if (enemy.z < squad.z - 1000) {
      enemies.splice(i, 1);
    }
  }

  // Spawn new enemies more frequently
  if (frameCount % 20 === 0 && enemies.length < MAX_ENEMIES) { // Reduced from 120 to 20
    const wave = Math.floor(enemiesKilled / 50); // Every 50 kills increases wave
    const types = Object.keys(ENEMY_TYPES);
    const type = types[Math.min(wave, types.length - 1)];

    // Spawn boss every 200 kills
    if (enemiesKilled % 200 === 0 && enemiesKilled > 0) {
      const bossLevel = Math.min(Math.floor(wave / 3), 3);
      // Spawn boss in center of main lane
      enemies.push({
        x: 0,
        z: squad.z + 800,
        type: ENEMY_TYPES[`BOSS${bossLevel}`],
        health: ENEMY_TYPES[`BOSS${bossLevel}`].health,
        lastShot: 0
      });
    } else {
      // Spawn regular enemies across main lane width
      const numEnemies = random(2, 4); // Spawn 2-4 enemies at once
      const spacing = MAIN_LANE_WIDTH / (numEnemies + 1);

      for (let i = 1; i <= numEnemies; i++) {
        const x = -MAIN_LANE_WIDTH / 2 + spacing * i; // Evenly space enemies
        const z = squad.z + random(500, 1000);

        enemies.push({
          x,
          z,
          type: ENEMY_TYPES[type],
          health: ENEMY_TYPES[type].health,
          lastShot: 0
        });
      }
    }
  }
}

function drawEnemies() {
  enemies.forEach(enemy => {
    push();
    translate(enemy.x, 30, enemy.z); // Raise enemies higher above bridge

    // Body
    fill(...enemy.type.color); // Use enemy type color
    
    if (enemy.type.size >= 30) { // Boss types
      // Taller rectangular body for bosses
      push();
      box(enemy.type.size * 1.2, enemy.type.size * 2, enemy.type.size * 0.8);
      
      // Shoulder pads
      translate(0, -enemy.type.size * 0.7, 0);
      box(enemy.type.size * 1.8, enemy.type.size * 0.3, enemy.type.size * 0.6);
      
      // Head
      translate(0, -enemy.type.size * 0.4, 0);
      fill(enemy.type.color[0] * 0.8, enemy.type.color[1] * 0.8, enemy.type.color[2] * 0.8); // Darker color for head
      box(enemy.type.size * 0.6, enemy.type.size * 0.6, enemy.type.size * 0.6);
      
      // Crown
      translate(0, -enemy.type.size * 0.4, 0);
      fill(255, 200, 0); // Gold color
      rotateX(PI/6);
      for (let i = 0; i < 4; i++) {
        rotateY(PI/2);
        translate(enemy.type.size * 0.2, 0, 0);
        cone(enemy.type.size * 0.15, enemy.type.size * 0.3);
        translate(-enemy.type.size * 0.2, 0, 0);
      }
      pop();
    } else {
      // Regular enemies remain spherical
      sphere(enemy.type.size);
      
      // Hat for regular enemies
      translate(0, -enemy.type.size * 0.8, 0);
      fill(200, 0, 0);
      rotateX(PI / 6);
      cylinder(enemy.type.size * 0.7, enemy.type.size * 0.5);
      
      // White details
      fill(255);
      translate(0, enemy.type.size * 0.3, enemy.type.size * 0.2);
      box(enemy.type.size * 0.3, enemy.type.size * 0.1, enemy.type.size * 0.1);
    }

    // Health bar if damaged
    if (enemy.health < enemy.type.health) {
      translate(0, -enemy.type.size, 0);
      rotateX(-PI / 6);
      noStroke();
      fill(100);
      rect(-20, 0, 40, 5); // Background
      fill(255, 0, 0);
      rect(-20, 0, map(enemy.health, 0, enemy.type.health, 0, 40), 5); // Health
    }

    pop();
  });
}

function spawnEnemies() {
  // Spawn new enemies if there are too few
  while (enemies.length < MAX_ENEMIES) {
    // Determine enemy type based on current wave
    let enemyType;
    if (currentWave % 10 === 0) { // Boss wave every 10 waves
      const bossLevel = Math.min(3, Math.floor(currentWave / 10));
      enemyType = ENEMY_TYPES[`BOSS${bossLevel}`];
    } else {
      const types = [ENEMY_TYPES.BASIC, ENEMY_TYPES.FAST, ENEMY_TYPES.HEAVY];
      enemyType = types[Math.floor(Math.random() * types.length)];
    }

    // Spawn enemies across the bridge width
    const numEnemies = random(2, 4); // Spawn 2-4 enemies at once
    const spacing = BRIDGE_WIDTH / (numEnemies + 1);
    const minDistance = 50; // Minimum distance between enemies

    for (let i = 1; i <= numEnemies; i++) {
      let x = -BRIDGE_WIDTH / 2 + spacing * i; // Base position
      let z = squad.z + random(500, 1000);

      // Adjust position if too close to other enemies
      let validPosition = false;
      let attempts = 0;
      while (!validPosition && attempts < 10) {
        validPosition = true;
        for (let enemy of enemies) {
          const dx = enemy.x - x;
          const dz = enemy.z - z;
          const distance = sqrt(dx * dx + dz * dz);
          if (distance < minDistance) {
            validPosition = false;
            x += random(-spacing / 2, spacing / 2);
            z += random(-100, 100);
            break;
          }
        }
        attempts++;
      }

      if (validPosition) {
        // Add new enemy
        enemies.push({
          x,
          z,
          type: enemyType,
          health: enemyType.health,
          lastShot: 0
        });
      }
    }
    break; // Exit while loop after spawning a group
  }

  // Check if wave is complete
  if (enemies.length === 0) {
    currentWave++;
  }
}

function drawSoldier(isLeader = false) {
  push();
  // Soldier body
  fill(100, 150, 255); // Light blue body
  sphere(15); // Round body

  // Hat
  translate(0, -12, 0);
  fill(isLeader ? color(255, 255, 0) : color(50, 100, 255)); // Yellow for leader, blue for others
  rotateX(PI / 6);
  cylinder(10, 8); // Baseball cap style

  // Gun
  translate(0, 8, -10);
  fill(80, 130, 255);
  rotateX(HALF_PI);
  cylinder(2, 15);
  pop();
}



function fireBullet() {
  bullets.push({
    x: squad.x,
    y: 0,
    z: squad.z,
    dx: 0,  // No horizontal movement
    dz: 1,  // Move straight forward
    distanceTraveled: 0
  });
}

function updateWeaponAngle() {
  weaponAngle = lerp(weaponAngle, targetWeaponAngle, 0.1);
}

function drawBullets() {
  // Draw and update squad bullets
  bullets = bullets.filter((bullet) => {
    push();
    translate(bullet.x, 0, bullet.z);
    fill(255, 255, 0); // Yellow color
    noStroke();
    box(5); // Square bullet
    pop();

    // Update bullet position
    bullet.z += bullet.speed; // Only move forward
    bullet.distance = (bullet.distance || 0) + bullet.speed;

    // Remove bullet if it has traveled too far
    return bullet.distance < 1000;
  });

  // No enemy bullets, only melee combat
}

// Enemies only use melee attacks



function drawCastSkills() {
  let currentTime = millis();

  if (casting.a && currentTime - lastCastTime.a >= cooldown.a) {
    castSkill("a", 1, 3, skillSoundMap["a"]);
    lastCastTime.a = currentTime;
  }
  if (casting.s && currentTime - lastCastTime.s >= cooldown.s) {
    castSkill("s", 1, 10, skillSoundMap["s"]);
    lastCastTime.s = currentTime;
  }
  if (casting.d && currentTime - lastCastTime.d >= cooldown.d) {
    castSkill("d", 1, 9999, skillSoundMap["d"]);
    lastCastTime.d = currentTime;
  }
  if (casting.f && currentTime - lastCastTime.f >= cooldown.f) {
    castSkill("f", 9999, 1, skillSoundMap["f"]);
    lastCastTime.f = currentTime;
  }
  if (casting.g && currentTime - lastCastTime.g >= cooldown.g) {
    castSkill("g", 1, 1, skillSoundMap["g"]);
    lastCastTime.g = currentTime;
  }
  if (casting.h && currentTime - lastCastTime.h >= cooldown.h) {
    if (millis() - lastCastTime.h > 500) { // 500ms cooldown
      waves.push(new Wave(playerX, playerZ, 9999));
      skillSoundMap.h.play();
      lastCastTime.h = millis();
    }
  }
}
function drawShuriken(size) {
  scale(size);
  model(shurikenModel);
}

function drawFireball(size) {
  ambientMaterial(255, 100, 0);
  scale(size);
  model(fireBall);
}

function drawEnemies() {
  for (let enemy of enemies) {
    push();
    translate(enemy.x, 0, enemy.z);
    
    // Apply enemy type color
    const color = enemy.type.color;
    fill(color[0], color[1], color[2]);
    
    // Draw different sizes based on enemy type
    if (enemy.type.size >= 30) { // Boss types
      push();
      // Add spikes or details for bosses
      rotateY(frameCount * 0.02); // Slow rotation for menacing effect
      box(enemy.type.size);
      
      // Add crown/spikes
      translate(0, -enemy.type.size/2, 0);
      fill(255, 200, 0); // Gold color
      rotateX(PI/4);
      cone(enemy.type.size/3, enemy.type.size/3);
      pop();
    } else { // Regular enemies
      box(enemy.type.size);
    }
    
    // Health bar
    push();
    translate(0, -enemy.type.size, 0);
    rotateY(-cameraAngle); // Face camera
    noStroke();
    fill(255, 0, 0); // Red background
    box(40, 5, 1);
    fill(0, 255, 0); // Green health
    const healthPercent = enemy.health / enemy.type.health;
    translate(-20 * (1 - healthPercent), 0, 0);
    box(40 * healthPercent, 5, 1);
    pop();
    
    pop();
  }
}

function updatePlayerPosition() {
  // Calculate movement direction based on camera angle
  let moveX = 0;
  let moveZ = 0;
  if (moving.up) {
    moveX -= cos(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ -= sin(cameraAngle) * PLAYER_MOVE_SPEED;
  }
  if (moving.down) {
    moveX += cos(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ += sin(cameraAngle) * PLAYER_MOVE_SPEED;
  }

  if (moving.left) {
    moveX -= sin(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ += cos(cameraAngle) * PLAYER_MOVE_SPEED;
  }
  if (moving.right) {
    moveX += sin(cameraAngle) * PLAYER_MOVE_SPEED;
    moveZ -= cos(cameraAngle) * PLAYER_MOVE_SPEED;
  }
  // Update player position
  playerX += moveX;
  playerZ += moveZ;
}

function spawnSquadMember() {
  let x = random(
    playerX - 200,
    playerX + 200
  );
  let z = random(
    playerZ - 200,
    playerZ + 200
  );

  // Random direction
  let dx = random(-1, 1);
  let dz = random(-1, 1);
  let dist = Math.sqrt(dx * dx + dz * dz);
  dx = dx / dist;
  dz = dz / dist;

  skills.push({
    x: x,
    y: 0,
    z: z,
    dx: dx,
    dz: dz,
    type: 'g',
    lifetime: 300,
    distanceTraveled: 0,
    sizeFactor: 1
  });
}

function updateSquadMemberPosition(squadMember) {
  // Squad member positions are now handled in updateSquadPosition
  // This function is kept for compatibility but does nothing
  return;

  // Calculate angle towards nearest enemy for shooting
  let nearestEnemy = findNearestEnemies(1)[0];
  if (nearestEnemy && frameCount % 30 === 0) {
    let bulletAngle = atan2(nearestEnemy.z - squadMember.z, nearestEnemy.x - squadMember.x);
    bullets.push({
      x: squadMember.x,
      y: 0,
      z: squadMember.z,
      dx: cos(bulletAngle),
      dz: sin(bulletAngle),
      distanceTraveled: 0,
      fromAlly: true // Mark bullet as from ally
    });
  }
}

function updateEnemiesPosition() {
  for (let enemy of enemies) {
    // Calculate the distance to the player
    let distanceToPlayer = dist(enemy.x, 0, enemy.z, playerX, 0, playerZ);

    // Check if the enemy is within shooting distance
    if (distanceToPlayer > ENEMY_SHOOTING_DISTANCE) {
      // Move towards the player if not within shooting distance
      let angle = atan2(playerZ - enemy.z, playerX - enemy.x);
      enemy.x += cos(angle) * ENEMY_MOVE_SPEED;
      enemy.z += sin(angle) * ENEMY_MOVE_SPEED;
    }
  }
}

function keyReleased() {
  if (gamePaused) {
    return;
  }
  if (keyCode === LEFT_ARROW) {
    moving.left = false;
  } else if (keyCode === RIGHT_ARROW) {
    moving.right = false;
  } else if (keyCode === UP_ARROW) {
    moving.up = false;
  } else if (keyCode === DOWN_ARROW) {
    moving.down = false;
  } else if (key.toLowerCase() === "a") {
    casting.a = false;
  } else if (key.toLowerCase() === "s") {
    casting.s = false;
  } else if (key.toLowerCase() === "d") {
    casting.d = false;
  } else if (key.toLowerCase() === "f") {
    casting.f = false;
  } else if (key.toLowerCase() === "g") {
    casting.g = false;
  } else if (key.toLowerCase() === "h") {
    casting.h = false;
  } else if (key.toLowerCase() === "q") {
    rotatingLeft = false;
  } else if (key.toLowerCase() === "w") {
    rotatingRight = false;
  } else if (key.toLowerCase() === "e") {
    increasingHeight = false;
  } else if (key.toLowerCase() === "r") {
    decreasingHeight = false;
  } else if (key.toLowerCase() === "t") {
    movingCloser = false;
  } else if (key.toLowerCase() === "y") {
    movingFarther = false;
  }
}

// Mouse state tracking
let isMiddleMouseDown = false;

function mouseWheel(event) {
  // Zoom with mouse wheel
  let zoomSpeed = 50;
  cameraDistance = constrain(
    cameraDistance + event.delta * 0.1,
    MIN_CAMERA_DISTANCE,
    MAX_CAMERA_DISTANCE
  );
  return false; // Prevent default scrolling
}

function mousePressed() {
  // Middle mouse button
  if (mouseButton === CENTER) {
    isMiddleMouseDown = true;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function mouseReleased() {
  if (mouseButton === CENTER) {
    isMiddleMouseDown = false;
  }
}

function mouseDragged() {
  if (isMiddleMouseDown) {
    // Calculate mouse movement
    let deltaX = mouseX - lastMouseX;
    let deltaY = mouseY - lastMouseY;

    // Adjust camera angle based on horizontal movement
    cameraAngle += deltaX * 0.01;

    // Adjust camera height based on vertical movement
    cameraHeight = constrain(
      cameraHeight - deltaY * 2,
      MIN_CAMERA_HEIGHT,
      MAX_CAMERA_HEIGHT
    );

    // Update last position
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}

function castSkill(type, numTargets, sizeFactor, skillSound) {
  if (gamePaused) {
    return;
  }
  if (skillSound) {
    skillSound.play();
  }

  // Special handling for squad members (type 'g')
  if (type === "g") {
    spawnSquadMember();
    return;
  }

  // Original behavior for other skills
  let targets = findNearestEnemies(numTargets);
  for (let target of targets) {
    let dx = target.x - playerX;
    let dz = target.z - playerZ;
    let angle = atan2(dz, dx);
    skills.push({
      x: playerX,
      y: 0,
      z: playerZ,
      dx: cos(angle),
      dz: sin(angle),
      type: type,
      lifetime: 200,
      distanceTraveled: 0,
      sizeFactor: sizeFactor,
      target: target,
    });
  }
}

function spawnEnemy(type) {
  const enemyType = ENEMY_TYPES[type];
  const enemy = {
    x: random(-BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2),
    z: squad.z + 1000, // Spawn ahead of squad
    type: enemyType,
    health: enemyType.health,
    lastShot: 0
  };
  enemies.push(enemy);
}

let normalEnemyCount = 0;
const NORMAL_ENEMIES_BEFORE_BOSS = 10;

function spawnEnemies(count = 1) {
  for (let i = 0; i < count; i++) {
    // Spawn at top of screen
    const x = random(-BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2);
    const z = BRIDGE_LENGTH * 0.9; // Spawn at 90% of bridge length

    let type;
    if (normalEnemyCount >= NORMAL_ENEMIES_BEFORE_BOSS) {
      // Spawn a boss
      const bossTypes = ['BOSS1', 'BOSS2', 'BOSS3'];
      type = bossTypes[Math.floor(Math.random() * bossTypes.length)];
      normalEnemyCount = 0; // Reset counter after boss
    } else {
      // Spawn normal enemies
      const normalTypes = ['SOLDIER', 'FAST', 'HEAVY'];
      type = normalTypes[Math.floor(Math.random() * normalTypes.length)];
      normalEnemyCount++;
    }

    enemies.push({
      x: x,
      z: z,
      type: ENEMY_TYPES[type],
      health: ENEMY_TYPES[type].health,
      speed: ENEMY_TYPES[type].speed,
      lastFireTime: 0
    });
  }
}

function checkCollisions() {
  // Check bullet collisions with enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    const bulletSize = bullet.size || 5; // Default bullet size if not specified

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const dist = dist3D(bullet.x, bullet.z, enemy.x, enemy.z);

      if (dist < (bulletSize + enemy.type.size) / 2) {
        // Bullet hit enemy
        enemy.health -= bullet.damage;
        bullets.splice(i, 1);

        // Create hit effect
        effects.push({
          type: 'hit',
          x: enemy.x,
          z: enemy.z,
          size: 20,
          duration: 10,
          age: 0
        });

        if (enemy.health <= 0) {
          enemies.splice(j, 1);
          enemiesKilled++;
          score += enemy.type.health; // Score based on enemy health
        }
        break;
      }
    }
  }

  // Check powerup collisions with squad
  powerups.forEach(powerup => {
    if (!powerup.collected) {
      squad.members.forEach(member => {
        const dx = member.x - powerup.x;
        const dz = member.z - powerup.z;
        const distance = sqrt(dx * dx + dz * dz);
        if (distance < SQUAD_MEMBER_SIZE) {
          powerup.collected = true;
          applyPowerup(powerup.type);
        }
      });
    }
  });

  // Enemy collision with squad members
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    for (let j = squad.members.length - 1; j >= 0; j--) {
      const member = squad.members[j];
      const dist = dist3D(enemy.x, enemy.z, member.x, member.z);

      if (dist < (enemy.type.size + 30) / 2) { // 30 is squad member size
        // Enemy collides with squad member
        member.health -= enemy.type.damage;

        if (member.health <= 0) {
          squad.members.splice(j, 1);
        }
        break;
      }
    }
  }

  // Check if all squad members are dead
  if (squad.members.length === 0) {
    gamePaused = true;
    alert('Game Over! Score: ' + enemiesKilled);
    return;
  }
}

// Helper function to calculate 3D distance between two points
function dist3D(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dz * dz);
}

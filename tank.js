// Configuration variables

// Squad Mechanics
const INITIAL_SQUAD_SIZE = 1;
const MAX_SQUAD_SIZE = 10;
const SQUAD_SPACING = 40; // Space between squad members

// Bridge Settings
const BRIDGE_WIDTH = 300;
const BRIDGE_LENGTH = 16000;
const POWERUP_LANE_WIDTH = 100;
const POWERUP_SPAWN_INTERVAL = 3000; // Spawn power-up every 3 seconds

// Gameplay Mechanics
const ENEMIES_TO_KILL = 1_000_000_000;
const MAX_ENEMIES = 50;
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
  BASIC: { health: 30, speed: 2, damage: 10, size: 50, points: 100 },
  FAST: { health: 20, speed: 3, damage: 8, size: 40, points: 150 },
  HEAVY: { health: 50, speed: 1, damage: 15, size: 60, points: 200 },
  BOSS1: { health: 200, speed: 1, damage: 20, size: 100, points: 1000 },
  BOSS2: { health: 400, speed: 1.2, damage: 25, size: 120, points: 2000 },
  BOSS3: { health: 800, speed: 1.5, damage: 30, size: 150, points: 5000 }
};

// Movement Settings
const PLAYER_MOVE_SPEED = 4;
const MIN_X = -BRIDGE_WIDTH / 2;
const MAX_X = BRIDGE_WIDTH / 2;

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
  members: [{ x: 0, z: 0, health: 100 }],
  weapon: WEAPON_TYPES.BASIC,
  lastFireTime: 0,
  direction: 1, // 1 for right, -1 for left
  speed: 3
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
let moving = { left: false, right: false };

// Game progress
let enemiesKilled = 0;
let score = 0;
let currentWave = 1;
let gamePaused = true;

// Visual settings
let zoomLevel = 0.2;
let tankSize = 75;

// Share state with window for external access
window.squadSize = INITIAL_SQUAD_SIZE;
window.currentWeapon = WEAPON_TYPES.BASIC.name;

let playerAngle = 0; // Tank body angle
let turretAngle = 0; // Turret angle
let cameraAngle = 0; // Camera angle
let cameraDistance = 200; // Initial distance from the player

let targetTurretAngle = 0;

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
  a: 500, // 500 milliseconds
  s: 500,
  d: 500,
  f: 500,
  g: 500,
  h: 500,
};

window.getState = function () {
  // Calculate average health of squad members
  const avgHealth = squad.members.reduce((sum, member) => sum + member.health, 0) / squad.members.length;
  
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
  groundTexture = loadImage("rocky_terrain_02_diff_4k.jpg"); // Ground texture
  tankTexture = loadImage("photo-1539538507524-eab6a4184604.jpg"); // Tank texture
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
  zoomLevel = getDynamicZoomLevel();
}

function drawBridge() {
  push();
  translate(0, 50, 0);

  // Draw main bridge
  push();
  fill(100);
  noStroke();
  rotateX(HALF_PI);
  rect(-BRIDGE_WIDTH / 2, -BRIDGE_LENGTH / 2, BRIDGE_WIDTH, BRIDGE_LENGTH);
  pop();

  // Draw power-up lane on the right
  push();
  fill(120);
  noStroke();
  translate(BRIDGE_WIDTH / 2 + POWERUP_LANE_WIDTH / 2, 0, 0);
  rotateX(HALF_PI);
  rect(-POWERUP_LANE_WIDTH / 2, -BRIDGE_LENGTH / 2, POWERUP_LANE_WIDTH, BRIDGE_LENGTH);
  pop();

  // Draw bridge railings
  push();
  fill(150);
  translate(-BRIDGE_WIDTH / 2, -20, 0);
  box(10, 40, BRIDGE_LENGTH);
  translate(BRIDGE_WIDTH, 0, 0);
  box(10, 40, BRIDGE_LENGTH);
  pop();

  pop();
}

function draw() {
  if (gamePaused) {
    return;
  }

  background(200);
  smooth();

  // Set up camera
  let camX = squad.x + cos(cameraAngle) * cameraDistance;
  let camZ = squad.z + sin(cameraAngle) * cameraDistance;
  camera(camX, cameraHeight, camZ,
    squad.x, cameraHeight, squad.z,
    0, 1, 0);

  // Update game state
  updateSquadPosition();
  updatePowerups();
  updateEnemies();
  autoFireSquad();
  checkCollisions();

  // Draw game elements
  drawBridge();
  drawSquad();
  drawBullets();
  drawEnemyBullets();
  drawEnemies();
  drawPowerups();
}

function updateSquadPosition() {
  // Auto move squad horizontally
  squad.x = constrain(squad.x + squad.speed * squad.direction, MIN_X, MAX_X);

  // Reverse direction if hitting bridge boundaries
  if (squad.x <= MIN_X || squad.x >= MAX_X) {
    squad.direction *= -1;
  }

  // Update squad members positions with spacing
  squad.members = squad.members.map((member, index) => ({
    ...member,
    x: squad.x - index * SQUAD_SPACING * squad.direction,
    z: squad.z
  }));
}

function autoFireSquad() {
  if (millis() - squad.lastFireTime > AUTO_FIRE_RATE) {
    // Each squad member fires forward
    squad.members.forEach(member => {
      bullets.push({
        x: member.x,
        z: member.z,
        size: squad.weapon.bulletSize,
        speed: squad.weapon.bulletSpeed,
        damage: squad.weapon.damage,
        angle: 0, // Always shoot forward
        distance: 0
      });
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

  // Spawn new powerups in the power-up lane
  if (frameCount % POWERUP_SPAWN_INTERVAL === 0) {
    const powerupTypes = Object.values(POWERUP_TYPES);
    const randomType = powerupTypes[Math.floor(random(powerupTypes.length))];
    
    powerups.push({
      x: BRIDGE_WIDTH / 2 + POWERUP_LANE_WIDTH / 2, // Always in power-up lane
      z: squad.z + 1000,
      speed: 2,
      size: 20,
      type: randomType
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

      // Different visuals for different powerup types
      if (powerup.type === POWERUP_TYPES.MIRROR) {
        fill(200, 200, 255);
        box(30);
      } else if (powerup.type === POWERUP_TYPES.GUN_UPGRADE) {
        fill(255, 200, 200);
        cylinder(15, 40);
      } else {
        fill(200, 255, 200);
        sphere(20);
      }
      pop();
    }
  });
}
function drawSquad() {
  const spacing = tankSize * 1.2;
  const rows = Math.ceil(Math.sqrt(squad.size));
  const cols = Math.ceil(squad.size / rows);

  push();
  translate(squad.x, 0, squad.z);

  // Update squad member positions
  squad.members = [];
  let memberIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols && memberIndex < squad.size; col++) {
      const offsetX = (col - (cols - 1) / 2) * spacing;
      const offsetZ = (row - (rows - 1) / 2) * spacing;
      squad.members.push({ x: squad.x + offsetX, z: squad.z + offsetZ });

      // Draw individual tank
      push();
      translate(offsetX, 0, offsetZ);

      // Draw tank body
      fill(200);
      box(tankSize, tankSize / 2, tankSize * 1.5);

      // Draw tank turret
      translate(0, -tankSize / 4, 0);
      fill(180);
      box(tankSize * 0.8, tankSize / 2, tankSize);

      // Draw tank barrel with current weapon appearance
      translate(0, 0, tankSize * 0.7);
      fill(160);
      const barrelSize = squad.weapon.bulletSize * 2;
      box(barrelSize, barrelSize, tankSize);
      pop();

      memberIndex++;
    }
  }
  pop();
}

function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    // Move towards squad on bridge
    enemy.z -= enemy.type.speed; // Always move towards squad

    // Check for collisions with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];
      if (dist(bullet.x, bullet.z, enemy.x, enemy.z) < enemy.type.size/2 + bullet.size/2) {
        enemy.health -= bullet.damage;
        bullets.splice(j, 1);
        
        if (enemy.health <= 0) {
          score += enemy.type.points;
          enemies.splice(i, 1);
          enemiesKilled++;
          break;
        }
      }
    }

    // Check for collisions with squad members
    for (let j = squad.members.length - 1; j >= 0; j--) {
      const member = squad.members[j];
      if (dist(member.x, member.z, enemy.x, enemy.z) < enemy.type.size/2 + 20) {
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

  // Spawn new enemies
  if (frameCount % 120 === 0 && enemies.length < MAX_ENEMIES) {
    const wave = Math.floor(enemiesKilled / 50); // Every 50 kills increases wave
    const types = Object.keys(ENEMY_TYPES);
    const type = types[Math.min(wave, types.length - 1)];
    
    // Spawn boss every 200 kills
    if (enemiesKilled % 200 === 0 && enemiesKilled > 0) {
      const bossLevel = Math.min(Math.floor(wave / 3), 3);
      spawnEnemy(`BOSS${bossLevel}`);
    } else {
      spawnEnemy(type);
    }
  }
}

function drawEnemies() {
  enemies.forEach(enemy => {
    push();
    translate(enemy.x, 0, enemy.z);

    // Different visuals for different enemy types
    if (enemy.type === ENEMY_TYPES.BOSS1 ||
      enemy.type === ENEMY_TYPES.BOSS2 ||
      enemy.type === ENEMY_TYPES.BOSS3) {
      // Boss appearance
      fill(255, 0, 0);
      box(enemy.type.size, enemy.type.size * 0.6, enemy.type.size * 1.5);

      // Boss turret
      translate(0, -enemy.type.size * 0.2, 0);
      fill(200, 0, 0);
      box(enemy.type.size * 0.8, enemy.type.size * 0.4, enemy.type.size);
    } else {
      // Regular enemy
      fill(150, 0, 0);
      box(enemy.type.size, enemy.type.size * 0.5, enemy.type.size * 1.2);

      // Enemy turret
      translate(0, -enemy.type.size * 0.15, 0);
      fill(120, 0, 0);
      box(enemy.type.size * 0.6, enemy.type.size * 0.3, enemy.type.size * 0.8);
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

    // Random position ahead of the squad
    const x = random(-BRIDGE_WIDTH / 2, BRIDGE_WIDTH / 2);
    const z = squad.z + random(500, 1000);

    // Add new enemy
    enemies.push({
      x,
      z,
      type: enemyType,
      health: enemyType.health,
      lastShot: 0
    });
  }

  // Check if wave is complete
  if (enemies.length === 0) {
    currentWave++;
  }
}

function getDynamicZoomLevel() {
  const screenWidth = windowWidth;

  if (screenWidth < 1024) {
    return 0.1;
  }

  return 0.2;
}

function drawTank(isPlayer = false) {
  push();
  if (isPlayer) {
    translate(playerX, 0, playerZ);
    rotateY(playerAngle); // Rotate tank body
  }
  // Tank body
  texture(tankTexture);
  box(tankSize, 20, tankSize);
  // Turret
  translate(0, -15, 0);
  if (isPlayer) {
    rotateY(turretAngle - playerAngle); // Rotate turret independently for player
  }
  box(30, 10, 30);
  // Gun barrel
  translate(0, 0, -20); // Position the barrel at the front of the turret
  rotateX(HALF_PI); // Rotate the barrel 90 degrees to lie horizontally
  fill(100); // Set a color for the barrel
  cylinder(5, 40); // Create a cylinder for the barrel
  pop();
}

function drawAimLine(target) {
  let dx = target.x - playerX;
  let dz = target.z - playerZ;
  let angle = atan2(dz, dx);

  push();
  stroke(255, 255, 0, 150); // Yellow line
  strokeWeight(2);
  let aimX = playerX + cos(angle) * AIM_LINE_LENGTH;
  let aimZ = playerZ + sin(angle) * AIM_LINE_LENGTH;
  line(playerX, 0, playerZ, aimX, 0, aimZ);
  pop();
}

function drawSkillAimLines() {
  for (let skill of skills) {
    if (skill.lifetime > 0 && skill.target) {
      drawAimLine(skill.target);
    }
  }
}

function findNearestEnemies(numTargets) {
  let sortedEnemies = [...enemies].sort((a, b) => {
    let distA = dist(playerX, 0, playerZ, a.x, 0, a.z);
    let distB = dist(playerX, 0, playerZ, b.x, 0, b.z);
    return distA - distB;
  });
  return sortedEnemies.slice(0, numTargets);
}

function fireBullet() {
  let targets = findNearestEnemies(1); // Find the nearest enemy
  if (targets.length > 0) {
    let target = targets[0];
    let dx = target.x - playerX;
    let dz = target.z - playerZ;
    let angle = atan2(dz, dx);
    targetTurretAngle = -atan2(dz, dx) - HALF_PI;
    bullets.push({
      x: playerX,
      y: 0,
      z: playerZ,
      dx: cos(angle),
      dz: sin(angle),
      distanceTraveled: 0,
    });

    // Draw aim line for the bullet
    drawAimLine(target);
  }
}

function updateTurretAngle() {
  turretAngle = lerp(turretAngle, targetTurretAngle, 0.1);
}

function drawBullets() {
  // Draw and update squad bullets
  bullets = bullets.filter((bullet) => {
    push();
    translate(bullet.x, 0, bullet.z);
    fill(255, 255, 0);
    sphere(bullet.size);
    pop();

    // Update bullet position
    bullet.z += bullet.speed; // Only move forward
    bullet.distance += bullet.speed;

    // Remove bullet if it has traveled too far
    return bullet.distance < 1000;
  });

  // Draw and update enemy bullets
  enemyBullets = enemyBullets.filter((bullet) => {
    push();
    translate(bullet.x, 0, bullet.z);
    fill(255, 0, 0);
    sphere(5);
    pop();

    // Update bullet position
    bullet.x += cos(bullet.angle) * bullet.speed;
    bullet.z += sin(bullet.angle) * bullet.speed;

    // Remove bullets that are too far behind the squad
    return bullet.z > squad.z - 1000;
  });
  translate(bullet.x, bullet.y, bullet.z);
  sphere(BULLET_SIZE);
  pop();

  // Remove bullets that have traveled beyond the maximum distance
  if (bullet.distanceTraveled > BULLET_MAX_DISTANCE) {
    bullets.splice(i, 1);
  }
}

function drawEnemyBullets() {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    bullet.x += bullet.dx * ENEMY_BULLET_SPEED;
    bullet.z += bullet.dz * ENEMY_BULLET_SPEED;
    bullet.distanceTraveled += ENEMY_BULLET_SPEED;

    push();
    translate(bullet.x, bullet.y, bullet.z);
    sphere(BULLET_SIZE);
    pop();

    // Remove bullets that have traveled beyond the maximum distance
    if (bullet.distanceTraveled > BULLET_MAX_DISTANCE) {
      enemyBullets.splice(i, 1);
    }
  }
}

// Wave effect for skill h
let waves = [];

class Wave {
  constructor(x, z, size) {
    this.x = x;
    this.z = z;
    this.waves = [
      { radius: 50, alpha: 255 },
      { radius: 50, alpha: 255 },
      { radius: 50, alpha: 255 },
      { radius: 50, alpha: 255 },
      { radius: 50, alpha: 255 }
    ];
    this.maxRadius = size;
    this.speed = 16;
    this.waveGap = 100; // Gap between waves
    this.startTimes = [0, 10, 20, 30, 40]; // Stagger start times
    this.frameCount = 0;
  }

  update() {
    this.frameCount++;
    let anyWaveActive = false;

    for (let i = 0; i < this.waves.length; i++) {
      if (this.frameCount > this.startTimes[i]) {
        let wave = this.waves[i];
        if (wave.radius < this.maxRadius) {
          wave.radius += this.speed;
          wave.alpha = map(wave.radius, 50, this.maxRadius, 255, 0);
          anyWaveActive = true;
        }
      } else {
        anyWaveActive = true;
      }
    }

    return anyWaveActive;
  }

  draw() {
    push();
    translate(this.x, 0, this.z);
    rotateX(HALF_PI);

    // Draw each wave
    for (let wave of this.waves) {
      if (wave.radius <= this.maxRadius) {
        noFill();
        stroke(0, 180, 255, wave.alpha);
        strokeWeight(20);
        circle(0, 0, wave.radius * 2);

        // Check collision with enemies for each wave
        for (let i = enemies.length - 1; i >= 0; i--) {
          let enemy = enemies[i];
          let d = dist(enemy.x, enemy.z, this.x, this.z);
          if (d <= wave.radius) {
            // Kill enemy and add score
            enemies.splice(i, 1);
            enemiesKilled++;
            if (enemies.length < MAX_ENEMIES) {
              spawnEnemies(1);
            }
          }
        }
      }
    }
    pop();
  }
}

function drawSkills() {
  // Draw waves
  for (let i = waves.length - 1; i >= 0; i--) {
    let wave = waves[i];
    wave.draw();
    if (!wave.update()) {
      waves.splice(i, 1);
    }
  }

  for (let i = skills.length - 1; i >= 0; i--) {
    let skill = skills[i];

    if (skill.type === "g") {
      updateMiniTankPosition(skill);

      // Find nearest enemy for turret rotation
      let nearestEnemy = findNearestEnemies(1)[0];
      let turretAngle = 0;

      if (nearestEnemy) {
        turretAngle = atan2(nearestEnemy.z - skill.z, nearestEnemy.x - skill.x);
      }

      push();
      translate(skill.x, skill.y, skill.z);
      fill(0, 255, 0, skill.lifetime);
      scale(0.5); // Fixed scale for ally tank

      // Draw tank with turret rotation
      push();
      // Tank body
      texture(tankTexture);
      box(tankSize, 20, tankSize);

      // Turret with rotation
      translate(0, -15, 0);
      rotateY(turretAngle);
      box(30, 10, 30);

      // Gun barrel
      translate(0, 0, -20);
      rotateX(HALF_PI);
      fill(100);
      cylinder(5, 40);
      pop();

      pop();

      skill.lifetime--;
    } else {
      // Original behavior for other skills
      skill.x += skill.dx * SKILL_SPEED;
      skill.z += skill.dz * SKILL_SPEED;
      skill.lifetime--;
      skill.distanceTraveled += SKILL_SPEED;

      push();
      translate(skill.x, skill.y, skill.z);
      let size = map(
        skill.distanceTraveled,
        0,
        SKILL_EXPAND_DISTANCE,
        10,
        SKILL_BASE_SIZE * skill.sizeFactor
      );
      size = constrain(size, 10, SKILL_BASE_SIZE * skill.sizeFactor);

      rotateY(skillAngle);
      if (skill.type === "a") {
        fill(255, 0, 0, skill.lifetime * 5);
        drawFireball(size / 100);
      } else if (skill.type === "s") {
        fill(0, 255, 255, skill.lifetime * 5);
        box(size, size, size);
      } else if (skill.type === "d") {
        fill(255, 165, 0, skill.lifetime * 5);
        cone(size, size * 2);
      } else if (skill.type === "f") {
        fill(255, 255, 0, skill.lifetime * 5);
        drawShuriken((size / 100) * 1);
      }
      pop();
    }

    if (skill.distanceTraveled > SKILL_MAX_DISTANCE || skill.lifetime <= 0) {
      skills.splice(i, 1);
    }
  }
}

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
    fill(255, 0, 0); // Red for enemies
    box(40, 40, 40);
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

function spawnMiniTank() {
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

function updateMiniTankPosition(miniTank) {
  // Move in same direction as player
  if (moving.up || moving.down || moving.left || moving.right) {
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
    // Update ally tank position with same movement
    miniTank.x += moveX;
    miniTank.z += moveZ;
  }

  // Calculate angle towards nearest enemy for shooting
  let nearestEnemy = findNearestEnemies(1)[0];
  if (nearestEnemy && frameCount % 30 === 0) {
    let bulletAngle = atan2(nearestEnemy.z - miniTank.z, nearestEnemy.x - miniTank.x);
    bullets.push({
      x: miniTank.x,
      y: 0,
      z: miniTank.z,
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
    } else if (frameCount % 60 === 0) {
      // Shoot at the player if within shooting distance
      let bulletAngle = atan2(playerZ - enemy.z, playerX - enemy.x);
      enemyBullets.push({
        x: enemy.x,
        y: 0,
        z: enemy.z,
        dx: cos(bulletAngle),
        dz: sin(bulletAngle),
        distanceTraveled: 0,
      });
    }
  }
}

function keyPressed() {
  if (gamePaused) {
    return;
  }
  if (keyCode === LEFT_ARROW) {
    moving.left = true;
  } else if (keyCode === RIGHT_ARROW) {
    moving.right = true;
  } else if (keyCode === UP_ARROW) {
    moving.up = true;
  } else if (keyCode === DOWN_ARROW) {
    moving.down = true;
  } else if (key.toLowerCase() === "a") {
    casting.a = true;
  } else if (key.toLowerCase() === "s") {
    casting.s = true;
  } else if (key.toLowerCase() === "d") {
    casting.d = true;
  } else if (key.toLowerCase() === "f") {
    casting.f = true;
  } else if (key.toLowerCase() === "g") {
    casting.g = true;
  } else if (key.toLowerCase() === "h") {
    casting.h = true;
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

function mouseWheel(event) {
  // Prevent default behavior (page scrolling)
  event.preventDefault();

  // Adjust zoom level with mouse wheel when middle mouse is not held
  if (!isMiddleMouseDown) {
    let zoomChange = event.delta > 0 ? 0.01 : -0.01;
    zoomLevel = constrain(zoomLevel + zoomChange, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL);
  }
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

  // Special handling for ally tanks (type 'g')
  if (type === "g") {
    spawnMiniTank();
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

function spawnEnemies(count = 1) {
  for (let i = 0; i < count; i++) {
    const types = Object.keys(ENEMY_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    spawnEnemy(type);
  }
}

function checkCollisions() {
  // Check bullet collisions with enemies
  bullets = bullets.filter((bullet) => {
    let hit = false;
    enemies = enemies.filter((enemy) => {
      const dx = enemy.x - bullet.x;
      const dz = enemy.z - bullet.z;
      const distance = sqrt(dx * dx + dz * dz);
      if (distance < enemy.type.size / 2) {
        hit = true;
        enemy.health -= bullet.damage;
        if (enemy.health <= 0) {
          enemiesKilled++;
          score += enemy.type.health; // Score based on enemy health
          return false;
        }
        return true;
      }
      return true;
    });
    return !hit;
  });

  // Check enemy bullet collisions with squad members
  enemyBullets = enemyBullets.filter((bullet) => {
    let hit = false;
    squad.members.forEach(member => {
      const dx = member.x - bullet.x;
      const dz = member.z - bullet.z;
      const distance = sqrt(dx * dx + dz * dz);
      if (distance < tankSize / 2) {
        squad.health -= bullet.damage;
        hit = true;
      }
    });
    return !hit;
  });

  // Check powerup collisions with squad
  powerups.forEach(powerup => {
    if (!powerup.collected) {
      squad.members.forEach(member => {
        const dx = member.x - powerup.x;
        const dz = member.z - powerup.z;
        const distance = sqrt(dx * dx + dz * dz);
        if (distance < tankSize) {
          powerup.collected = true;
          applyPowerup(powerup.type);
        }
      });
    }
  });

  // Check if game over
  if (squad.health <= 0) {
    gamePaused = true;
    alert('Game Over! Score: ' + score);
  }

  // Skill collision with enemies
  for (let i = skills.length - 1; i >= 0; i--) {
    let skill = skills[i];
    // For ally tanks, use fixed size. For other skills, use expanding size
    let skillSize = skill.type === 'g' ?
      SKILL_BASE_SIZE * 0.5 : // Fixed size for ally tanks
      constrain(
        map(skill.distanceTraveled, 0, SKILL_EXPAND_DISTANCE, 10, SKILL_BASE_SIZE * skill.sizeFactor),
        10,
        SKILL_BASE_SIZE * skill.sizeFactor
      );

    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      if (isColliding(skill, skillSize, enemy)) {
        // If the enemy is within the skill's area
        enemies[j].health -= 10;
        if (enemies[j].health <= 0) {
          enemies.splice(j, 1);
          enemiesKilled++;
          if (enemiesKilled >= ENEMIES_TO_KILL) {
            gamePaused = true;
          } else {
            spawnEnemies(1);
          }
        }
      }
    }
  }
}

// Function to check if a skill is colliding with an enemy
function isColliding(skill, skillSize, enemy) {
  // Check if the bounding boxes of the skill and enemy overlap
  return (
    skill.x - skillSize / 2 < enemy.x + 20 &&
    skill.x + skillSize / 2 > enemy.x - 20 &&
    skill.z - skillSize / 2 < enemy.z + 20 &&
    skill.z + skillSize / 2 > enemy.z - 20
  );
}

// Configuration variables

// Gameplay Mechanics
const ENEMIES_TO_KILL = 1_000_000_000; // Number of enemies to kill before pausing
const MAX_ENEMIES = 50; // Maximum number of enemies at any time

// Bullet and Skill Properties

// Bullet Properties
const BULLET_SPEED = 8; // Speed of the player's bullets
const ENEMY_BULLET_SPEED = 3; // Speed of the enemy's bullets
const BULLET_MAX_DISTANCE = 1000; // Maximum distance bullets can travel
const BULLET_FIRE_INTERVAL = 30; // Fire bullets every 500ms (30 frames at 60 FPS)
const BULLET_SIZE = 5;

// Skill Properties
const SKILL_SPEED = 12; // Speed of the skills
const SKILL_BASE_SIZE = 30; // Base size of the skill
const SKILL_MAX_DISTANCE = 2000; // Maximum distance skills can travel
const SKILL_EXPAND_DISTANCE = 0; // Distance after which the skill expands

// Enemy Settings
const ENEMY_SHOOTING_DISTANCE = 500; // Increased maximum distance for enemies to shoot
const ENEMY_SPAWN_DISTANCE = 1500; // Increased maximum distance for enemies to shoot

// Camera Settings
const MIN_CAMERA_HEIGHT = -500; // Minimum camera height (ground level)
const MAX_CAMERA_HEIGHT = 0; // Maximum camera height (tank level)

// Camera Settings
const MIN_ZOOM_LEVEL = 0.04; // Maximum camera height (tank level)
const MAX_ZOOM_LEVEL = 2; // Minimum camera height (ground level)

// Movement Speeds
const PLAYER_MOVE_SPEED = 6; // Speed of the player's tank
const ENEMY_MOVE_SPEED = 2; // Speed of the enemies

// Visual Aids
const AIM_LINE_LENGTH = 2000; // Configurable length of the aim line

// Ground Settings
const GROUND_TILE_SIZE = 16000; // Size of each ground tile (4x larger)
const GROUND_TILES = 1; // Number of tiles in each direction (3x3 grid)
const GROUND_REPEAT_DISTANCE = GROUND_TILE_SIZE; // Distance before ground repeats

let playerX = 0;
let playerZ = 0;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let skills = [];
let moving = { left: false, right: false, up: false, down: false };

// Mouse control variables
let isMiddleMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let playerHealth = 1000; // Default health
let enemiesKilled = 0;
let tankSize = 75; // Tank size
let zoomLevel = 0.2; // Default zoom level
let gamePaused = true;

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
  return {
    playerHealth,
    enemiesKilled,
    cameraHeight,
    cameraAngle,
    zoomLevel,
    gamePaused,
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

function drawGround() {
  push();
  translate(0, 50, 0); // Move ground down by 50 units
  
  // Calculate which grid cell the player is in
  let gridX = Math.floor(playerX / GROUND_REPEAT_DISTANCE);
  let gridZ = Math.floor(playerZ / GROUND_REPEAT_DISTANCE);
  
  // Draw ground tiles centered around player
  for (let x = -GROUND_TILES; x <= GROUND_TILES; x++) {
    for (let z = -GROUND_TILES; z <= GROUND_TILES; z++) {
      push();
      translate(
        (gridX + x) * GROUND_REPEAT_DISTANCE,
        0,
        (gridZ + z) * GROUND_REPEAT_DISTANCE
      );
      
      // Draw ground tile with image
      noStroke();
      rotateX(HALF_PI);
      texture(groundTexture);
      
      // Draw a single large texture for each tile
      // Scale UV coordinates to 1/4 to make texture 4x larger
      beginShape();
      textureMode(NORMAL);
      vertex(-GROUND_TILE_SIZE/2, -GROUND_TILE_SIZE/2, 0, 0, 0);
      vertex(GROUND_TILE_SIZE/2, -GROUND_TILE_SIZE/2, 0, 0.25, 0);
      vertex(GROUND_TILE_SIZE/2, GROUND_TILE_SIZE/2, 0, 0.25, 0.25);
      vertex(-GROUND_TILE_SIZE/2, GROUND_TILE_SIZE/2, 0, 0, 0.25);
      endShape(CLOSE);
      
      pop();
    }
  }
  pop();
}

function draw() {
  if (gamePaused) {
    return;
  }

  // Update camera angle based on key presses
  if (rotatingLeft) {
    cameraAngle -= PI / 180; // Rotate left
  }
  if (rotatingRight) {
    cameraAngle += PI / 180; // Rotate right
  }

  // Adjust camera height based on key presses
  if (increasingHeight) {
    cameraHeight = min(cameraHeight + 2, MAX_CAMERA_HEIGHT); // Increase camera height, but not above tank level
  }
  if (decreasingHeight) {
    cameraHeight = max(cameraHeight - 2, MIN_CAMERA_HEIGHT); // Decrease camera height, but not below ground level
  }

  // Move camera closer or further from the tank with t and y
  if (movingCloser) {
    zoomLevel = min(zoomLevel + 0.005, MAX_ZOOM_LEVEL);
  }
  if (movingFarther) {
    zoomLevel = max(zoomLevel - 0.005, MIN_ZOOM_LEVEL);
  }

  background(135, 206, 235); // Sky color

  // Lighting
  ambientLight(75); // Ánh sáng môi trường
  directionalLight(255, 255, 255, 0, 1, -1);

  // Draw infinite ground
  drawGround();

  // Move camera with player and apply zoom
  let camX = playerX + (cos(cameraAngle) * cameraDistance) / zoomLevel;
  let camZ = playerZ + (sin(cameraAngle) * cameraDistance) / zoomLevel;

  // Adjust camera height and ensure it rotates around the tank
  camera(camX, cameraHeight / zoomLevel, camZ, playerX, 0, playerZ, 0, 1, 0);

  // Draw tank
  drawTank(true); // Player tank needs translation

  // Draw aim lines for active skills
  drawSkillAimLines();

  // Draw bullets
  drawBullets();

  // Draw enemy bullets
  drawEnemyBullets();

  // Draw skills
  drawSkills();

  // Draw cast skills
  drawCastSkills();

  // Draw enemies
  drawEnemies();

  // Update player position
  updatePlayerPosition();

  // Update enemies position
  updateEnemiesPosition();

  updateTurretAngle();

  // Check collisions
  checkCollisions();

  // Automatically fire bullets every BULLET_FIRE_INTERVAL frames
  if (frameCount % BULLET_FIRE_INTERVAL === 0) {
    fireBullet();
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
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.dx * BULLET_SPEED;
    bullet.z += bullet.dz * BULLET_SPEED;
    bullet.distanceTraveled += BULLET_SPEED;

    push();
    translate(bullet.x, bullet.y, bullet.z);
    sphere(BULLET_SIZE);
    pop();

    // Remove bullets that have traveled beyond the maximum distance
    if (bullet.distanceTraveled > BULLET_MAX_DISTANCE) {
      bullets.splice(i, 1);
    }
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
      { radius: 50, alpha:255 },
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
  if(casting.h && currentTime - lastCastTime.h >= cooldown.h){
    if (millis() - lastCastTime.h > 500) { // 500ms cooldown
      waves.push(new Wave(playerX, playerZ, 9999  ));
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

function spawnEnemies() {
  // Count the number of enemies within the spawn distance
  let enemiesWithinRadius = enemies.filter((enemy) => {
    return (
      dist(enemy.x, 0, enemy.z, playerX, 0, playerZ) < ENEMY_SPAWN_DISTANCE
    );
  }).length;

  // Spawn new enemies if the count is below the maximum
  while (enemiesWithinRadius < MAX_ENEMIES) {
    let x = random(
      playerX - ENEMY_SPAWN_DISTANCE,
      playerX + ENEMY_SPAWN_DISTANCE
    );
    let z = random(
      playerZ - ENEMY_SPAWN_DISTANCE,
      playerZ + ENEMY_SPAWN_DISTANCE
    );

    // Ensure enemies do not spawn too close to the player
    if (dist(x, 0, z, playerX, 0, playerZ) > tankSize) {
      enemies.push({ x: x, z: z, health: 10 });
      enemiesWithinRadius++;
    }
  }
}

function checkCollisions() {
  // Bullet collision with enemies
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      let enemy = enemies[j];
      let d = dist(bullet.x, bullet.y, bullet.z, enemy.x, 0, enemy.z);
      if (d < 40) {
        enemies[j].health -= 10;
        bullets.splice(i, 1);
        if (enemies[j].health <= 0) {
          enemies.splice(j, 1);
          enemiesKilled++;
          if (enemiesKilled >= ENEMIES_TO_KILL) {
            gamePaused = true;
          } else {
            spawnEnemies(1);
          }
        }
        break;
      }
    }
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

  // Enemy bullet collision with player
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let bullet = enemyBullets[i];
    let d = dist(bullet.x, bullet.y, bullet.z, playerX, 0, playerZ);
    if (d < 40) {
      playerHealth -= 1;
      enemyBullets.splice(i, 1);
      if (playerHealth <= 0) {
        gamePaused = true;
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

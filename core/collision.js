// Collision System Module
// Handles collision detection and spatial partitioning

// Spatial grid for collision detection
let spatialGrid = {};
const GRID_CELL_SIZE = 200; // Size of each grid cell

// Initialize the collision system
function initCollisionSystem() {
  spatialGrid = {};
  console.log("Collision system initialized");
}

// Get grid cell key from position
function getGridKey(x, y) {
  const gridX = Math.floor(x / GRID_CELL_SIZE);
  const gridY = Math.floor(y / GRID_CELL_SIZE);
  return `${gridX},${gridY}`;
}

// Add entity to spatial grid
function addToSpatialGrid(entity) {
  const key = getGridKey(entity.x, entity.y);
  
  if (!spatialGrid[key]) {
    spatialGrid[key] = [];
  }
  
  spatialGrid[key].push(entity);
}

// Clear the spatial grid
function clearSpatialGrid() {
  spatialGrid = {};
}

// Get nearby entities from spatial grid
function getNearbyEntities(x, y, radius) {
  const results = [];
  const searchRadius = Math.ceil(radius / GRID_CELL_SIZE);
  
  const centerGridX = Math.floor(x / GRID_CELL_SIZE);
  const centerGridY = Math.floor(y / GRID_CELL_SIZE);
  
  // Check all grid cells within search radius
  for (let gridX = centerGridX - searchRadius; gridX <= centerGridX + searchRadius; gridX++) {
    for (let gridY = centerGridY - searchRadius; gridY <= centerGridY + searchRadius; gridY++) {
      const key = `${gridX},${gridY}`;
      
      if (spatialGrid[key]) {
        results.push(...spatialGrid[key]);
      }
    }
  }
  
  return results;
}

// Check if two entities are colliding
function checkCollision(entity1, entity2) {
  // Calculate squared distance between entities
  const dx = entity1.x - entity2.x;
  const dy = entity1.y - entity2.y;
  const dz = (entity1.z || 0) - (entity2.z || 0);
  
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  
  // Calculate squared sum of radii
  const radiiSum = (entity1.size || 0) + (entity2.size || 0);
  const radiiSumSquared = radiiSum * radiiSum;
  
  // Collision occurs if distance is less than sum of radii
  return distanceSquared < radiiSumSquared;
}

// Check if a point is inside a rectangle
function pointInRect(x, y, rectX, rectY, rectWidth, rectHeight) {
  return (
    x >= rectX - rectWidth / 2 &&
    x <= rectX + rectWidth / 2 &&
    y >= rectY - rectHeight / 2 &&
    y <= rectY + rectHeight / 2
  );
}

// Check if a point is beyond a boundary
function isBeyondBoundary(y, boundaryY) {
  return y > boundaryY;
}

// Check if a point is beyond the wall
function isBeyondWall(y) {
  return y > WALL_Y;
}

// Check if a point is within the power-up lane
function isInPowerUpLane(x) {
  return x > BRIDGE_WIDTH / 2;
}

// Check collisions between projectiles and enemies
function checkProjectileEnemyCollisions(projectiles, enemies) {
  // Build spatial grid for enemies
  clearSpatialGrid();
  
  for (let enemy of enemies) {
    addToSpatialGrid(enemy);
  }
  
  // Check each projectile against nearby enemies
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    
    // Skip projectiles that have already hit something
    if (proj.hasHit) continue;
    
    // Get nearby enemies
    const nearbyEnemies = getNearbyEntities(proj.x, proj.y, proj.size + 100);
    
    // Check collision with each nearby enemy
    for (let j = 0; j < nearbyEnemies.length; j++) {
      const enemy = nearbyEnemies[j];
      
      // Skip if enemy is already dead
      if (enemy.health <= 0) continue;
      
      // Check collision
      if (checkCollision(proj, enemy)) {
        // Handle collision
        handleProjectileEnemyCollision(proj, enemy);
        
        // Mark projectile as hit
        proj.hasHit = true;
        
        // Remove projectile if it's not a penetrating type
        if (!proj.penetrating) {
          projectiles.splice(i, 1);
          break;
        }
      }
    }
  }
}

// Handle collision between projectile and enemy
function handleProjectileEnemyCollision(projectile, enemy) {
  // Calculate damage based on weapon type and power-ups
  let damage = getWeaponDamage(projectile.weapon);
  
  // Apply damage boost
  if (damageBoost > 0) {
    damage *= (1 + damageBoost / 20);
  }
  
  // Apply critical hit chance
  if (Math.random() < 0.1) {
    damage *= 2;
    createHitEffect(enemy.x, enemy.y, enemy.z, [255, 255, 0], enemy.size / 2);
  }
  
  // Apply damage to enemy
  enemy.health -= damage;
  
  // Create hit effect
  createHitEffect(
    enemy.x,
    enemy.y,
    enemy.z,
    WEAPON_COLORS[projectile.weapon] || [255, 255, 255],
    enemy.size / 3
  );
  
  // Check if enemy is defeated
  if (enemy.health <= 0) {
    // Create explosion effect
    createExplosionEffect(
      enemy.x,
      enemy.y,
      enemy.z,
      [255, 100, 0],
      enemy.size
    );
    
    // Increment kill counters
    totalEnemiesKilled++;
    waveEnemiesKilled++;
    
    // Add score
    score += getEnemyScore(enemy.type);
    
    // Remove enemy
    const enemyIndex = enemies.indexOf(enemy);
    if (enemyIndex !== -1) {
      enemies.splice(enemyIndex, 1);
    }
  }
}

// Check collisions between squad members and enemies
function checkSquadEnemyCollisions(squad, enemies) {
  // Check each squad member against each enemy
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    for (let j = squad.length - 1; j >= 0; j--) {
      const member = squad[j];
      
      // Calculate collision size based on entity sizes
      const collisionSize = (enemy.size + member.size) * 0.8;
      
      // Calculate squared distance
      const dx = enemy.x - member.x;
      const dy = enemy.y - member.y;
      const dz = (enemy.z || 0) - (member.z || 0);
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      // Check if colliding
      if (distanceSquared < collisionSize * collisionSize) {
        // Create collision effect
        if (frameCount % 10 === 0) {
          // Only create effect occasionally to avoid too many effects
          effects.push({
            x: (enemy.x + member.x) / 2,
            y: (enemy.y + member.y) / 2,
            z: (enemy.z + member.z) / 2,
            type: "hit",
            size: collisionSize / 2,
            life: 15,
            color: [255, 0, 0, 150], // Red for enemy collision
          });
        }
        
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
          // Create explosion effect
          createExplosionEffect(enemy.x, enemy.y, enemy.z, [255, 100, 0], enemy.size);
          enemies.splice(i, 1);
        }
        
        break;
      }
    }
  }
}

// Check collisions between squad members and power-ups
function checkSquadPowerUpCollisions(squad, powerUps) {
  // Check each squad member against each power-up
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    
    for (let j = 0; j < squad.length; j++) {
      const member = squad[j];
      
      // Calculate collision size
      const collisionSize = (powerUp.size + member.size) * 0.8;
      
      // Calculate squared distance
      const dx = powerUp.x - member.x;
      const dy = powerUp.y - member.y;
      const dz = (powerUp.z || 0) - (member.z || 0);
      const distanceSquared = dx * dx + dy * dy + dz * dz;
      
      // Check if colliding
      if (distanceSquared < collisionSize * collisionSize) {
        // Handle power-up collection
        handlePowerUpCollection(powerUp);
        
        // Remove power-up
        powerUps.splice(i, 1);
        break;
      }
    }
  }
}

// Get weapon damage based on weapon type
function getWeaponDamage(weaponType) {
  const damageValues = {
    thunderbolt: 20,
    blaster: 30,
    inferno: 25,
    frostbite: 15,
    vortex: 35,
    plasma: 40,
    photon: 50,
    mirror: 25
  };
  
  return damageValues[weaponType] || 20;
}

// Get enemy score based on enemy type
function getEnemyScore(enemyType) {
  const scoreValues = {
    standard: 10,
    elite: 25,
    boss1: 100,
    boss2: 250,
    boss3: 500
  };
  
  return scoreValues[enemyType] || 10;
}

// Get enemy max health based on enemy type
function getEnemyMaxHealth(enemyType) {
  const healthValues = {
    standard: 50,
    elite: 100,
    boss1: 500,
    boss2: 1000,
    boss3: 2000
  };
  
  return healthValues[enemyType] || 50;
}
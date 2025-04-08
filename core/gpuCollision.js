// GPU-Accelerated Collision System for Squad Game
// Uses spatial partitioning for efficient collision detection

class SpatialGrid {
  constructor(cellSize = 100) {
    this.cellSize = cellSize;
    this.grid = {};
    this.objectCells = new Map(); // Maps objects to their cell coordinates
  }
  
  // Get cell coordinates for a position
  getCellCoords(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  // Add an object to the grid
  addObject(object) {
    const cellCoords = this.getCellCoords(object.x, object.y);
    
    // Initialize cell if it doesn't exist
    if (!this.grid[cellCoords]) {
      this.grid[cellCoords] = [];
    }
    
    // Add object to cell
    this.grid[cellCoords].push(object);
    
    // Remember which cell this object is in
    this.objectCells.set(object, cellCoords);
  }
  
  // Update object position in the grid
  updateObject(object) {
    const oldCellCoords = this.objectCells.get(object);
    const newCellCoords = this.getCellCoords(object.x, object.y);
    
    // If the object has moved to a new cell
    if (oldCellCoords !== newCellCoords) {
      // Remove from old cell
      if (oldCellCoords && this.grid[oldCellCoords]) {
        const index = this.grid[oldCellCoords].indexOf(object);
        if (index !== -1) {
          this.grid[oldCellCoords].splice(index, 1);
        }
      }
      
      // Add to new cell
      if (!this.grid[newCellCoords]) {
        this.grid[newCellCoords] = [];
      }
      this.grid[newCellCoords].push(object);
      
      // Update cell reference
      this.objectCells.set(object, newCellCoords);
    }
  }
  
  // Remove an object from the grid
  removeObject(object) {
    const cellCoords = this.objectCells.get(object);
    
    if (cellCoords && this.grid[cellCoords]) {
      const index = this.grid[cellCoords].indexOf(object);
      if (index !== -1) {
        this.grid[cellCoords].splice(index, 1);
      }
      
      this.objectCells.delete(object);
    }
  }
  
  // Get all objects in the same cell and neighboring cells
  getNearbyObjects(x, y) {
    const cellCoords = this.getCellCoords(x, y);
    const cellX = parseInt(cellCoords.split(',')[0]);
    const cellY = parseInt(cellCoords.split(',')[1]);
    
    const nearbyObjects = [];
    
    // Check current cell and all 8 neighboring cells
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const neighborCoords = `${cellX + i},${cellY + j}`;
        
        if (this.grid[neighborCoords]) {
          nearbyObjects.push(...this.grid[neighborCoords]);
        }
      }
    }
    
    return nearbyObjects;
  }
  
  // Clear the entire grid
  clear() {
    this.grid = {};
    this.objectCells.clear();
  }
}

// Collision detection system using spatial partitioning
class CollisionSystem {
  constructor() {
    this.spatialGrid = new SpatialGrid(150); // Cell size of 150 units
    this.projectileGrid = new SpatialGrid(200); // Larger cells for projectiles
    this.enabled = true;
  }
  
  // Initialize the system with existing objects
  init() {
    // Clear existing grids
    this.spatialGrid.clear();
    this.projectileGrid.clear();
    
    // Add squad members to grid
    for (const member of squad) {
      this.spatialGrid.addObject(member);
    }
    
    // Add enemies to grid
    for (const enemy of enemies) {
      this.spatialGrid.addObject(enemy);
    }
    
    // Add projectiles to grid
    for (const projectile of projectiles) {
      this.projectileGrid.addObject(projectile);
    }
  }
  
  // Update object positions in the grid
  updatePositions() {
    if (!this.enabled) return;
    
    // Update squad members
    for (const member of squad) {
      this.spatialGrid.updateObject(member);
    }
    
    // Update enemies
    for (const enemy of enemies) {
      this.spatialGrid.updateObject(enemy);
    }
    
    // Update projectiles
    for (const projectile of projectiles) {
      this.projectileGrid.updateObject(projectile);
    }
  }
  
  // Add a new object to the appropriate grid
  addObject(object, type) {
    if (!this.enabled) return;
    
    if (type === 'projectile') {
      this.projectileGrid.addObject(object);
    } else {
      this.spatialGrid.addObject(object);
    }
  }
  
  // Remove an object from the grid
  removeObject(object, type) {
    if (!this.enabled) return;
    
    if (type === 'projectile') {
      this.projectileGrid.removeObject(object);
    } else {
      this.spatialGrid.removeObject(object);
    }
  }
  
  // Check for collisions between projectiles and entities
  checkProjectileCollisions() {
    if (!this.enabled) return [];
    
    const collisions = [];
    
    // For each projectile
    for (let i = 0; i < projectiles.length; i++) {
      const projectile = projectiles[i];
      
      // Get nearby entities
      const nearbyEntities = this.spatialGrid.getNearbyObjects(projectile.x, projectile.y);
      
      // Check for collisions with each nearby entity
      for (const entity of nearbyEntities) {
        // Skip if entity is a squad member and projectile is from squad
        if (entity.isSquadMember && projectile.fromSquad) continue;
        
        // Skip if entity is an enemy and projectile is from enemy
        if (!entity.isSquadMember && !projectile.fromSquad) continue;
        
        // Calculate distance
        const dx = entity.x - projectile.x;
        const dy = entity.y - projectile.y;
        const dz = entity.z - projectile.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Check for collision
        if (distance < entity.size / 2 + projectile.size / 2) {
          collisions.push({
            projectile: projectile,
            entity: entity,
            index: i
          });
          
          // Break to avoid checking more entities for this projectile
          break;
        }
      }
    }
    
    return collisions;
  }
  
  // Check for collisions between squad members and enemies
  checkSquadEnemyCollisions() {
    if (!this.enabled) return [];
    
    const collisions = [];
    
    // For each squad member
    for (const member of squad) {
      // Get nearby entities
      const nearbyEntities = this.spatialGrid.getNearbyObjects(member.x, member.y);
      
      // Check for collisions with each nearby entity
      for (const entity of nearbyEntities) {
        // Skip if entity is not an enemy
        if (entity.isSquadMember) continue;
        
        // Calculate distance
        const dx = entity.x - member.x;
        const dy = entity.y - member.y;
        const dz = entity.z - member.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Check for collision
        if (distance < entity.size / 2 + member.size / 2) {
          collisions.push({
            squadMember: member,
            enemy: entity
          });
        }
      }
    }
    
    return collisions;
  }
  
  // Enable or disable the collision system
  setEnabled(enabled) {
    this.enabled = enabled;
    
    if (enabled) {
      this.init();
    }
  }
}

// Create a global instance
let collisionSystem;

function initCollisionSystem() {
  // Initialize the collision system
  collisionSystem = new CollisionSystem();
  collisionSystem.init();
}

// Function to handle new projectiles
function addProjectileToCollisionSystem(projectile) {
  if (collisionSystem && collisionSystem.enabled) {
    collisionSystem.addObject(projectile, 'projectile');
  }
}

// Function to handle new entities
function addEntityToCollisionSystem(entity, isSquadMember) {
  if (collisionSystem && collisionSystem.enabled) {
    entity.isSquadMember = isSquadMember;
    collisionSystem.addObject(entity, 'entity');
  }
}
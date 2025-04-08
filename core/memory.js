// Memory Management Module
// Handles memory tracking, cleanup and optimization

// Memory management constants
const MAX_OBJECTS = 1000; // Maximum total objects allowed
const MAX_EFFECTS = 300; // Maximum effects allowed
const MAX_PROJECTILES = 200; // Maximum projectiles allowed
const MEMORY_CLEANUP_INTERVAL = 300; // Frames between memory cleanup operations

// Track last memory cleanup time
let lastMemoryCleanup = 0;

// Memory Manager object
const MemoryManager = {
  warningOverlay: null,
  warningShown: false,
  lastWarningTime: 0,

  // Create memory warning overlay if needed
  createWarningOverlay: function() {
    if (this.warningOverlay) return;

    if (window.performance && window.performance.memory) {
      this.warningOverlay = createStyledContainer(width / 2 - 150, 50, 300, {
        styles: {
          backgroundColor: "rgba(255, 0, 0, 0.7)",
          textAlign: "center",
          display: "none"
        }
      });
    }
  },

  // Check memory usage and show warning if needed
  checkMemoryUsage: function() {
    this.createWarningOverlay();

    if (!this.warningOverlay || !window.performance || !window.performance.memory) {
      return;
    }

    const currentMemory = window.performance.memory.usedJSHeapSize / (1024 * 1024);

    // Show warning if memory usage is too high
    if (currentMemory > 800 && !this.warningShown) {
      this.warningShown = true;
      this.warningOverlay.html(`
        <h3>HIGH MEMORY USAGE!</h3>
        <p>Game is using ${currentMemory.toFixed(1)} MB</p>
        <p>Consider refreshing</p>
      `);
      this.warningOverlay.style("display", "block");
      this.lastWarningTime = Date.now();
    } 
    // Hide warning if memory usage has decreased
    else if (currentMemory < 700 && this.warningShown && Date.now() - this.lastWarningTime > 5000) {
      this.warningShown = false;
      this.warningOverlay.style("display", "none");
    }
  },

  // Clean up memory and optimize performance
  cleanupMemory: function(squad, enemies, projectiles, powerUps, effects, projectilePool) {
    // Only run cleanup at specified intervals to avoid performance impact
    if (frameCount - lastMemoryCleanup < MEMORY_CLEANUP_INTERVAL) return;

    lastMemoryCleanup = frameCount;

    // Calculate total objects
    const totalObjects =
      squad.length +
      enemies.length +
      projectiles.length +
      powerUps.length +
      effects.length;

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

      // Only reduce enemies as a last resort (important for gameplay)
      if (totalObjects > MAX_OBJECTS && enemies.length > 50) {
        // Remove enemies that are farthest away from the player
        enemies.sort((a, b) => {
          // Find distance from first squad member
          if (squad.length === 0) return 0;

          const mainMember = squad[0];
          const distA =
            Math.pow(a.x - mainMember.x, 2) + Math.pow(a.y - mainMember.y, 2);
          const distB =
            Math.pow(b.x - mainMember.x, 2) + Math.pow(b.y - mainMember.y, 2);

          // Sort by distance (descending - farthest first)
          return distB - distA;
        });

        // Remove farthest enemies
        enemies.splice(50, enemies.length - 50);
      }

      // Clear object pools when they get too large
      while (projectilePool && projectilePool.length > 30) projectilePool.pop();
    }

    // Force release of any references that might be causing memory leaks
    if (frameCount % 1800 === 0) {
      // Every 30 seconds
      if (projectilePool) projectilePool.length = 0; // Clear the pool completely
    }
  },

  // Limit effects based on performance settings
  limitEffects: function(effects) {
    // Get the current effect multiplier based on performance level
    const effectMultiplier = getEffectMultiplier();
    
    // Calculate maximum effects based on performance level
    const maxEffects = Math.floor(MAX_EFFECTS * effectMultiplier);
    
    // If we have too many effects, prioritize and reduce
    if (effects.length > maxEffects) {
      // Separate effects into priority and normal
      const priorityEffects = effects.filter(
        (e) =>
          e.forceRenderDetail ||
          e.type === "atomicBomb" ||
          e.type === "atomicExplosion" ||
          e.type === "atomicFlash" ||
          e.type === "shockwave" ||
          e.type === "areaBarrier" ||
          e.type === "globalFrost"
      );

      const normalEffects = effects.filter(
        (e) =>
          !e.forceRenderDetail &&
          e.type !== "atomicBomb" &&
          e.type !== "atomicExplosion" &&
          e.type !== "atomicFlash" &&
          e.type !== "shockwave" &&
          e.type !== "areaBarrier" &&
          e.type !== "globalFrost"
      );

      // Keep all priority effects and as many normal effects as we can
      const normalEffectsToKeep = Math.max(
        0,
        maxEffects - priorityEffects.length
      );

      // Keep the newest normal effects (they're more relevant)
      const newNormalEffects = normalEffects.slice(-normalEffectsToKeep);

      // Update the effects array
      effects = [...priorityEffects, ...newNormalEffects];
      
      return effects;
    }
    
    return effects;
  },
  
  // Initial cleanup to free memory
  initialCleanup: function() {
    // Purge any old references
    setTimeout(function () {
      // Clear arrays just in case
      if (typeof effects !== 'undefined') effects = [];
      if (typeof projectiles !== 'undefined') projectiles = [];
      if (typeof projectilePool !== 'undefined') projectilePool = [];

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
};

// Wrapper function for backward compatibility
function checkMemoryUsage() {
  MemoryManager.checkMemoryUsage();
}
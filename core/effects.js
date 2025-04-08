// Visual Effects Module
// Handles creation and rendering of visual effects

// Effects array
let effects = [];

// Effect constants
const EFFECT_DURATION = 30 * 0.5; // frames

// Global effect states
let globalFireEffect = null;
let globalFrostEffect = null;
let globalTimeDilationEffect = null;

// Create a hit effect at the specified position
function createHitEffect(x, y, z, color, size = 15) {
  // Create the main hit effect
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "hit",
    size: size,
    life: 20,
    color: color || [255, 255, 255],
  });

  // Add a few spark particles
  const sparkCount = Math.min(5, Math.floor(size / 3));
  for (let i = 0; i < sparkCount; i++) {
    const angle = random(TWO_PI);
    const dist = random(size * 0.2, size * 0.5);
    effects.push({
      x: x + cos(angle) * dist,
      y: y + sin(angle) * dist,
      z: z + random(-5, 5),
      type: "spark",
      size: random(2, 5),
      life: random(10, 20),
      color: color || [255, 255, 255],
      velocity: {
        x: cos(angle) * random(0.5, 2),
        y: sin(angle) * random(0.5, 2),
        z: random(0.2, 1),
      },
    });
  }
}

// Create an explosion effect at the specified position
function createExplosionEffect(x, y, z, color, size = 30) {
  // Create the main explosion
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "explosion",
    size: size,
    life: 30,
    color: color || [255, 100, 0],
  });

  // Add shockwave
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "shockwave",
    size: size * 1.5,
    life: 30,
    color: [255, 255, 255, 150],
  });
}

// Create ice effect on a target
function createIceEffect(x, y, z) {
  // Create ice crystals around the target
  const iceColor = [200, 240, 255];

  // Create a main ice crystal
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "iceCrystal",
    size: 25,
    life: 120,
    color: iceColor,
    growthTime: 10, // Frames to reach full size
    rotationSpeed: random(-0.05, 0.05),
  });

  // Create smaller ice crystals around the main one
  for (let i = 0; i < 5; i++) {
    effects.push({
      x: x + random(-15, 15),
      y: y + random(-15, 15),
      z: z + random(0, 20),
      type: "iceCrystal",
      size: random(5, 15),
      life: random(60, 100),
      color: iceColor,
      growthTime: random(5, 15),
      rotationSpeed: random(-0.1, 0.1),
    });
  }

  // Create a frost burst effect
  effects.push({
    x: x,
    y: y,
    z: z,
    type: "frostBurst",
    size: 30,
    life: 20,
    color: iceColor,
  });
}

// Create a global fire effect
function createGlobalFireEffect(duration, intensity = 0.3) {
  globalFireEffect = {
    life: duration,
    intensity: intensity
  };
}

// Create a global frost effect
function createGlobalFrostEffect(duration, intensity = 0.5) {
  globalFrostEffect = {
    life: duration,
    intensity: intensity
  };
}

// Create a global time dilation effect
function createGlobalTimeDilationEffect(duration, intensity = 0.2) {
  globalTimeDilationEffect = {
    life: duration,
    intensity: intensity
  };
}

// Update all effects
function updateEffects() {
  // Update global effects
  if (globalFireEffect) {
    globalFireEffect.life--;
    if (globalFireEffect.life <= 0) {
      globalFireEffect = null;
    }
  }
  
  if (globalFrostEffect) {
    globalFrostEffect.life--;
    if (globalFrostEffect.life <= 0) {
      globalFrostEffect = null;
    }
  }
  
  if (globalTimeDilationEffect) {
    globalTimeDilationEffect.life--;
    if (globalTimeDilationEffect.life <= 0) {
      globalTimeDilationEffect = null;
    }
  }

  // Update individual effects
  for (let i = effects.length - 1; i >= 0; i--) {
    let effect = effects[i];
    
    // Decrease life
    effect.life--;
    
    // Remove dead effects
    if (effect.life <= 0) {
      effects.splice(i, 1);
      continue;
    }
    
    // Update effect positions if they have velocity
    if (effect.velocity) {
      effect.x += effect.velocity.x;
      effect.y += effect.velocity.y;
      effect.z += effect.velocity.z;
      
      // Apply gravity to some effect types
      if (effect.type === "spark" || effect.type === "debris") {
        effect.velocity.z -= 0.1; // Gravity
      }
    }
    
    // Update effects that follow entities
    if (effect.member) {
      effect.x = effect.member.x;
      effect.y = effect.member.y;
      effect.z = effect.member.z;
      
      // Apply offset if specified
      if (effect.offset) {
        effect.y += effect.offset;
      }
    }
  }
}

// Draw all effects
function drawEffects() {
  // Apply global effects first
  applyGlobalEffects();
  
  // Draw individual effects
  for (let effect of effects) {
    push();
    translate(effect.x, effect.y, effect.z);
    
    // Get effect color
    const effectColor = effect.color || [255, 255, 255];
    
    // Calculate alpha based on life (fade out as life decreases)
    const alpha = map(effect.life, 0, effect.maxLife || 30, 0, 255);
    
    // Draw different effect types
    switch (effect.type) {
      case "hit":
        drawHitEffect(effect, effectColor, alpha);
        break;
      case "explosion":
        drawExplosionEffect(effect, effectColor, alpha);
        break;
      case "shockwave":
        drawShockwaveEffect(effect, effectColor, alpha);
        break;
      case "spark":
        drawSparkEffect(effect, effectColor, alpha);
        break;
      case "iceCrystal":
        drawIceCrystalEffect(effect, effectColor, alpha);
        break;
      case "frostBurst":
        drawFrostBurstEffect(effect, effectColor, alpha);
        break;
      // Add more effect types as needed
    }
    
    pop();
  }
}

// Apply global visual effects
function applyGlobalEffects() {
  // Check if we have multiple global effects active
  if (globalFireEffect && globalTimeDilationEffect) {
    // Combined fire and time dilation effect
    const fireIntensity = globalFireEffect.intensity || 0.3;
    const dilationIntensity = globalTimeDilationEffect.intensity || 0.2;
    
    // Calculate fade alphas
    const fireFadeAlpha = (globalFireEffect.life / 600) * fireIntensity * 30;
    const dilationFadeAlpha = (globalTimeDilationEffect.life / 480) * dilationIntensity * 20;

    // Apply a semi-transparent blended overlay
    push();
    translate(0, 0, 1000); // Move in front of everything
    noStroke();

    // First layer - fire effect
    fill(255, 100, 50, fireFadeAlpha * 0.7);
    plane(width * 2, height * 2);

    // Second layer - time dilation effect
    fill(0, 200, 255, dilationFadeAlpha * 0.6);
    plane(width * 2, height * 2);

    // Add special combined effect - energy flicker
    if (frameCount % 3 === 0) {
      fill(200, 150, 200, random(5, 10));
      plane(width * 2, height * 2);
    }

    pop();

    // Adjust lighting for combined effect - energized light
    ambientLight(210, 190, 200);
    directionalLight(230, 210, 220, 0, -1, -1);
  } else if (globalFrostEffect) {
    // Apply a simplified blue tint to the scene based on the frost intensity
    const intensity = globalFrostEffect.intensity || 0.5;
    const fadeAlpha = (globalFrostEffect.life / 120) * intensity * 25;

    // Apply a simplified semi-transparent blue overlay
    push();
    translate(0, 0, 1000); // Move in front of everything
    fill(200, 240, 255, min(fadeAlpha, 150)); // Cap the maximum alpha for better performance
    noStroke();
    plane(width * 2, height * 2); // Cover the entire screen
    pop();

    // Simplified lighting for frost effect
    ambientLight(190, 210, 230); // Bluer ambient light
    directionalLight(200, 220, 255, 0, -1, -1); // Bluer directional light
  } else if (globalFireEffect) {
    // Apply a red-orange tint to the scene based on the fire intensity
    const intensity = globalFireEffect.intensity || 0.3;
    const fadeAlpha = (globalFireEffect.life / 600) * intensity * 30;

    // Apply a semi-transparent red-orange overlay
    push();
    // Use a 2D overlay for the fire effect
    translate(0, 0, 1000); // Move in front of everything
    fill(255, 100, 50, fadeAlpha);
    noStroke();
    plane(width * 2, height * 2); // Cover the entire screen

    // Add flickering effect
    if (frameCount % 5 === 0) {
      // Random flicker overlay
      fill(255, 150, 0, random(5, 15));
      plane(width * 2, height * 2);
    }
    pop();

    // Adjust lighting for fire effect - warmer, redder light
    ambientLight(220, 180, 160); // Warmer ambient light
    directionalLight(255, 220, 180, 0, -1, -1); // Warmer directional light
  } else if (globalTimeDilationEffect) {
    // Apply a cyan tint to the scene based on the time dilation intensity
    const intensity = globalTimeDilationEffect.intensity || 0.2;
    const fadeAlpha = (globalTimeDilationEffect.life / 480) * intensity * 25;

    // Apply a semi-transparent cyan overlay
    push();
    // Use a 2D overlay for the time dilation effect
    translate(0, 0, 1000); // Move in front of everything
    fill(0, 200, 255, fadeAlpha);
    noStroke();
    plane(width * 2, height * 2); // Cover the entire screen

    // Add time ripple effect
    if (frameCount % 6 === 0) {
      // Subtle ripple overlay
      fill(100, 220, 255, random(3, 8));
      plane(width * 2, height * 2);
    }

    // Add occasional bright flash for time distortion
    if (frameCount % 60 === 0) {
      fill(200, 240, 255, random(10, 20));
      plane(width * 2, height * 2);
    }
    pop();

    // Adjust lighting for time dilation effect - cooler, cyan-tinted light
    ambientLight(190, 210, 220); // Cyan-tinted ambient light
    directionalLight(200, 240, 255, 0, -1, -1); // Cyan-tinted directional light
  } else {
    // Normal lighting
    ambientLight(200); // Higher value for more brightness
    directionalLight(255, 255, 255, 0, -1, -1); // Optimize lighting - only one light source
  }
}

// Helper functions for drawing specific effect types
function drawHitEffect(effect, effectColor, alpha) {
  noStroke();
  fill(effectColor[0], effectColor[1], effectColor[2], alpha);
  
  // Draw a sphere for the hit effect
  sphere(effect.size * (effect.life / 20)); // Shrink as life decreases
  
  // Add a glow effect
  if (effect.life > 10) {
    push();
    fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
    sphere(effect.size * 1.5 * (effect.life / 20));
    pop();
  }
}

function drawExplosionEffect(effect, effectColor, alpha) {
  noStroke();
  
  // Main explosion
  fill(effectColor[0], effectColor[1], effectColor[2], alpha);
  sphere(effect.size * (1 + (30 - effect.life) / 15)); // Expand as life decreases
  
  // Inner bright core
  fill(255, 255, 200, alpha);
  sphere(effect.size * 0.6 * (1 - effect.life / 30)); // Shrink as life decreases
  
  // Add particles
  if (effect.life > 15) {
    for (let i = 0; i < 5; i++) {
      push();
      const angle = random(TWO_PI);
      const dist = random(effect.size * 0.8, effect.size * 1.2);
      translate(cos(angle) * dist, sin(angle) * dist, random(-10, 10));
      fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.7);
      sphere(random(3, 8));
      pop();
    }
  }
}

function drawShockwaveEffect(effect, effectColor, alpha) {
  // Draw shockwave as a torus
  noFill();
  stroke(effectColor[0], effectColor[1], effectColor[2], alpha);
  strokeWeight(3);
  
  // Expand the shockwave as life decreases
  const radius = effect.size * (1 + (30 - effect.life) / 15);
  torus(radius, 5);
}

function drawSparkEffect(effect, effectColor, alpha) {
  // Draw spark as a small bright point
  noStroke();
  fill(effectColor[0], effectColor[1], effectColor[2], alpha);
  
  // Use a box for better performance
  box(effect.size);
  
  // Add a small glow
  fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.5);
  sphere(effect.size * 1.5);
}

function drawIceCrystalEffect(effect, effectColor, alpha) {
  // Calculate growth factor
  const growthFactor = effect.growthTime ? 
    min(1, (effect.maxLife - effect.life) / effect.growthTime) : 1;
  
  // Apply rotation
  if (effect.rotationSpeed) {
    rotateX(frameCount * effect.rotationSpeed);
    rotateY(frameCount * effect.rotationSpeed * 0.7);
    rotateZ(frameCount * effect.rotationSpeed * 0.3);
  }
  
  // Draw ice crystal
  noStroke();
  fill(effectColor[0], effectColor[1], effectColor[2], alpha);
  
  // Use a custom shape for ice crystal
  push();
  scale(effect.size * growthFactor);
  
  // Draw a crystalline shape
  beginShape();
  vertex(0, 0, 1);
  vertex(0.5, 0.5, 0);
  vertex(0, 0.7, 0);
  vertex(-0.5, 0.5, 0);
  endShape(CLOSE);
  
  beginShape();
  vertex(0, 0, 1);
  vertex(0.5, -0.5, 0);
  vertex(0, -0.7, 0);
  vertex(-0.5, -0.5, 0);
  endShape(CLOSE);
  
  beginShape();
  vertex(0, 0, -1);
  vertex(0.5, 0.5, 0);
  vertex(0, 0.7, 0);
  vertex(-0.5, 0.5, 0);
  endShape(CLOSE);
  
  beginShape();
  vertex(0, 0, -1);
  vertex(0.5, -0.5, 0);
  vertex(0, -0.7, 0);
  vertex(-0.5, -0.5, 0);
  endShape(CLOSE);
  
  pop();
  
  // Add a subtle glow
  fill(effectColor[0], effectColor[1], effectColor[2], alpha * 0.3);
  sphere(effect.size * 1.2 * growthFactor);
}

function drawFrostBurstEffect(effect, effectColor, alpha) {
  // Draw frost burst as expanding particles
  noStroke();
  fill(effectColor[0], effectColor[1], effectColor[2], alpha);
  
  // Draw multiple particles in a burst pattern
  for (let i = 0; i < 12; i++) {
    push();
    const angle = i * (TWO_PI / 12);
    const expansionFactor = 1 - effect.life / 20;
    const dist = effect.size * expansionFactor;
    
    translate(cos(angle) * dist, sin(angle) * dist, 0);
    sphere(3 * (1 - expansionFactor));
    pop();
  }
  
  // Add a central flash that fades quickly
  if (effect.life > 15) {
    fill(255, 255, 255, alpha * (effect.life - 15) / 5);
    sphere(effect.size * 0.5 * (effect.life / 20));
  }
}

// Function to clean up any effects that go beyond a boundary
function cleanupEffectsBeyondBoundary(effects, checkFunction) {
  // Process effects from the end of the array to avoid index issues when removing
  for (let i = effects.length - 1; i >= 0; i--) {
    let effect = effects[i];

    // Check if effect is beyond the boundary and remove it
    // Skip certain global effects that should persist regardless of position
    if (
      effect.y &&
      checkFunction(effect) &&
      !effect.type.includes("global") &&
      !effect.type.includes("atomic") &&
      !effect.type.includes("shield")
    ) {
      // Remove the effect
      effects.splice(i, 1);
    }
  }
}
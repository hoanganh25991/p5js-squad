// GPU-Accelerated Particle System for Squad Game
// This uses instanced rendering for better performance

class GPUParticleSystem {
  constructor(maxParticles = 1000) {
    this.maxParticles = maxParticles;
    this.particles = [];
    this.instanceShader = null;
    this.particleGeometry = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    // Create shader for instanced rendering
    this.instanceShader = createShader(this.vertexShader(), this.fragmentShader());
    
    // Create particle geometry (simple cube for each particle)
    this.particleGeometry = createGeometry();
    this.particleGeometry.addAttribute('aPosition', [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3);
    this.particleGeometry.addAttribute('aTexCoord', [0, 0, 1, 0, 1, 1, 0, 1], 2);
    this.particleGeometry.addFace([0, 1, 2]);
    this.particleGeometry.addFace([0, 2, 3]);
    
    this.initialized = true;
  }

  // Add a new particle
  addParticle(x, y, z, color, size = 10, lifespan = 60) {
    if (this.particles.length >= this.maxParticles) return;
    
    this.particles.push({
      position: createVector(x, y, z),
      velocity: createVector(random(-1, 1), random(-1, 1), random(-1, 1)).mult(2),
      color: color,
      size: size,
      life: lifespan,
      maxLife: lifespan
    });
  }

  // Add explosion effect
  addExplosion(x, y, z, color, count = 30, size = 8) {
    for (let i = 0; i < count; i++) {
      this.addParticle(x, y, z, color, size, 45);
    }
  }

  // Update all particles
  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.position.add(p.velocity);
      
      // Apply gravity
      p.velocity.y += 0.05;
      
      // Slow down
      p.velocity.mult(0.97);
      
      // Decrease life
      p.life--;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // Render all particles using instanced rendering
  render() {
    if (!this.initialized || this.particles.length === 0) return;
    
    // Prepare instance data
    const positions = [];
    const colors = [];
    const sizes = [];
    const opacities = [];
    
    for (const p of this.particles) {
      positions.push(p.position.x, p.position.y, p.position.z);
      colors.push(p.color[0]/255, p.color[1]/255, p.color[2]/255);
      sizes.push(p.size);
      opacities.push(p.life / p.maxLife);
    }
    
    // Use our custom shader
    shader(this.instanceShader);
    
    // Set shader uniforms
    this.instanceShader.setUniform('uProjectionMatrix', _renderer.uPMatrix.copy());
    this.instanceShader.setUniform('uModelViewMatrix', _renderer.uMVMatrix.copy());
    this.instanceShader.setUniform('uPositions', positions);
    this.instanceShader.setUniform('uColors', colors);
    this.instanceShader.setUniform('uSizes', sizes);
    this.instanceShader.setUniform('uOpacities', opacities);
    this.instanceShader.setUniform('uParticleCount', this.particles.length);
    
    // Draw all particles in a single draw call
    this.particleGeometry.drawInstanced(this.particles.length);
    
    // Reset to default shader
    resetShader();
  }

  // Vertex shader with instancing support
  vertexShader() {
    return `
      precision highp float;
      
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      
      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      uniform vec3 uPositions[${this.maxParticles}];
      uniform float uSizes[${this.maxParticles}];
      uniform int uParticleCount;
      
      varying vec2 vTexCoord;
      varying float vIndex;
      
      void main() {
        int index = gl_InstanceID;
        if (index >= uParticleCount) {
          gl_Position = vec4(0.0);
          return;
        }
        
        vIndex = float(index);
        vTexCoord = aTexCoord;
        
        // Position the particle
        vec3 particlePosition = uPositions[index];
        float particleSize = uSizes[index];
        
        // Scale and position the particle
        vec4 position = vec4(aPosition * particleSize + particlePosition, 1.0);
        
        // Apply camera transformation
        gl_Position = uProjectionMatrix * uModelViewMatrix * position;
      }
    `;
  }

  // Fragment shader for particles
  fragmentShader() {
    return `
      precision highp float;
      
      varying vec2 vTexCoord;
      varying float vIndex;
      
      uniform vec3 uColors[${this.maxParticles}];
      uniform float uOpacities[${this.maxParticles}];
      uniform int uParticleCount;
      
      void main() {
        int index = int(vIndex);
        if (index >= uParticleCount) {
          discard;
        }
        
        // Calculate distance from center for circular particles
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vTexCoord, center);
        
        // Discard pixels outside the circle
        if (dist > 0.5) {
          discard;
        }
        
        // Soft edge
        float alpha = smoothstep(0.5, 0.4, dist) * uOpacities[index];
        
        // Output color with alpha
        gl_FragColor = vec4(uColors[index], alpha);
      }
    `;
  }
}

// Create a global instance
let gpuParticles;

function initGPUParticles() {
  // Initialize the GPU particle system
  gpuParticles = new GPUParticleSystem();
  gpuParticles.init();
}

// Function to add to draw loop
function updateAndRenderGPUParticles() {
  if (!gpuParticles) return;
  
  gpuParticles.update();
  gpuParticles.render();
}
// GPU Acceleration Features for Squad Game
// This file loads and initializes all GPU acceleration features

// Track if GPU acceleration is enabled
let gpuAccelerationEnabled = false;

// Initialize all GPU acceleration features
function initGPUAcceleration() {
  // Check if WebGL is supported
  if (!window.WebGLRenderingContext) {
    console.warn("WebGL not supported, GPU acceleration disabled");
    return false;
  }
  
  // Check if we can use advanced features
  if (!PerformanceManager.canUseAdvancedFeatures()) {
    console.log("Advanced GPU features not available on this device");
    return false;
  }
  
  console.log("Initializing GPU acceleration features");
  
  // Initialize GPU-based particle system
  if (typeof initGPUParticles === 'function') {
    try {
      initGPUParticles();
      console.log("GPU Particle system initialized");
    } catch (e) {
      console.warn("Could not initialize GPU particles:", e);
    }
  }
  
  // Initialize GPU-based renderer for effects
  if (typeof initGPURenderer === 'function') {
    try {
      initGPURenderer();
      console.log("GPU Renderer initialized");
    } catch (e) {
      console.warn("Could not initialize GPU renderer:", e);
    }
  }
  
  // Initialize spatial partitioning for collision detection
  if (typeof initCollisionSystem === 'function') {
    try {
      initCollisionSystem();
      console.log("Collision system initialized");
    } catch (e) {
      console.warn("Could not initialize collision system:", e);
    }
  }
  
  // Enable instanced rendering if supported
  enableInstancedRendering();
  
  gpuAccelerationEnabled = true;
  return true;
}

// Enable instanced rendering for WebGL if supported
function enableInstancedRendering() {
  try {
    if (typeof _renderer !== 'undefined' && _renderer.GL) {
      const gl = _renderer.GL;
      
      // Check for instanced arrays extension
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      
      if (ext) {
        console.log("Instanced rendering supported");
        
        // Store the extension for later use
        _renderer.ext_instanced_arrays = ext;
        
        // Add instanced drawing method to p5.Geometry
        if (typeof p5.Geometry !== 'undefined') {
          p5.Geometry.prototype.drawInstanced = function(instanceCount) {
            if (!this.vertexBuffer) return;
            
            const gl = _renderer.GL;
            const ext = _renderer.ext_instanced_arrays;
            
            // Bind buffers
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            
            // Set up attributes
            this._setAttributes();
            
            // Set instance divisors
            for (let i = 0; i < this.attributes.position.location; i++) {
              ext.vertexAttribDivisorANGLE(i, 0);
            }
            
            // Draw instances
            ext.drawElementsInstancedANGLE(
              gl.TRIANGLES,
              this.faces.length * 3,
              gl.UNSIGNED_SHORT,
              0,
              instanceCount
            );
            
            // Reset divisors
            for (let i = 0; i < this.attributes.position.location; i++) {
              ext.vertexAttribDivisorANGLE(i, 0);
            }
          };
        }
      } else {
        console.log("Instanced rendering not supported");
      }
    }
  } catch (e) {
    console.warn("Error setting up instanced rendering:", e);
  }
}

// Create a custom shader for efficient rendering
function createCustomShader(vertSrc, fragSrc) {
  // Use p5's createShader if available
  if (typeof createShader === 'function') {
    return createShader(vertSrc, fragSrc);
  }
  
  // Fallback to manual shader creation
  try {
    const gl = _renderer.GL;
    
    // Create shader program
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertSrc);
    gl.compileShader(vertShader);
    
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragSrc);
    gl.compileShader(fragShader);
    
    // Create program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    
    // Check for errors
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(shaderProgram);
      throw new Error('Could not compile shader program: ' + info);
    }
    
    return {
      program: shaderProgram,
      use: function() {
        gl.useProgram(shaderProgram);
      },
      setUniform: function(name, value) {
        const location = gl.getUniformLocation(shaderProgram, name);
        
        // Determine type and set uniform
        if (Array.isArray(value)) {
          if (value.length === 2) {
            gl.uniform2fv(location, value);
          } else if (value.length === 3) {
            gl.uniform3fv(location, value);
          } else if (value.length === 4) {
            gl.uniform4fv(location, value);
          } else if (value.length === 9) {
            gl.uniformMatrix3fv(location, false, value);
          } else if (value.length === 16) {
            gl.uniformMatrix4fv(location, false, value);
          }
        } else if (typeof value === 'number') {
          gl.uniform1f(location, value);
        } else if (typeof value === 'boolean') {
          gl.uniform1i(location, value ? 1 : 0);
        }
      }
    };
  } catch (e) {
    console.error('Error creating custom shader:', e);
    return null;
  }
}

// Optimize WebGL context for performance
function optimizeWebGLContext() {
  try {
    if (typeof _renderer !== 'undefined' && _renderer.GL) {
      const gl = _renderer.GL;
      
      // Set hints for performance
      gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
      
      // Disable depth writing when not needed
      gl.depthMask(false);
      
      // Enable extensions that might help performance
      gl.getExtension('OES_element_index_uint');
      gl.getExtension('OES_standard_derivatives');
      
      console.log("WebGL context optimized for performance");
    }
  } catch (e) {
    console.warn("Error optimizing WebGL context:", e);
  }
}
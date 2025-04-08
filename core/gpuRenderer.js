// GPU-Based Offscreen Renderer for Squad Game
// This uses framebuffers to render effects offscreen for better performance

class GPURenderer {
  constructor() {
    this.initialized = false;
    this.effectsBuffer = null;
    this.blurBuffer = null;
    this.blurShader = null;
    this.bloomShader = null;
    this.compositeShader = null;
    this.bufferSize = { width: 0, height: 0 };
  }

  init() {
    if (this.initialized) return;
    
    // Determine buffer size based on performance level
    this.updateBufferSize();
    
    // Create offscreen buffers
    this.effectsBuffer = createGraphics(this.bufferSize.width, this.bufferSize.height, WEBGL);
    this.blurBuffer = createGraphics(this.bufferSize.width, this.bufferSize.height, WEBGL);
    
    // Configure buffer settings
    this.effectsBuffer.noSmooth();
    this.blurBuffer.noSmooth();
    
    // Create shaders
    this.createShaders();
    
    this.initialized = true;
    console.log("GPU Renderer initialized with buffer size:", this.bufferSize);
  }
  
  updateBufferSize() {
    // Set buffer size based on performance level
    let scaleFactor = 1.0;
    
    if (currentPerformanceLevel === PerformanceLevel.LOW) {
      scaleFactor = 0.25; // Quarter resolution for low performance
    } else if (currentPerformanceLevel === PerformanceLevel.MEDIUM) {
      scaleFactor = 0.5; // Half resolution for medium performance
    } else {
      scaleFactor = 0.75; // 75% resolution for high performance
    }
    
    this.bufferSize = {
      width: Math.floor(width * scaleFactor),
      height: Math.floor(height * scaleFactor)
    };
  }
  
  createShaders() {
    // Blur shader for post-processing
    this.blurShader = this.effectsBuffer.createShader(this.blurVertShader(), this.blurFragShader());
    
    // Bloom shader for glow effects
    this.bloomShader = this.effectsBuffer.createShader(this.bloomVertShader(), this.bloomFragShader());
    
    // Composite shader for final rendering
    this.compositeShader = this.effectsBuffer.createShader(this.compositeVertShader(), this.compositeFragShader());
  }
  
  // Begin rendering to offscreen buffer
  beginEffectsBuffer() {
    if (!this.initialized) this.init();
    
    // Clear the effects buffer
    this.effectsBuffer.clear();
    this.effectsBuffer.background(0, 0, 0, 0);
    
    // Set up camera to match main canvas
    this.effectsBuffer.camera(
      cameraOffsetX, 
      cameraOffsetY, 
      cameraZoom, 
      cameraOffsetX, 
      cameraOffsetY, 
      0, 
      0, 1, 0
    );
    
    return this.effectsBuffer;
  }
  
  // Apply post-processing and render to screen
  endEffectsBuffer() {
    if (!this.initialized) return;
    
    // Apply blur if on medium or high performance
    if (currentPerformanceLevel !== PerformanceLevel.LOW) {
      this.applyBlur();
    }
    
    // Apply bloom if on high performance
    if (currentPerformanceLevel === PerformanceLevel.HIGH) {
      this.applyBloom();
    }
    
    // Render the final result to the screen
    this.renderToScreen();
  }
  
  applyBlur() {
    // Apply horizontal blur
    this.blurBuffer.clear();
    this.blurBuffer.shader(this.blurShader);
    this.blurShader.setUniform('tex0', this.effectsBuffer);
    this.blurShader.setUniform('texelSize', [1.0/this.bufferSize.width, 1.0/this.bufferSize.height]);
    this.blurShader.setUniform('direction', [1.0, 0.0]);
    this.blurBuffer.rect(0, 0, this.bufferSize.width, this.bufferSize.height);
    
    // Apply vertical blur back to effects buffer
    this.effectsBuffer.clear();
    this.effectsBuffer.shader(this.blurShader);
    this.blurShader.setUniform('tex0', this.blurBuffer);
    this.blurShader.setUniform('texelSize', [1.0/this.bufferSize.width, 1.0/this.bufferSize.height]);
    this.blurShader.setUniform('direction', [0.0, 1.0]);
    this.effectsBuffer.rect(0, 0, this.bufferSize.width, this.bufferSize.height);
  }
  
  applyBloom() {
    // Apply bloom effect
    this.blurBuffer.clear();
    this.blurBuffer.shader(this.bloomShader);
    this.bloomShader.setUniform('tex0', this.effectsBuffer);
    this.bloomShader.setUniform('bloomStrength', 1.5);
    this.bloomShader.setUniform('bloomThreshold', 0.6);
    this.blurBuffer.rect(0, 0, this.bufferSize.width, this.bufferSize.height);
    
    // Copy back to effects buffer
    this.effectsBuffer.clear();
    this.effectsBuffer.copy(this.blurBuffer, 0, 0, this.bufferSize.width, this.bufferSize.height, 
                           0, 0, this.bufferSize.width, this.bufferSize.height);
  }
  
  renderToScreen() {
    // Use the composite shader to render the final result
    push();
    resetMatrix();
    shader(this.compositeShader);
    this.compositeShader.setUniform('tex0', this.effectsBuffer);
    this.compositeShader.setUniform('screenSize', [width, height]);
    rect(0, 0, width, height);
    resetShader();
    pop();
  }
  
  // Resize buffers when window size changes
  resize() {
    if (!this.initialized) return;
    
    this.updateBufferSize();
    
    // Resize buffers
    this.effectsBuffer.resizeCanvas(this.bufferSize.width, this.bufferSize.height);
    this.blurBuffer.resizeCanvas(this.bufferSize.width, this.bufferSize.height);
    
    console.log("GPU Renderer resized to:", this.bufferSize);
  }
  
  // Shader definitions
  blurVertShader() {
    return `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;
      
      void main() {
        vTexCoord = aTexCoord;
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
      }
    `;
  }
  
  blurFragShader() {
    return `
      precision highp float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform vec2 texelSize;
      uniform vec2 direction;
      
      // Gaussian weights for 9-tap filter
      const float weights[9] = float[9](
        0.051, 0.0918, 0.1231, 0.1353, 0.1231, 0.0918, 0.051, 0.0276, 0.0153
      );
      
      void main() {
        vec2 uv = vTexCoord;
        vec4 color = texture2D(tex0, uv) * weights[0];
        
        for (int i = 1; i < 9; i++) {
          vec2 offset = direction * texelSize * float(i);
          color += texture2D(tex0, uv + offset) * weights[i];
          color += texture2D(tex0, uv - offset) * weights[i];
        }
        
        gl_FragColor = color;
      }
    `;
  }
  
  bloomVertShader() {
    return `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;
      
      void main() {
        vTexCoord = aTexCoord;
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
      }
    `;
  }
  
  bloomFragShader() {
    return `
      precision highp float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform float bloomStrength;
      uniform float bloomThreshold;
      
      void main() {
        vec4 color = texture2D(tex0, vTexCoord);
        float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
        
        if (brightness > bloomThreshold) {
          gl_FragColor = color * bloomStrength;
        } else {
          gl_FragColor = vec4(0.0, 0.0, 0.0, color.a);
        }
      }
    `;
  }
  
  compositeVertShader() {
    return `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec2 aTexCoord;
      varying vec2 vTexCoord;
      
      void main() {
        vTexCoord = aTexCoord;
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
      }
    `;
  }
  
  compositeFragShader() {
    return `
      precision highp float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform vec2 screenSize;
      
      void main() {
        vec2 uv = vTexCoord;
        vec4 color = texture2D(tex0, uv);
        
        // Add a subtle vignette effect
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vTexCoord, center);
        color.rgb *= smoothstep(0.8, 0.2, dist);
        
        gl_FragColor = color;
      }
    `;
  }
}

// Create a global instance
let gpuRenderer;

function initGPURenderer() {
  // Initialize the GPU renderer
  gpuRenderer = new GPURenderer();
  gpuRenderer.init();
}
// Performance Management Module
// Handles performance detection, optimization and settings

// Performance level constants
const PerformanceLevel = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  AUTO: "auto"
};

// Global performance variables
let performanceMode = PerformanceLevel.AUTO;
let currentPerformanceLevel = PerformanceLevel.HIGH; // Will be set based on device detection
let fpsHistory = [];
let lastPerformanceCheck = 0;
let performanceCheckInterval = 300; // Check every 5 seconds (300 frames at 60fps)
let isMobileDevice = false;

// Performance Manager object
const PerformanceManager = {
  gpuInfo: null,
  gpuTier: 0, // 0=unknown, 1=low, 2=medium, 3=high
  
  // Detect GPU capabilities
  detectGPUCapabilities: function() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.warn('WebGL not supported');
        return false;
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        
        this.gpuInfo = {
          vendor: vendor,
          renderer: renderer,
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
          extensions: gl.getSupportedExtensions()
        };
        
        console.log('GPU Info:', this.gpuInfo);
        
        // Determine GPU tier based on renderer string
        const rendererLower = renderer.toLowerCase();
        
        // Check for high-end GPUs
        if (rendererLower.includes('nvidia') && !rendererLower.includes('mobile') ||
            rendererLower.includes('amd') && !rendererLower.includes('mobile') ||
            rendererLower.includes('intel') && (
              rendererLower.includes('iris') || 
              rendererLower.includes('hd 6') || 
              rendererLower.includes('uhd')
            )) {
          this.gpuTier = 3; // High-end
        }
        // Check for mid-range GPUs
        else if (rendererLower.includes('intel') || 
                 rendererLower.includes('mali-t') ||
                 rendererLower.includes('adreno 6')) {
          this.gpuTier = 2; // Mid-range
        }
        // Everything else is considered low-end
        else {
          this.gpuTier = 1; // Low-end
        }
        
        console.log('GPU Tier:', this.gpuTier);
        return true;
      }
    } catch (e) {
      console.warn('Error detecting GPU:', e);
    }
    
    return false;
  },

  // Detect if the device is mobile
  detectMobileDevice: function() {
    // Check if the device has touch capability
    const hasTouchScreen =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    // Check user agent for mobile devices
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(
        userAgent
      );

    // Check screen size (typical mobile width is less than 768px)
    const hasSmallScreen = window.innerWidth < 768;

    // Consider it a mobile device if it has a touch screen and either has a mobile user agent or small screen
    return hasTouchScreen && (isMobile || hasSmallScreen);
  },

  // Calculate average FPS from history
  getAverageFPS: function() {
    if (fpsHistory.length === 0) return 60; // Default to 60 if no history
    return fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length;
  },

  // Set performance level based on device, GPU and FPS
  setPerformanceLevel: function() {
    if (performanceMode !== PerformanceLevel.AUTO) {
      currentPerformanceLevel = performanceMode;
      return;
    }

    // Try to detect GPU capabilities if not already done
    if (!this.gpuInfo) {
      this.detectGPUCapabilities();
    }

    const avgFPS = this.getAverageFPS();

    // If we're on a mobile device, use more conservative settings
    if (isMobileDevice) {
      // Start with medium as default for mobile
      currentPerformanceLevel = PerformanceLevel.MEDIUM;
      
      // If we have GPU info, use it to refine our decision
      if (this.gpuTier === 3) {
        // High-end mobile GPU can handle medium settings
        currentPerformanceLevel = PerformanceLevel.MEDIUM;
      } else if (this.gpuTier === 1) {
        // Low-end mobile GPU should use low settings
        currentPerformanceLevel = PerformanceLevel.LOW;
      }

      // If we have enough FPS history and it's consistently low, adjust down
      if (fpsHistory.length >= 10) {
        if (avgFPS < 30) {
          currentPerformanceLevel = PerformanceLevel.LOW;
        }
      }
    } else {
      // On desktop, start with high performance
      currentPerformanceLevel = PerformanceLevel.HIGH;
      
      // If we have GPU info, use it to refine our decision
      if (this.gpuTier === 1) {
        // Low-end desktop GPU should use medium settings
        currentPerformanceLevel = PerformanceLevel.MEDIUM;
      }

      // If we have enough FPS history and it's consistently low, adjust
      if (fpsHistory.length >= 10) {
        if (avgFPS < 30) {
          currentPerformanceLevel = PerformanceLevel.MEDIUM;
        } else if (avgFPS < 20) {
          currentPerformanceLevel = PerformanceLevel.LOW;
        }
      }
    }

    console.log("Performance level set to:", currentPerformanceLevel);
  },

  // Get multipliers for effect counts based on performance level
  getEffectMultiplier: function() {
    switch (currentPerformanceLevel) {
      case PerformanceLevel.LOW:
        return 0.3; // 30% of normal effects
      case PerformanceLevel.MEDIUM:
        return 0.6; // 60% of normal effects
      case PerformanceLevel.HIGH:
        return 1.0; // 100% of normal effects
      default:
        return 0.6; // Default to medium
    }
  },

  // Apply performance settings to WebGL context
  applyWebGLSettings: function() {
    // Configure WebGL settings based on performance level
    if (currentPerformanceLevel === PerformanceLevel.LOW) {
      setAttributes("antialias", false);
      setAttributes("perPixelLighting", false);
      setAttributes("depth", false);
      setAttributes("preserveDrawingBuffer", false);
    } else if (currentPerformanceLevel === PerformanceLevel.MEDIUM) {
      setAttributes("antialias", true);
      setAttributes("perPixelLighting", false);
      setAttributes("preserveDrawingBuffer", false);
      if (isMobileDevice) {
        setAttributes("depth", false);
      } else {
        setAttributes("depth", true);
      }
    } else {
      setAttributes("antialias", true);
      setAttributes("perPixelLighting", true);
      setAttributes("depth", true);
      setAttributes("preserveDrawingBuffer", false);
    }

    // Disable texture mipmapping to save memory
    textureMode(NORMAL);
    
    // Enable hardware acceleration hints
    if (typeof _renderer !== 'undefined' && _renderer.GL) {
      const gl = _renderer.GL;
      
      // Check if GENERATE_MIPMAP_HINT is available
      if (gl.GENERATE_MIPMAP_HINT !== undefined) {
        gl.hint(gl.GENERATE_MIPMAP_HINT, gl.FASTEST);
      }
      
      // Check if FRAGMENT_SHADER_DERIVATIVE_HINT is available
      // This is part of the OES_standard_derivatives extension and may not be available in all WebGL implementations
      if (gl.FRAGMENT_SHADER_DERIVATIVE_HINT !== undefined) {
        gl.hint(gl.FRAGMENT_SHADER_DERIVATIVE_HINT, gl.FASTEST);
      }
    }
  },
  
  // Check if we can use advanced GPU features
  canUseAdvancedFeatures: function() {
    return this.gpuTier >= 2 && currentPerformanceLevel !== PerformanceLevel.LOW;
  },

  // Update FPS history
  updateFPSHistory: function(currentFPS) {
    // Add current FPS to history
    fpsHistory.push(currentFPS);
    
    // Keep history at a reasonable size
    if (fpsHistory.length > 60) {
      fpsHistory.shift();
    }
    
    // Check if we need to adjust performance settings
    if (frameCount - lastPerformanceCheck > performanceCheckInterval) {
      lastPerformanceCheck = frameCount;
      this.setPerformanceLevel();
    }
  }
};

// Wrapper functions for backward compatibility
function detectMobileDevice() {
  return PerformanceManager.detectMobileDevice();
}

function setPerformanceLevel() {
  PerformanceManager.setPerformanceLevel();
}

function getEffectMultiplier() {
  return PerformanceManager.getEffectMultiplier();
}

// Check if hardware acceleration is available
function checkHardwareAcceleration() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return {
      supported: false,
      reason: "WebGL not supported"
    };
  }
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) {
    return {
      supported: true,
      reason: "Basic WebGL supported, but couldn't detect GPU info"
    };
  }
  
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  
  // Check for software renderers
  const isSoftwareRenderer = 
    renderer.includes('SwiftShader') || 
    renderer.includes('llvmpipe') || 
    renderer.includes('Software') ||
    renderer.includes('Microsoft Basic Render');
  
  return {
    supported: !isSoftwareRenderer,
    renderer: renderer,
    vendor: vendor,
    reason: isSoftwareRenderer ? "Software rendering detected" : "Hardware acceleration available"
  };
}
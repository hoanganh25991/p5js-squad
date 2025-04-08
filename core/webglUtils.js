// WebGL Utilities for Squad Game
// This file provides WebGL helper functions for advanced rendering

// Geometry class for managing WebGL buffers and attributes
class Geometry {
  constructor() {
    this.attributes = {};
    this.faces = [];
    this.vertexCount = 0;
  }
  
  // Add an attribute (position, texcoord, etc.)
  addAttribute(name, data, itemSize) {
    this.attributes[name] = {
      data: data,
      itemSize: itemSize,
      buffer: null
    };
    
    // Update vertex count based on position attribute
    if (name === 'aPosition') {
      this.vertexCount = Math.floor(data.length / itemSize);
    }
  }
  
  // Add a face (triangle indices)
  addFace(indices) {
    this.faces.push(indices);
  }
  
  // Create WebGL buffers for all attributes
  createBuffers() {
    // Get WebGL context from p5.js
    const gl = _renderer.GL;
    
    // Create buffers for each attribute
    for (const name in this.attributes) {
      const attr = this.attributes[name];
      attr.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.data), gl.STATIC_DRAW);
    }
    
    // Create index buffer if faces are defined
    if (this.faces.length > 0) {
      this.indexBuffer = gl.createBuffer();
      const indices = [];
      for (const face of this.faces) {
        indices.push(...face);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      this.indexCount = indices.length;
    }
  }
  
  // Draw the geometry
  draw() {
    // Get WebGL context from p5.js
    const gl = _renderer.GL;
    
    // Bind all attribute buffers
    for (const name in this.attributes) {
      const attr = this.attributes[name];
      const location = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), name);
      if (location !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, attr.itemSize, gl.FLOAT, false, 0, 0);
      }
    }
    
    // Draw with indices if available, otherwise use vertex count
    if (this.faces.length > 0) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
    }
  }
  
  // Draw instanced geometry (for particle systems)
  drawInstanced(instanceCount) {
    // Get WebGL context from p5.js
    const gl = _renderer.GL;
    
    // Check if instanced arrays extension is available
    const ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) {
      console.error('ANGLE_instanced_arrays extension not supported');
      return;
    }
    
    // Bind all attribute buffers
    for (const name in this.attributes) {
      const attr = this.attributes[name];
      const location = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), name);
      if (location !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, attr.itemSize, gl.FLOAT, false, 0, 0);
        // Set attribute divisor to 0 for per-vertex attributes
        ext.vertexAttribDivisorANGLE(location, 0);
      }
    }
    
    // Draw with indices if available, otherwise use vertex count
    if (this.faces.length > 0) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      ext.drawElementsInstancedANGLE(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, instanceCount);
    } else {
      ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, this.vertexCount, instanceCount);
    }
  }
}

// Create a new geometry instance
function createGeometry() {
  const geometry = new Geometry();
  return geometry;
}

// Create a shader program from vertex and fragment shader source
function createShader(vertSource, fragSource) {
  // Get WebGL context
  const gl = _renderer.GL;
  
  // Create shader program
  const program = gl.createProgram();
  
  // Create and compile vertex shader
  const vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertSource);
  gl.compileShader(vertShader);
  
  // Check for vertex shader compilation errors
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertShader));
    gl.deleteShader(vertShader);
    return null;
  }
  
  // Create and compile fragment shader
  const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragSource);
  gl.compileShader(fragShader);
  
  // Check for fragment shader compilation errors
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragShader));
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return null;
  }
  
  // Attach shaders to program
  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);
  
  // Check for linking errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    return null;
  }
  
  // Create a p5.Shader object to wrap the program
  const shader = new p5.Shader(_renderer, program);
  
  return shader;
}
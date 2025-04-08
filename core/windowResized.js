// Function to handle window resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Resize GPU renderer if initialized
  if (typeof gpuRenderer !== 'undefined' && gpuRenderer && gpuRenderer.initialized) {
    gpuRenderer.resize();
  }
  
  // Reposition UI elements
  if (typeof repositionUIElements === 'function') {
    repositionUIElements();
  }
}
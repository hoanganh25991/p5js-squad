/**
 * Updated drawBackground function
 * This function draws the background elements of the game, ensuring the sky
 * is visible outside the main lane and enemies aren't hidden.
 */
function drawBackground() {
  push();

  // Use a very far negative z-value to ensure the background is behind everything
  // No need to disable depth testing which can cause rendering issues

  // Enable blending for better visual effects
  blendMode(BLEND);
  
  // Draw a distant starfield
  drawStarfield();

  // Draw distant planets
  drawPlanets();

  // Draw a ground plane below the bridge
  drawGround();
  
  // Reset blend mode
  blendMode(BLEND);

  pop();
}

/**
 * This is how you would implement the drawStarfield function
 * to ensure the sky is visible and properly rendered
 */
function drawStarfield() {
  push();

  // Create a fixed starfield that doesn't change every frame
  randomSeed(1234); // Use a fixed seed for consistent star pattern

  // Move far away from the camera but not so far that it's clipped
  // This ensures the starfield is visible but doesn't interfere with gameplay
  translate(0, 0, -2000);

  // Draw the main space background (dark blue with gradient)
  noStroke();
  
  // Create a more interesting gradient background
  push();
  rotateX(PI/2); // Rotate to be perpendicular to view
  
  // Use a larger plane to ensure it covers the entire view
  // This ensures the sky is visible from all camera angles
  fill(5, 10, 30); // Dark blue base
  plane(15000, 15000);
  
  // Add a subtle nebula effect
  push();
  translate(0, 0, 1);
  fill(30, 20, 50, 30); // Purple nebula, very transparent
  plane(12000, 12000);
  pop();
  
  // Add another nebula layer
  push();
  translate(0, 0, 2);
  fill(20, 40, 60, 20); // Blue nebula, very transparent
  plane(10000, 10000);
  pop();
  
  pop();

  // Draw stars at fixed positions
  for (let i = 0; i < 200; i++) {
    const x = random(-4000, 4000);
    const y = random(-4000, 4000);
    const z = random(-500, -100);
    const brightness = random(150, 255);
    const size = random(1, 4);

    push();
    translate(x, y, z);
    fill(brightness, brightness, brightness);
    noStroke();

    // Use simple shapes for stars to improve performance
    if (i % 3 === 0) {
      // Twinkle effect for some stars based on frameCount
      const twinkle = sin(frameCount * 0.05 + i) * 0.5 + 0.5;
      fill(brightness, brightness, brightness, 150 + 100 * twinkle);
    }

    // Use point or small box for better performance
    if (i % 5 === 0) {
      // Larger, brighter stars
      sphere(size * 1.5);
    } else {
      // Smaller stars
      box(size);
    }

    pop();
  }

  // Reset the random seed
  randomSeed();

  pop();
}
// Create keyboard layout container
const handleInput = (key, isDown) => {
  const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
    key: key,
    code: key.startsWith('Arrow') ? key : `Key${key.toUpperCase()}`,
    bubbles: true
  });
  document.dispatchEvent(event);
};

// Mouse/Touch events for buttons
document.querySelectorAll('.key').forEach(button => {
  const key = button.getAttribute('data-key');
  
  // Mouse events
  button.addEventListener('mousedown', () => handleInput(key, true));
  button.addEventListener('mouseup', () => handleInput(key, false));
  button.addEventListener('mouseleave', () => handleInput(key, false));

  // Touch events
  button.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(key, true);
  });
  button.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleInput(key, false);
  });
});

// Keyboard events
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const button = document.querySelector(`[data-key="${e.key.toLowerCase()}"]`);
    if (button) button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const button = document.querySelector(`[data-key="${e.key.toLowerCase()}"]`);
    if (button) button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  }
});

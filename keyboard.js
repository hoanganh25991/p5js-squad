// Create keyboard layout container
const keyboardLayout = document.createElement('div');
keyboardLayout.id = 'keyboard-layout';
keyboardLayout.style.position = 'fixed';
keyboardLayout.style.bottom = '20px';
keyboardLayout.style.left = '50%';
keyboardLayout.style.transform = 'translateX(-50%)';
keyboardLayout.style.display = 'flex';
keyboardLayout.style.gap = '10px';
keyboardLayout.style.zIndex = '1000';

// Create left and right arrow buttons
const createButton = (text, keyValue) => {
  const button = document.createElement('button');
  button.className = 'key';
  button.setAttribute('data-key', keyValue);
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.fontSize = '24px';
  button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  button.style.color = 'white';
  button.style.border = '2px solid #666';
  button.style.borderRadius = '10px';
  button.style.cursor = 'pointer';
  button.style.userSelect = 'none';
  button.innerHTML = text;
  return button;
};

const leftButton = createButton('←', 'arrowLeft');
const rightButton = createButton('→', 'arrowRight');

keyboardLayout.appendChild(leftButton);
keyboardLayout.appendChild(rightButton);
document.body.appendChild(keyboardLayout);

// Event handling for both keyboard and touch/mouse
const handleInput = (key, isDown) => {
  const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
    key: key,
    code: key.startsWith('Arrow') ? key : `Key${key.toUpperCase()}`,
    keyCode: key === 'arrowLeft' ? 37 : 39,
    which: key === 'arrowLeft' ? 37 : 39,
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

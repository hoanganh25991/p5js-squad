// Status board to display game information
const statusBoard = document.createElement('div');
statusBoard.id = 'status-board';
statusBoard.style.position = 'fixed';
statusBoard.style.top = '10px';
statusBoard.style.left = '10px';
statusBoard.style.padding = '10px';
statusBoard.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
statusBoard.style.color = 'white';
statusBoard.style.fontFamily = 'Arial, sans-serif';
statusBoard.style.borderRadius = '5px';
statusBoard.style.zIndex = '1000';

document.body.appendChild(statusBoard);

function updateStatusBoard() {
    const gameState = window.getState();
    if (!gameState) return;

    const squadSize = window.squadSize || 1;
    const weaponType = window.currentWeapon || 'Basic Gun';
    const score = gameState.enemiesKilled || 0;

    statusBoard.innerHTML = `
        <div style="margin-bottom: 5px">Squad Size: ${squadSize}</div>
        <div style="margin-bottom: 5px">Weapon: ${weaponType}</div>
        <div style="margin-bottom: 5px">Score: ${score}</div>
        <div>Health: ${gameState.playerHealth}</div>
    `;
}

// Update status board every 100ms
setInterval(updateStatusBoard, 100);

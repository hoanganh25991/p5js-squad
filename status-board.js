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

    const squadSize = gameState.squadSize || 1;
    const weaponType = gameState.currentWeapon || 'Basic Gun';
    const score = gameState.enemiesKilled || 0;
    const wave = Math.floor(score / 50);
    const nextBoss = 200 - (score % 200);
    const health = gameState.squadHealth || 100;

    statusBoard.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 10px; color: #4CAF50">Squad Status</div>
        <div style="margin-bottom: 5px">Squad Members: ${squadSize}</div>
        <div style="margin-bottom: 5px">Weapon: ${weaponType}</div>
        <div style="margin-bottom: 5px">Health: ${health}%</div>
        <div style="margin-bottom: 10px; border-bottom: 1px solid #666"></div>
        <div style="font-size: 18px; margin-bottom: 10px; color: #2196F3">Game Progress</div>
        <div style="margin-bottom: 5px">Score: ${score}</div>
        <div style="margin-bottom: 5px">Wave: ${wave}</div>
        <div style="margin-bottom: 5px">Next Boss: ${nextBoss} kills</div>
        ${gameState.gamePaused ? '<div style="color: #f44336; margin-top: 10px">GAME OVER</div>' : ''}
    `;
}

// Update status board every 100ms
setInterval(updateStatusBoard, 100);

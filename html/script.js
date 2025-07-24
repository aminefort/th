// Game state
let gameState = {
    towers: [[], [], []],
    selectedBlock: null,
    selectedTower: null,
    moveCount: 0,
    gameActive: false,
    progress: 0
};

let cursor = null;
let currentScreen = 'standby';

// Create custom cursor
function createCursor() {
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
}

// Show/hide cursor
function toggleCursor(show) {
    if (!cursor) createCursor();
    cursor.style.display = show ? 'block' : 'none';
}

// Update cursor position
function updateCursor(x, y) {
    if (cursor) {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    }
}

// Switch screens
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + 'Screen').classList.add('active');
    currentScreen = screenName;
}

// Initialize game
function initGame() {
    gameState.towers = [[4, 3, 2, 1], [], []];
    gameState.selectedBlock = null;
    gameState.selectedTower = null;
    gameState.moveCount = 0;
    gameState.gameActive = true;
    gameState.progress = 0;
    
    renderGame();
    updateProgress();
}

// Render game
function renderGame() {
    // Clear existing blocks
    document.querySelectorAll('.block').forEach(block => block.remove());
    
    // Render blocks on towers
    gameState.towers.forEach((tower, towerIndex) => {
        const towerElement = document.getElementById(`tower${towerIndex + 1}`);
        
        tower.forEach((blockSize, blockIndex) => {
            const block = document.createElement('div');
            block.className = `block block-${blockSize}`;
            block.textContent = blockSize;
            block.style.bottom = `${15 + (blockIndex * 22)}px`;
            block.setAttribute('data-size', blockSize);
            block.setAttribute('data-tower', towerIndex);
            block.setAttribute('data-index', blockIndex);
            
            towerElement.appendChild(block);
        });
    });
}

// Handle block click
function handleBlockClick(blockSize, towerIndex, blockIndex) {
    if (!gameState.gameActive) return;
    
    const tower = gameState.towers[towerIndex];
    
    // Can only move top block
    if (blockIndex !== tower.length - 1) return;
    
    if (gameState.selectedBlock === null) {
        selectBlock(blockSize, towerIndex);
    } else if (gameState.selectedBlock === blockSize && gameState.selectedTower === towerIndex) {
        deselectBlock();
    } else {
        moveBlock(gameState.selectedTower, towerIndex);
    }
}

// Handle tower click
function handleTowerClick(towerIndex) {
    if (!gameState.gameActive) return;
    
    if (gameState.selectedBlock !== null) {
        moveBlock(gameState.selectedTower, towerIndex);
    } else {
        const tower = gameState.towers[towerIndex];
        if (tower.length > 0) {
            const topBlock = tower[tower.length - 1];
            selectBlock(topBlock, towerIndex);
        }
    }
}

// Select block
function selectBlock(blockSize, towerIndex) {
    gameState.selectedBlock = blockSize;
    gameState.selectedTower = towerIndex;
    
    // Visual feedback
    document.querySelectorAll('.block').forEach(b => b.classList.remove('selected'));
    const selected = document.querySelector(`[data-size="${blockSize}"][data-tower="${towerIndex}"]`);
    if (selected) selected.classList.add('selected');
}

// Deselect block
function deselectBlock() {
    gameState.selectedBlock = null;
    gameState.selectedTower = null;
    document.querySelectorAll('.block').forEach(b => b.classList.remove('selected'));
}

// Move block
function moveBlock(fromTower, toTower) {
    const source = gameState.towers[fromTower];
    const target = gameState.towers[toTower];
    
    if (source.length === 0) return;
    
    const blockToMove = source[source.length - 1];
    
    // Check valid move
    if (target.length > 0 && blockToMove > target[target.length - 1]) {
        showInvalidMove(toTower);
        return;
    }
    
    // Execute move
    const block = source.pop();
    target.push(block);
    gameState.moveCount++;
    
    deselectBlock();
    renderGame();
    updateProgress();
    showValidMove(toTower);
    
    // Check win condition
    if (gameState.towers[2].length === 4) {
        gameWon();
    }
}

// Update progress
function updateProgress() {
    const blocksInTarget = gameState.towers[2].length;
    gameState.progress = (blocksInTarget / 4) * 100;
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = gameState.progress + '%';
    }
}

// Game won
function gameWon() {
    gameState.gameActive = false;
    
    setTimeout(() => {
        switchScreen('success');
        
        // Send success to FiveM
        fetch(`https://${GetParentResourceName()}/hackResult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
        }).catch(() => {});
        
        setTimeout(() => {
            switchScreen('standby');
        }, 3000);
    }, 1000);
}

// Visual effects
function showValidMove(towerIndex) {
    const tower = document.getElementById(`tower${towerIndex + 1}`);
    tower.classList.add('valid');
    setTimeout(() => tower.classList.remove('valid'), 300);
}

function showInvalidMove(towerIndex) {
    const tower = document.getElementById(`tower${towerIndex + 1}`);
    tower.classList.add('invalid');
    setTimeout(() => tower.classList.remove('invalid'), 300);
}

// Setup event listeners
function setupEventListeners() {
    // Tower clicks
    for (let i = 1; i <= 3; i++) {
        const tower = document.getElementById(`tower${i}`);
        tower.addEventListener('click', (e) => {
            if (e.target.classList.contains('block')) {
                const blockSize = parseInt(e.target.getAttribute('data-size'));
                const towerIndex = parseInt(e.target.getAttribute('data-tower'));
                const blockIndex = parseInt(e.target.getAttribute('data-index'));
                handleBlockClick(blockSize, towerIndex, blockIndex);
            } else {
                const towerIndex = parseInt(tower.getAttribute('data-tower'));
                handleTowerClick(towerIndex);
            }
        });
    }
}

// Handle messages from FiveM
window.addEventListener('message', function(event) {
    const data = event.data;
    
    try {
        if (data.type === 'startHack') {
            switchScreen('hack');
            toggleCursor(true);
            initGame();
        } else if (data.type === 'stopHack') {
            switchScreen('standby');
            toggleCursor(false);
            gameState.gameActive = false;
        } else if (data.type === 'mouseMove') {
            updateCursor(data.x, data.y);
        } else if (data.type === 'click') {
            handleClick(data.x, data.y);
        }
    } catch (error) {
        console.error('Error handling FiveM message:', error);
    }
});

// Handle mouse clicks from FiveM
function handleClick(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element) {
        // Add click effect to cursor
        if (cursor) {
            cursor.style.background = '#ff0000';
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            setTimeout(() => {
                cursor.style.background = '#00ff00';
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 150);
        }
        
        // Trigger click on element
        element.click();
    }
}

// Auto-fail after timeout (security measure)
let hackTimeout = null;

function startHackTimeout() {
    hackTimeout = setTimeout(() => {
        if (gameState.gameActive) {
            gameState.gameActive = false;
            switchScreen('failure');
            
            // Send failure to FiveM
            fetch(`https://${GetParentResourceName()}/hackResult`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false })
            }).catch(() => {});
            
            setTimeout(() => {
                switchScreen('standby');
            }, 3000);
        }
    }, 60000); // 60 seconds timeout
}

function clearHackTimeout() {
    if (hackTimeout) {
        clearTimeout(hackTimeout);
        hackTimeout = null;
    }
}

// Override initGame to include timeout
const originalInitGame = initGame;
initGame = function() {
    originalInitGame();
    clearHackTimeout();
    startHackTimeout();
};

// Override gameWon to clear timeout
const originalGameWon = gameWon;
gameWon = function() {
    clearHackTimeout();
    originalGameWon();
};

// Keyboard shortcuts (for testing)
document.addEventListener('keydown', function(e) {
    if (currentScreen === 'hack' && gameState.gameActive) {
        switch(e.key) {
            case '1':
                handleTowerClick(0);
                break;
            case '2':
                handleTowerClick(1);
                break;
            case '3':
                handleTowerClick(2);
                break;
        }
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    createCursor();
    setupEventListeners();
    switchScreen('standby');
    console.log('Heist hack system initialized');
});

// Debug functions (remove in production)
window.debugHack = function() {
    console.log('Game State:', gameState);
    console.log('Current Screen:', currentScreen);
};

window.testWin = function() {
    gameState.towers = [[], [], [4, 3, 2, 1]];
    gameWon();
};

window.testFail = function() {
    gameState.gameActive = false;
    switchScreen('failure');
};

console.log('Heist hacking minigame loaded');
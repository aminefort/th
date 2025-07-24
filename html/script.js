// حالة اللعبة
let gameState = {
    towers: [[], [], []],
    selectedBlock: null,
    selectedTower: null,
    moveCount: 0,
    gameActive: false,
    progress: 0,
    startTime: null,
    timeRemaining: 60
};

// متغيرات النظام
let cursor = null;
let currentScreen = 'standby';
let hackTimeout = null;
let gameTimer = null;

// إنشاء المؤشر المخصص
function createCursor() {
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
}

// إظهار/إخفاء المؤشر
function toggleCursor(show) {
    if (!cursor) createCursor();
    cursor.style.display = show ? 'block' : 'none';
}

// تحديث موقع المؤشر
function updateCursor(x, y) {
    if (cursor) {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    }
}

// تبديل الشاشات
function switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenName + 'Screen').classList.add('active');
    currentScreen = screenName;
    
    // تأثيرات صوتية (اختيارية)
    console.log(`تم التبديل إلى شاشة: ${screenName}`);
}

// تهيئة اللعبة
function initGame() {
    // إعادة تعيين حالة اللعبة
    gameState.towers = [[4, 3, 2, 1], [], []];
    gameState.selectedBlock = null;
    gameState.selectedTower = null;
    gameState.moveCount = 0;
    gameState.gameActive = true;
    gameState.progress = 0;
    gameState.startTime = Date.now();
    gameState.timeRemaining = 60;
    
    // تحديث واجهة المستخدم
    renderGame();
    updateProgress();
    updateMoveCounter();
    startGameTimer();
    
    console.log('تم تهيئة اللعبة بنجاح');
}

// عرض اللعبة
function renderGame() {
    // مسح الأقراص الموجودة
    document.querySelectorAll('.block').forEach(block => block.remove());
    
    // عرض الأقراص على الأبراج
    gameState.towers.forEach((tower, towerIndex) => {
        const towerElement = document.getElementById(`tower${towerIndex + 1}`);
        
        tower.forEach((blockSize, blockIndex) => {
            const block = document.createElement('div');
            block.className = `block block-${blockSize}`;
            block.textContent = blockSize;
            block.style.bottom = `${33 + (blockIndex * 32)}px`;
            block.setAttribute('data-size', blockSize);
            block.setAttribute('data-tower', towerIndex);
            block.setAttribute('data-index', blockIndex);
            
            // إضافة تأثير الظهور
            block.style.opacity = '0';
            block.style.transform = 'translateX(-50%) translateY(20px)';
            
            towerElement.appendChild(block);
            
            // تأثير الظهور المتدرج
            setTimeout(() => {
                block.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                block.style.opacity = '1';
                block.style.transform = 'translateX(-50%) translateY(0)';
            }, blockIndex * 100);
        });
    });
}

// التعامل مع النقر على القرص
function handleBlockClick(blockSize, towerIndex, blockIndex) {
    if (!gameState.gameActive) return;
    
    const tower = gameState.towers[towerIndex];
    
    // يمكن تحريك القرص العلوي فقط
    if (blockIndex !== tower.length - 1) {
        showInvalidMove(towerIndex);
        return;
    }
    
    if (gameState.selectedBlock === null) {
        selectBlock(blockSize, towerIndex);
    } else if (gameState.selectedBlock === blockSize && gameState.selectedTower === towerIndex) {
        deselectBlock();
    } else {
        moveBlock(gameState.selectedTower, towerIndex);
    }
}

// التعامل مع النقر على البرج
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

// اختيار القرص
function selectBlock(blockSize, towerIndex) {
    gameState.selectedBlock = blockSize;
    gameState.selectedTower = towerIndex;
    
    // تأثير بصري
    document.querySelectorAll('.block').forEach(b => b.classList.remove('selected'));
    const selected = document.querySelector(`[data-size="${blockSize}"][data-tower="${towerIndex}"]`);
    if (selected) {
        selected.classList.add('selected');
        
        // تأثير صوتي (اختياري)
        console.log(`تم اختيار القرص: ${blockSize}`);
    }
}

// إلغاء اختيار القرص
function deselectBlock() {
    gameState.selectedBlock = null;
    gameState.selectedTower = null;
    document.querySelectorAll('.block').forEach(b => b.classList.remove('selected'));
    
    console.log('تم إلغاء اختيار القرص');
}

// تحريك القرص
function moveBlock(fromTower, toTower) {
    const source = gameState.towers[fromTower];
    const target = gameState.towers[toTower];
    
    if (source.length === 0) return;
    
    const blockToMove = source[source.length - 1];
    
    // فحص صحة الحركة
    if (target.length > 0 && blockToMove > target[target.length - 1]) {
        showInvalidMove(toTower);
        return;
    }
    
    // تنفيذ الحركة
    const block = source.pop();
    target.push(block);
    gameState.moveCount++;
    
    deselectBlock();
    renderGame();
    updateProgress();
    updateMoveCounter();
    showValidMove(toTower);
    
    console.log(`تم تحريك القرص ${block} من البرج ${fromTower + 1} إلى البرج ${toTower + 1}`);
    
    // فحص شرط الفوز
    if (gameState.towers[2].length === 4) {
        gameWon();
    }
}

// تحديث شريط التقدم
function updateProgress() {
    const blocksInTarget = gameState.towers[2].length;
    gameState.progress = (blocksInTarget / 4) * 100;
    
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) {
        progressBar.style.width = gameState.progress + '%';
    }
    
    if (progressText) {
        progressText.textContent = Math.round(gameState.progress) + '%';
    }
}

// تحديث عداد الحركات
function updateMoveCounter() {
    const moveCounter = document.getElementById('moveCounter');
    if (moveCounter) {
        moveCounter.textContent = gameState.moveCount;
    }
}

// تحديث عداد الوقت
function updateTimeCounter() {
    const timeCounter = document.getElementById('timeCounter');
    if (timeCounter) {
        timeCounter.textContent = gameState.timeRemaining + 's';
        
        // تغيير اللون عند اقتراب انتهاء الوقت
        if (gameState.timeRemaining <= 10) {
            timeCounter.style.color = 'var(--warning-color)';
            timeCounter.style.animation = 'urgentPulse 1s ease-in-out infinite';
        } else {
            timeCounter.style.color = 'var(--primary-color)';
            timeCounter.style.animation = 'none';
        }
    }
}

// بدء مؤقت اللعبة
function startGameTimer() {
    clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        if (gameState.gameActive && gameState.timeRemaining > 0) {
            gameState.timeRemaining--;
            updateTimeCounter();
            
            if (gameState.timeRemaining <= 0) {
                gameTimeout();
            }
        }
    }, 1000);
}

// انتهاء وقت اللعبة
function gameTimeout() {
    gameState.gameActive = false;
    clearInterval(gameTimer);
    clearHackTimeout();
    
    console.log('انتهى وقت اللعبة');
    
    setTimeout(() => {
        switchScreen('failure');
        
        // إرسال النتيجة إلى FiveM
        sendResultToFiveM(false);
        
        setTimeout(() => {
            switchScreen('standby');
            toggleCursor(false);
        }, 4000);
    }, 1000);
}

// الفوز في اللعبة
function gameWon() {
    gameState.gameActive = false;
    clearInterval(gameTimer);
    clearHackTimeout();
    
    const finalTime = 60 - gameState.timeRemaining;
    
    console.log(`تم الفوز! الحركات: ${gameState.moveCount}, الوقت: ${finalTime}s`);
    
    setTimeout(() => {
        // تحديث إحصائيات النتيجة
        const finalMoves = document.getElementById('finalMoves');
        const finalTimeElement = document.getElementById('finalTime');
        
        if (finalMoves) finalMoves.textContent = gameState.moveCount;
        if (finalTimeElement) finalTimeElement.textContent = finalTime;
        
        switchScreen('success');
        
        // إرسال النتيجة إلى FiveM
        sendResultToFiveM(true);
        
        setTimeout(() => {
            switchScreen('standby');
            toggleCursor(false);
        }, 5000);
    }, 1500);
}

// إرسال النتيجة إلى FiveM
function sendResultToFiveM(success) {
    try {
        fetch(`https://${GetParentResourceName()}/hackResult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: success,
                moves: gameState.moveCount,
                time: 60 - gameState.timeRemaining
            })
        }).catch(error => {
            console.error('خطأ في إرسال النتيجة إلى FiveM:', error);
        });
    } catch (error) {
        console.error('خطأ في الاتصال مع FiveM:', error);
    }
}

// تأثيرات بصرية للحركات
function showValidMove(towerIndex) {
    const tower = document.getElementById(`tower${towerIndex + 1}`);
    tower.classList.add('valid');
    setTimeout(() => tower.classList.remove('valid'), 800);
    
    // تأثير إضافي للبرج الهدف
    if (towerIndex === 2) {
        tower.style.transform = 'translateY(-15px) scale(1.05)';
        setTimeout(() => {
            tower.style.transform = 'translateY(-10px) scale(1)';
        }, 400);
    }
}

function showInvalidMove(towerIndex) {
    const tower = document.getElementById(`tower${towerIndex + 1}`);
    tower.classList.add('invalid');
    setTimeout(() => tower.classList.remove('invalid'), 800);
    
    console.log('حركة غير صحيحة');
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // النقر على الأبراج
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
    
    console.log('تم إعداد مستمعي الأحداث');
}

// التعامل مع رسائل FiveM
window.addEventListener('message', function(event) {
    const data = event.data;
    
    try {
        switch(data.type) {
            case 'startHack':
                console.log('بدء اللعبة من FiveM');
                switchScreen('hack');
                toggleCursor(true);
                initGame();
                startHackTimeout();
                break;
                
            case 'stopHack':
                console.log('إيقاف اللعبة من FiveM');
                switchScreen('standby');
                toggleCursor(false);
                gameState.gameActive = false;
                clearInterval(gameTimer);
                clearHackTimeout();
                break;
                
            case 'mouseMove':
                updateCursor(data.x, data.y);
                break;
                
            case 'click':
                handleFiveMClick(data.x, data.y);
                break;
                
            default:
                console.log('رسالة غير معروفة من FiveM:', data.type);
        }
    } catch (error) {
        console.error('خطأ في التعامل مع رسالة FiveM:', error);
    }
});

// التعامل مع النقرات من FiveM
function handleFiveMClick(x, y) {
    const element = document.elementFromPoint(x, y);
    if (element) {
        // تأثير النقر على المؤشر
        if (cursor) {
            cursor.style.background = 'radial-gradient(circle, #ff0080, rgba(255, 0, 128, 0.6))';
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursor.style.boxShadow = '0 0 30px #ff0080, 0 0 50px rgba(255, 0, 128, 0.4)';
            
            setTimeout(() => {
                cursor.style.background = 'radial-gradient(circle, var(--primary-color), rgba(0, 255, 65, 0.6))';
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.boxShadow = 'var(--glow-primary), 0 0 40px rgba(0, 255, 65, 0.3)';
            }, 200);
        }
        
        // تنفيذ النقر
        element.click();
        console.log('تم النقر على العنصر:', element.className);
    }
}

// مهلة زمنية للأمان
function startHackTimeout() {
    clearHackTimeout();
    
    hackTimeout = setTimeout(() => {
        if (gameState.gameActive) {
            console.log('انتهت المهلة الزمنية للأمان');
            gameTimeout();
        }
    }, 65000); // 65 ثانية (أكثر من مؤقت اللعبة بقليل)
}

function clearHackTimeout() {
    if (hackTimeout) {
        clearTimeout(hackTimeout);
        hackTimeout = null;
    }
}

// اختصارات لوحة المفاتيح (للاختبار)
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
            case 'Escape':
                deselectBlock();
                break;
        }
    }
    
    // اختصارات للمطورين
    if (e.ctrlKey && e.shiftKey) {
        switch(e.key) {
            case 'W':
                if (currentScreen === 'hack') gameWon();
                break;
            case 'L':
                if (currentScreen === 'hack') gameTimeout();
                break;
            case 'R':
                if (currentScreen === 'hack') {
                    initGame();
                    console.log('تم إعادة تشغيل اللعبة');
                }
                break;
        }
    }
});

// إضافة أنماط CSS للتأثيرات الإضافية
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes urgentPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
        }
        
        .block {
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .tower {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .cursor {
            transition: all 0.1s ease;
        }
    `;
    document.head.appendChild(style);
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('بدء تهيئة نظام Tower of Hanoi المحسن');
    
    createCursor();
    setupEventListeners();
    addDynamicStyles();
    switchScreen('standby');
    
    console.log('تم تهيئة النظام بنجاح');
    console.log('الوظائف المتاحة:');
    console.log('- FiveM Integration: ✓');
    console.log('- Custom Cursor: ✓');
    console.log('- Game Logic: ✓');
    console.log('- Visual Effects: ✓');
    console.log('- Arabic Support: ✓');
});

// وظائف التصحيح (للمطورين)
window.debugHack = function() {
    console.log('=== حالة اللعبة ===');
    console.log('الشاشة الحالية:', currentScreen);
    console.log('حالة اللعبة:', gameState);
    console.log('الأبراج:', gameState.towers);
    console.log('القرص المختار:', gameState.selectedBlock);
    console.log('البرج المختار:', gameState.selectedTower);
    console.log('عدد الحركات:', gameState.moveCount);
    console.log('التقدم:', gameState.progress + '%');
    console.log('الوقت المتبقي:', gameState.timeRemaining + 's');
    console.log('==================');
};

window.testWin = function() {
    console.log('اختبار الفوز');
    gameState.towers = [[], [], [4, 3, 2, 1]];
    gameWon();
};

window.testFail = function() {
    console.log('اختبار الفشل');
    gameTimeout();
};

window.testStart = function() {
    console.log('اختبار بدء اللعبة');
    switchScreen('hack');
    toggleCursor(true);
    initGame();
};

// رسالة التأكيد
console.log('🎮 تم تحميل نظام Tower of Hanoi المحسن بنجاح');
console.log('🔧 جميع الوظائف الأساسية محفوظة');
console.log('🎨 تم تحسين التصميم والتأثيرات البصرية');
console.log('🖱️ دعم كامل للماوس و FiveM');
console.log('🌟 جاهز للاستخدام!');
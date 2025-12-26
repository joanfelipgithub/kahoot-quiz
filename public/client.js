// Connect to Socket.IO server
const socket = io();

// DOM Elements
const screens = {
    lobby: document.getElementById('lobby'),
    question: document.getElementById('question'),
    reveal: document.getElementById('reveal'),
    ranking: document.getElementById('ranking'),
    final: document.getElementById('final')
};

const elements = {
    playerName: document.getElementById('playerName'),
    joinBtn: document.getElementById('joinBtn'),
    playerCount: document.getElementById('playerCount'),
    playersList: document.getElementById('playersList'),
    startGameBtn: document.getElementById('startGameBtn'),
    
    currentQuestion: document.getElementById('currentQuestion'),
    totalQuestions: document.getElementById('totalQuestions'),
    timer: document.getElementById('timer'),
    timerBar: document.getElementById('timerBar'),
    questionText: document.getElementById('questionText'),
    answersGrid: document.getElementById('answersGrid'),
    answerFeedback: document.getElementById('answerFeedback'),
    
    resultBadge: document.getElementById('resultBadge'),
    revealTitle: document.getElementById('revealTitle'),
    correctAnswerDisplay: document.getElementById('correctAnswerDisplay'),
    pointsEarned: document.getElementById('pointsEarned'),
    
    rankingList: document.getElementById('rankingList'),
    rankingQuestion: document.getElementById('rankingQuestion'),
    rankingTotal: document.getElementById('rankingTotal'),
    
    podium: document.getElementById('podium'),
    finalList: document.getElementById('finalList'),
    
    connectionStatus: document.getElementById('connectionStatus')
};

// State
let playerState = {
    name: '',
    joined: false,
    currentAnswer: null,
    timerInterval: null
};

// Helper Functions
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showConnectionStatus(show) {
    if (show) {
        elements.connectionStatus.classList.remove('hidden');
    } else {
        elements.connectionStatus.classList.add('hidden');
    }
}

// Event Listeners
elements.joinBtn.addEventListener('click', joinGame);
elements.playerName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinGame();
});

elements.startGameBtn.addEventListener('click', () => {
    socket.emit('start_game');
});

// Answer buttons
document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (playerState.currentAnswer) return; // Already answered
        
        const answer = btn.dataset.answer;
        playerState.currentAnswer = answer;
        
        // Visual feedback
        btn.classList.add('selected');
        document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
        
        // Send answer to server
        socket.emit('answer', { answer });
        
        elements.answerFeedback.textContent = '✓ Answer submitted!';
        elements.answerFeedback.className = 'answer-feedback submitted';
    });
});

// Functions
function joinGame() {
    const name = elements.playerName.value.trim();
    
    if (name.length < 2) {
        alert('Please enter a name (at least 2 characters)');
        return;
    }
    
    playerState.name = name;
    playerState.joined = true;
    
    socket.emit('join', name);
    
    elements.playerName.disabled = true;
    elements.joinBtn.disabled = true;
    elements.joinBtn.textContent = '✓ Joined';
}

function updatePlayersList(players) {
    elements.playersList.innerHTML = '';
    
    players.forEach(player => {
        const badge = document.createElement('div');
        badge.className = 'player-badge';
        badge.textContent = player.name;
        elements.playersList.appendChild(badge);
    });
}

function startTimer(duration) {
    let timeLeft = duration;
    elements.timer.textContent = timeLeft;
    elements.timerBar.style.width = '100%';
    
    // Clear any existing timer
    if (playerState.timerInterval) {
        clearInterval(playerState.timerInterval);
    }
    
    playerState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timer.textContent = timeLeft;
        
        // Update progress bar
        const percentage = (timeLeft / duration) * 100;
        elements.timerBar.style.width = percentage + '%';
        
        // Warning state
        if (timeLeft <= 5) {
            elements.timer.classList.add('warning');
        } else {
            elements.timer.classList.remove('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(playerState.timerInterval);
        }
    }, 1000);
}

function stopTimer() {
    if (playerState.timerInterval) {
        clearInterval(playerState.timerInterval);
        playerState.timerInterval = null;
    }
}

// Socket.IO Event Handlers
socket.on('connect', () => {
    console.log('Connected to server');
    showConnectionStatus(false);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    showConnectionStatus(true);
});

socket.on('game_state', (data) => {
    console.log('Game state:', data);
});

socket.on('players_update', (data) => {
    elements.playerCount.textContent = data.count;
    updatePlayersList(data.players);
});

socket.on('question', (data) => {
    console.log('Question received:', data);
    
    showScreen('question');
    
    // Reset state
    playerState.currentAnswer = null;
    elements.answerFeedback.textContent = '';
    elements.answerFeedback.className = 'answer-feedback';
    
    // Update UI
    elements.currentQuestion.textContent = data.questionNumber;
    elements.totalQuestions.textContent = data.totalQuestions;
    elements.questionText.textContent = data.question;
    
    // Set answers
    document.getElementById('answerA').textContent = data.options.a;
    document.getElementById('answerB').textContent = data.options.b;
    document.getElementById('answerC').textContent = data.options.c;
    document.getElementById('answerD').textContent = data.options.d;
    
    // Enable buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('selected', 'correct', 'wrong');
    });
    
    // Start timer
    startTimer(data.duration);
});

socket.on('answer_received', () => {
    console.log('Answer received by server');
});

socket.on('reveal', (data) => {
    console.log('Reveal:', data);
    
    stopTimer();
    
    // Show correct/wrong on question screen first
    document.querySelectorAll('.answer-btn').forEach(btn => {
        const answer = btn.dataset.answer;
        
        if (answer === data.correct) {
            btn.classList.add('correct');
        } else if (answer === playerState.currentAnswer) {
            btn.classList.add('wrong');
        }
    });
    
    // Then show reveal screen after a delay
    setTimeout(() => {
        showScreen('reveal');
        
        // Find player's result
        const playerResult = data.playerResults.find(p => p.name === playerState.name);
        
        if (playerResult) {
            if (playerResult.correct) {
                elements.resultBadge.textContent = '✅';
                elements.revealTitle.textContent = 'Correct!';
                elements.revealTitle.style.color = 'var(--color-green)';
                elements.pointsEarned.textContent = `+${playerResult.points} points`;
            } else {
                elements.resultBadge.textContent = '❌';
                elements.revealTitle.textContent = 'Wrong Answer';
                elements.revealTitle.style.color = 'var(--color-red)';
                elements.pointsEarned.textContent = '+0 points';
            }
        }
        
        elements.correctAnswerDisplay.textContent = data.explanation;
    }, 1500);
});

socket.on('ranking', (data) => {
    console.log('Ranking:', data);
    
    showScreen('ranking');
    
    elements.rankingQuestion.textContent = data.currentQuestion;
    elements.rankingTotal.textContent = data.totalQuestions;
    
    // Display ranking
    elements.rankingList.innerHTML = '';
    
    data.ranking.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="ranking-position">${player.position}</div>
            <div class="ranking-name">${player.name}</div>
            <div class="ranking-score">${player.score}</div>
        `;
        elements.rankingList.appendChild(item);
    });
});

socket.on('final_results', (data) => {
    console.log('Final results:', data);
    
    showScreen('final');
    
    // Create podium (top 3)
    elements.podium.innerHTML = '';
    const topThree = data.ranking.slice(0, 3);
    
    // Sort for podium display: 2nd, 1st, 3rd
    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(p => p);
    
    podiumOrder.forEach((player, index) => {
        if (!player) return;
        
        const place = document.createElement('div');
        place.className = 'podium-place';
        
        const medal = ['🥇', '🥈', '🥉'][player.position - 1] || '🏅';
        
        place.innerHTML = `
            <div class="podium-avatar">${medal}</div>
            <div class="podium-name">${player.name}</div>
            <div class="podium-block">
                <div class="podium-position">#${player.position}</div>
                <div class="podium-score">${player.score} pts</div>
            </div>
        `;
        elements.podium.appendChild(place);
    });
    
    // Full ranking list
    elements.finalList.innerHTML = '';
    data.ranking.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'final-item';
        item.innerHTML = `
            <span><strong>#${player.position}</strong> ${player.name}</span>
            <span>${player.score} points</span>
        `;
        elements.finalList.appendChild(item);
    });
});

socket.on('return_to_lobby', () => {
    console.log('Returning to lobby');
    showScreen('lobby');
    
    // Reset player state but keep name
    playerState.currentAnswer = null;
    playerState.joined = true;
    
    elements.playerName.disabled = true;
    elements.joinBtn.disabled = true;
    elements.joinBtn.textContent = '✓ Joined';
});

// Initialize
showScreen('lobby');
showConnectionStatus(false);

// Focus on name input
elements.playerName.focus();

// Host View Client - Teacher's Control Panel
const socket = io();

// DOM Elements
const screens = {
    lobby: document.getElementById('lobbyScreen'),
    question: document.getElementById('questionScreen'),
    reveal: document.getElementById('revealScreen'),
    ranking: document.getElementById('rankingScreen'),
    final: document.getElementById('finalScreen')
};

const elements = {
    // Lobby
    connectionUrl: document.getElementById('connectionUrl'),
    playerCountDisplay: document.getElementById('playerCountDisplay'),
    playerListDisplay: document.getElementById('playerListDisplay'),
    startGameBtn: document.getElementById('startGameBtn'),
    
    // Question
    questionNumberDisplay: document.getElementById('questionNumberDisplay'),
    timerDisplay: document.getElementById('timerDisplay'),
    questionTextDisplay: document.getElementById('questionTextDisplay'),
    answersPreview: document.getElementById('answersPreview'),
    answeredCount: document.getElementById('answeredCount'),
    totalPlayers: document.getElementById('totalPlayers'),
    answerBars: document.getElementById('answerBars'),
    answeredPlayersList: document.getElementById('answeredPlayersList'),
    
    // Reveal
    revealQuestionText: document.getElementById('revealQuestionText'),
    revealAnswersPreview: document.getElementById('revealAnswersPreview'),
    correctCount: document.getElementById('correctCount'),
    incorrectCount: document.getElementById('incorrectCount'),
    revealAnswerBars: document.getElementById('revealAnswerBars'),
    
    // Ranking
    rankingQuestionNum: document.getElementById('rankingQuestionNum'),
    rankingTotalNum: document.getElementById('rankingTotalNum'),
    rankingGrid: document.getElementById('rankingGrid'),
    
    // Final
    finalRankingGrid: document.getElementById('finalRankingGrid')
};

// State
let hostState = {
    currentQuestion: null,
    players: {},
    answerDistribution: { a: 0, b: 0, c: 0, d: 0 },
    timerInterval: null
};

// Helper Functions
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function updatePlayerList(players) {
    elements.playerListDisplay.innerHTML = '';
    
    players.forEach(player => {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.textContent = player.name;
        elements.playerListDisplay.appendChild(item);
    });
}

function updateAnswerDistribution() {
    const total = Object.values(hostState.answerDistribution).reduce((a, b) => a + b, 0);
    
    const colors = { a: 'red', b: 'blue', c: 'yellow', d: 'green' };
    const labels = { a: 'A', b: 'B', c: 'C', d: 'D' };
    
    elements.answerBars.innerHTML = '';
    
    Object.keys(hostState.answerDistribution).forEach(key => {
        const count = hostState.answerDistribution[key];
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        
        const barDiv = document.createElement('div');
        barDiv.className = 'answer-bar';
        barDiv.innerHTML = `
            <div class="answer-bar-label">
                <span>${labels[key]}</span>
                <span>${count} (${percentage}%)</span>
            </div>
            <div class="answer-bar-bg">
                <div class="answer-bar-fill ${colors[key]}" style="width: ${percentage}%">
                    ${percentage > 0 ? count : ''}
                </div>
            </div>
        `;
        elements.answerBars.appendChild(barDiv);
    });
}

function updateAnsweredPlayersList() {
    elements.answeredPlayersList.innerHTML = '';
    
    Object.values(hostState.players)
        .filter(p => p.answered)
        .forEach(player => {
            const item = document.createElement('div');
            item.className = 'answered-player';
            item.textContent = `${player.name} - ${player.answer ? player.answer.toUpperCase() : '?'}`;
            elements.answeredPlayersList.appendChild(item);
        });
}

function startTimer(duration) {
    let timeLeft = duration;
    elements.timerDisplay.textContent = timeLeft;
    
    if (hostState.timerInterval) {
        clearInterval(hostState.timerInterval);
    }
    
    hostState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 5) {
            elements.timerDisplay.classList.add('warning');
        } else {
            elements.timerDisplay.classList.remove('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(hostState.timerInterval);
        }
    }, 1000);
}

function stopTimer() {
    if (hostState.timerInterval) {
        clearInterval(hostState.timerInterval);
        hostState.timerInterval = null;
    }
}

// Generate QR Code on load
window.addEventListener('load', () => {
    const url = window.location.origin;
    elements.connectionUrl.textContent = url;
    
    // Generate QR code
    new QRCode(document.getElementById('lobbyQRCode'), {
        text: url,
        width: 250,
        height: 250,
        colorDark: '#667eea',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
});

// Event Listeners
elements.startGameBtn.addEventListener('click', () => {
    socket.emit('start_game');
});

// Socket.IO Event Handlers
socket.on('connect', () => {
    console.log('Host connected to server');
    // Join as host (special identification)
    socket.emit('join', '👨‍🏫 PROFESSOR (Pantalla Principal)');
});

socket.on('game_state', (data) => {
    console.log('Game state:', data);
});

socket.on('players_update', (data) => {
    elements.playerCountDisplay.textContent = data.count;
    elements.totalPlayers.textContent = data.count;
    updatePlayerList(data.players);
    
    // Update internal player state
    data.players.forEach(p => {
        if (!hostState.players[p.name]) {
            hostState.players[p.name] = { ...p, answered: false, answer: null };
        }
    });
});

socket.on('question', (data) => {
    console.log('Question received:', data);
    showScreen('question');
    
    // Reset state
    hostState.currentQuestion = data;
    hostState.answerDistribution = { a: 0, b: 0, c: 0, d: 0 };
    Object.values(hostState.players).forEach(p => {
        p.answered = false;
        p.answer = null;
    });
    
    // Update displays
    elements.questionNumberDisplay.textContent = `Pregunta ${data.questionNumber}/${data.totalQuestions}`;
    elements.questionTextDisplay.textContent = data.question;
    elements.answeredCount.textContent = '0';
    
    // Display answers
    const colors = ['red', 'blue', 'yellow', 'green'];
    const letters = ['A', 'B', 'C', 'D'];
    elements.answersPreview.innerHTML = '';
    
    Object.keys(data.options).forEach((key, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = `answer-preview ${colors[index]}`;
        answerDiv.innerHTML = `
            <span class="answer-letter">${letters[index]}</span>
            <span>${data.options[key]}</span>
        `;
        elements.answersPreview.appendChild(answerDiv);
    });
    
    // Initialize answer bars
    updateAnswerDistribution();
    updateAnsweredPlayersList();
    
    // Start timer
    startTimer(data.duration);
});

// Listen for individual answer updates (we'll need to add this to server)
socket.on('player_answered', (data) => {
    console.log('Player answered:', data);
    
    // Update player state
    if (hostState.players[data.playerName]) {
        hostState.players[data.playerName].answered = true;
        hostState.players[data.playerName].answer = data.answer;
    }
    
    // Update distribution
    if (hostState.answerDistribution[data.answer] !== undefined) {
        hostState.answerDistribution[data.answer]++;
    }
    
    // Update displays
    const answeredCount = Object.values(hostState.players).filter(p => p.answered).length;
    elements.answeredCount.textContent = answeredCount;
    
    updateAnswerDistribution();
    updateAnsweredPlayersList();
});

socket.on('reveal', (data) => {
    console.log('Reveal:', data);
    stopTimer();
    
    showScreen('reveal');
    
    // Display question and answers with correct highlighted
    elements.revealQuestionText.textContent = hostState.currentQuestion.question;
    
    const colors = ['red', 'blue', 'yellow', 'green'];
    const letters = ['A', 'B', 'C', 'D'];
    elements.revealAnswersPreview.innerHTML = '';
    
    Object.keys(hostState.currentQuestion.options).forEach((key, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = `answer-preview ${colors[index]}`;
        if (key === data.correct) {
            answerDiv.classList.add('correct');
        }
        answerDiv.innerHTML = `
            <span class="answer-letter">${letters[index]}</span>
            <span>${hostState.currentQuestion.options[key]}</span>
        `;
        elements.revealAnswersPreview.appendChild(answerDiv);
    });
    
    // Calculate correct/incorrect
    let correctCount = 0;
    let incorrectCount = 0;
    
    data.playerResults.forEach(result => {
        if (result.correct) {
            correctCount++;
        } else if (result.answer) {
            incorrectCount++;
        }
    });
    
    elements.correctCount.textContent = correctCount;
    elements.incorrectCount.textContent = incorrectCount;
    
    // Show final distribution
    elements.revealAnswerBars.innerHTML = elements.answerBars.innerHTML;
});

socket.on('ranking', (data) => {
    console.log('Ranking:', data);
    showScreen('ranking');
    
    elements.rankingQuestionNum.textContent = data.currentQuestion;
    elements.rankingTotalNum.textContent = data.totalQuestions;
    
    // Display ranking
    elements.rankingGrid.innerHTML = '';
    
    data.ranking.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'ranking-card';
        if (index < 3) {
            card.classList.add('top3');
        }
        
        let positionClass = '';
        if (index === 0) positionClass = 'gold';
        else if (index === 1) positionClass = 'silver';
        else if (index === 2) positionClass = 'bronze';
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        card.innerHTML = `
            <div class="rank-position ${positionClass}">${medal} #${player.position}</div>
            <div class="rank-info">
                <div class="rank-name">${player.name}</div>
                <div class="rank-score">${player.score} pts</div>
            </div>
        `;
        elements.rankingGrid.appendChild(card);
    });
});

socket.on('final_results', (data) => {
    console.log('Final results:', data);
    showScreen('final');
    
    // Display final ranking
    elements.finalRankingGrid.innerHTML = '';
    
    data.ranking.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'ranking-card';
        if (index < 3) {
            card.classList.add('top3');
        }
        
        let positionClass = '';
        if (index === 0) positionClass = 'gold';
        else if (index === 1) positionClass = 'silver';
        else if (index === 2) positionClass = 'bronze';
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        
        card.innerHTML = `
            <div class="rank-position ${positionClass}">${medal} #${player.position}</div>
            <div class="rank-info">
                <div class="rank-name">${player.name}</div>
                <div class="rank-score">${player.score} pts</div>
            </div>
        `;
        elements.finalRankingGrid.appendChild(card);
    });
});

socket.on('return_to_lobby', () => {
    console.log('Returning to lobby');
    showScreen('lobby');
    hostState.players = {};
    hostState.answerDistribution = { a: 0, b: 0, c: 0, d: 0 };
});

// Initialize
showScreen('lobby');

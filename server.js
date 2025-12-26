const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 8080;
const QUESTIONS_FILE = path.join(__dirname, 'questions', 'quiz.txt');
const RANKING_DISPLAY_TIME = 5000; // 5 seconds

// Serve static files
app.use(express.static('public'));

// Game state
let gameState = {
  status: 'lobby', // lobby | question | reveal | ranking | finished
  currentQuestionIndex: 0,
  questions: [],
  players: {},
  startTime: null
};

// Get local LAN IP
function getLocalIP() {
  const nets = os.networkInterfaces();
  for (let name of Object.keys(nets)) {
    for (let net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

// Parse questions from TXT file
function loadQuestions() {
  try {
    const content = fs.readFileSync(QUESTIONS_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const questions = [];
    let currentQuestion = null;
    
    for (let line of lines) {
      line = line.trim();
      
      // Check if it's a question line (starts with number)
      const questionMatch = line.match(/^(\d+)\((\d+)s\)\s+(.+)$/);
      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          id: parseInt(questionMatch[1]),
          duration: parseInt(questionMatch[2]),
          question: questionMatch[3],
          options: {},
          correct: null
        };
      }
      // Check if it's an answer line
      else if (line.match(/^[\*]?[a-d]\.\s+.+$/)) {
        const isCorrect = line.startsWith('*');
        const answerLine = isCorrect ? line.substring(1) : line;
        const answerMatch = answerLine.match(/^([a-d])\.\s+(.+)$/);
        
        if (answerMatch && currentQuestion) {
          const key = answerMatch[1];
          const text = answerMatch[2];
          currentQuestion.options[key] = text;
          
          if (isCorrect) {
            currentQuestion.correct = key;
          }
        }
      }
    }
    
    // Add the last question
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions;
  } catch (error) {
    console.error('Error loading questions:', error.message);
    return [];
  }
}

// Initialize questions
gameState.questions = loadQuestions();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Player joins the game
  socket.on('join', (playerName) => {
    gameState.players[socket.id] = {
      id: socket.id,
      name: playerName || `Player${Object.keys(gameState.players).length + 1}`,
      score: 0,
      answered: false,
      answer: null,
      answerTime: null
    };
    
    console.log(`${gameState.players[socket.id].name} joined the game`);
    
    // Send current game state to the new player
    socket.emit('game_state', {
      status: gameState.status,
      playerCount: Object.keys(gameState.players).length
    });
    
    // Broadcast updated player list to all
    io.emit('players_update', {
      players: Object.values(gameState.players).map(p => ({
        name: p.name,
        score: p.score
      })),
      count: Object.keys(gameState.players).length
    });
  });
  
  // Player submits an answer
  socket.on('answer', (data) => {
    const player = gameState.players[socket.id];
    
    if (!player || player.answered || gameState.status !== 'question') {
      return;
    }
    
    player.answered = true;
    player.answer = data.answer;
    player.answerTime = Date.now() - gameState.startTime;
    
    console.log(`${player.name} answered: ${data.answer} (${player.answerTime}ms)`);
    
    // Send confirmation to player
    socket.emit('answer_received');
    
    // Broadcast to all clients (especially host view) that someone answered
    io.emit('player_answered', {
      playerName: player.name,
      answer: data.answer,
      answered: true
    });
  });
  
  // Start game (teacher/host control)
  socket.on('start_game', () => {
    if (gameState.status === 'lobby' && gameState.questions.length > 0) {
      console.log('Game starting...');
      gameState.status = 'question';
      gameState.currentQuestionIndex = 0;
      
      // Reset all players
      Object.values(gameState.players).forEach(player => {
        player.score = 0;
        player.answered = false;
        player.answer = null;
      });
      
      sendQuestion();
    }
  });
  
  // Player disconnects
  socket.on('disconnect', () => {
    const player = gameState.players[socket.id];
    if (player) {
      console.log(`${player.name} disconnected`);
      delete gameState.players[socket.id];
      
      io.emit('players_update', {
        players: Object.values(gameState.players).map(p => ({
          name: p.name,
          score: p.score
        })),
        count: Object.keys(gameState.players).length
      });
    }
  });
});

// Send question to all players
function sendQuestion() {
  const question = gameState.questions[gameState.currentQuestionIndex];
  
  if (!question) {
    endGame();
    return;
  }
  
  gameState.status = 'question';
  gameState.startTime = Date.now();
  
  // Reset player answers
  Object.values(gameState.players).forEach(player => {
    player.answered = false;
    player.answer = null;
    player.answerTime = null;
  });
  
  io.emit('question', {
    questionNumber: gameState.currentQuestionIndex + 1,
    totalQuestions: gameState.questions.length,
    question: question.question,
    options: question.options,
    duration: question.duration
  });
  
  console.log(`Question ${gameState.currentQuestionIndex + 1} sent`);
  
  // Auto-reveal after duration
  setTimeout(() => {
    revealAnswer();
  }, question.duration * 1000);
}

// Reveal correct answer and calculate scores
function revealAnswer() {
  const question = gameState.questions[gameState.currentQuestionIndex];
  gameState.status = 'reveal';
  
  // Calculate scores
  Object.values(gameState.players).forEach(player => {
    if (player.answer === question.correct) {
      // Kahoot-style scoring: base points + time bonus
      const timeBonus = Math.floor(500 * (1 - player.answerTime / (question.duration * 1000)));
      const points = 500 + Math.max(0, timeBonus);
      player.score += points;
      player.lastPoints = points;
    } else {
      player.lastPoints = 0;
    }
  });
  
  io.emit('reveal', {
    correct: question.correct,
    explanation: `The correct answer is: ${question.options[question.correct]}`,
    playerResults: Object.values(gameState.players).map(p => ({
      id: p.id,
      name: p.name,
      answer: p.answer,
      correct: p.answer === question.correct,
      points: p.lastPoints || 0
    }))
  });
  
  console.log('Answer revealed');
  
  // Show ranking after 2 seconds
  setTimeout(() => {
    showRanking();
  }, 2000);
}

// Show ranking leaderboard
function showRanking() {
  gameState.status = 'ranking';
  
  const ranking = Object.values(gameState.players)
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      position: index + 1,
      name: player.name,
      score: player.score,
      lastPoints: player.lastPoints || 0
    }));
  
  io.emit('ranking', {
    ranking: ranking,
    currentQuestion: gameState.currentQuestionIndex + 1,
    totalQuestions: gameState.questions.length
  });
  
  console.log('Ranking displayed');
  
  // Move to next question or end game
  setTimeout(() => {
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex < gameState.questions.length) {
      sendQuestion();
    } else {
      endGame();
    }
  }, RANKING_DISPLAY_TIME);
}

// End game and show final results
function endGame() {
  gameState.status = 'finished';
  
  const finalRanking = Object.values(gameState.players)
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      position: index + 1,
      name: player.name,
      score: player.score
    }));
  
  io.emit('final_results', {
    ranking: finalRanking
  });
  
  console.log('Game finished! Final results sent.');
  
  // Reset to lobby after 30 seconds
  setTimeout(() => {
    gameState.status = 'lobby';
    gameState.currentQuestionIndex = 0;
    
    // Keep players but reset scores
    Object.values(gameState.players).forEach(player => {
      player.score = 0;
      player.answered = false;
      player.answer = null;
    });
    
    io.emit('return_to_lobby');
  }, 30000);
}

// Start server
server.listen(PORT, () => {
  const localIP = getLocalIP();
  const url = `http://${localIP}:${PORT}`;
  
  console.log('='.repeat(50));
  console.log('🎮 KAHOOT-STYLE QUIZ SERVER');
  console.log('='.repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`📡 LAN access: ${url}`);
  console.log(`📝 Questions loaded: ${gameState.questions.length}`);
  console.log('='.repeat(50));
  console.log('📱 Students: Scan this QR code to connect:');
  console.log('');
  qrcode.generate(url, {small: true});
  console.log('');
  console.log(`Or type: ${url}`);
  console.log('='.repeat(50));
  console.log('Ready for players to connect!');
  console.log('Teacher: Open the "Teacher Control" panel to start the game.');
});

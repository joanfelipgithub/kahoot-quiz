const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');
const os = require('os');
const qrcode = require('qrcode-terminal');
const bonjour = require('bonjour')();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 8080;
const HOSTNAME = 'quiz.local'; // Easy to remember name!
const QUESTIONS_FILE = path.join(__dirname, 'questions', 'quiz.txt');
const RANKING_DISPLAY_TIME = 5000;

// Serve static files
app.use(express.static('public'));

// Game state
let gameState = {
  status: 'lobby',
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
    
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions;
  } catch (error) {
    console.error('Error loading questions:', error.message);
    return [];
  }
}

gameState.questions = loadQuestions();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
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
    
    socket.emit('game_state', {
      status: gameState.status,
      playerCount: Object.keys(gameState.players).length
    });
    
    io.emit('players_update', {
      players: Object.values(gameState.players).map(p => ({
        name: p.name,
        score: p.score
      })),
      count: Object.keys(gameState.players).length
    });
  });
  
  socket.on('answer', (data) => {
    const player = gameState.players[socket.id];
    
    if (!player || player.answered || gameState.status !== 'question') {
      return;
    }
    
    player.answered = true;
    player.answer = data.answer;
    player.answerTime = Date.now() - gameState.startTime;
    
    console.log(`${player.name} answered: ${data.answer} (${player.answerTime}ms)`);
    
    socket.emit('answer_received');
  });
  
  socket.on('start_game', () => {
    if (gameState.status === 'lobby' && gameState.questions.length > 0) {
      console.log('Game starting...');
      gameState.status = 'question';
      gameState.currentQuestionIndex = 0;
      
      Object.values(gameState.players).forEach(player => {
        player.score = 0;
        player.answered = false;
        player.answer = null;
      });
      
      sendQuestion();
    }
  });
  
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

function sendQuestion() {
  const question = gameState.questions[gameState.currentQuestionIndex];
  
  if (!question) {
    endGame();
    return;
  }
  
  gameState.status = 'question';
  gameState.startTime = Date.now();
  
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
  
  setTimeout(() => {
    revealAnswer();
  }, question.duration * 1000);
}

function revealAnswer() {
  const question = gameState.questions[gameState.currentQuestionIndex];
  gameState.status = 'reveal';
  
  Object.values(gameState.players).forEach(player => {
    if (player.answer === question.correct) {
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
  
  setTimeout(() => {
    showRanking();
  }, 2000);
}

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
  
  setTimeout(() => {
    gameState.currentQuestionIndex++;
    
    if (gameState.currentQuestionIndex < gameState.questions.length) {
      sendQuestion();
    } else {
      endGame();
    }
  }, RANKING_DISPLAY_TIME);
}

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
  
  setTimeout(() => {
    gameState.status = 'lobby';
    gameState.currentQuestionIndex = 0;
    
    Object.values(gameState.players).forEach(player => {
      player.score = 0;
      player.answered = false;
      player.answer = null;
    });
    
    io.emit('return_to_lobby');
  }, 30000);
}

// Start server with mDNS
server.listen(PORT, () => {
  const localIP = getLocalIP();
  const ipUrl = `http://${localIP}:${PORT}`;
  const localUrl = `http://${HOSTNAME}:${PORT}`;
  
  // Publish mDNS service
  bonjour.publish({ 
    name: 'Quiz Battle', 
    type: 'http', 
    port: PORT,
    host: HOSTNAME
  });
  
  console.log('='.repeat(60));
  console.log('🎮 KAHOOT-STYLE QUIZ SERVER (with mDNS)');
  console.log('='.repeat(60));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Questions loaded: ${gameState.questions.length}`);
  console.log('='.repeat(60));
  console.log('🌟 EASY ACCESS (works on Mac/iOS):');
  console.log(`   Type this: ${localUrl}`);
  console.log('');
  console.log('📡 Or use IP address:');
  console.log(`   ${ipUrl}`);
  console.log('');
  console.log('📱 Or scan this QR code:');
  console.log('');
  qrcode.generate(ipUrl, {small: true});
  console.log('');
  console.log('='.repeat(60));
  console.log('💡 TIP: On Apple devices, just type "quiz.local:8080"');
  console.log('='.repeat(60));
  console.log('Ready for players to connect!');
});

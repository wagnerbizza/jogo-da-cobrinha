// ==============================================================================
// 🐍 SNAKE ARCADE PRO - CONFIGURAÇÕES DE SOM INDEPENDENTES & MOVIMENTO
// ==============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const speedLevelEl = document.getElementById('speed-level');
const livesDisplayEl = document.getElementById('lives-display');

const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const rankingBtn = document.getElementById('ranking-btn');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownText = document.getElementById('countdown-text');
const startOverlay = document.getElementById('start-overlay');
const startGameBtn = document.getElementById('start-game-btn');

// Elementos de Configuração de Som Independentes
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const initialSpeedSelect = document.getElementById('initial-speed-select');

const soundMoveToggle = document.getElementById('sound-move');
const soundEatToggle = document.getElementById('sound-eat');
const soundHitToggle = document.getElementById('sound-hit');

// Grade
const gridSize = 20;

// Sistema de Som
let audioCtx = null;
let soundConfig = {
  move: true,
  eat: true,
  hit: true
};

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  // Verifica se a categoria específica de som está ativada
  if (type === 'move' && !soundConfig.move) return;
  if ((type === 'eat' || type === 'eat_special') && !soundConfig.eat) return;
  if ((type === 'hit' || type === 'die' || type === 'count' || type === 'go') && !soundConfig.hit) return;

  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'move') {
      // Som sutil e curto de passo/movimento da cobrinha
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'eat') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'eat_special') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'hit') {
      // Som ao perder 1 vida
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'die') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'count') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'go') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {}
}

// Partículas
let particles = [];

function createExplosion(x, y, color) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + gridSize / 2,
      y: y + gridSize / 2,
      dx: (Math.random() - 0.5) * 5,
      dy: (Math.random() - 0.5) * 5,
      radius: Math.random() * 3 + 1,
      color: color,
      life: 18
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life--;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 18;
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1.0;

    if (p.life <= 0) particles.splice(i, 1);
  }
}

// Estados Globais
let lives = 3;
let score = 0;
let highScore = localStorage.getItem('snake_highscore') || 0;
let level = 1;
let isPaused = false;
let isCountingDown = false;
let gameStarted = false;
let gameInterval = null;

let baseSpeed = 120;
let currentSpeed = 120;

highScoreEl.textContent = highScore;

// Cobra e Alimentos
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0, type: 'normal' };

function initSnake() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
}

function spawnFood() {
  let valid = false;
  while (!valid) {
    food.x = Math.floor(Math.random() * Math.floor(canvas.width / gridSize));
    food.y = Math.floor(Math.random() * Math.floor(canvas.height / gridSize));
    valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
  food.type = Math.random() < 0.2 ? 'special' : 'normal';
}

function updateHUD() {
  scoreEl.textContent = score;
  livesDisplayEl.textContent = '❤️'.repeat(lives);
  
  level = Math.floor(score / 50) + 1;
  const speedMultiplier = (baseSpeed / currentSpeed).toFixed(1);
  speedLevelEl.textContent = `Fase ${level} (${speedMultiplier}x)`;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snake_highscore', highScore);
    highScoreEl.textContent = highScore;
  }
}

// Controles do Teclado e Mobile
window.addEventListener('keydown', (e) => {
  initAudio();
  if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y === 0) nextDir = { x: 0, y: -1 };
  if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y === 0) nextDir = { x: 0, y: 1 };
  if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x === 0) nextDir = { x: -1, y: 0 };
  if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x === 0) nextDir = { x: 1, y: 0 };
  if (e.key === 'p' || e.key === 'P') togglePause();
});

document.getElementById('btn-up')?.addEventListener('click', () => { if (dir.y === 0) nextDir = { x: 0, y: -1 }; });
document.getElementById('btn-down')?.addEventListener('click', () => { if (dir.y === 0) nextDir = { x: 0, y: 1 }; });
document.getElementById('btn-left')?.addEventListener('click', () => { if (dir.x === 0) nextDir = { x: -1, y: 0 }; });
document.getElementById('btn-right')?.addEventListener('click', () => { if (dir.x === 0) nextDir = { x: 1, y: 0 }; });

pauseBtn.addEventListener('click', () => { initAudio(); togglePause(); });
restartBtn.addEventListener('click', () => {
  initAudio();
  if (!gameStarted) startGame();
  else resetGame();
});
rankingBtn.addEventListener('click', () => { initAudio(); showLeaderboard(); });

rankingBtn.addEventListener('click', () => {
  // Se o jogo estiver rodando e não pausado, pausa automaticamente
  if (gameStarted && !isPaused && !isCountingDown) {
    togglePause(); // Pausa o jogo
  }
  allowFirebaseSync = false; // Evita sincronizações indesejadas em segundo plano
  showLeaderboard(); // Abre o modal do ranking
});

// Menu Configurações
settingsBtn?.addEventListener('click', () => { settingsModal.classList.remove('hidden'); });
closeSettingsBtn?.addEventListener('click', () => {
  baseSpeed = parseInt(initialSpeedSelect.value);
  
  // Salva preferências individuais de som
  soundConfig.move = soundMoveToggle.checked;
  soundConfig.eat = soundEatToggle.checked;
  soundConfig.hit = soundHitToggle.checked;

  settingsModal.classList.add('hidden');
});

function togglePause() {
  if (isCountingDown || !gameStarted) return;

  if (isPaused) {
    startCountdown(() => {
      isPaused = false;
      pauseBtn.textContent = 'Pausar';
      startGameLoop();
    });
  } else {
    isPaused = true;
    pauseBtn.textContent = 'Continuar';
    clearInterval(gameInterval);
  }
}

function startCountdown(onComplete) {
  isCountingDown = true;
  countdownOverlay.classList.remove('hidden');
  let count = 3;
  countdownText.textContent = count;
  playSound('count');

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownText.textContent = count;
      playSound('count');
    } else if (count === 0) {
      countdownText.textContent = 'JÁ!';
      playSound('go');
    } else {
      clearInterval(timer);
      countdownOverlay.classList.add('hidden');
      isCountingDown = false;
      if (onComplete) onComplete();
    }
  }, 600);
}

function startGame() {
  initAudio();
  gameStarted = true;
  if (startOverlay) startOverlay.classList.add('hidden');

  lives = 3;
  score = 0;
  baseSpeed = parseInt(initialSpeedSelect.value);
  currentSpeed = baseSpeed;
  particles = [];
  initSnake();
  spawnFood();
  updateHUD();

  startCountdown(() => {
    startGameLoop();
  });
}

function resetGame() {
  clearInterval(gameInterval);
  lives = 3;
  score = 0;
  currentSpeed = baseSpeed;
  particles = [];
  initSnake();
  spawnFood();
  updateHUD();

  if (isPaused) {
    isPaused = false;
    pauseBtn.textContent = 'Pausar';
  }

  startCountdown(() => {
    startGameLoop();
  });
}

function startGameLoop() {
  clearInterval(gameInterval);
  gameInterval = setInterval(gameStep, currentSpeed);
}

// Lógica de Colisão
function handleCollision() {
  lives--;
  updateHUD();

  if (lives > 0) {
    playSound('hit');
    clearInterval(gameInterval);
    initSnake();
    startCountdown(() => {
      startGameLoop();
    });
  } else {
    gameOver();
  }
}

function gameStep() {
  if (isPaused || isCountingDown || !gameStarted) return;

  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const maxTileX = Math.floor(canvas.width / gridSize);
  const maxTileY = Math.floor(canvas.height / gridSize);

  // Colisão com Paredes
  if (head.x < 0 || head.x >= maxTileX || head.y < 0 || head.y >= maxTileY) {
    handleCollision();
    return;
  }

  // Colisão com o Corpo
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    handleCollision();
    return;
  }

  snake.unshift(head);

  // Toca o som contínuo de passo/movimento da cobrinha
  playSound('move');

  // Comer Fruta
  if (head.x === food.x && head.y === food.y) {
    const isSpecial = food.type === 'special';
    score += isSpecial ? 30 : 10;

    createExplosion(
      food.x * gridSize,
      food.y * gridSize,
      isSpecial ? '#f59e0b' : '#ef4444'
    );

    playSound(isSpecial ? 'eat_special' : 'eat');

    if (score % 50 === 0 && currentSpeed > 40) {
      currentSpeed -= 8;
      startGameLoop();
    }

    spawnFood();
    updateHUD();
  } else {
    snake.pop();
  }

  render();
}

function gameOver() {
  playSound('die');
  clearInterval(gameInterval);
  saveLeaderboardScore(score);
  gameStarted = false;
  if (startOverlay) startOverlay.classList.remove('hidden');
  renderStatic();
}

function drawGrid() {
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.5;

  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    ctx.beginPath();
    ctx.roundRect(
      segment.x * gridSize + 1,
      segment.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2,
      index === 0 ? 6 : 3
    );

    if (index === 0) {
      ctx.fillStyle = '#38bdf8';
    } else {
      ctx.fillStyle = index % 2 === 0 ? '#0284c7' : '#0369a1';
    }

    ctx.fill();
    ctx.closePath();
  });
}

function drawFood() {
  ctx.beginPath();
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;
  const radius = gridSize / 2 - 2;

  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  const color = food.type === 'special' ? '#f59e0b' : '#ef4444';
  ctx.fillStyle = color;
  ctx.shadowBlur = 10;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.closePath();
  ctx.shadowBlur = 0;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
  updateParticles();
}

function renderStatic() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawSnake();
}

// RANKING FIREBASE
const MAX_LEADERBOARD_ENTRIES = 5;

function saveLeaderboardScore(newScore) {
  if (newScore <= 0) return;

  const playerName = prompt(`🎉 Fim de jogo! Você fez ${newScore} pontos.\nDigite seu nome para o Ranking Global:`) || "Jogador Anônimo";

  const scoreData = {
    name: playerName.trim().substring(0, 12),
    score: newScore,
    timestamp: Date.now()
  };

  database.ref('snake_leaderboard').push(scoreData)
    .then(() => showLeaderboard())
    .catch((err) => console.error("Erro ao salvar no Firebase:", err));
}

function showLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  const modal = document.getElementById('leaderboard-modal');

  if (!listEl || !modal) return;

  listEl.innerHTML = '<li>Carregando ranking global...</li>';
  modal.classList.remove('hidden');

  database.ref('snake_leaderboard')
    .orderByChild('score')
    .limitToLast(MAX_LEADERBOARD_ENTRIES)
    .once('value', (snapshot) => {
      listEl.innerHTML = '';
      const scores = [];

      snapshot.forEach((childSnapshot) => {
        scores.push(childSnapshot.val());
      });

      scores.reverse();

      if (scores.length === 0) {
        listEl.innerHTML = '<li>Nenhuma pontuação salva ainda.</li>';
      } else {
        scores.forEach((entry) => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${entry.name}</strong>: ${entry.score} pts`;
          listEl.appendChild(li);
        });
      }
    })
    .catch((err) => {
      listEl.innerHTML = '<li>Erro ao carregar o ranking. Verifique as Regras do Firebase.</li>';
      console.error(err);
    });
}

document.getElementById('close-leaderboard-btn')?.addEventListener('click', () => {
  document.getElementById('leaderboard-modal')?.classList.add('hidden');
});

// Inicialização
initSnake();
updateHUD();
renderStatic();

startGameBtn.addEventListener('click', startGame);
const themes = {
  mixed: [
    '🍎', '🍌', '🍇', '🍓', '🍍', '🍉', '🍒', '🥝',
    '🍋', '🍑', '🥥', '🥭', '🍐', '🍊', '🫐', '🍈',
    '🐶', '🐱', '🐸', '🦊', '🐼', '🦁', '🐵', '🐯',
    '⭐', '🌙', '☀️', '⚡', '🔥', '❄️', '🌈', '💎',
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
    '🐴', '🦄', '🐝', '🦋', '🐢', '🐙', '🦀', '🐬',
  ],
  space: [
    '🚀', '🛸', '🌍', '🌎', '🌕', '🌙', '☀️', '⭐',
    '🌟', '✨', '☄️', '🪐', '🌌', '👽', '🛰️', '🔭',
    '⚡', '🔥', '💫', '🌠', '🌑', '🌒', '🌓', '🌔',
    '🌖', '🌗', '🌘', '🧑‍🚀', '👾', '🧪', '🧬', '💎',
  ],
  sports: [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
    '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
    '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🥊',
    '🥋', '🎽', '🛹', '🛼', '⛸️', '🎿', '🏂', '🏆',
  ],
};

const difficultySettings = {
  easy: {
    label: 'Easy',
    columns: 4,
    pairs: 8,
    multiplier: 1,
  },
  medium: {
    label: 'Medium',
    columns: 6,
    pairs: 18,
    multiplier: 2,
  },
  hard: {
    label: 'Hard',
    columns: 8,
    pairs: 32,
    multiplier: 4,
  },
};

const leaderboardKey = 'memoryMatchLeaderboard';
const playerNameKey = 'memoryMatchPlayerName';
const themeKey = 'memoryMatchTheme';
const difficultyKey = 'memoryMatchDifficulty';

let currentDifficulty = localStorage.getItem(difficultyKey) || 'easy';
let currentTheme = localStorage.getItem(themeKey) || 'mixed';
let currentSymbols = [];
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let secondsElapsed = 0;
let peekPenalty = 0;
let timerInterval = null;
let timerStarted = false;

const gameBoard = document.getElementById('game-board');
const moveCount = document.getElementById('move-count');
const matchCount = document.getElementById('match-count');
const timer = document.getElementById('timer');
const scorePreview = document.getElementById('score-preview');
const bestScore = document.getElementById('best-score');
const statusMessage = document.getElementById('status-message');
const restartButton = document.getElementById('restart-btn');
const newGameButton = document.getElementById('new-game-btn');
const peekButton = document.getElementById('peek-btn');
const clearLeaderboardButton = document.getElementById('clear-leaderboard-btn');
const difficultySelect = document.getElementById('difficulty-select');
const themeSelect = document.getElementById('theme-select');
const playerNameInput = document.getElementById('player-name');
const leaderboardFilter = document.getElementById('leaderboard-filter');
const leaderboardList = document.getElementById('leaderboard-list');
const winModal = document.getElementById('win-modal');
const winSummary = document.getElementById('win-summary');
const playAgainButton = document.getElementById('play-again-btn');
const closeModalButton = document.getElementById('close-modal-btn');

function initGame() {
  const difficulty = difficultySettings[currentDifficulty];

  currentSymbols = themes[currentTheme].slice(0, difficulty.pairs);
  cards = shuffleArray([...currentSymbols, ...currentSymbols]);
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matches = 0;
  secondsElapsed = 0;
  peekPenalty = 0;
  timerStarted = false;

  stopTimer();
  updateStats();
  closeWinModal();
  statusMessage.textContent = `${difficulty.label} mode loaded with the ${formatThemeName(currentTheme)} theme. Click any card to start the timer.`;
  gameBoard.innerHTML = '';
  gameBoard.style.setProperty('--columns', difficulty.columns);

  cards.forEach((symbol, index) => {
    gameBoard.appendChild(createCard(symbol, index));
  });
}

function createCard(symbol, index) {
  const card = document.createElement('button');

  card.classList.add('card');
  card.type = 'button';
  card.dataset.symbol = symbol;
  card.dataset.index = index;
  card.setAttribute('aria-label', 'Hidden memory card');

  const cardFront = document.createElement('span');
  cardFront.classList.add('card-face', 'card-front');
  cardFront.textContent = '?';

  const cardBack = document.createElement('span');
  cardBack.classList.add('card-face', 'card-back');
  cardBack.textContent = symbol;

  card.appendChild(cardFront);
  card.appendChild(cardBack);
  card.addEventListener('click', () => flipCard(card));

  return card;
}

function flipCard(card) {
  if (lockBoard || card === firstCard || card.classList.contains('matched') || card.classList.contains('flipped')) {
    return;
  }

  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }

  card.classList.add('flipped');
  card.setAttribute('aria-label', `Revealed card: ${card.dataset.symbol}`);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;
  updateStats();
  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;

  if (isMatch) {
    handleMatch();
  } else {
    unflipCards();
  }
}

function handleMatch() {
  firstCard.classList.add('matched');
  secondCard.classList.add('matched');
  firstCard.disabled = true;
  secondCard.disabled = true;

  matches += 1;
  statusMessage.textContent = 'Match found!';
  updateStats();
  resetBoard();

  if (matches === currentSymbols.length) {
    endGame();
  }
}

function unflipCards() {
  lockBoard = true;
  statusMessage.textContent = 'Not a match. Try again!';
  firstCard.classList.add('wrong');
  secondCard.classList.add('wrong');

  setTimeout(() => {
    firstCard.classList.remove('flipped', 'wrong');
    secondCard.classList.remove('flipped', 'wrong');
    firstCard.setAttribute('aria-label', 'Hidden memory card');
    secondCard.setAttribute('aria-label', 'Hidden memory card');
    resetBoard();
  }, 850);
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function peekCards() {
  if (lockBoard || matches === currentSymbols.length) {
    return;
  }

  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }

  lockBoard = true;
  peekPenalty += 100;
  updateStats();
  statusMessage.textContent = 'Peek used! Your score was reduced by 100 points.';

  const hiddenCards = [...document.querySelectorAll('.card:not(.matched)')];
  hiddenCards.forEach((card) => card.classList.add('flipped', 'peeked'));

  setTimeout(() => {
    hiddenCards.forEach((card) => {
      if (!card.classList.contains('matched')) {
        card.classList.remove('flipped', 'peeked');
      }
    });
    resetBoard();
  }, 1100);
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed += 1;
    updateStats();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateStats() {
  moveCount.textContent = moves;
  matchCount.textContent = `${matches} / ${currentSymbols.length || difficultySettings[currentDifficulty].pairs}`;
  timer.textContent = formatTime(secondsElapsed);
  scorePreview.textContent = calculateScore();
  bestScore.textContent = getBestScoreText();
}

function calculateScore() {
  const difficulty = difficultySettings[currentDifficulty];
  const baseScore = difficulty.pairs * 250 * difficulty.multiplier;
  const movePenalty = moves * 10;
  const timePenalty = secondsElapsed * 3;
  return Math.max(0, baseScore - movePenalty - timePenalty - peekPenalty);
}

function endGame() {
  stopTimer();

  const finalScore = calculateScore();
  const playerName = getPlayerName();
  const difficulty = difficultySettings[currentDifficulty];

  saveLeaderboardEntry({
    name: playerName,
    score: finalScore,
    moves,
    time: secondsElapsed,
    difficulty: difficulty.label,
    theme: formatThemeName(currentTheme),
    date: new Date().toISOString(),
  });

  renderLeaderboard();
  updateStats();
  statusMessage.textContent = `You won ${difficulty.label} mode with ${finalScore} points!`;
  showWinModal(finalScore, difficulty.label);
}

function getPlayerName() {
  const trimmedName = playerNameInput.value.trim();
  return trimmedName || 'Player';
}

function showWinModal(finalScore, difficultyLabel) {
  winSummary.textContent = `${getPlayerName()}, you cleared ${difficultyLabel} mode in ${moves} moves and ${formatTime(secondsElapsed)} for ${finalScore} points.`;
  winModal.classList.remove('hidden');
}

function closeWinModal() {
  winModal.classList.add('hidden');
}

function saveLeaderboardEntry(entry) {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);

  leaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.time !== b.time) {
      return a.time - b.time;
    }

    return a.moves - b.moves;
  });

  localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard.slice(0, 20)));
}

function getLeaderboard() {
  const storedLeaderboard = localStorage.getItem(leaderboardKey);

  if (!storedLeaderboard) {
    return [];
  }

  try {
    return JSON.parse(storedLeaderboard);
  } catch (error) {
    localStorage.removeItem(leaderboardKey);
    return [];
  }
}

function renderLeaderboard() {
  const filter = leaderboardFilter.value;
  const leaderboard = getLeaderboard().filter((entry) => filter === 'all' || entry.difficulty === filter);

  leaderboardList.innerHTML = '';

  if (leaderboard.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.classList.add('empty-leaderboard');
    emptyItem.textContent = 'No scores yet. Finish a game to add one!';
    leaderboardList.appendChild(emptyItem);
    return;
  }

  leaderboard.slice(0, 10).forEach((entry, index) => {
    const listItem = document.createElement('li');
    listItem.classList.add('leaderboard-entry');
    listItem.innerHTML = `
      <span class="rank">#${index + 1}</span>
      <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
      <span>${entry.difficulty}</span>
      <span>${escapeHtml(entry.theme || 'Mixed')}</span>
      <span>${formatTime(entry.time)}</span>
      <span>${entry.moves} moves</span>
      <strong>${entry.score}</strong>
    `;
    leaderboardList.appendChild(listItem);
  });
}

function clearLeaderboard() {
  const shouldClear = confirm('Clear all locally saved leaderboard scores?');

  if (shouldClear) {
    localStorage.removeItem(leaderboardKey);
    renderLeaderboard();
    updateStats();
  }
}

function getBestScoreText() {
  const difficultyLabel = difficultySettings[currentDifficulty].label;
  const matchingScores = getLeaderboard().filter((entry) => entry.difficulty === difficultyLabel);

  if (matchingScores.length === 0) {
    return '—';
  }

  return Math.max(...matchingScores.map((entry) => entry.score));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatThemeName(theme) {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadSavedPreferences() {
  difficultySelect.value = currentDifficulty;
  themeSelect.value = currentTheme;
  playerNameInput.value = localStorage.getItem(playerNameKey) || '';
}

difficultySelect.addEventListener('change', (event) => {
  currentDifficulty = event.target.value;
  localStorage.setItem(difficultyKey, currentDifficulty);
  initGame();
  renderLeaderboard();
});

themeSelect.addEventListener('change', (event) => {
  currentTheme = event.target.value;
  localStorage.setItem(themeKey, currentTheme);
  initGame();
});

playerNameInput.addEventListener('input', () => {
  localStorage.setItem(playerNameKey, playerNameInput.value.trim());
});

leaderboardFilter.addEventListener('change', renderLeaderboard);
restartButton.addEventListener('click', initGame);
newGameButton.addEventListener('click', initGame);
peekButton.addEventListener('click', peekCards);
playAgainButton.addEventListener('click', initGame);
closeModalButton.addEventListener('click', closeWinModal);
clearLeaderboardButton.addEventListener('click', clearLeaderboard);

loadSavedPreferences();
renderLeaderboard();
initGame();

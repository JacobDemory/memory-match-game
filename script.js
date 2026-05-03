const symbols = ['🍎', '🍌', '🍇', '🍓', '🍍', '🍉', '🍒', '🥝'];
const totalPairs = symbols.length;

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let secondsElapsed = 0;
let timerInterval = null;
let timerStarted = false;

const gameBoard = document.getElementById('game-board');
const moveCount = document.getElementById('move-count');
const matchCount = document.getElementById('match-count');
const timer = document.getElementById('timer');
const statusMessage = document.getElementById('status-message');
const restartButton = document.getElementById('restart-btn');

function initGame() {
  cards = shuffleArray([...symbols, ...symbols]);
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matches = 0;
  secondsElapsed = 0;
  timerStarted = false;

  stopTimer();
  updateStats();
  statusMessage.textContent = 'Click any card to start the timer.';
  gameBoard.innerHTML = '';

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
  if (lockBoard || card === firstCard || card.classList.contains('matched')) {
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

  if (matches === totalPairs) {
    endGame();
  }
}

function unflipCards() {
  lockBoard = true;
  statusMessage.textContent = 'Not a match. Try again!';

  setTimeout(() => {
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');
    firstCard.setAttribute('aria-label', 'Hidden memory card');
    secondCard.setAttribute('aria-label', 'Hidden memory card');
    resetBoard();
  }, 800);
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed += 1;
    timer.textContent = formatTime(secondsElapsed);
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
  matchCount.textContent = `${matches} / ${totalPairs}`;
  timer.textContent = formatTime(secondsElapsed);
}

function endGame() {
  stopTimer();
  statusMessage.textContent = `You won in ${moves} moves and ${formatTime(secondsElapsed)}!`;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function shuffleArray(array) {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

restartButton.addEventListener('click', initGame);
initGame();

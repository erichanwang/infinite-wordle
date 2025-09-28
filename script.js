// Game state
let currentWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let gamesPlayed = 0;
let gamesWon = 0;
let guessesWon = [];
let wonThisGame = false;
let currentStreak = 0;
let maxStreak = 0;

// DOM elements
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageEl = document.getElementById('message');
const attemptsEl = document.getElementById('attempts');
const gamesPlayedEl = document.getElementById('games-played');
const gamesWonEl = document.getElementById('games-won');
const winPercentageEl = document.getElementById('win-percentage');
const avgGuessesEl = document.getElementById('avg-guesses');
const currentStreakEl = document.getElementById('current-streak');
const maxStreakEl = document.getElementById('max-streak');
const toggleBtn = document.getElementById('toggle-btn');
const hintsPanel = document.getElementById('hints-panel');
const remainingCount = document.getElementById('remaining-count');
const knownPositions = document.getElementById('known-positions');
const letterProbs = document.getElementById('letter-probs');
const topGuesses = document.getElementById('top-guesses');
const winModal = document.getElementById('win-modal');
const winWord = document.getElementById('win-word');
const colorChart = document.getElementById('color-chart');

let guessHistory = [];

// Event listeners
toggleBtn.addEventListener('click', toggleHints);

// Initialize game
function initGame() {
    // Select a random word from awords (answers)
    currentWord = awords[Math.floor(Math.random() * awords.length)];
    currentRow = 0;
    currentTile = 0;
    gameOver = false;
    guessHistory = [];

    // Clear the board
    gameBoard.innerHTML = '';

    // Create the game board
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'row';

        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.addEventListener('click', () => focusTile(i, j));
            row.appendChild(tile);
        }

        gameBoard.appendChild(row);
    }

    // Create the keyboard
    createKeyboard();

    // Update attempts
    updateAttempts();

    // Clear message
    messageEl.textContent = '';

    // Focus on first tile
    focusTile(0, 0);

    updateHints();

    // Restore hints panel state
    if (localStorage.getItem('hintsVisible') === 'true') {
        hintsPanel.classList.add('show');
        toggleBtn.textContent = 'Hide';
    } else {
        hintsPanel.classList.remove('show');
        toggleBtn.textContent = 'Hints';
    }
}

function toggleHints() {
    hintsPanel.classList.toggle('show');
    const isVisible = hintsPanel.classList.contains('show');
    toggleBtn.textContent = isVisible ? 'Hide' : 'Hints';
    localStorage.setItem('hintsVisible', isVisible);
}

// Create virtual keyboard
function createKeyboard() {
    keyboard.innerHTML = '';

    const keyboardLayout = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

    keyboardLayout.forEach((row, rowIndex) => {
        const keyboardRow = document.createElement('div');
        keyboardRow.className = 'keyboard-row';

        row.forEach(key => {
            const keyButton = document.createElement('button');
            keyButton.className = `key ${key === 'ENTER' || key === 'BACKSPACE' ? 'wide' : ''}`;
            keyButton.textContent = key;
            keyButton.addEventListener('click', () => handleKeyPress(key));
            keyboardRow.appendChild(keyButton);
        });

        keyboard.appendChild(keyboardRow);
    });
}

// Focus on a specific tile
function focusTile(row, col) {
    if (row === currentRow && col >= 0 && col <= 4) {
        currentTile = col;
        updateTileFocus();
    }
}

// Update tile focus styling
function updateTileFocus() {
    // Remove focus from all tiles
    const allTiles = gameBoard.querySelectorAll('.tile');
    allTiles.forEach(tile => tile.classList.remove('focused'));

    // Add focus to current tile
    if (currentRow < 6) {
        const currentRowElement = gameBoard.children[currentRow];
        if (currentRowElement && currentTile < 5) {
            const currentTileElement = currentRowElement.children[currentTile];
            if (currentTileElement) {
                currentTileElement.classList.add('focused');
            }
        }
    }
}

// Handle key press
function handleKeyPress(key) {
    if (gameOver) return;

    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else {
        addLetter(key);
    }
}

// Add letter to current tile
function addLetter(letter) {
    if (currentTile < 5 && currentRow < 6) {
        const tile = gameBoard.children[currentRow].children[currentTile];
        tile.textContent = letter;
        currentTile++;
        updateTileFocus();
    }
}

// Delete letter from current tile
function deleteLetter() {
    if (currentTile > 0) {
        currentTile--;
        const tile = gameBoard.children[currentRow].children[currentTile];
        tile.textContent = '';
        updateTileFocus();
    }
}

// Submit guess
function submitGuess() {
    // Check if we have a complete word
    const guess = [];
    let isComplete = true;

    for (let i = 0; i < 5; i++) {
        const tile = gameBoard.children[currentRow].children[i];
        const letter = tile.textContent;
        if (!letter) {
            isComplete = false;
            break;
        }
        guess.push(letter);
    }

    if (!isComplete) {
        showMessage('Please complete the word!');
        return;
    }

    const guessWord = guess.join('').toUpperCase();

    if (!words.includes(guessWord.toLowerCase())) {
        showMessage('Not a valid word!');
        return;
    }

    checkGuess(guessWord);
}

// Helper function to compute tile states for a guess against a secret word
function computeStates(guess, secret) {
    const wordArray = secret.split('');
    const guessArray = guess.split('');
    const tileStates = [];

    // First pass: correct
    for (let i = 0; i < 5; i++) {
        if (guessArray[i] === wordArray[i]) {
            tileStates[i] = 'correct';
            wordArray[i] = null;
        }
    }

    // Second pass: present and absent
    for (let i = 0; i < 5; i++) {
        if (tileStates[i] === 'correct') continue;

        const letterIndex = wordArray.indexOf(guessArray[i]);
        if (letterIndex !== -1) {
            tileStates[i] = 'present';
            wordArray[letterIndex] = null;
        } else {
            tileStates[i] = 'absent';
        }
    }

    return tileStates;
}

// Filter possible words based on history
function matchesHistory(candidate, history) {
    for (let entry of history) {
        const computedStates = computeStates(entry.guess, candidate);
        if (computedStates.join('') !== entry.states.join('')) {
            return false;
        }
    }
    return true;
}

// Get best next guess from possible words
function getBestGuess(possible, history) {
    if (possible.length <= 1) return possible[0] || '';

    // Compute letter frequencies in possible words
    const letterFreq = {};
    for (let word of possible) {
        for (let letter of word) {
            letterFreq[letter] = (letterFreq[letter] || 0) + 1;
        }
    }

    let bestScore = -1;
    let bestWord = '';
    for (let word of possible) {
        let score = 0;
        const uniqueLetters = new Set(word);
        for (let letter of uniqueLetters) {
            score += letterFreq[letter] || 0;
        }
        if (score > bestScore) {
            bestScore = score;
            bestWord = word;
        }
    }
    return bestWord;
}

// Update hints panel
function updateHints() {
    let possible = awords.filter(word => matchesHistory(word, guessHistory));
    remainingCount.textContent = `Possible words: ${possible.length}`;

    if (possible.length === 0) {
        topGuesses.innerHTML = '<li>No possible words left!</li>';
        knownPositions.innerHTML = '';
        letterProbs.innerHTML = '';
        return;
    }

    if (possible.length === 1) {
        topGuesses.innerHTML = `<li>The word must be: ${possible[0].toUpperCase()}</li>`;
        knownPositions.innerHTML = '';
        letterProbs.innerHTML = '';
        return;
    }

    // Mini grid for known positions
    knownPositions.innerHTML = '';
    const knownCorrect = new Array(5).fill(null);
    const requiredLetters = new Set();
    const absentLetters = new Set();

    // Collect info from history
    for (let entry of guessHistory) {
        for (let i = 0; i < 5; i++) {
            const state = entry.states[i];
            const letter = entry.guess[i];
            if (state === 'correct') {
                knownCorrect[i] = letter;
            } else if (state === 'present') {
                requiredLetters.add(letter);
            } else if (state === 'absent') {
                absentLetters.add(letter);
            }
        }
    }

    // Build mini grid
    for (let i = 0; i < 5; i++) {
        const miniTile = document.createElement('div');
        miniTile.className = 'mini-tile';
        if (knownCorrect[i]) {
            miniTile.textContent = knownCorrect[i];
            miniTile.classList.add('correct');
        } else if (requiredLetters.size > 0) {
            // Show a representative required letter or empty
            miniTile.textContent = '';
            miniTile.classList.add('required'); // Gray with border or something, but for now empty
        }
        knownPositions.appendChild(miniTile);
    }

    // Letter probabilities
    const letterFreq = {};
    let totalLetters = 0;
    for (let word of possible) {
        for (let letter of word) {
            if (!absentLetters.has(letter)) {
                letterFreq[letter] = (letterFreq[letter] || 0) + 1;
                totalLetters++;
            }
        }
    }

    letterProbs.innerHTML = '';
    Object.entries(letterFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([letter, count]) => {
            const prob = ((count / totalLetters) * 100).toFixed(1);
            const div = document.createElement('div');
            div.className = 'letter-prob';
            div.textContent = `${letter}: ${prob}%`;
            letterProbs.appendChild(div);
        });

    // Top guesses
    const top3 = possible
        .map(word => ({ word, score: calculateScore(word, possible) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    topGuesses.innerHTML = top3.map(({ word }) => `<li>${word.toUpperCase()}</li>`).join('');
}

// Calculate score for a guess (simple: sum of unique letter frequencies)
function calculateScore(word, possible) {
    const letterFreq = {};
    for (let w of possible) {
        for (let letter of w) {
            letterFreq[letter] = (letterFreq[letter] || 0) + 1;
        }
    }
    let score = 0;
    const unique = new Set(word);
    for (let letter of unique) {
        score += letterFreq[letter] || 0;
    }
    return score;
}

// Check guess against current word
function checkGuess(guess) {
    const row = gameBoard.children[currentRow];
    const wordArray = currentWord.split('');
    const guessArray = guess.split('');
    const tileStates = [];

    // First pass: check for correct letters in correct positions
    for (let i = 0; i < 5; i++) {
        const tile = row.children[i];

        if (guessArray[i] === wordArray[i]) {
            tile.classList.add('correct', 'flip');
            tileStates[i] = 'correct';
            wordArray[i] = null; // Mark as used
        }
    }

    // Second pass: check for correct letters in wrong positions
    for (let i = 0; i < 5; i++) {
        if (tileStates[i] === 'correct') continue;

        const tile = row.children[i];
        const letterIndex = wordArray.indexOf(guessArray[i]);

        if (letterIndex !== -1) {
            tile.classList.add('present', 'flip');
            tileStates[i] = 'present';
            wordArray[letterIndex] = null; // Mark as used
        } else {
            tile.classList.add('absent', 'flip');
            tileStates[i] = 'absent';
        }
    }

    // Update keyboard
    updateKeyboard(guessArray, tileStates);

    // Add to history
    guessHistory.push({ guess: guess, states: tileStates });

    currentRow++;
    currentTile = 0;
    updateAttempts();

    // Check win/lose condition
    if (guess === currentWord) {
        showMessage('Congratulations! You won!');
        gamesWon++;
        gamesPlayed++;
        guessesWon.push(currentRow + 1);
        wonThisGame = true;
        gameOver = true;
        currentStreak++;
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }
        showWinModal();
    } else if (currentRow === 6) {
        showMessage(`Game Over! The word was: ${currentWord}`);
        gamesPlayed++;
        gameOver = true;
        currentStreak = 0;

        // Start new game after delay
        setTimeout(() => {
            startNewGame();
        }, 3000);
    } else {
        // Move to next row
        focusTile(currentRow, 0);
        updateHints();
    }
}

// Update keyboard colors
function updateKeyboard(guessArray, tileStates) {
    const keys = keyboard.querySelectorAll('.key');

    guessArray.forEach((letter, index) => {
        const key = Array.from(keys).find(k => k.textContent === letter);
        if (key) {
            const currentState = tileStates[index];
            if (currentState === 'correct' && !key.classList.contains('correct')) {
                key.className = key.className.replace(/\b(?:correct|present|absent)\b/g, '');
                key.classList.add('correct');
            } else if (currentState === 'present' && !key.classList.contains('correct') && !key.classList.contains('present')) {
                key.className = key.className.replace(/\b(?:present|absent)\b/g, '');
                key.classList.add('present');
            } else if (currentState === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present') && !key.classList.contains('absent')) {
                key.className = key.className.replace(/\babsent\b/g, '');
                key.classList.add('absent');
            }
        }
    });
}

// Show message
function showMessage(message) {
    messageEl.textContent = message;
    setTimeout(() => {
        messageEl.textContent = '';
    }, 3000);
}

// Update attempts display
function updateAttempts() {
    attemptsEl.textContent = currentRow;
}

// Start new game
function startNewGame() {
    updateStats();
    initGame();
}

// Update statistics
function updateStats() {
    gamesPlayedEl.textContent = gamesPlayed;
    gamesWonEl.textContent = gamesWon;
    winPercentageEl.textContent = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
    avgGuessesEl.textContent = guessesWon.length > 0 ? (guessesWon.reduce((a, b) => a + b, 0) / guessesWon.length).toFixed(1) : 0;
    currentStreakEl.textContent = currentStreak;
    maxStreakEl.textContent = maxStreak;

    // Save stats to localStorage
    localStorage.setItem('gamesPlayed', gamesPlayed);
    localStorage.setItem('gamesWon', gamesWon);
    localStorage.setItem('guessesWon', JSON.stringify(guessesWon));
    localStorage.setItem('currentStreak', currentStreak);
    localStorage.setItem('maxStreak', maxStreak);
}

function showWinModal() {
    winWord.textContent = `The word was: ${currentWord}`;
    colorChart.innerHTML = '';

    const winGrid = document.createElement('div');
    winGrid.className = 'win-grid';

    for (let i = 0; i < currentRow; i++) {
        const row = gameBoard.children[i].cloneNode(true);
        Array.from(row.children).forEach(tile => {
            tile.textContent = '';
        });
        winGrid.appendChild(row);
    }

    colorChart.appendChild(winGrid);
    winModal.style.display = 'flex';
}

function getColorCount(row, state) {
    let count = 0;
    for (let i = 0; i < 5; i++) {
        if (row.children[i].classList.contains(state)) {
            count++;
        }
    }
    return count;
}

// Handle physical keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) {
        if (wonThisGame) {
            startNewGame();
            wonThisGame = false;
            winModal.style.display = 'none';
            e.preventDefault();
            return;
        }
        return;
    }

    // Allow system commands (Ctrl+R, Ctrl+F5, etc.) to work
    if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
    }

    const key = e.key.toUpperCase();

    if (key === 'ENTER') {
        e.preventDefault();
        submitGuess();
    } else if (key === 'BACKSPACE') {
        e.preventDefault();
        deleteLetter();
    } else if (key.length === 1 && key.match(/[A-Z]/)) {
        e.preventDefault();
        addLetter(key);
    }
});

// Load stats from localStorage
function loadStats() {
    gamesPlayed = parseInt(localStorage.getItem('gamesPlayed')) || 0;
    gamesWon = parseInt(localStorage.getItem('gamesWon')) || 0;
    guessesWon = JSON.parse(localStorage.getItem('guessesWon')) || [];
    currentStreak = parseInt(localStorage.getItem('currentStreak')) || 0;
    maxStreak = parseInt(localStorage.getItem('maxStreak')) || 0;
    updateStats();
}

// Center the main container
function centerMainContainer() {
    const leftStatsWidth = document.querySelector('.left-stats').offsetWidth;
    const mainContainer = document.querySelector('.main-container');
    const windowWidth = window.innerWidth;
    const mainContainerWidth = mainContainer.offsetWidth;
    const marginLeft = (windowWidth - mainContainerWidth + leftStatsWidth) / 2;
    mainContainer.style.marginLeft = `${marginLeft}px`;
}

// Initialize game on load
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    initGame();
    centerMainContainer();
    window.addEventListener('resize', centerMainContainer);
});

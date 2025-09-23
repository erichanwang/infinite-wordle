// Game state
let currentWord = '';
let currentRow = 0;
let currentTile = 0;
let gameOver = false;
let gamesPlayed = 0;
let gamesWon = 0;

// DOM elements
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageEl = document.getElementById('message');
const attemptsEl = document.getElementById('attempts');
const gamesPlayedEl = document.getElementById('games-played');
const gamesWonEl = document.getElementById('games-won');
const winPercentageEl = document.getElementById('win-percentage');

// Initialize game
function initGame() {
    // Select a random word from awords (answers)
    currentWord = awords[Math.floor(Math.random() * awords.length)];
    currentRow = 0;
    currentTile = 0;
    gameOver = false;

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

    currentRow++;
    currentTile = 0;
    updateAttempts();

    // Check win/lose condition
    if (guess === currentWord) {
        showMessage('Congratulations! You won!');
        gamesWon++;
        gamesPlayed++;
        gameOver = true;

        // Start new game after delay
        setTimeout(() => {
            startNewGame();
        }, 2000);
    } else if (currentRow === 6) {
        showMessage(`Game Over! The word was: ${currentWord}`);
        gamesPlayed++;
        gameOver = true;

        // Start new game after delay
        setTimeout(() => {
            startNewGame();
        }, 3000);
    } else {
        // Move to next row
        focusTile(currentRow, 0);
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
}

// Handle physical keyboard input
document.addEventListener('keydown', (e) => {
    if (gameOver) return;

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

// Initialize game on load
document.addEventListener('DOMContentLoaded', initGame);

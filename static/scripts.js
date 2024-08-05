document.addEventListener('DOMContentLoaded', () => {
    const instructionsButton = document.getElementById('instructions-button');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeButton = document.querySelector('.close-button');

    instructionsButton.addEventListener('click', () => {
        instructionsModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === instructionsModal) {
            instructionsModal.style.display = 'none';
        }
    });

    // Save initial state
    saveState();
});

let timer;
let time = 0;
let isPaused = false;
let attempts = 0;
let wins = 0;
let selectedCell = null;
let history = [];
let redoStack = [];

function startTimer() {
    if (timer) {
        clearInterval(timer);
    }
    timer = setInterval(function () {
        if (!isPaused) {
            time++;
            document.getElementById('timer').innerText = formatTime(time);
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function clearDigit() {
    if (selectedCell) {
        saveState(true);
        selectedCell.value = '';
        // eraseSound.play();
    }
}

function saveState(isUserAction = false) {
    const state = Array.from(document.querySelectorAll('#sudoku-grid input')).map(input => input.value);
    history.push([...state]); // Save a copy of the current state
    // if (isUserAction) {
    //     redoStack = []; // Clear redo stack on new user action
    //     console.log('User action: redo stack cleared');
    // }
    console.log('State saved:', state);
    console.log('History:', history);
    console.log('Redo stack:', redoStack);
}

function restoreState(state) {
    const inputs = document.querySelectorAll('#sudoku-grid input');
    state.forEach((value, i) => {
        inputs[i].value = value;
    });
    console.log('State restored:', state);
}

function undo() {
    if (history.length > 1) {
        const lastState = history.pop();
        redoStack.push([...lastState]);
        const previousState = history[history.length - 1];
        restoreState(previousState);
        console.log('Undo performed. History:', history);
        console.log('Redo stack:', redoStack);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        restoreState(nextState);
        history.push([...nextState]); // Save current state after applying redo
        console.log('Redo performed. History:', history);
        console.log('Redo stack:', redoStack);
    }
}

function submitSolution() {
    const solution = [];
    document.querySelectorAll('#sudoku-grid .row').forEach(row => {
        const rowData = [];
        row.querySelectorAll('input').forEach(cell => {
            rowData.push(cell.value ? parseInt(cell.value) : 0);
        });
        solution.push(rowData);
    });

    fetch('/check_solution', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ solution })
    })
    .then(response => response.json())
    .then(data => {
        attempts++;
        if (data.result === 'win') {
            wins++;
            // victorySound.play();
            document.getElementById('victory-modal').style.display = 'block';
        } else {
            // defeatSound.play();
            document.getElementById('correct-solution').innerText = JSON.stringify(data.correct_solution);
            document.getElementById('defeat-modal').style.display = 'block';
        }
        updateStats();
    });
}

function highlightCells(cell) {
    document.querySelectorAll('#sudoku-grid input').forEach(input => {
        input.classList.remove('highlighted');
    });

    const allRows = Array.from(document.querySelectorAll('#sudoku-grid .row'));
    const row = allRows.indexOf(cell.parentElement);
    const col = Array.from(cell.parentElement.children).indexOf(cell);

    if (row === -1 || col === -1) return;

    allRows[row].querySelectorAll('input').forEach(input => {
        input.classList.add('highlighted');
    });

    allRows.forEach(rowElem => {
        rowElem.children[col].classList.add('highlighted');
    });

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
            allRows[r].children[c].classList.add('highlighted');
        }
    }
}

document.querySelectorAll('#sudoku-grid input').forEach(cell => {
    cell.addEventListener('focus', () => {
        selectedCell = cell;
        highlightCells(cell);
    });
    cell.addEventListener('input', (e) => {
        // inputSound.play();
        e.target.value = e.target.value.replace(/[^1-9]/g, '').substr(0, 1); // Restrict to single digit 1-9
        saveState(true); // User action
    });
    cell.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            saveState(true); // User action
            // eraseSound.play();
        }
    });
});

document.querySelectorAll('.digit-button').forEach(button => {
    button.addEventListener('click', () => {
        if (selectedCell) {
            saveState(true); // User action
            selectedCell.value = button.innerText;
            // inputSound.play();
        }
    });
});

document.getElementById('clear-button').addEventListener('click', clearDigit);
document.getElementById('undo-button').addEventListener('click', undo);
document.getElementById('redo-button').addEventListener('click', redo);

document.getElementById('dark-mode-toggle').addEventListener('change', function() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark-mode', this.checked);
});

function startNewGame() {
    window.location.href = '/game';
}

function togglePauseResume() {
    const pauseButton = document.getElementById('pause-resume');
    if (isPaused) {
        isPaused = false;
        pauseButton.innerText = 'Pause';
    } else {
        isPaused = true;
        pauseButton.innerText = 'Resume';
    }
}

function updateStats() {
    document.getElementById('attempts').innerText = `Attempts: ${attempts}`;
    document.getElementById('wins').innerText = `Wins: ${wins}`;
}

window.onload = function() {
    startTimer();
    updateStats();
    if (localStorage.getItem('dark-mode') === 'true') {
        document.getElementById('dark-mode-toggle').checked = true;
        document.body.classList.add('dark-mode');
    }
};

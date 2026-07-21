import { loadDictionaries, ALLOWED_GUESSES, ANSWERS } from './words.js';

const logFeed = document.getElementById('log-feed');
const boardEl = document.getElementById('wordle-board');
const launchBtn = document.getElementById('launch-btn');
const roundsInput = document.getElementById('rounds-input');

let isRunning = false;
let statsChart = null;

const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://wordleagents.onrender.com';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function logMessage(text) {
    if (logFeed) {
        const p = document.createElement('p');
        p.textContent = text;
        logFeed.appendChild(p);
        logFeed.scrollTop = logFeed.scrollHeight;
    }
}

// Build empty 6x5 Wordle grid
function createBoard() {
    boardEl.innerHTML = '';
    for (let r = 0; r < 6; r++) {
        const row = document.createElement('div');
        row.className = 'row';
        for (let c = 0; c < 5; c++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${r}-${c}`;
            row.appendChild(tile);
        }
        boardEl.appendChild(row);
    }
}

// Animate word on the board
function displayGuess(rowIndex, guess, feedback) {
    for (let c = 0; c < 5; c++) {
        const tile = document.getElementById(`tile-${rowIndex}-${c}`);
        if (tile) {
            tile.textContent = guess[c];
            tile.className = `tile ${feedback[c]}`;
        }
    }
}

function evaluateGuess(guess, secret) {
    let result = Array(5).fill('absent');
    let secretChars = secret.split('');
    let guessChars = guess.split('');

    for (let i = 0; i < 5; i++) {
        if (guessChars[i] === secretChars[i]) {
            result[i] = 'correct';
            secretChars[i] = null;
            guessChars[i] = null;
        }
    }

    for (let i = 0; i < 5; i++) {
        if (guessChars[i] !== null && secretChars.includes(guessChars[i])) {
            result[i] = 'present';
            secretChars[secretChars.indexOf(guessChars[i])] = null;
        }
    }

    return result;
}

function filterPossibleWords(words, guess, feedback) {
    return words.filter(word => {
        const testResult = evaluateGuess(guess, word);
        return JSON.stringify(testResult) === JSON.stringify(feedback);
    });
}

// 1. Grab the dropdown element
const agentSelect = document.getElementById('agent-select');

async function fetchAgentGuess(possibleWords) {
    const selectedAgent = agentSelect ? agentSelect.value : 'frequency';

    const response = await fetch('http://localhost:5000/api/get-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            possibleWords: possibleWords,         
            allAllowedGuesses: ALLOWED_GUESSES,   
            agentType: selectedAgent 
        })
    });
    const data = await response.json();
    return data.guess.toLowerCase();
}

// Render or update the Chart.js Bar Chart
function renderChart(dist) {
    const ctx = document.getElementById('stats-chart').getContext('2d');
    
    if (statsChart) statsChart.destroy();

    statsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1 Guess', '2 Guesses', '3 Guesses', '4 Guesses', '5 Guesses', '6 Guesses', 'Failed'],
            datasets: [{
                label: 'Games Won',
                data: [dist[1], dist[2], dist[3], dist[4], dist[5], dist[6], dist.fail],
                backgroundColor: ['#538d4e', '#538d4e', '#538d4e', '#538d4e', '#538d4e', '#538d4e', '#a11414']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// Full multi-round simulation loop
async function runSimulation() {
    if (isRunning) return;
    isRunning = true;

    const totalRounds = parseInt(roundsInput.value) || 1;
    let distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 };

    if (ALLOWED_GUESSES.length === 0) await loadDictionaries();

    logMessage(`Starting multi-round simulation (${totalRounds} games)...`);

    for (let round = 1; round <= totalRounds; round++) {
        createBoard();
        const secretWord = ANSWERS[Math.floor(Math.random() * ANSWERS.length)].toLowerCase();
        let currentPool = [...ALLOWED_GUESSES].map(w => w.toLowerCase());
        let solved = false;

        logMessage(`--- Round ${round}/${totalRounds} (Secret: ${secretWord.toUpperCase()}) ---`);

        for (let attempt = 0; attempt < 6; attempt++) {
            const guess = await fetchAgentGuess(currentPool);
            const feedback = evaluateGuess(guess, secretWord);

            displayGuess(attempt, guess, feedback);
            await sleep(300);

            if (guess === secretWord) {
                logMessage(`🎉 Round ${round} Solved in ${attempt + 1} guesses!`);
                distribution[attempt + 1]++;
                solved = true;
                break;
            }

            currentPool = filterPossibleWords(currentPool, guess, feedback);
        }

        if (!solved) {
            logMessage(`Round ${round} Failed!`);
            distribution.fail++;
        }

        await sleep(500); // Pause between rounds
    }

    logMessage(`Simulation completed! Rendering chart...`);
    renderChart(distribution);
    isRunning = false;
}

window.addEventListener('DOMContentLoaded', () => {
    createBoard();
    if (launchBtn) launchBtn.addEventListener('click', runSimulation);
});
# Wordle AI Arena

A dashboard for watching AI agents play Wordle, and compare guess-distribution stats. The frontend renders an animated board and live log feed while a Flask backend computes each agent's next guess.

## Features

- **Animated Wordle board** — six-row grid that is exact to the NYTimes Wordle.
- **Three solver agents**:
  - **Frequency Guesser** — scores candidate words by letter frequency across the remaining possible answers.
  - **Random Guesser** — picks a random word from the remaining pool.
  - **Entropy Guesser** — an information-theoretic solver that picks the guess maximizing expected entropy (bits of information) over possible feedback patterns, with a fallback opening word (`soare`) for large search spaces.
- **Multi-round simulation** — configure how many games to run back-to-back; each round picks a random secret word and solves it in up to 6 guesses.
- **Live console log** — streams round-by-round progress and results.
- **Guess distribution chart** — a Chart.js bar chart summarizing how many games were solved in 1–6 guesses vs. failed, once the simulation completes.

## Architecture

The frontend (`app.js`) drives the simulation: for each round it asks the backend for a guess, evaluates it locally against the secret word, updates the board/log, and filters the remaining word pool before asking for the next guess.

The backend (`server.py`) is a small Flask API with a single endpoint:

- `POST /api/get-guess` — body: `{ possibleWords, allAllowedGuesses, agentType }`, returns `{ guess }`.

## Prerequisites

- Python 3.9+
- A browser (which you should have)
- Internet (which you also should have)

## Agents in Detail

| Agent | Strategy |
|---|---|
| `frequency` | Sums letter-frequency scores (based on unique letters in the word) across all remaining possible words, picks the highest-scoring candidate. |
| `random` | Picks at random from the remaining possible words. |
| `entropy` | Computes the Shannon entropy of the feedback-pattern distribution each candidate would produce against all remaining possible answers, and picks the candidate that maximizes expected information gain. |

export let ANSWERS = [];
export let ALLOWED_GUESSES = [];

export async function loadDictionaries() {
    try {
        const guessRes = await fetch('https://gist.githubusercontent.com/cfreshman/8b92bc418b43096094cf5d1b0eea8f84/raw/2519c8c22e3274b7a665fe11ab233a96416defc2/nyt-wordle-allowed-guesses-2026-03-06.txt');
        const guessText = await guessRes.text();
        ALLOWED_GUESSES = guessText.split('\n');

        const answerRes = await fetch('https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/c46f451920d5cf6326d550fb2d6abb1642717852/wordle-answers-alphabetical.txt');
        const answerText = await answerRes.text();
        ANSWERS = answerText.split('\n');
    } catch (error) {
        console.error("Failed to load dictionaries:", error);
    }
}
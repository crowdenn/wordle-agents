from functools import lru_cache
import math
import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


class FrequencyAgent:

  def make_guess(self, possible_words, all_allowed=None):
    if not possible_words:
      return "crane"

    freq = {}
    for word in possible_words:
      for char in word:
        freq[char] = freq.get(char, 0) + 1

    best_word = possible_words[0]
    max_score = -1

    for word in possible_words:
      score = sum(freq[char] for char in set(word))
      if score > max_score:
        max_score = score
        best_word = word

    return best_word.lower()


class RandomAgent:

  def make_guess(self, possible_words, all_allowed=None):
    if not possible_words:
      return "crane"
    return random.choice(possible_words).lower()


class EntropyAgent:

  @staticmethod
  @lru_cache(maxsize=None)
  def get_pattern_id(guess, secret):
    # Maps feedback to a unique integer ID (0 to 242)
    secret_chars = list(secret)
    guess_chars = list(guess)
    p = [0] * 5  # 0: absent, 1: present, 2: correct

    for i in range(5):
      if guess_chars[i] == secret_chars[i]:
        p[i] = 2
        secret_chars[i] = None
        guess_chars[i] = None

    for i in range(5):
      if guess_chars[i] is not None and guess_chars[i] in secret_chars:
        p[i] = 1
        secret_chars[secret_chars.index(guess_chars[i])] = None

    # Base-3 encoding to single integer ID
    return p[0] + p[1] * 3 + p[2] * 9 + p[3] * 27 + p[4] * 81

  def make_guess(self, possible_words, all_allowed=None):
    if not possible_words:
      return "soare"
    if len(possible_words) >= 10000:
      return "soare"
    if len(possible_words) <= 2:
      return possible_words[0].lower()

    # Prioritize words in possible_words, then sample from all_allowed
    if all_allowed and len(possible_words) < 30:
      # Look at all possible answers PLUS 1,500 allowed burn words
      candidates = possible_words + all_allowed[:1500]
    else:
      candidates = possible_words

    best_word = possible_words[0]
    max_entropy = -1.0
    total_words = len(possible_words)

    for candidate in candidates:
      # Fast pattern binning with integer keys
      pattern_counts = {}
      for target in possible_words:
        pid = self.get_pattern_id(candidate, target)
        pattern_counts[pid] = pattern_counts.get(pid, 0) + 1

      entropy = 0.0
      for count in pattern_counts.values():
        p = count / total_words
        entropy -= p * math.log2(p)

      if entropy > max_entropy:
        max_entropy = entropy
        best_word = candidate

    return best_word.lower()


agents = {
    "frequency": FrequencyAgent(),
    "random": RandomAgent(),
    "entropy": EntropyAgent(),
}


@app.route("/api/get-guess", methods=["POST"])
def get_guess():
  data = request.json or {}
  possible_words = data.get("possibleWords", [])
  all_allowed = data.get("allAllowedGuesses", possible_words)
  agent_type = data.get("agentType", "frequency")

  selected_agent = agents.get(agent_type, agents["frequency"])

  # Pass both arrays safely to any agent
  chosen_guess = selected_agent.make_guess(possible_words, all_allowed)

  return jsonify({"guess": chosen_guess})


if __name__ == "__main__":
  print("Python Wordle Agent Server running on http://localhost:5000")
  app.run(port=5000)
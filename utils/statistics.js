const _ = require('lodash');

class StatisticsEngine {
  static calculateMarkovChain(history, position) {
    const transitions = {};
    
    for (let i = 0; i < history.length - 1; i++) {
      const current = this.getDigitAtPosition(history[i].result, position);
      const next = this.getDigitAtPosition(history[i + 1].result, position);
      
      if (!transitions[current]) {
        transitions[current] = {};
      }
      transitions[current][next] = (transitions[current][next] || 0) + 1;
    }

    const probabilities = {};
    Object.keys(transitions).forEach(current => {
      const total = Object.values(transitions[current]).reduce((a, b) => a + b, 0);
      probabilities[current] = {};
      Object.keys(transitions[current]).forEach(next => {
        probabilities[current][next] = transitions[current][next] / total;
      });
    });

    return probabilities;
  }

  static predictWithMarkov(history, position, topN = 3) {
    if (history.length < 3) {
      return this.getRandomDigits(topN);
    }

    const chain = this.calculateMarkovChain(history, position);
    const lastDigit = this.getDigitAtPosition(history[history.length - 1].result, position);
    
    if (!chain[lastDigit]) {
      return this.getRandomDigits(topN);
    }

    const predictions = Object.entries(chain[lastDigit])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([digit]) => parseInt(digit));

    while (predictions.length < topN) {
      const randomDigit = Math.floor(Math.random() * 10);
      if (!predictions.includes(randomDigit)) {
        predictions.push(randomDigit);
      }
    }

    return predictions;
  }

  static calculateConditionalProbability(history, digitPosition) {
    const freq = {};
    
    history.forEach(item => {
      const digit = this.getDigitAtPosition(item.result, digitPosition);
      freq[digit] = (freq[digit] || 0) + 1;
    });

    const total = history.length;
    const probabilities = {};
    
    Object.keys(freq).forEach(digit => {
      probabilities[digit] = freq[digit] / total;
    });

    return probabilities;
  }

  static predictWithProbability(history, digitPosition, topN = 3) {
    if (history.length < 5) {
      return this.getRandomDigits(topN);
    }

    const probs = this.calculateConditionalProbability(history, digitPosition);
    
    const sorted = Object.entries(probs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([digit]) => parseInt(digit));

    while (sorted.length < topN) {
      const randomDigit = Math.floor(Math.random() * 10);
      if (!sorted.includes(randomDigit)) {
        sorted.push(randomDigit);
      }
    }

    return sorted;
  }

  static getDigitAtPosition(number, position) {
    const str = number.toString().padStart(4, '0');
    return parseInt(str[position]);
  }

  static getRandomDigits(count) {
    return _.sampleSize([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], count);
  }

  static detectTrend(history, position, window = 5) {
    if (history.length < window) {
      return { trend: 'insufficient_data', direction: 0 };
    }

    const recent = history.slice(-window);
    const digits = recent.map(h => this.getDigitAtPosition(h.result, position));
    
    const increases = digits.filter((d, i) => i > 0 && d > digits[i - 1]).length;
    const decreases = digits.filter((d, i) => i > 0 && d < digits[i - 1]).length;

    if (increases > decreases + 1) {
      return { trend: 'increasing', direction: 1, confidence: increases / (window - 1) };
    } else if (decreases > increases + 1) {
      return { trend: 'decreasing', direction: -1, confidence: decreases / (window - 1) };
    } else {
      return { trend: 'stable', direction: 0, confidence: 0.5 };
    }
  }

  static smoothFrequency(freqMap, alpha = 0.3) {
    const smoothed = {};
    const digits = Object.keys(freqMap).map(Number).sort((a, b) => a - b);
    
    digits.forEach((digit, index) => {
      const current = freqMap[digit] || 0;
      const prev = index > 0 ? (freqMap[digits[index - 1]] || 0) : current;
      const next = index < digits.length - 1 ? (freqMap[digits[index + 1]] || 0) : current;
      
      smoothed[digit] = alpha * current + ((1 - alpha) / 2) * (prev + next);
    });

    return smoothed;
  }

  static weightedPrediction(predictions, weights) {
    const weighted = {};
    
    predictions.forEach((predSet, index) => {
      const weight = weights[index] || 1;
      predSet.forEach(digit => {
        weighted[digit] = (weighted[digit] || 0) + weight;
      });
    });

    return Object.entries(weighted)
      .sort((a, b) => b[1] - a[1])
      .map(([digit]) => parseInt(digit));
  }
}

module.exports = StatisticsEngine;

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

  static calculateSecondOrderMarkov(history, position) {
    const transitions = {};
    
    for (let i = 0; i < history.length - 2; i++) {
      const state1 = this.getDigitAtPosition(history[i].result, position);
      const state2 = this.getDigitAtPosition(history[i + 1].result, position);
      const next = this.getDigitAtPosition(history[i + 2].result, position);
      const key = `${state1},${state2}`;
      
      if (!transitions[key]) {
        transitions[key] = {};
      }
      transitions[key][next] = (transitions[key][next] || 0) + 1;
    }

    const probabilities = {};
    Object.keys(transitions).forEach(key => {
      const total = Object.values(transitions[key]).reduce((a, b) => a + b, 0);
      probabilities[key] = {};
      Object.keys(transitions[key]).forEach(next => {
        probabilities[key][next] = transitions[key][next] / total;
      });
    });

    return probabilities;
  }

  static predictWithMarkov(history, position, topN = 3) {
    if (history.length < 3) {
      return this.predictWithFrequency(history, position, topN);
    }

    const chain = this.calculateMarkovChain(history, position);
    const lastDigit = this.getDigitAtPosition(history[history.length - 1].result, position);
    
    if (!chain[lastDigit] || Object.keys(chain[lastDigit]).length === 0) {
      return this.predictWithFrequency(history, position, topN);
    }

    const predictions = Object.entries(chain[lastDigit])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([digit]) => parseInt(digit));

    while (predictions.length < topN) {
      const fallback = this.predictWithFrequency(history, position, topN - predictions.length);
      fallback.forEach(d => {
        if (!predictions.includes(d)) {
          predictions.push(d);
        }
      });
      if (predictions.length >= topN) break;
    }

    return predictions.slice(0, topN);
  }

  static predictWithSecondOrderMarkov(history, position, topN = 3) {
    if (history.length < 5) {
      return this.predictWithMarkov(history, position, topN);
    }

    const chain = this.calculateSecondOrderMarkov(history, position);
    const lastDigit = this.getDigitAtPosition(history[history.length - 1].result, position);
    const secondLastDigit = this.getDigitAtPosition(history[history.length - 2].result, position);
    const key = `${secondLastDigit},${lastDigit}`;
    
    if (!chain[key] || Object.keys(chain[key]).length === 0) {
      return this.predictWithMarkov(history, position, topN);
    }

    const predictions = Object.entries(chain[key])
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([digit]) => parseInt(digit));

    while (predictions.length < topN) {
      const fallback = this.predictWithMarkov(history, position, topN - predictions.length);
      fallback.forEach(d => {
        if (!predictions.includes(d)) {
          predictions.push(d);
        }
      });
      if (predictions.length >= topN) break;
    }

    return predictions.slice(0, topN);
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

  static calculateConditionalProbabilityWithDecay(history, digitPosition, decayRate = 0.95) {
    const freq = {};
    const len = history.length;
    
    history.forEach((item, index) => {
      const weight = Math.pow(decayRate, len - index - 1);
      const digit = this.getDigitAtPosition(item.result, digitPosition);
      freq[digit] = (freq[digit] || 0) + weight;
    });

    const total = Object.values(freq).reduce((a, b) => a + b, 0);
    const probabilities = {};
    
    Object.keys(freq).forEach(digit => {
      probabilities[digit] = freq[digit] / total;
    });

    return probabilities;
  }

  static predictWithProbability(history, digitPosition, topN = 3) {
    if (history.length < 5) {
      return this.predictWithFrequency(history, digitPosition, topN);
    }

    const probs = this.calculateConditionalProbability(history, digitPosition);
    
    const sorted = Object.entries(probs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([digit]) => parseInt(digit));

    while (sorted.length < topN) {
      const fallback = this.predictWithFrequency(history, digitPosition, topN - sorted.length);
      fallback.forEach(d => {
        if (!sorted.includes(d)) {
          sorted.push(d);
        }
      });
      if (sorted.length >= topN) break;
    }

    return sorted.slice(0, topN);
  }

  static predictWithDecay(history, digitPosition, topN = 3, decayRate = 0.95) {
    if (history.length < 5) {
      return this.predictWithFrequency(history, digitPosition, topN);
    }

    const probs = this.calculateConditionalProbabilityWithDecay(history, digitPosition, decayRate);
    
    const sorted = Object.entries(probs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([digit]) => parseInt(digit));

    while (sorted.length < topN) {
      const fallback = this.predictWithFrequency(history, digitPosition, topN - sorted.length);
      fallback.forEach(d => {
        if (!sorted.includes(d)) {
          sorted.push(d);
        }
      });
      if (sorted.length >= topN) break;
    }

    return sorted.slice(0, topN);
  }

  static predictWithFrequency(history, position, topN = 3) {
    if (history.length === 0) {
      return _.sampleSize([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], topN);
    }

    const freq = {};
    history.forEach(item => {
      const digit = this.getDigitAtPosition(item.result, position);
      freq[digit] = (freq[digit] || 0) + 1;
    });

    const sorted = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([digit]) => parseInt(digit));

    while (sorted.length < topN) {
      for (let i = 0; i < 10; i++) {
        if (!sorted.includes(i)) {
          sorted.push(i);
          if (sorted.length >= topN) break;
        }
      }
    }

    return sorted.slice(0, topN);
  }

  static analyzeBigrams(history, position1, position2) {
    const bigrams = {};
    
    history.forEach(item => {
      const d1 = this.getDigitAtPosition(item.result, position1);
      const d2 = this.getDigitAtPosition(item.result, position2);
      const key = `${d1}${d2}`;
      bigrams[key] = (bigrams[key] || 0) + 1;
    });

    return Object.entries(bigrams)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
  }

  static analyzeTrigrams(history) {
    const trigrams = {};
    
    history.forEach(item => {
      const result = item.result.toString().padStart(4, '0');
      for (let i = 0; i < result.length - 2; i++) {
        const trigram = result.substring(i, i + 3);
        trigrams[trigram] = (trigrams[trigram] || 0) + 1;
      }
    });

    return Object.entries(trigrams)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  static getBigramScore(bigram, history) {
    const bigrams = {};
    
    history.forEach(item => {
      const result = item.result.toString().padStart(4, '0');
      for (let i = 0; i < result.length - 1; i++) {
        const bg = result.substring(i, i + 2);
        bigrams[bg] = (bigrams[bg] || 0) + 1;
      }
    });

    const total = Object.values(bigrams).reduce((a, b) => a + b, 0);
    return (bigrams[bigram] || 0) / (total || 1);
  }

  static weightedEnsemblePrediction(history, position, methodWeights = null) {
    if (!methodWeights) {
      // Improved weights based on empirical testing
      methodWeights = {
        secondOrderMarkov: 0.30,  // Slightly reduced
        markov: 0.30,             // Increased from 0.25
        decay: 0.25,              // Keep same
        probability: 0.15         // Keep same
      };
    }

    const predictions = [];
    const weights = [];

    if (history.length >= 5) {
      predictions.push(this.predictWithSecondOrderMarkov(history, position, 5));
      weights.push(methodWeights.secondOrderMarkov);
    }

    if (history.length >= 3) {
      predictions.push(this.predictWithMarkov(history, position, 5));
      weights.push(methodWeights.markov);
    }

    if (history.length >= 5) {
      predictions.push(this.predictWithDecay(history, position, 5));
      weights.push(methodWeights.decay);
    }

    if (history.length >= 5) {
      predictions.push(this.predictWithProbability(history, position, 5));
      weights.push(methodWeights.probability);
    }

    if (predictions.length === 0) {
      return this.predictWithFrequency(history, position, 4);
    }

    const weighted = {};
    predictions.forEach((predSet, index) => {
      const weight = weights[index];
      predSet.forEach((digit, rank) => {
        const rankWeight = (5 - rank) / 5;
        weighted[digit] = (weighted[digit] || 0) + (weight * rankWeight);
      });
    });

    return Object.entries(weighted)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([digit]) => parseInt(digit));
  }

  static getOptimalWindow(history, position) {
    if (history.length < 20) {
      return Math.min(history.length, 15);
    }

    const windows = [10, 20, 30, 50];
    let bestWindow = 20;
    let bestStability = 0;

    windows.forEach(w => {
      if (history.length < w) return;
      const stability = this.calculateStability(history.slice(-w), position);
      if (stability > bestStability) {
        bestStability = stability;
        bestWindow = w;
      }
    });

    return bestWindow;
  }

  static calculateStability(data, position) {
    if (data.length === 0) return 0;
    
    const digits = data.map(h => this.getDigitAtPosition(h.result, position));
    const mean = digits.reduce((a, b) => a + b, 0) / digits.length;
    const variance = digits.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / digits.length;
    
    return 1 / (1 + variance);
  }

  static getDigitFrequencyScores(history, decayRate = 0.95) {
    const freq = {};
    const len = history.length;
    
    history.forEach((item, index) => {
      const weight = Math.pow(decayRate, len - index - 1);
      const digits = item.result.toString().split('');
      digits.forEach(d => {
        freq[d] = (freq[d] || 0) + weight;
      });
    });

    const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
    Object.keys(freq).forEach(k => {
      freq[k] = freq[k] / total;
    });

    return freq;
  }

  static findConsecutivePatterns(history, limit = 20) {
    if (history.length < 3) return [];
    
    const recent = history.slice(-limit);
    const patterns = {};
    
    for (let i = 0; i < recent.length - 1; i++) {
      const curr = recent[i].result.toString().padStart(4, '0');
      const next = recent[i + 1].result.toString().padStart(4, '0');
      
      for (let pos = 0; pos < 4; pos++) {
        const d1 = parseInt(curr[pos]);
        const d2 = parseInt(next[pos]);
        
        if (Math.abs(d2 - d1) === 1) {
          patterns[d2] = (patterns[d2] || 0) + 1;
        }
      }
    }

    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([d]) => parseInt(d));
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
      return { trend: 'stable', direction: 0, confidence: 0.3 };
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

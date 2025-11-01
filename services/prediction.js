const _ = require('lodash');
const PatternAnalyzer = require('../utils/pattern');
const TogelFormulas = require('../utils/formulas');
const StatisticsEngine = require('../utils/statistics');

class PredictionEngine {
  static generateCompletePrediction(history, pasaran) {
    const hasEnoughData = history.length >= 5;
    
    if (!hasEnoughData) {
      return this.generateRandomPrediction();
    }

    const pattern = PatternAnalyzer.analyzePattern(history);
    const hotCold = PatternAnalyzer.hotColdWithDecay(history);
    const ganjilGenap = PatternAnalyzer.analyzeGanjilGenap(history);
    const besarKecil = PatternAnalyzer.analyzeBesarKecil(history);
    const allPositionPatterns = PatternAnalyzer.analyzeAllPositionPatterns(history);

    const lastResult = history[history.length - 1]?.result || '1234';

    const as = StatisticsEngine.weightedEnsemblePrediction(history, 0);
    const kop = StatisticsEngine.weightedEnsemblePrediction(history, 1);
    const kepala = StatisticsEngine.weightedEnsemblePrediction(history, 2);
    const ekor = StatisticsEngine.weightedEnsemblePrediction(history, 3);

    const ai = this.generateAIWithScoring(hotCold, lastResult, history);
    const bbfs = this.generateIntelligentBBFS(as, kop, kepala, ekor, history);
    const combinations4D = this.generateRanked4DCombinations(as, kop, kepala, ekor, history);

    const topFormulas = this.getAdaptiveFormulas(pasaran, history);
    const formulas = {};
    topFormulas.forEach(f => {
      formulas[f] = TogelFormulas.applyFormula(lastResult, f);
    });

    const trends = {
      as: StatisticsEngine.detectTrend(history, 0),
      kop: StatisticsEngine.detectTrend(history, 1),
      kepala: StatisticsEngine.detectTrend(history, 2),
      ekor: StatisticsEngine.detectTrend(history, 3)
    };

    const bigrams = StatisticsEngine.analyzeBigrams(history, 2, 3);
    const trigrams = StatisticsEngine.analyzeTrigrams(history);

    return {
      ai,
      kepala,
      ekor,
      as,
      kop,
      bbfs,
      combinations4D,
      formulas,
      hotCold,
      pattern: {
        ganjilGenap,
        besarKecil,
        allPositions: allPositionPatterns
      },
      trends,
      bigrams: bigrams.slice(0, 5),
      trigrams: trigrams.slice(0, 3),
      lastResult,
      dataCount: history.length,
      confidence: this.calculateConfidence(history.length)
    };
  }

  static generateRandomPrediction() {
    const randomDigits = _.sampleSize([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7);
    return {
      ai: randomDigits.slice(0, 5).sort((a, b) => a - b),
      kepala: randomDigits.slice(0, 4).sort((a, b) => a - b),
      ekor: randomDigits.slice(1, 5).sort((a, b) => a - b),
      as: randomDigits.slice(0, 3).sort((a, b) => a - b),
      kop: randomDigits.slice(2, 5).sort((a, b) => a - b),
      bbfs: randomDigits.sort((a, b) => a - b).join(''),
      combinations4D: this.generateRandom4D(10),
      formulas: {},
      hotCold: { hot: [], cold: [], frequency: {} },
      pattern: { ganjilGenap: { ganjil: 0, genap: 0 }, besarKecil: { besar: 0, kecil: 0 } },
      trends: {},
      lastResult: 0,
      dataCount: 0,
      confidence: 'low'
    };
  }

  static generateAI(hotCold, lastResult, history) {
    const pool = new Set();
    
    hotCold.hot.forEach(h => pool.add(parseInt(h)));
    
    const lastDigits = lastResult.toString().split('').map(Number);
    lastDigits.forEach(d => pool.add(d));

    if (history.length >= 3) {
      for (let pos = 0; pos < 4; pos++) {
        const markov = StatisticsEngine.predictWithMarkov(history, pos, 2);
        markov.forEach(d => pool.add(d));
      }
    }

    const aiArray = Array.from(pool);
    return _.sampleSize(aiArray, Math.min(5, aiArray.length)).sort((a, b) => a - b);
  }

  static generateAIWithScoring(hotCold, lastResult, history) {
    const scores = {};
    
    for (let i = 0; i < 10; i++) {
      scores[i] = 0;
    }

    Object.entries(hotCold.frequency).forEach(([digit, freq]) => {
      scores[digit] = (scores[digit] || 0) + (freq * 0.35);
    });

    for (let pos = 0; pos < 4; pos++) {
      const ensemble = StatisticsEngine.weightedEnsemblePrediction(history, pos);
      ensemble.forEach((d, idx) => {
        const rankWeight = (4 - idx) / 10;
        scores[d] = (scores[d] || 0) + (rankWeight * 0.40);
      });
    }

    const consecutive = StatisticsEngine.findConsecutivePatterns(history);
    consecutive.forEach(d => {
      scores[d] = (scores[d] || 0) + 0.15;
    });

    const lastDigits = lastResult.toString().split('').map(Number);
    lastDigits.forEach(d => {
      scores[d] = (scores[d] || 0) + 0.10;
    });

    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([digit]) => parseInt(digit));
  }

  static generateBBFS(as, kop, kepala, ekor, hotNumbers) {
    const pool = new Set();
    
    as.forEach(d => pool.add(d));
    kop.forEach(d => pool.add(d));
    kepala.forEach(d => pool.add(d));
    ekor.forEach(d => pool.add(d));
    
    hotNumbers.slice(0, 3).forEach(h => pool.add(parseInt(h)));

    while (pool.size < 7) {
      pool.add(Math.floor(Math.random() * 10));
    }

    return Array.from(pool).slice(0, 7).sort((a, b) => a - b).join('');
  }

  static generateIntelligentBBFS(as, kop, kepala, ekor, history) {
    const pool = new Set();
    
    as.forEach(d => pool.add(d));
    kop.forEach(d => pool.add(d));
    kepala.forEach(d => pool.add(d));
    ekor.forEach(d => pool.add(d));

    if (pool.size < 7) {
      const freqScores = StatisticsEngine.getDigitFrequencyScores(history);
      const sorted = Object.entries(freqScores)
        .sort((a, b) => b[1] - a[1])
        .map(([d]) => parseInt(d));
      
      for (let digit of sorted) {
        pool.add(digit);
        if (pool.size >= 7) break;
      }
    }

    return Array.from(pool).slice(0, 7).sort((a, b) => a - b).join('');
  }

  static generate4DCombinations(as, kop, kepala, ekor) {
    const combinations = [];
    
    for (let a of as) {
      for (let k of kop) {
        for (let kp of kepala.slice(0, 2)) {
          for (let e of ekor.slice(0, 2)) {
            combinations.push(`${a}${k}${kp}${e}`);
          }
        }
      }
    }

    return combinations.slice(0, 10);
  }

  static generateRanked4DCombinations(as, kop, kepala, ekor, history) {
    const combinations = [];

    for (let a of as) {
      for (let k of kop) {
        for (let kp of kepala) {
          for (let e of ekor) {
            const combo = `${a}${k}${kp}${e}`;
            const score = this.score4DCombination(combo, history);
            combinations.push({ combo, score });
          }
        }
      }
    }

    return combinations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(c => c.combo);
  }

  static score4DCombination(combo, history) {
    let score = 0;
    const digits = combo.split('').map(Number);

    const freqScores = StatisticsEngine.getDigitFrequencyScores(history);
    digits.forEach(d => {
      score += freqScores[d] || 0;
    });

    for (let i = 0; i < 3; i++) {
      const bigram = combo.substring(i, i + 2);
      score += StatisticsEngine.getBigramScore(bigram, history) * 2;
    }

    const ganjil = digits.filter(d => d % 2 === 1).length;
    if (ganjil >= 2 && ganjil <= 3) {
      score += 0.15;
    }

    const besar = digits.filter(d => d >= 5).length;
    if (besar >= 2 && besar <= 3) {
      score += 0.10;
    }

    return score;
  }

  static generateRandom4D(count) {
    const combinations = [];
    for (let i = 0; i < count; i++) {
      const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      combinations.push(num);
    }
    return combinations;
  }

  static getTopFormulas() {
    return ['Mistik', 'ML', 'IX', 'M1', 'M3', 'M5', 'M7', 'TY'];
  }

  static getAdaptiveFormulas(pasaran, history) {
    if (history.length < 10) {
      return this.getTopFormulas().slice(0, 5);
    }

    const allFormulas = ['Mistik', 'ML', 'IX', 'M1', 'M3', 'M5', 'M7', 'M8', 'M9', 'TY'];
    const formulaScores = {};

    allFormulas.forEach(formula => {
      formulaScores[formula] = this.evaluateFormulaAccuracy(history, formula);
    });

    return Object.entries(formulaScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([formula]) => formula);
  }

  static evaluateFormulaAccuracy(history, formula) {
    if (history.length < 5) return 0;

    let hits = 0;
    const testSize = Math.min(10, history.length - 1);

    for (let i = history.length - testSize; i < history.length; i++) {
      if (i === 0) continue;

      const prevResult = history[i - 1].result;
      const actualResult = history[i].result.toString().padStart(4, '0');
      const actualDigits = actualResult.split('').map(Number);

      const transformed = TogelFormulas.applyFormula(prevResult, formula);
      const transformedDigits = transformed.toString().padStart(4, '0').split('').map(Number);

      const hasMatch = transformedDigits.some(td => actualDigits.includes(td));
      if (hasMatch) hits++;
    }

    return hits / testSize;
  }

  static calculateConfidence(dataCount) {
    if (dataCount < 5) return 'very_low';
    if (dataCount < 10) return 'low';
    if (dataCount < 20) return 'medium';
    if (dataCount < 50) return 'high';
    return 'very_high';
  }

  static generateWithFormula(history, formulaType, modifier = 0) {
    if (history.length === 0) {
      return this.generateRandomPrediction();
    }

    const lastResult = history[history.length - 1].result.toString().padStart(4, '0');
    const ai = TogelFormulas.generateAIWithFormula(lastResult, formulaType, modifier);
    
    return {
      ai,
      formula: formulaType,
      modifier,
      baseNumber: lastResult
    };
  }
}

module.exports = PredictionEngine;

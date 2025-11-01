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
    const hotCold = PatternAnalyzer.hotColdNumbers(history);
    const ganjilGenap = PatternAnalyzer.analyzeGanjilGenap(history);
    const besarKecil = PatternAnalyzer.analyzeBesarKecil(history);

    const lastResult = history[history.length - 1]?.result || '1234';

    const asMarkov = StatisticsEngine.predictWithMarkov(history, 0, 3);
    const asProb = StatisticsEngine.predictWithProbability(history, 0, 3);
    const as = [...new Set([...asMarkov, ...asProb])].slice(0, 3);

    const kopMarkov = StatisticsEngine.predictWithMarkov(history, 1, 3);
    const kopProb = StatisticsEngine.predictWithProbability(history, 1, 3);
    const kop = [...new Set([...kopMarkov, ...kopProb])].slice(0, 3);

    const kepalaMarkov = StatisticsEngine.predictWithMarkov(history, 2, 4);
    const kepalaProb = StatisticsEngine.predictWithProbability(history, 2, 4);
    const kepala = [...new Set([...kepalaMarkov, ...kepalaProb])].slice(0, 4);

    const ekorMarkov = StatisticsEngine.predictWithMarkov(history, 3, 4);
    const ekorProb = StatisticsEngine.predictWithProbability(history, 3, 4);
    const ekor = [...new Set([...ekorMarkov, ...ekorProb])].slice(0, 4);

    const ai = this.generateAI(hotCold, lastResult, history);
    const bbfs = this.generateBBFS(as, kop, kepala, ekor, hotCold.hot);
    const combinations4D = this.generate4DCombinations(as, kop, kepala, ekor);

    const topFormulas = this.getTopFormulas();
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
        besarKecil
      },
      trends,
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

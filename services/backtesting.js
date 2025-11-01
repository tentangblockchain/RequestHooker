const PredictionEngine = require('./prediction');
const storage = require('./storage');

class BacktestingService {
  static runBacktest(pasaran, testSize = 10) {
    const history = storage.getHistory(pasaran);
    
    if (history.length < testSize + 5) {
      return {
        success: false,
        message: `Tidak cukup data. Butuh minimal ${testSize + 5}, ada ${history.length}`
      };
    }

    const results = {
      pasaran,
      totalTests: testSize,
      hits: {
        ai: 0,
        ai_partial: 0,
        kepala: 0,
        ekor: 0,
        as: 0,
        kop: 0,
        bbfs: 0,
        bbfs_partial: 0,
        combinations4D: 0
      },
      accuracy: {},
      details: []
    };

    for (let i = history.length - testSize; i < history.length; i++) {
      const trainingData = history.slice(0, i);
      const actualResult = history[i].result.toString().padStart(4, '0');
      
      const prediction = PredictionEngine.generateCompletePrediction(trainingData, pasaran);
      
      const actualDigits = actualResult.split('').map(Number);
      const actualAS = actualDigits[0];
      const actualKOP = actualDigits[1];
      const actualKepala = actualDigits[2];
      const actualEkor = actualDigits[3];

      const aiHit = actualDigits.every(d => prediction.ai.includes(d));
      const aiPartialHit = actualDigits.some(d => prediction.ai.includes(d));
      
      const kepalaHit = prediction.kepala.includes(actualKepala);
      const ekorHit = prediction.ekor.includes(actualEkor);
      const asHit = prediction.as.includes(actualAS);
      const kopHit = prediction.kop.includes(actualKOP);
      
      const bbfsDigits = prediction.bbfs.split('').map(Number);
      const bbfsHit = actualDigits.every(d => bbfsDigits.includes(d));
      const bbfsPartialHit = actualDigits.filter(d => bbfsDigits.includes(d)).length >= 3;
      
      const combo4DHit = prediction.combinations4D.includes(actualResult);

      if (aiHit) results.hits.ai++;
      if (aiPartialHit) results.hits.ai_partial++;
      if (kepalaHit) results.hits.kepala++;
      if (ekorHit) results.hits.ekor++;
      if (asHit) results.hits.as++;
      if (kopHit) results.hits.kop++;
      if (bbfsHit) results.hits.bbfs++;
      if (bbfsPartialHit) results.hits.bbfs_partial++;
      if (combo4DHit) results.hits.combinations4D++;

      results.details.push({
        actual: actualResult,
        prediction: {
          ai: prediction.ai,
          kepala: prediction.kepala,
          ekor: prediction.ekor,
          as: prediction.as,
          kop: prediction.kop,
          combinations4D: prediction.combinations4D.slice(0, 5)
        },
        hits: { aiHit, kepalaHit, ekorHit, asHit, kopHit, bbfsHit, combo4DHit }
      });
    }

    results.accuracy = {
      ai: ((results.hits.ai / testSize) * 100).toFixed(2) + '%',
      ai_partial: ((results.hits.ai_partial / testSize) * 100).toFixed(2) + '%',
      kepala: ((results.hits.kepala / testSize) * 100).toFixed(2) + '%',
      ekor: ((results.hits.ekor / testSize) * 100).toFixed(2) + '%',
      as: ((results.hits.as / testSize) * 100).toFixed(2) + '%',
      kop: ((results.hits.kop / testSize) * 100).toFixed(2) + '%',
      bbfs: ((results.hits.bbfs / testSize) * 100).toFixed(2) + '%',
      bbfs_partial: ((results.hits.bbfs_partial / testSize) * 100).toFixed(2) + '%',
      combinations4D: ((results.hits.combinations4D / testSize) * 100).toFixed(2) + '%'
    };

    return {
      success: true,
      results
    };
  }

  static runRollingBacktest(pasaran, testSize = 10, windowSize = 50) {
    const history = storage.getHistory(pasaran);
    
    if (history.length < testSize + Math.min(windowSize, 20)) {
      return {
        success: false,
        message: `Tidak cukup data untuk rolling backtest. Butuh minimal ${testSize + 20}, ada ${history.length}`
      };
    }

    const results = {
      pasaran,
      totalTests: testSize,
      windowSize,
      hits: {
        ai: 0,
        kepala: 0,
        ekor: 0,
        as: 0,
        kop: 0,
        bbfs: 0,
        combinations4D: 0
      },
      accuracy: {},
      details: []
    };

    for (let i = history.length - testSize; i < history.length; i++) {
      const trainingStart = Math.max(0, i - windowSize);
      const trainingData = history.slice(trainingStart, i);
      const actualResult = history[i].result.toString().padStart(4, '0');
      
      if (trainingData.length < 5) continue;
      
      const prediction = PredictionEngine.generateCompletePrediction(trainingData, pasaran);
      
      const actualDigits = actualResult.split('').map(Number);
      const actualAS = actualDigits[0];
      const actualKOP = actualDigits[1];
      const actualKepala = actualDigits[2];
      const actualEkor = actualDigits[3];

      const aiHit = actualDigits.every(d => prediction.ai.includes(d));
      const kepalaHit = prediction.kepala.includes(actualKepala);
      const ekorHit = prediction.ekor.includes(actualEkor);
      const asHit = prediction.as.includes(actualAS);
      const kopHit = prediction.kop.includes(actualKOP);
      
      const bbfsDigits = prediction.bbfs.split('').map(Number);
      const bbfsHit = actualDigits.every(d => bbfsDigits.includes(d));
      
      const combo4DHit = prediction.combinations4D.includes(actualResult);

      if (aiHit) results.hits.ai++;
      if (kepalaHit) results.hits.kepala++;
      if (ekorHit) results.hits.ekor++;
      if (asHit) results.hits.as++;
      if (kopHit) results.hits.kop++;
      if (bbfsHit) results.hits.bbfs++;
      if (combo4DHit) results.hits.combinations4D++;

      results.details.push({
        actual: actualResult,
        trainingSize: trainingData.length,
        prediction: {
          ai: prediction.ai,
          kepala: prediction.kepala,
          ekor: prediction.ekor,
          combinations4D: prediction.combinations4D.slice(0, 5)
        },
        hits: { aiHit, kepalaHit, ekorHit, asHit, kopHit, bbfsHit, combo4DHit }
      });
    }

    const actualTests = results.details.length;
    results.totalTests = actualTests;

    results.accuracy = {
      ai: ((results.hits.ai / actualTests) * 100).toFixed(2) + '%',
      kepala: ((results.hits.kepala / actualTests) * 100).toFixed(2) + '%',
      ekor: ((results.hits.ekor / actualTests) * 100).toFixed(2) + '%',
      as: ((results.hits.as / actualTests) * 100).toFixed(2) + '%',
      kop: ((results.hits.kop / actualTests) * 100).toFixed(2) + '%',
      bbfs: ((results.hits.bbfs / actualTests) * 100).toFixed(2) + '%',
      combinations4D: ((results.hits.combinations4D / actualTests) * 100).toFixed(2) + '%'
    };

    return {
      success: true,
      results
    };
  }

  static getFormulaEffectiveness(pasaran, limit = 20) {
    const history = storage.getHistory(pasaran);
    
    if (history.length < limit) {
      return null;
    }

    const formulaTypes = ['Mistik', 'ML', 'IX', 'MB', 'MC', 'M1', 'M3', 'M5', 'M7', 'M8', 'M9', 'TY'];
    const effectiveness = {};

    formulaTypes.forEach(formula => {
      effectiveness[formula] = { hits: 0, total: 0 };
    });

    for (let i = history.length - limit; i < history.length; i++) {
      if (i === 0) continue;
      
      const prevResult = history[i - 1].result;
      const actualResult = history[i].result.toString().padStart(4, '0');
      const actualDigits = actualResult.split('').map(Number);

      const TogelFormulas = require('../utils/formulas');
      const allFormulas = TogelFormulas.applyAllFormulas(prevResult);

      formulaTypes.forEach(formula => {
        const transformed = allFormulas[formula];
        const transformedDigits = transformed.toString().padStart(4, '0').split('').map(Number);
        
        const hasMatch = transformedDigits.some(td => actualDigits.includes(td));
        
        effectiveness[formula].total++;
        if (hasMatch) {
          effectiveness[formula].hits++;
        }
      });
    }

    Object.keys(effectiveness).forEach(formula => {
      const data = effectiveness[formula];
      effectiveness[formula].accuracy = ((data.hits / data.total) * 100).toFixed(2) + '%';
      effectiveness[formula].score = (data.hits / data.total);
    });

    const sorted = Object.entries(effectiveness)
      .sort((a, b) => b[1].score - a[1].score)
      .map(([formula, data]) => ({ formula, ...data }));

    return sorted;
  }
}

module.exports = BacktestingService;

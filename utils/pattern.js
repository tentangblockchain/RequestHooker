const config = require('../config/config');

class PatternAnalyzer {
  static analyzePattern(history, limit = config.app.patternLimit) {
    const recent = history.slice(-limit);
    const kepalaFreq = {};
    const ekorFreq = {};
    const asFreq = {};
    const kopFreq = {};
    
    recent.forEach(item => {
      if (item.result) {
        const result = item.result.toString().padStart(4, '0');
        const as = parseInt(result[0]);
        const kop = parseInt(result[1]);
        const kepala = parseInt(result[2]);
        const ekor = parseInt(result[3]);
        
        asFreq[as] = (asFreq[as] || 0) + 1;
        kopFreq[kop] = (kopFreq[kop] || 0) + 1;
        kepalaFreq[kepala] = (kepalaFreq[kepala] || 0) + 1;
        ekorFreq[ekor] = (ekorFreq[ekor] || 0) + 1;
      }
    });

    return { kepalaFreq, ekorFreq, asFreq, kopFreq };
  }

  static hotColdNumbers(history, limit = config.app.hotColdLimit) {
    const recent = history.slice(-limit);
    const digitFreq = {};
    
    recent.forEach(item => {
      if (item.result) {
        const digits = item.result.toString().split('');
        digits.forEach(d => {
          digitFreq[d] = (digitFreq[d] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(digitFreq).sort((a, b) => b[1] - a[1]);
    
    const hot = sorted.slice(0, 5).map(x => x[0]);
    const cold = sorted.slice(-5).reverse().map(x => x[0]);
    
    for (let i = 0; i < 10; i++) {
      if (!digitFreq.hasOwnProperty(i.toString())) {
        cold.push(i.toString());
      }
    }

    return {
      hot: [...new Set(hot)].slice(0, 5),
      cold: [...new Set(cold)].slice(0, 5),
      frequency: digitFreq
    };
  }

  static getTopDigits(freqMap, count = 5) {
    const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, count).map(x => ({ digit: x[0], count: x[1] }));
  }

  static analyzeGanjilGenap(history, limit = 10) {
    const recent = history.slice(-limit);
    let ganjil = 0;
    let genap = 0;

    recent.forEach(item => {
      if (item.result) {
        const resultStr = item.result.toString().padStart(4, '0');
        const ekor = parseInt(resultStr[3]);
        if (ekor % 2 === 0) {
          genap++;
        } else {
          ganjil++;
        }
      }
    });

    return { ganjil, genap };
  }

  static analyzeBesarKecil(history, limit = 10) {
    const recent = history.slice(-limit);
    let besar = 0;
    let kecil = 0;

    recent.forEach(item => {
      if (item.result) {
        const resultStr = item.result.toString().padStart(4, '0');
        const ekor = parseInt(resultStr[3]);
        if (ekor >= 5) {
          besar++;
        } else {
          kecil++;
        }
      }
    });

    return { besar, kecil };
  }

  static analyzeAllPositionPatterns(history, limit = 20) {
    const recent = history.slice(-limit);
    const patterns = {
      as: { ganjil: 0, genap: 0, besar: 0, kecil: 0 },
      kop: { ganjil: 0, genap: 0, besar: 0, kecil: 0 },
      kepala: { ganjil: 0, genap: 0, besar: 0, kecil: 0 },
      ekor: { ganjil: 0, genap: 0, besar: 0, kecil: 0 }
    };

    recent.forEach(item => {
      if (item.result) {
        const result = item.result.toString().padStart(4, '0');
        const positions = ['as', 'kop', 'kepala', 'ekor'];
        
        positions.forEach((pos, idx) => {
          const digit = parseInt(result[idx]);
          const isGanjil = digit % 2 === 1;
          const isBesar = digit >= 5;
          
          if (isGanjil) {
            patterns[pos].ganjil++;
          } else {
            patterns[pos].genap++;
          }
          
          if (isBesar) {
            patterns[pos].besar++;
          } else {
            patterns[pos].kecil++;
          }
        });
      }
    });

    Object.keys(patterns).forEach(pos => {
      const p = patterns[pos];
      const total = recent.length;
      p.ganjilTendency = p.ganjil / total;
      p.genapTendency = p.genap / total;
      p.besarTendency = p.besar / total;
      p.kecilTendency = p.kecil / total;
    });

    return patterns;
  }

  static hotColdWithDecay(history, limit = 30, decayRate = 0.95) {
    const recent = history.slice(-limit);
    const digitFreq = {};
    const len = recent.length;
    
    recent.forEach((item, index) => {
      if (item.result) {
        const weight = Math.pow(decayRate, len - index - 1);
        const digits = item.result.toString().split('');
        digits.forEach(d => {
          digitFreq[d] = (digitFreq[d] || 0) + weight;
        });
      }
    });

    const total = Object.values(digitFreq).reduce((a, b) => a + b, 0) || 1;
    Object.keys(digitFreq).forEach(k => {
      digitFreq[k] = digitFreq[k] / total;
    });

    const sorted = Object.entries(digitFreq).sort((a, b) => b[1] - a[1]);
    
    const hot = sorted.slice(0, 5).map(x => x[0]);
    const cold = sorted.slice(-5).reverse().map(x => x[0]);
    
    for (let i = 0; i < 10; i++) {
      if (!digitFreq.hasOwnProperty(i.toString())) {
        cold.push(i.toString());
      }
    }

    const normalizedFreq = {};
    for (let i = 0; i < 10; i++) {
      normalizedFreq[i] = digitFreq[i.toString()] || 0;
    }

    return {
      hot: [...new Set(hot)].slice(0, 5),
      cold: [...new Set(cold)].slice(0, 5),
      frequency: normalizedFreq
    };
  }

  static analyzePositionCorrelation(history, pos1, pos2, limit = 30) {
    const recent = history.slice(-limit);
    const correlations = {};
    
    recent.forEach(item => {
      if (item.result) {
        const result = item.result.toString().padStart(4, '0');
        const d1 = parseInt(result[pos1]);
        const d2 = parseInt(result[pos2]);
        const key = `${d1}-${d2}`;
        correlations[key] = (correlations[key] || 0) + 1;
      }
    });

    return Object.entries(correlations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }
}

module.exports = PatternAnalyzer;

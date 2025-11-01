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
}

module.exports = PatternAnalyzer;

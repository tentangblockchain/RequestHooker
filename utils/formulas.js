class TogelFormulas {
  static mistik(angka) {
    const mistikMap = { 0: 8, 1: 7, 2: 6, 3: 9, 4: 5, 5: 4, 6: 2, 7: 1, 8: 0, 9: 3 };
    return mistikMap[angka];
  }

  static indexML(angka) {
    const mlMap = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 0 };
    return mlMap[angka];
  }

  static indexIX(angka) {
    const ixMap = { 0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 0, 6: 1, 7: 2, 8: 3, 9: 4 };
    return ixMap[angka];
  }

  static indexM1(angka) {
    const m1Map = { 0: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 0, 8: 1, 9: 2 };
    return m1Map[angka];
  }

  static indexM3(angka) {
    const m3Map = { 0: 4, 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 0, 7: 1, 8: 2, 9: 3 };
    return m3Map[angka];
  }

  static indexM5(angka) {
    const m5Map = { 0: 6, 1: 7, 2: 8, 3: 9, 4: 0, 5: 1, 6: 2, 7: 3, 8: 4, 9: 5 };
    return m5Map[angka];
  }

  static indexM7(angka) {
    const m7Map = { 0: 7, 1: 8, 2: 9, 3: 0, 4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6 };
    return m7Map[angka];
  }

  static indexM8(angka) {
    const m8Map = { 0: 9, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8 };
    return m8Map[angka];
  }

  static indexM9(angka) {
    const m9Map = { 0: 1, 1: 0, 2: 3, 3: 2, 4: 5, 5: 4, 6: 7, 7: 6, 8: 9, 9: 8 };
    return m9Map[angka];
  }

  static indexTY(angka) {
    const tyMap = { 0: 9, 1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1, 9: 0 };
    return tyMap[angka];
  }

  static applyFormula(baseNumber, formulaType) {
    const digits = baseNumber.toString().padStart(4, '0').split('').map(Number);
    const methodName = `index${formulaType}`;
    
    if (formulaType === 'Mistik') {
      return digits.map(d => this.mistik(d)).join('');
    }
    
    if (typeof this[methodName] === 'function') {
      return digits.map(d => this[methodName](d)).join('');
    }
    
    return baseNumber.toString();
  }

  static applyAllFormulas(baseNumber) {
    const formulas = ['Mistik', 'ML', 'IX', 'M1', 'M3', 'M5', 'M7', 'M8', 'M9', 'TY'];
    const results = {};
    
    formulas.forEach(formula => {
      results[formula] = this.applyFormula(baseNumber, formula);
    });
    
    return results;
  }

  static generateAIWithFormula(baseNumber, formulaType, modifier = 0) {
    const digits = baseNumber.toString().padStart(4, '0').split('').map(Number);
    const aiSet = new Set();

    digits.forEach(digit => {
      let transformed = this.applyFormula(digit, formulaType);
      let finalDigit = (parseInt(transformed.toString()[0]) + modifier) % 10;
      aiSet.add(finalDigit);
    });

    while (aiSet.size < 5) {
      aiSet.add(Math.floor(Math.random() * 10));
    }

    return Array.from(aiSet).slice(0, 5).sort((a, b) => a - b);
  }
}

module.exports = TogelFormulas;

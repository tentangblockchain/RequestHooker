const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class StorageService {
  constructor() {
    this.dataFile = config.data.filePath;
    this.exportsPath = config.data.exportsPath;
    this.schedulerFile = config.data.schedulerPath || './data/scheduler.json';
    this.adminsFile = './data/admins.json';
    this.data = this.loadData();
    this.admins = this.loadAdmins();
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dataDir = path.dirname(this.dataFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.exportsPath)) {
      fs.mkdirSync(this.exportsPath, { recursive: true });
    }
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const content = fs.readFileSync(this.dataFile, 'utf8');
        const data = JSON.parse(content);
        
        if (!data.predictionTracking) data.predictionTracking = [];
        if (!data.winRates) data.winRates = {};
        
        return data;
      }
    } catch (error) {
      console.error('Error loading data:', error.message);
    }
    return { 
      history: [], 
      predictions: [],
      predictionTracking: [],
      winRates: {}
    };
  }

  saveData() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving data:', error.message);
      return false;
    }
  }

  addHistory(pasaran, result) {
    const normalizedResult = this.normalizeResult(result);
    const normalizedPasaran = pasaran.toUpperCase();
    
    // Check for duplicate (same pasaran & result on same day)
    const today = new Date().toISOString().split('T')[0];
    const duplicate = this.data.history.find(h => 
      h.pasaran === normalizedPasaran && 
      h.result === normalizedResult &&
      h.date.startsWith(today)
    );
    
    if (duplicate) {
      return { success: false, message: 'Data sudah ada untuk hari ini', duplicate: true };
    }
    
    const entry = {
      pasaran: normalizedPasaran,
      date: new Date().toISOString(),
      result: normalizedResult
    };
    
    this.data.history.push(entry);
    this.cleanOldData(normalizedPasaran);
    this.updatePredictionTracking(normalizedPasaran, normalizedResult);
    
    return this.saveData();
  }

  addHistoryWithDate(pasaran, result, customDate = null) {
    const normalizedResult = this.normalizeResult(result);
    const normalizedPasaran = pasaran.toUpperCase();
    const dateToUse = customDate || new Date();
    
    // Check for duplicate (same pasaran, result & date)
    const targetDate = dateToUse.toISOString().split('T')[0];
    const duplicate = this.data.history.find(h => 
      h.pasaran === normalizedPasaran && 
      h.result === normalizedResult &&
      h.date.startsWith(targetDate)
    );
    
    if (duplicate) {
      return { success: false, message: 'Data sudah ada untuk tanggal ini', duplicate: true };
    }
    
    const entry = {
      pasaran: normalizedPasaran,
      date: dateToUse.toISOString(),
      result: normalizedResult
    };
    
    this.data.history.push(entry);
    this.cleanOldData(normalizedPasaran);
    this.updatePredictionTracking(normalizedPasaran, normalizedResult);
    
    return this.saveData();
  }

  cleanOldData(pasaran) {
    const maxResults = 16;
    const pasaranHistory = this.data.history.filter(h => h.pasaran === pasaran);
    
    if (pasaranHistory.length > maxResults) {
      // Sort by date (oldest first)
      pasaranHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Get entries to remove (keep only last 16 results)
      const toRemove = pasaranHistory.slice(0, pasaranHistory.length - maxResults);
      
      // Remove old entries
      this.data.history = this.data.history.filter(h => 
        !toRemove.some(r => r.pasaran === h.pasaran && r.date === h.date && r.result === h.result)
      );
      
      console.log(`🗑️ Cleaned ${toRemove.length} old entries for ${pasaran}. Keeping latest ${maxResults} results.`);
    }
  }

  normalizeResult(result) {
    const resultStr = result.toString().replace(/\D/g, '');
    return resultStr.padStart(4, '0');
  }

  addPrediction(pasaran, prediction) {
    const entry = {
      pasaran: pasaran.toUpperCase(),
      date: new Date().toISOString(),
      prediction
    };
    
    this.data.predictions.push(entry);
    
    this.data.predictionTracking.push({
      pasaran: pasaran.toUpperCase(),
      date: new Date().toISOString(),
      prediction: {
        ai: prediction.ai,
        kepala: prediction.kepala,
        ekor: prediction.ekor,
        as: prediction.as,
        kop: prediction.kop,
        bbfs: prediction.bbfs,
        combinations4D: prediction.combinations4D
      },
      actual: null,
      verified: false
    });
    
    return this.saveData();
  }

  updatePredictionTracking(pasaran, actualResult) {
    const unverified = this.data.predictionTracking.filter(
      p => p.pasaran === pasaran.toUpperCase() && !p.verified
    );

    if (unverified.length > 0) {
      const latest = unverified[unverified.length - 1];
      latest.actual = actualResult;
      latest.verified = true;
      latest.verifiedDate = new Date().toISOString();
      
      const actualStr = actualResult.toString().padStart(4, '0');
      const actualDigits = actualStr.split('').map(Number);
      
      latest.hits = {
        ai: latest.prediction.ai.some(d => actualDigits.includes(d)),
        kepala: latest.prediction.kepala.includes(actualDigits[2]),
        ekor: latest.prediction.ekor.includes(actualDigits[3]),
        as: latest.prediction.as.includes(actualDigits[0]),
        kop: latest.prediction.kop.includes(actualDigits[1]),
        bbfs: actualDigits.every(d => latest.prediction.bbfs.includes(d.toString())),
        combinations4D: latest.prediction.combinations4D.includes(actualStr)
      };
      
      this.updateWinRates(pasaran);
    }
  }

  updateWinRates(pasaran) {
    const verified = this.data.predictionTracking.filter(
      p => p.pasaran === pasaran.toUpperCase() && p.verified
    );

    if (verified.length === 0) return;

    const rates = {
      ai: 0,
      kepala: 0,
      ekor: 0,
      as: 0,
      kop: 0,
      bbfs: 0,
      combinations4D: 0,
      total: verified.length
    };

    verified.forEach(track => {
      if (track.hits) {
        Object.keys(rates).forEach(key => {
          if (key !== 'total' && track.hits[key]) {
            rates[key]++;
          }
        });
      }
    });

    Object.keys(rates).forEach(key => {
      if (key !== 'total') {
        rates[`${key}_percentage`] = ((rates[key] / rates.total) * 100).toFixed(2) + '%';
      }
    });

    this.data.winRates[pasaran.toUpperCase()] = rates;
    this.saveData();
  }

  getWinRates(pasaran) {
    return this.data.winRates[pasaran.toUpperCase()] || null;
  }

  getPredictionTracking(pasaran, limit = 10) {
    const tracking = this.data.predictionTracking
      .filter(p => p.pasaran === pasaran.toUpperCase())
      .slice(-limit);
    
    return tracking;
  }

  getHistory(pasaran, limit = null) {
    const history = this.data.history.filter(h => 
      h.pasaran === pasaran.toUpperCase()
    );
    return limit ? history.slice(-limit) : history;
  }

  getPredictions(pasaran, limit = null) {
    const predictions = this.data.predictions.filter(p => 
      p.pasaran === pasaran.toUpperCase()
    );
    return limit ? predictions.slice(-limit) : predictions;
  }

  getAllHistory() {
    return this.data.history;
  }

  saveSchedulerData(data) {
    try {
      fs.writeFileSync(this.schedulerFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving scheduler data:', error.message);
      return false;
    }
  }

  loadSchedulerData() {
    try {
      if (fs.existsSync(this.schedulerFile)) {
        const content = fs.readFileSync(this.schedulerFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading scheduler data:', error.message);
    }
    return null;
  }

  exportToFile(filename, content) {
    try {
      const filePath = path.join(this.exportsPath, filename);
      fs.writeFileSync(filePath, content);
      return filePath;
    } catch (error) {
      console.error('Error exporting file:', error.message);
      return null;
    }
  }

  getExportFilePath(filename) {
    return path.join(this.exportsPath, filename);
  }

  loadAdmins() {
    try {
      if (fs.existsSync(this.adminsFile)) {
        const content = fs.readFileSync(this.adminsFile, 'utf8');
        const data = JSON.parse(content);
        return data.admins || [];
      }
    } catch (error) {
      console.error('Error loading admins:', error.message);
    }
    return [];
  }

  saveAdmins() {
    try {
      fs.writeFileSync(this.adminsFile, JSON.stringify({ admins: this.admins }, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving admins:', error.message);
      return false;
    }
  }

  isAdmin(chatId) {
    return this.admins.includes(chatId);
  }

  addAdmin(chatId) {
    if (!this.admins.includes(chatId)) {
      this.admins.push(chatId);
      return this.saveAdmins();
    }
    return false;
  }

  removeAdmin(chatId) {
    const index = this.admins.indexOf(chatId);
    if (index > -1) {
      this.admins.splice(index, 1);
      return this.saveAdmins();
    }
    return false;
  }

  getAdmins() {
    return [...this.admins];
  }
}

module.exports = new StorageService();

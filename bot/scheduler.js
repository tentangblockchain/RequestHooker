const cron = require('node-cron');
const PredictionEngine = require('../services/prediction');
const storage = require('../services/storage');

class SchedulerService {
  constructor(bot) {
    this.bot = bot;
    this.jobs = [];
    this.subscribers = new Map();
  }

  addSubscriber(chatId, pasaran, time) {
    if (!this.subscribers.has(chatId)) {
      this.subscribers.set(chatId, []);
    }
    
    const existing = this.subscribers.get(chatId).find(s => s.pasaran === pasaran);
    if (existing) {
      existing.time = time;
      this.saveSubscribers();
      return { success: true, message: 'Updated existing subscription' };
    }
    
    this.subscribers.get(chatId).push({ pasaran, time });
    this.saveSubscribers();
    return { success: true, message: 'Subscription added' };
  }

  removeSubscriber(chatId, pasaran) {
    if (!this.subscribers.has(chatId)) {
      return { success: false, message: 'No subscriptions found' };
    }
    
    const subs = this.subscribers.get(chatId);
    const filtered = subs.filter(s => s.pasaran !== pasaran);
    
    if (filtered.length === subs.length) {
      return { success: false, message: 'Subscription not found' };
    }
    
    this.subscribers.set(chatId, filtered);
    this.saveSubscribers();
    return { success: true, message: 'Subscription removed' };
  }

  getSubscriptions(chatId) {
    return this.subscribers.get(chatId) || [];
  }

  saveSubscribers() {
    const data = Array.from(this.subscribers.entries()).map(([chatId, subs]) => ({
      chatId,
      subscriptions: subs
    }));
    storage.saveSchedulerData(data);
  }

  loadSubscribers() {
    const data = storage.loadSchedulerData();
    if (data) {
      data.forEach(({ chatId, subscriptions }) => {
        this.subscribers.set(chatId, subscriptions);
      });
    }
  }

  startScheduledPredictions() {
    const times = [
      { hour: 9, minute: 0, label: 'Pagi' },
      { hour: 14, minute: 0, label: 'Siang' },
      { hour: 20, minute: 0, label: 'Malam' }
    ];

    times.forEach(({ hour, minute, label }) => {
      const job = cron.schedule(`${minute} ${hour} * * *`, () => {
        console.log(`🕐 Running scheduled predictions - ${label} (${hour}:${minute})`);
        this.sendScheduledPredictions(label);
      });
      
      this.jobs.push(job);
      console.log(`✅ Scheduled: ${label} predictions at ${hour}:${minute}`);
    });
  }

  sendScheduledPredictions(timeLabel) {
    this.subscribers.forEach((subscriptions, chatId) => {
      subscriptions.forEach(({ pasaran, time }) => {
        if (time === timeLabel.toLowerCase()) {
          try {
            const history = storage.getHistory(pasaran);
            const prediction = PredictionEngine.generateCompletePrediction(history, pasaran);
            
            const message = this.formatScheduledMessage(pasaran, prediction, timeLabel);
            this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          } catch (error) {
            console.error(`Error sending scheduled prediction to ${chatId}:`, error);
          }
        }
      });
    });
  }

  formatScheduledMessage(pasaran, prediction, timeLabel) {
    const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';
    const confidence = this.getConfidenceEmoji(prediction.confidence);
    
    // Get last 3 results
    const history = storage.getHistory(pasaran);
    const recentHistory = history.slice(-3).reverse();
    let historyText = '';
    if (recentHistory.length > 0) {
      historyText = '\n*📊 RESULT SEBELUMNYA*\n';
      recentHistory.forEach(h => {
        const date = new Date(h.date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short'
        });
        historyText += `${date}: ${h.result.toString().padStart(4, '0')}\n`;
      });
      historyText += '\n';
    }

    // Prediction date
    const predictionDate = new Date();
    predictionDate.setDate(predictionDate.getDate() + 1);
    const predDateStr = predictionDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    // Generate 3D combinations
    const combinations3D = [];
    for (let k of prediction.kop.slice(0, 3)) {
      for (let kp of prediction.kepala.slice(0, 2)) {
        for (let e of prediction.ekor.slice(0, 2)) {
          combinations3D.push(`${k}${kp}${e}`);
          if (combinations3D.length >= 10) break;
        }
        if (combinations3D.length >= 10) break;
      }
      if (combinations3D.length >= 10) break;
    }

    // Generate 2D invest
    const combinations2D = [];
    for (let kp of prediction.kepala) {
      for (let e of prediction.ekor) {
        combinations2D.push(`${kp}${e}`);
      }
    }

    // Generate top 2D (10 line)
    const top2D = combinations2D.slice(0, 10);
    
    return `
🔔 *PREDIKSI OTOMATIS - ${timeLabel.toUpperCase()}*
${icon} *${pasaran}*
🎯 *Untuk: ${predDateStr}*
━━━━━━━━━━━━━━━━━━━━
${historyText}

*🎲 ANGKA IKUT*
AI: *${prediction.ai.join(' - ')}*

*🎯 KEPALA & EKOR*
Kepala: ${prediction.kepala.join(' - ')}
Ekor: ${prediction.ekor.join(' - ')}

*💎 BBFS*
${prediction.bbfs.split('').join(' - ')}

━━━━━━━━━━━━━━━━━━━━

*🔥 TOP 10 LINE 4D*
${prediction.combinations4D.slice(0, 10).join(' • ')}

━━━━━━━━━━━━━━━━━━━━

*🎰 TOP 10 LINE 3D*
${combinations3D.join(' • ')}

━━━━━━━━━━━━━━━━━━━━

*💰 TOP 10 LINE 2D*
${top2D.join(' • ')}

━━━━━━━━━━━━━━━━━━━━
${confidence} Confidence: *${prediction.confidence.toUpperCase()}*
📊 Data: ${prediction.dataCount} draw

⚠️ _Prediksi untuk referensi!_
    `;
  }

  getConfidenceEmoji(confidence) {
    const map = {
      'very_low': '🔴',
      'low': '🟠',
      'medium': '🟡',
      'high': '🟢',
      'very_high': '🔵'
    };
    return map[confidence] || '⚪';
  }

  stopAll() {
    this.jobs.forEach(job => job.stop());
    console.log('🛑 All scheduled jobs stopped');
  }
}

module.exports = SchedulerService;

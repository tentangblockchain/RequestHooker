const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/config');
const PredictionEngine = require('../services/prediction');
const PatternAnalyzer = require('../utils/pattern');
const BacktestingService = require('../services/backtesting');
const ScraperService = require('../services/scraper');
const storage = require('../services/storage');
const KeyboardHelper = require('./keyboards');
const SchedulerService = require('./scheduler');
const fs = require('fs');

class TelegramBotHandler {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.scheduler = new SchedulerService(this.bot);
    this.setupCommands();
    this.setupCallbacks();
    this.startScheduler();
    this.autoScrapeOnStartup();
  }

  startScheduler() {
    try {
      this.scheduler.loadSubscribers();
      this.scheduler.startScheduledPredictions();
      console.log('✅ Scheduler initialized');
    } catch (error) {
      console.error('❌ Scheduler initialization failed:', error.message);
    }
  }

  setupCommands() {
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/menu/, (msg) => this.handleMenu(msg));
    this.bot.onText(/\/prediksi/, (msg) => this.handlePrediksiMenu(msg));
    this.bot.onText(/\/input (.+) (\d+)/, (msg, match) => this.handleInput(msg, match));
    this.bot.onText(/\/history/, (msg) => this.handleHistoryMenu(msg));
    this.bot.onText(/\/stats/, (msg) => this.handleStatsMenu(msg));
    this.bot.onText(/\/backtest/, (msg) => this.handleBacktestMenu(msg));
    this.bot.onText(/\/winrate/, (msg) => this.handleWinRateMenu(msg));
    this.bot.onText(/\/schedule/, (msg) => this.handleScheduleMenu(msg));
    this.bot.onText(/\/export/, (msg) => this.handleExportMenu(msg));
    this.bot.onText(/\/list/, (msg) => this.handleList(msg));
    this.bot.onText(/\/addadmin (\d+)/, (msg, match) => this.handleAddAdmin(msg, match));
    this.bot.onText(/\/removeadmin (\d+)/, (msg, match) => this.handleRemoveAdmin(msg, match));
    this.bot.onText(/\/admins/, (msg) => this.handleListAdmins(msg));
    this.bot.onText(/\/scrape/, (msg) => this.handleScrapeMenu(msg));
    this.bot.onText(/\/scrapeconfig/, (msg) => this.handleScrapeConfig(msg));

    this.bot.on('message', (msg) => {
      if (msg.text && msg.text.startsWith('/')) return;

      // Handle reply keyboard buttons
      if (msg.text === '📱 Menu') {
        this.handleMenu(msg);
        return;
      }

      if (msg.text || msg.caption) {
        this.handleForwardedMessage(msg);
      }
    });

    this.bot.on('polling_error', (error) => {
      console.error('❌ Polling error:', error.code, error.message);
    });
  }

  setupCallbacks() {
    this.bot.on('callback_query', async (query) => {
      const data = query.data;
      const msg = query.message;
      const chatId = msg.chat.id;

      // Answer callback query immediately to remove loading state
      await this.bot.answerCallbackQuery(query.id).catch(err => {
        console.error('Error answering callback:', err.message);
      });

      try {
        if (data.startsWith('pred_')) {
          const pasaran = data.split('_')[1];
          this.generatePrediksi(chatId, pasaran);
        } else if (data.startsWith('hist_')) {
          const pasaran = data.split('_')[1];
          this.showHistory(chatId, pasaran);
        } else if (data.startsWith('stat_')) {
          const pasaran = data.split('_')[1];
          this.showStats(chatId, pasaran);
        } else if (data.startsWith('btest_')) {
          const parts = data.split('_');
          const pasaran = parts[1];
          const size = parseInt(parts[2]);
          this.runBacktest(chatId, pasaran, size);
        } else if (data.startsWith('btestmenu_')) {
          const pasaran = data.split('_')[1];
          const keyboard = KeyboardHelper.getBacktestSizeKeyboard(pasaran);
          await this.bot.sendMessage(chatId, `🎯 Pilih ukuran backtest untuk ${pasaran}:`, {
            reply_markup: keyboard
          });
        } else if (data.startsWith('schedmenu_')) {
          const pasaran = data.split('_')[1];
          const keyboard = KeyboardHelper.getScheduleTimeKeyboard(pasaran);
          await this.bot.sendMessage(chatId, `⏰ Pilih waktu auto prediksi untuk ${pasaran}:`, {
            reply_markup: keyboard
          });
        } else if (data.startsWith('winr_')) {
          const pasaran = data.split('_')[1];
          this.showWinRate(chatId, pasaran);
        } else if (data.startsWith('exp_')) {
          const pasaran = data.split('_')[1];
          this.exportData(chatId, pasaran);
        } else if (data.startsWith('sched_')) {
          const parts = data.split('_');
          const pasaran = parts[1];
          const time = parts[2];
          this.addSchedule(chatId, pasaran, time);
        } else if (data.startsWith('unsched_')) {
          const pasaran = data.split('_')[1];
          this.removeSchedule(chatId, pasaran);
        } else if (data.startsWith('save_')) {
          const parts = data.split('_');
          const pasaran = parts[1];
          const result = parseInt(parts[2]);
          this.saveResult(chatId, pasaran, result);
        } else if (data.startsWith('menu_')) {
          const menu = data.split('_')[1];
          this.handleMenuCallback(chatId, menu);
        } else if (data === 'scrape_all') {
          this.executeScrape(chatId);
        } else if (data.startsWith('scrape_')) {
          const pasaran = data.split('_')[1];
          this.executeScrape(chatId, pasaran);
        } else if (data === 'scrape_status') {
          this.handleScrapeConfig(msg);
        } else if (data === 'main_menu') {
          this.handleMenu(msg);
        } else if (data === 'cancel') {
          await this.bot.sendMessage(chatId, '❌ Operasi dibatalkan.');
        }
      } catch (error) {
        console.error('❌ Callback error:', error.message);
        console.error('Stack:', error.stack);
        await this.bot.sendMessage(chatId, '❌ Terjadi kesalahan. Silakan coba lagi.').catch(() => {});
      }
    });
  }

  handleStart(msg) {
    const chatId = msg.chat.id;
    const welcomeMsg = `
🎰 *Selamat Datang di Togel Prediction Bot V2!*

Bot prediksi togel dengan *AI dan Statistical Analysis*.

*✨ Fitur Baru V2:*
🎯 Markov Chain & Conditional Probability
📊 Backtesting System
📈 Win Rate Tracking
⏰ Auto Prediksi Terjadwal
💾 Export Data

*🔥 Fitur Utama:*
• AI, Kepala, Ekor, AS, KOP, BBFS
• 10 Formula Transformasi Teroptimasi
• Pattern & Frequency Analysis
• Hot/Cold Numbers dengan Smoothing
• Trend Detection

*📍 Pasaran:* SGP 🇸🇬 | HK 🇭🇰 | SDY 🇦🇺

*📱 Commands:*
/menu - Menu utama interaktif
/prediksi - Generate prediksi
/backtest - Test akurasi prediksi
/winrate - Lihat tingkat akurasi
/schedule - Atur auto prediksi
/export - Export data
/help - Bantuan lengkap

Gunakan /menu untuk akses cepat semua fitur!

⚠️ _Prediksi untuk referensi. Main bijak!_
    `;

    const keyboard = KeyboardHelper.getReplyKeyboard();
    this.bot.sendMessage(chatId, welcomeMsg, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleHelp(msg) {
    const chatId = msg.chat.id;
    const helpMsg = `
📚 *Panduan Lengkap Bot V2*

*🎯 GENERATE PREDIKSI*
/prediksi - Pilih pasaran
• Prediksi menggunakan AI & statistics
• Confidence level berdasarkan data
• Formula teroptimasi

*📊 BACKTEST*
/backtest - Test akurasi
• Uji prediksi dengan data historis
• Lihat accuracy per kategori
• Pilih jumlah test (10-50 draw)

*📈 WIN RATE*
/winrate - Tingkat akurasi
• Persentase hit per kategori
• Tracking otomatis
• Update real-time

*⏰ AUTO PREDIKSI*
/schedule - Atur jadwal
• Pagi (09:00)
• Siang (14:00)
• Malam (20:00)

*💾 EXPORT*
/export - Export data
• Format lengkap
• Kirim via Telegram

*📝 INPUT HASIL* (Admin Only)
/input SGP 1234
• Atau forward pesan hasil
• Auto tracking win rate

*👥 ADMIN COMMANDS*
/addadmin <user_id> - Tambah admin
/removeadmin <user_id> - Hapus admin
/admins - Lihat daftar admin

*🌐 WEB SCRAPER* (Admin Only)
/scrape - Auto update data dari website
/scrapeconfig - Lihat konfigurasi URL

*💡 TIPS:*
• Min 10 data untuk akurasi baik
• 20+ data = hasil optimal
• Gunakan backtest untuk validasi
• Check win rate secara berkala

Gunakan /menu untuk akses mudah!
    `;

    this.bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
  }

  handleMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getMainMenu();

    this.bot.sendMessage(chatId, '📱 *Menu Utama*\n\nPilih fitur yang ingin digunakan:', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleMenuCallback(chatId, menu) {
    switch (menu) {
      case 'prediksi':
        this.handlePrediksiMenu({ chat: { id: chatId } });
        break;
      case 'history':
        this.handleHistoryMenu({ chat: { id: chatId } });
        break;
      case 'stats':
        this.handleStatsMenu({ chat: { id: chatId } });
        break;
      case 'backtest':
        this.handleBacktestMenu({ chat: { id: chatId } });
        break;
      case 'schedule':
        this.handleScheduleMenu({ chat: { id: chatId } });
        break;
      case 'export':
        this.handleExportMenu({ chat: { id: chatId } });
        break;
      case 'list':
        this.handleList({ chat: { id: chatId } });
        break;
    }
  }

  handlePrediksiMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getPasaranKeyboard('pred');

    this.bot.sendMessage(chatId, '🎯 *Pilih Pasaran untuk Prediksi:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleHistoryMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getPasaranKeyboard('hist');

    this.bot.sendMessage(chatId, '📊 *Pilih Pasaran untuk History:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleStatsMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getPasaranKeyboard('stat');

    this.bot.sendMessage(chatId, '📈 *Pilih Pasaran untuk Statistik:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleBacktestMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getPasaranKeyboard('btestmenu');

    this.bot.sendMessage(chatId, '🎯 *Pilih Pasaran untuk Backtest:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇸🇬 SGP', callback_data: 'btestmenu_SGP' },
            { text: '🇭🇰 HK', callback_data: 'btestmenu_HK' }
          ],
          [
            { text: '🇦🇺 SDY', callback_data: 'btestmenu_SDY' }
          ]
        ]
      }
    });
  }

  handleWinRateMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getPasaranKeyboard('winr');

    this.bot.sendMessage(chatId, '📈 *Pilih Pasaran untuk Win Rate:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleExportMenu(msg) {
    const chatId = msg.chat.id;
    const keyboard = KeyboardHelper.getPasaranKeyboard('exp');

    this.bot.sendMessage(chatId, '💾 *Pilih Pasaran untuk Export:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  handleScheduleMenu(msg) {
    const chatId = msg.chat.id;
    const subs = this.scheduler.getSubscriptions(chatId);

    let message = '⏰ *Auto Prediksi Terjadwal*\n\n';

    if (subs.length === 0) {
      message += '📭 Belum ada jadwal aktif.\n\n';
    } else {
      message += '📅 *Jadwal Aktif:*\n';
      subs.forEach(({ pasaran, time }) => {
        const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';
        message += `${icon} ${pasaran} - ${time.charAt(0).toUpperCase() + time.slice(1)}\n`;
      });
      message += '\n';
    }

    message += 'Pilih pasaran untuk atur jadwal:';

    const keyboard = KeyboardHelper.getPasaranKeyboard('schedmenu');

    this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇸🇬 SGP', callback_data: 'schedmenu_SGP' },
            { text: '🇭🇰 HK', callback_data: 'schedmenu_HK' }
          ],
          [
            { text: '🇦🇺 SDY', callback_data: 'schedmenu_SDY' }
          ]
        ]
      }
    });
  }

  handleInput(msg, match) {
    const chatId = msg.chat.id;

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa input data result.\nHubungi admin untuk mendapatkan akses.', { parse_mode: 'Markdown' });
      return;
    }

    const pasaran = match[1].toUpperCase();
    const result = parseInt(match[2]);

    if (!config.app.supportedPasaran.includes(pasaran)) {
      this.bot.sendMessage(chatId, `❌ Pasaran tidak valid! Gunakan: ${config.app.supportedPasaran.join(', ')}`);
      return;
    }

    if (isNaN(result) || result < 0 || result > 9999) {
      this.bot.sendMessage(chatId, '❌ Result harus 0-9999!');
      return;
    }

    this.saveResult(chatId, pasaran, result);
  }

  handleList(msg) {
    const chatId = msg.chat.id;
    let message = '📍 *Status Semua Pasaran:*\n\n';

    config.app.supportedPasaran.forEach((pasaran) => {
      const history = storage.getHistory(pasaran);
      const winRate = storage.getWinRates(pasaran);
      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      message += `${icon} *${pasaran}*\n`;
      message += `   📊 Data: ${history.length} draw\n`;

      if (winRate && winRate.total > 0) {
        message += `   🎯 AI Hit Rate: ${winRate.ai_percentage}\n`;
      }

      message += '\n';
    });

    message += 'Gunakan /prediksi untuk generate prediksi!';

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  generatePrediksi(chatId, pasaran) {
    try {
      this.bot.sendMessage(chatId, `⏳ Generating prediksi ${pasaran}...`);

      const history = storage.getHistory(pasaran);
      const prediction = PredictionEngine.generateCompletePrediction(history, pasaran);

      const confidence = this.getConfidenceEmoji(prediction.confidence);
      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      // Get last 3 results with dates
      const recentHistory = history.slice(-3).reverse();
      let historyText = '';
      if (recentHistory.length > 0) {
        historyText = '\n*📊 RESULT SEBELUMNYA*\n';
        historyText += '━━━━━━━━━━━━━━━━━━━━\n';
        recentHistory.forEach(h => {
          const date = new Date(h.date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          historyText += `${date}: ${h.result.toString().padStart(4, '0')}\n`;
        });
        historyText += '━━━━━━━━━━━━━━━━━━━━\n';
      }

      // Prediction date (tomorrow)
      const predictionDate = new Date();
      predictionDate.setDate(predictionDate.setDate() + 1);
      const predDateStr = predictionDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
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

      let message = `
${icon} *PREDIKSI ${pasaran}*
🎯 *Untuk: ${predDateStr}*
📅 Dibuat: ${new Date().toLocaleDateString('id-ID')}
${historyText}
━━━━━━━━━━━━━━━━━━━━

*🎲 ANGKA IKUT*
AI: *${prediction.ai.join(' - ')}*

*🎯 KEPALA & EKOR*
Kepala: ${prediction.kepala.join(' - ')}
Ekor: ${prediction.ekor.join(' - ')}

*💎 BBFS*
${prediction.bbfs.split('').join('')}

━━━━━━━━━━━━━━━━━━━━

*🔥 TOP 10 LINE 4D*
${prediction.combinations4D.slice(0, 10).join(' • ')}

*🎰 TOP 10 LINE 3D*
${combinations3D.join(' • ')}

*💰 TOP 10 LINE 2D*
${top2D.join(' • ')}

*📊 2D INVEST (${combinations2D.length} LINE)*
${combinations2D.join(' • ')}

━━━━━━━━━━━━━━━━━━━━

*📊 ANALISIS*
🔥 Hot: ${prediction.hotCold.hot.join(', ')}
❄️ Cold: ${prediction.hotCold.cold.join(', ')}
Ganjil/Genap: ${prediction.pattern.ganjilGenap.ganjil}/${prediction.pattern.ganjilGenap.genap}
Besar/Kecil: ${prediction.pattern.besarKecil.besar}/${prediction.pattern.besarKecil.kecil}

━━━━━━━━━━━━━━━━━━━━
${confidence} Confidence: *${prediction.confidence.toUpperCase()}*
📈 Data: ${prediction.dataCount} draw
⚠️ _Prediksi untuk referensi!_
      `;

      if (prediction.dataCount < 10) {
        message = `⚠️ *Data masih sedikit (${prediction.dataCount}/10)*\nPrediksi mungkin kurang akurat.\n\n` + message;
      }

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

      storage.addPrediction(pasaran, prediction);
    } catch (error) {
      console.error('Error generating prediction:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat generate prediksi.');
    }
  }

  showHistory(chatId, pasaran) {
    try {
      const history = storage.getHistory(pasaran, 10).reverse();

      if (history.length === 0) {
        this.bot.sendMessage(chatId, `⚠️ Belum ada data untuk ${pasaran}`);
        return;
      }

      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      let message = `
${icon} *HISTORY ${pasaran}* (10 Terakhir)
━━━━━━━━━━━━━━━━━━━━

`;

      history.forEach((h, i) => {
        const date = new Date(h.date).toLocaleDateString('id-ID', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        message += `${i + 1}. ${date}\n    Result: *${h.result.toString().padStart(4, '0')}*\n\n`;
      });

      message += `\n━━━━━━━━━━━━━━━━━━━━\nTotal: ${storage.getHistory(pasaran).length} data`;

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error showing history:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat menampilkan history.');
    }
  }

  showStats(chatId, pasaran) {
    try {
      const history = storage.getHistory(pasaran);

      if (history.length === 0) {
        this.bot.sendMessage(chatId, `⚠️ Belum ada data untuk ${pasaran}`);
        return;
      }

      const hotCold = PatternAnalyzer.hotColdNumbers(history, 30);
      const pattern = PatternAnalyzer.analyzePattern(history, 20);
      const ganjilGenap = PatternAnalyzer.analyzeGanjilGenap(history, 20);
      const besarKecil = PatternAnalyzer.analyzeBesarKecil(history, 20);

      const topKepala = PatternAnalyzer.getTopDigits(pattern.kepalaFreq, 5);
      const topEkor = PatternAnalyzer.getTopDigits(pattern.ekorFreq, 5);

      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      let message = `
${icon} *STATISTIK ${pasaran}*
━━━━━━━━━━━━━━━━━━━━

*🔥 HOT NUMBERS* (30 draw)
${hotCold.hot.join(', ')}

*❄️ COLD NUMBERS*
${hotCold.cold.join(', ')}

*📊 KEPALA SERING*
${topKepala.map(({ digit, count }) => `${digit}: ${count}x`).join(', ')}

*📊 EKOR SERING*
${topEkor.map(({ digit, count }) => `${digit}: ${count}x`).join(', ')}

*📉 PATTERN ANALYSIS*
Ganjil: ${ganjilGenap.ganjil} | Genap: ${ganjilGenap.genap}
Besar: ${besarKecil.besar} | Kecil: ${besarKecil.kecil}

━━━━━━━━━━━━━━━━━━━━
Total Data: ${history.length} draw
      `;

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error showing stats:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat menampilkan statistik.');
    }
  }

  runBacktest(chatId, pasaran, size) {
    try {
      this.bot.sendMessage(chatId, `⏳ Running backtest ${pasaran} dengan ${size} draw...`);

      const result = BacktestingService.runBacktest(pasaran, size);

      if (!result.success) {
        this.bot.sendMessage(chatId, `⚠️ ${result.message}`);
        return;
      }

      const { results } = result;
      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      let message = `
${icon} *BACKTEST ${pasaran}*
━━━━━━━━━━━━━━━━━━━━

*📊 AKURASI PREDIKSI*
━━━━━━━━━━━━━━━━━━━━
🎲 AI: *${results.accuracy.ai}* (${results.hits.ai}/${size})
👑 Kepala: ${results.accuracy.kepala} (${results.hits.kepala}/${size})
🎯 Ekor: ${results.accuracy.ekor} (${results.hits.ekor}/${size})
📈 AS: ${results.accuracy.as} (${results.hits.as}/${size})
📊 KOP: ${results.accuracy.kop} (${results.hits.kop}/${size})
💎 BBFS: ${results.accuracy.bbfs} (${results.hits.bbfs}/${size})
🎰 4D: ${results.accuracy.combinations4D} (${results.hits.combinations4D}/${size})

━━━━━━━━━━━━━━━━━━━━
Test: ${results.totalTests} draw
      `;

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error running backtest:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat backtest.');
    }
  }

  showWinRate(chatId, pasaran) {
    try {
      const winRate = storage.getWinRates(pasaran);

      if (!winRate || winRate.total === 0) {
        this.bot.sendMessage(chatId, `⚠️ Belum ada data win rate untuk ${pasaran}.\nInput hasil prediksi terlebih dahulu.`);
        return;
      }

      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      let message = `
${icon} *WIN RATE ${pasaran}*
━━━━━━━━━━━━━━━━━━━━

*🎯 TINGKAT AKURASI*
━━━━━━━━━━━━━━━━━━━━
🎲 AI: *${winRate.ai_percentage}* (${winRate.ai}/${winRate.total})
👑 Kepala: ${winRate.kepala_percentage} (${winRate.kepala}/${winRate.total})
🎯 Ekor: ${winRate.ekor_percentage} (${winRate.ekor}/${winRate.total})
📈 AS: ${winRate.as_percentage} (${winRate.as}/${winRate.total})
📊 KOP: ${winRate.kop_percentage} (${winRate.kop}/${winRate.total})
💎 BBFS: ${winRate.bbfs_percentage} (${winRate.bbfs}/${winRate.total})
🎰 4D: ${winRate.combinations4D_percentage} (${winRate.combinations4D}/${winRate.total})

━━━━━━━━━━━━━━━━━━━━
Total Verified: ${winRate.total} prediksi
📅 Updated: Real-time

💡 _Semakin banyak data, semakin akurat tracking!_
      `;

      this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error showing win rate:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat menampilkan win rate.');
    }
  }

  addSchedule(chatId, pasaran, time) {
    try {
      const result = this.scheduler.addSubscriber(chatId, pasaran, time);

      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';
      const timeLabel = time.charAt(0).toUpperCase() + time.slice(1);

      this.bot.sendMessage(chatId, `✅ *Jadwal ditambahkan!*\n\n${icon} ${pasaran} - ${timeLabel}\n\nAnda akan menerima prediksi otomatis setiap hari.`, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      this.bot.sendMessage(chatId, '❌ Gagal menambahkan jadwal.');
    }
  }

  removeSchedule(chatId, pasaran) {
    try {
      const result = this.scheduler.removeSubscriber(chatId, pasaran);

      if (result.success) {
        this.bot.sendMessage(chatId, `✅ Jadwal ${pasaran} dihapus.`);
      } else {
        this.bot.sendMessage(chatId, `⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error('Error removing schedule:', error);
      this.bot.sendMessage(chatId, '❌ Gagal menghapus jadwal.');
    }
  }

  exportData(chatId, pasaran) {
    try {
      this.bot.sendMessage(chatId, `⏳ Exporting data ${pasaran}...`);

      const history = storage.getHistory(pasaran);
      const predictions = storage.getPredictions(pasaran);
      const winRate = storage.getWinRates(pasaran);

      if (history.length === 0) {
        this.bot.sendMessage(chatId, `⚠️ Tidak ada data untuk di-export.`);
        return;
      }

      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      let content = `EXPORT DATA ${pasaran}\n`;
      content += `═══════════════════════════════════════\n`;
      content += `Generated: ${new Date().toLocaleString('id-ID')}\n`;
      content += `Total History: ${history.length} draw\n`;
      content += `Total Predictions: ${predictions.length}\n\n`;

      content += `HISTORY DATA\n`;
      content += `───────────────────────────────────────\n`;
      history.forEach((h, i) => {
        const date = new Date(h.date).toLocaleDateString('id-ID');
        content += `${i + 1}. ${date} - ${h.result.toString().padStart(4, '0')}\n`;
      });

      if (winRate && winRate.total > 0) {
        content += `\n\nWIN RATE\n`;
        content += `───────────────────────────────────────\n`;
        content += `AI: ${winRate.ai_percentage}\n`;
        content += `Kepala: ${winRate.kepala_percentage}\n`;
        content += `Ekor: ${winRate.ekor_percentage}\n`;
        content += `AS: ${winRate.as_percentage}\n`;
        content += `KOP: ${winRate.kop_percentage}\n`;
        content += `BBFS: ${winRate.bbfs_percentage}\n`;
        content += `4D: ${winRate.combinations4D_percentage}\n`;
        content += `Total Verified: ${winRate.total}\n`;
      }

      content += `\n\n═══════════════════════════════════════\n`;
      content += `Togel Prediction Bot V2\n`;

      const filename = `${pasaran}_export_${Date.now()}.txt`;
      const filePath = storage.exportToFile(filename, content);

      if (filePath && fs.existsSync(filePath)) {
        this.bot.sendDocument(chatId, filePath, {
          caption: `${icon} *Export Data ${pasaran}*\n\n📊 ${history.length} draw\n📅 ${new Date().toLocaleDateString('id-ID')}`,
          parse_mode: 'Markdown'
        }).then(() => {
          console.log(`✅ Export sent: ${filename}`);
        }).catch(err => {
          console.error('Error sending document:', err);
          this.bot.sendMessage(chatId, '❌ Gagal mengirim file export.');
        });
      } else {
        this.bot.sendMessage(chatId, '❌ Gagal membuat file export.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat export.');
    }
  }

  saveResult(chatId, pasaran, result) {
    try {
      const saveResult = storage.addHistory(pasaran, result);
      const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

      if (saveResult === true || (saveResult.success !== false)) {
        const winRate = storage.getWinRates(pasaran);
        let msg = `✅ *Data Berhasil Disimpan!*\n\n`;
        msg += `${icon} *${pasaran}*\n`;
        msg += `🎯 Result: *${result.toString().padStart(4, '0')}*\n`;
        msg += `📅 ${new Date().toLocaleDateString('id-ID')}\n\n`;
        msg += `📊 Total data ${pasaran}: ${storage.getHistory(pasaran).length}/16\n`;

        if (winRate && winRate.total > 0) {
          msg += `\n🎯 *Win Rate Update:*\n`;
          msg += `AI: ${winRate.ai_percentage}\n`;
          msg += `Verified: ${winRate.total} prediksi`;
        }

        this.bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } else if (saveResult.duplicate) {
        this.bot.sendMessage(chatId, `⚠️ *Data Duplikat!*\n\n${icon} ${pasaran}: ${result.toString().padStart(4, '0')}\n\n${saveResult.message}`, { parse_mode: 'Markdown' });
      } else {
        this.bot.sendMessage(chatId, '❌ Gagal menyimpan data!');
      }
    } catch (error) {
      console.error('Error saving result:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat menyimpan data.');
    }
  }

  handleForwardedMessage(msg) {
    const chatId = msg.chat.id;
    const text = msg.text || msg.caption;

    if (!text) return;

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa input data result.\nHubungi admin untuk mendapatkan akses.', { parse_mode: 'Markdown' });
      return;
    }

    try {
      const datePattern = /(\d{1,2})[\s-]+(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER|JANUARI|FEBRUARI|MARET|APRIL|MEI|JUNI|JULI|AGUSTUS|SEPTEMBER|OKTOBER|NOVEMBER|DESEMBER)[\s-]+(\d{4})/i;
      const dateMatch = text.match(datePattern);

      let parsedDate = null;
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const monthMap = {
          'JANUARY': 0, 'FEBRUARY': 1, 'MARCH': 2, 'APRIL': 3,
          'MAY': 4, 'JUNE': 5, 'JULY': 6, 'AUGUST': 7,
          'SEPTEMBER': 8, 'OCTOBER': 9, 'NOVEMBER': 10, 'DECEMBER': 11,
          'JANUARI': 0, 'FEBRUARI': 1, 'MARET': 2, 'APRIL': 3,
          'MEI': 4, 'JUNI': 5, 'JULI': 6, 'AGUSTUS': 7,
          'SEPTEMBER': 8, 'OKTOBER': 9, 'NOVEMBER': 10, 'DESEMBER': 11
        };
        const month = monthMap[dateMatch[2].toUpperCase()];
        const year = parseInt(dateMatch[3]);
        parsedDate = new Date(year, month, day);
      }

      let pasaran = null;
      if (text.match(/SINGAPORE|SGP/i)) pasaran = 'SGP';
      else if (text.match(/HONGKONG|HONG\s*KONG|HK/i)) pasaran = 'HK';
      else if (text.match(/SYDNEY|SDY/i)) pasaran = 'SDY';

      const prizePattern = /(?:PRIZE\s*1|WINNER)\s*[:=\s]+(\d{4})/i;
      const prizeMatch = text.match(prizePattern);

      let result = null;
      if (prizeMatch) {
        result = parseInt(prizeMatch[1]);
      }

      if (pasaran && result) {
        const saveResult = storage.addHistoryWithDate(pasaran, result, parsedDate);
        const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

        if (saveResult === true || (saveResult.success !== false)) {
          let responseMsg = '✅ *Data Berhasil Tersimpan!*\n\n';
          responseMsg += `${icon} *${pasaran}*\n`;
          responseMsg += `🎯 PRIZE 1: *${result.toString().padStart(4, '0')}*\n`;

          if (parsedDate) {
            responseMsg += `📅 ${parsedDate.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}\n`;
          } else {
            responseMsg += `📅 ${new Date().toLocaleDateString('id-ID')}\n`;
          }

          responseMsg += `\n📊 Total data ${pasaran}: ${storage.getHistory(pasaran).length}/16`;

          this.bot.sendMessage(chatId, responseMsg, { parse_mode: 'Markdown' });
          return;
        } else if (saveResult.duplicate) {
          this.bot.sendMessage(chatId, `⚠️ *Data Duplikat!*\n\n${icon} ${pasaran}: ${result.toString().padStart(4, '0')}\n\n${saveResult.message}`, { parse_mode: 'Markdown' });
          return;
        }
      }

      const patterns = [
        /(?:SGP|SINGAPORE)[:\s-]+(\d{3,4})/i,
        /(?:HK|HONGKONG)[:\s-]+(\d{3,4})/i,
        /(?:SDY|SYDNEY)[:\s-]+(\d{3,4})/i
      ];

      let parsed = [];
      patterns.forEach((pattern, index) => {
        const match = text.match(pattern);
        if (match) {
          const p = index === 0 ? 'SGP' : index === 1 ? 'HK' : 'SDY';
          const r = parseInt(match[1]);
          parsed.push({ pasaran: p, result: r });
        }
      });

      if (parsed.length > 0) {
        let responseMsg = '';
        let savedCount = 0;
        let duplicateCount = 0;

        parsed.forEach(({ pasaran, result }) => {
          const saveResult = storage.addHistory(pasaran, result);
          const icon = pasaran === 'SGP' ? '🇸🇬' : pasaran === 'HK' ? '🇭🇰' : '🇦🇺';

          if (saveResult === true || (saveResult.success !== false)) {
            responseMsg += `✅ ${icon} *${pasaran}*: ${result.toString().padStart(4, '0')}\n`;
            savedCount++;
          } else if (saveResult.duplicate) {
            responseMsg += `⚠️ ${icon} *${pasaran}*: ${result.toString().padStart(4, '0')} (duplikat)\n`;
            duplicateCount++;
          }
        });

        if (savedCount > 0) {
          responseMsg = `📥 *${savedCount} Data Tersimpan*\n\n` + responseMsg;
        }
        if (duplicateCount > 0) {
          responseMsg += `\n⚠️ ${duplicateCount} data duplikat dilewati`;
        }

        responseMsg += `\n📅 ${new Date().toLocaleDateString('id-ID')}`;

        this.bot.sendMessage(chatId, responseMsg, { parse_mode: 'Markdown' });
        return;
      }

      const simpleMatch = text.match(/\b(\d{4})\b/);

      if (simpleMatch) {
        const keyboard = {
          inline_keyboard: [
            [
              { text: '🇸🇬 SGP', callback_data: `save_SGP_${simpleMatch[1]}` },
              { text: '🇭🇰 HK', callback_data: `save_HK_${simpleMatch[1]}` }
            ],
            [
              { text: '🇦🇺 SDY', callback_data: `save_SDY_${simpleMatch[1]}` }
            ],
            [
              { text: '❌ Cancel', callback_data: 'cancel' }
            ]
          ]
        };

        this.bot.sendMessage(chatId, `🎯 Angka terdeteksi: *${simpleMatch[1]}*\n\nPilih pasaran:`, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        this.bot.sendMessage(chatId,
          '⚠️ *Tidak dapat parse data!*\n\n' +
          'Format yang didukung:\n' +
          '• Forward pesan dengan format PRIZE 1\n' +
          '• SGP: 1234\n' +
          '• Atau gunakan /input SGP 1234',
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      console.error('Error handling forwarded message:', error);
      this.bot.sendMessage(chatId, '❌ Terjadi kesalahan saat memproses pesan.');
    }
  }

  handleAddAdmin(msg, match) {
    const chatId = msg.chat.id;
    const targetId = parseInt(match[1]);

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa menambah admin baru.', { parse_mode: 'Markdown' });
      return;
    }

    if (storage.addAdmin(targetId)) {
      this.bot.sendMessage(chatId, `✅ *Admin Ditambahkan!*\n\nUser ID: \`${targetId}\`\n\nSekarang user ini bisa input data result.`, { parse_mode: 'Markdown' });

      this.bot.sendMessage(targetId, '🎉 *Selamat!*\n\nAnda telah ditambahkan sebagai admin bot.\nAnda sekarang bisa input data result togel.', { parse_mode: 'Markdown' }).catch(() => {
        console.log(`Cannot send message to new admin ${targetId}`);
      });
    } else {
      this.bot.sendMessage(chatId, `⚠️ User ID \`${targetId}\` sudah admin.`, { parse_mode: 'Markdown' });
    }
  }

  handleRemoveAdmin(msg, match) {
    const chatId = msg.chat.id;
    const targetId = parseInt(match[1]);

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa menghapus admin.', { parse_mode: 'Markdown' });
      return;
    }

    if (targetId === chatId) {
      this.bot.sendMessage(chatId, '❌ Tidak bisa menghapus diri sendiri sebagai admin!');
      return;
    }

    if (storage.removeAdmin(targetId)) {
      this.bot.sendMessage(chatId, `✅ *Admin Dihapus!*\n\nUser ID: \`${targetId}\`\n\nUser ini tidak bisa lagi input data result.`, { parse_mode: 'Markdown' });

      this.bot.sendMessage(targetId, '⚠️ *Akses Admin Dicabut*\n\nAnda tidak lagi memiliki akses admin.\nTerima kasih atas kontribusinya.', { parse_mode: 'Markdown' }).catch(() => {
        console.log(`Cannot send message to removed admin ${targetId}`);
      });
    } else {
      this.bot.sendMessage(chatId, `⚠️ User ID \`${targetId}\` bukan admin.`, { parse_mode: 'Markdown' });
    }
  }

  handleListAdmins(msg) {
    const chatId = msg.chat.id;

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa melihat daftar admin.', { parse_mode: 'Markdown' });
      return;
    }

    const admins = storage.getAdmins();

    if (admins.length === 0) {
      this.bot.sendMessage(chatId, '⚠️ Belum ada admin terdaftar.\n\nGunakan /addadmin <user_id> untuk menambah admin pertama.');
      return;
    }

    let message = '👥 *DAFTAR ADMIN*\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';

    admins.forEach((adminId, index) => {
      message += `${index + 1}. User ID: \`${adminId}\`\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Total: ${admins.length} admin\n\n`;
    message += '*Commands:*\n';
    message += '• `/addadmin <user_id>` - Tambah admin\n';
    message += '• `/removeadmin <user_id>` - Hapus admin\n';
    message += '• `/admins` - Lihat daftar admin';

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
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

  async handleScrapeMenu(msg) {
    const chatId = msg.chat.id;

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa menggunakan scraper.', { parse_mode: 'Markdown' });
      return;
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '🌐 Scrape Semua Pasaran', callback_data: 'scrape_all' }],
        [
          { text: '🇸🇬 Scrape SGP', callback_data: 'scrape_SGP' },
          { text: '🇭🇰 Scrape HK', callback_data: 'scrape_HK' }
        ],
        [{ text: '🇦🇺 Scrape SDY', callback_data: 'scrape_SDY' }],
        [{ text: '⚙️ Lihat Konfigurasi', callback_data: 'scrape_status' }],
        [{ text: '🔙 Menu Utama', callback_data: 'main_menu' }]
      ]
    };

    const message = '🌐 *WEB SCRAPER*\n' +
      '━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Scraper akan otomatis mengambil data dari website dan update database.\n\n' +
      '*Fitur:*\n' +
      '• Auto-deteksi data baru\n' +
      '• Skip duplikat otomatis\n' +
      '• Support SGP, HK, SDY\n\n' +
      'Pilih aksi:';

    this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleScrapeConfig(msg) {
    const chatId = msg.chat.id;

    if (!storage.isAdmin(chatId)) {
      this.bot.sendMessage(chatId, '❌ *Akses Ditolak!*\n\nHanya admin yang bisa melihat konfigurasi scraper.', { parse_mode: 'Markdown' });
      return;
    }

    const status = ScraperService.getScraperStatus();

    let message = '⚙️ *KONFIGURASI SCRAPER*\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';

    for (const [pasaran, info] of Object.entries(status)) {
      const emoji = info.configured ? '✅' : '❌';
      message += `${emoji} *${pasaran}* - ${info.name}\n`;
      if (info.configured) {
        message += `   URL: \`${info.url}\`\n`;
        if (info.offDays && info.offDays.length > 0) {
          const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
          const offDayNames = info.offDays.map(d => days[d]).join(', ');
          message += `   Off Days: ${offDayNames}\n`;
        }
      } else {
        message += `   ⚠️ URL belum dikonfigurasi\n`;
      }
      message += '\n';
    }

    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += '*Note:* URL disimpan di `config/scraper_config.json`\n';
    message += 'Edit file tersebut jika URL berubah.';

    this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async executeScrape(chatId, pasaran = null) {
    const loadingMsg = await this.bot.sendMessage(chatId, '⏳ Scraping data...');

    try {
      let result;
      
      if (pasaran) {
        const config = ScraperService.getConfig();
        const url = config.urls[pasaran];
        
        if (!url) {
          this.bot.editMessageText(`❌ URL untuk ${pasaran} belum dikonfigurasi!`, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
          });
          return;
        }

        result = await ScraperService.scrapeTogelData(url, pasaran);
        
        if (result.success && result.data.length > 0) {
          const importResult = storage.importScrapedData(result.data);
          
          let message = `✅ *SCRAPING ${pasaran} SELESAI!*\n`;
          message += '━━━━━━━━━━━━━━━━━━━━\n\n';
          message += `📊 Data ditemukan: ${result.count}\n`;
          message += `✨ Data baru: ${importResult.newCount}\n`;
          message += `♻️ Duplikat (skip): ${importResult.duplicateCount}\n\n`;
          
          if (importResult.newCount > 0) {
            message += '*Preview data baru:*\n';
            importResult.imported.slice(0, 3).forEach(item => {
              const date = new Date(item.date).toLocaleDateString('id-ID');
              message += `• ${date}: ${item.result}\n`;
            });
          }

          this.bot.editMessageText(message, {
            chat_id: chatId,
            message_id: loadingMsg.message_id,
            parse_mode: 'Markdown'
          });
        } else {
          this.bot.editMessageText(`⚠️ Tidak ada data ditemukan untuk ${pasaran}\n\nError: ${result.error || 'Unknown'}`, {
            chat_id: chatId,
            message_id: loadingMsg.message_id
          });
        }
      } else {
        result = await ScraperService.scrapeAll();
        
        let message = '✅ *SCRAPING SEMUA PASARAN SELESAI!*\n';
        message += '━━━━━━━━━━━━━━━━━━━━\n\n';

        let totalNew = 0;
        let totalDup = 0;

        for (const [pasaran, res] of Object.entries(result.results)) {
          if (res.success && res.data.length > 0) {
            const importResult = storage.importScrapedData(res.data);
            totalNew += importResult.newCount;
            totalDup += importResult.duplicateCount;

            const emoji = importResult.newCount > 0 ? '✨' : '♻️';
            message += `${emoji} *${pasaran}*: ${importResult.newCount} baru, ${importResult.duplicateCount} skip\n`;
          } else {
            message += `❌ *${pasaran}*: ${res.error || 'Gagal'}\n`;
          }
        }

        message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
        message += `📊 Total data baru: ${totalNew}\n`;
        message += `♻️ Total duplikat: ${totalDup}`;

        this.bot.editMessageText(message, {
          chat_id: chatId,
          message_id: loadingMsg.message_id,
          parse_mode: 'Markdown'
        });
      }
    } catch (error) {
      this.bot.editMessageText(`❌ Error saat scraping:\n\n${error.message}`, {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
    }
  }

  async autoScrapeOnStartup() {
    const scraperConfig = ScraperService.getConfig();
    
    if (!scraperConfig.autoScrape || !scraperConfig.autoScrape.enabled) {
      console.log('⏭️  Auto-scrape disabled in config\n');
      return;
    }

    console.log('🔄 Auto-scraping data on startup...\n');
    
    try {
      const result = await ScraperService.scrapeAll();
      
      let totalNew = 0;
      let totalData = 0;
      
      for (const [pasaran, res] of Object.entries(result.results)) {
        if (res.success && res.data.length > 0) {
          const importResult = storage.importScrapedData(res.data);
          totalNew += importResult.newCount;
          totalData += res.count;
          
          console.log(`   ✅ ${pasaran}: ${importResult.newCount} data baru dari ${res.count} hasil scrape`);
        } else {
          console.log(`   ❌ ${pasaran}: ${res.error || 'Gagal scrape'}`);
        }
      }
      
      console.log(`\n📊 Total: ${totalNew} data baru ditambahkan dari ${totalData} hasil scrape\n`);
    } catch (error) {
      console.error('❌ Auto-scrape error:', error.message);
    }
  }

  start() {
    console.log('🤖 Togel Prediction Bot V2 is running...');
    console.log(`📍 Pasaran: ${config.app.supportedPasaran.join(', ')}`);
    console.log(`✨ Features: Prediction, Backtest, Win Rate, Scheduler, Export, Auto-Scraper\n`);
  }

  stop() {
    this.scheduler.stopAll();
    this.bot.stopPolling();
    console.log('🛑 Bot stopped');
  }
}

module.exports = TelegramBotHandler;
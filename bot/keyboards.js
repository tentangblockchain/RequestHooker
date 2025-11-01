class KeyboardHelper {
  static getPasaranKeyboard(action = 'pred') {
    return {
      inline_keyboard: [
        [
          { text: '🇸🇬 SGP', callback_data: `${action}_SGP` },
          { text: '🇭🇰 HK', callback_data: `${action}_HK` }
        ],
        [
          { text: '🇦🇺 SDY', callback_data: `${action}_SDY` }
        ]
      ]
    };
  }

  static getMainMenu() {
    return {
      inline_keyboard: [
        [
          { text: '🎯 Prediksi', callback_data: 'menu_prediksi' },
          { text: '📊 History', callback_data: 'menu_history' }
        ],
        [
          { text: '📈 Statistik', callback_data: 'menu_stats' },
          { text: '🎯 Backtest', callback_data: 'menu_backtest' }
        ],
        [
          { text: '⏰ Auto Prediksi', callback_data: 'menu_schedule' },
          { text: '💾 Export', callback_data: 'menu_export' }
        ],
        [
          { text: '📍 Info Pasaran', callback_data: 'menu_list' }
        ]
      ]
    };
  }

  static getScheduleTimeKeyboard(pasaran) {
    return {
      inline_keyboard: [
        [
          { text: '🌅 Pagi (09:00)', callback_data: `sched_${pasaran}_pagi` }
        ],
        [
          { text: '☀️ Siang (14:00)', callback_data: `sched_${pasaran}_siang` }
        ],
        [
          { text: '🌙 Malam (20:00)', callback_data: `sched_${pasaran}_malam` }
        ],
        [
          { text: '❌ Batalkan', callback_data: 'cancel' }
        ]
      ]
    };
  }

  static getBacktestSizeKeyboard(pasaran) {
    return {
      inline_keyboard: [
        [
          { text: '10 Draw', callback_data: `btest_${pasaran}_10` },
          { text: '20 Draw', callback_data: `btest_${pasaran}_20` }
        ],
        [
          { text: '30 Draw', callback_data: `btest_${pasaran}_30` },
          { text: '50 Draw', callback_data: `btest_${pasaran}_50` }
        ],
        [
          { text: '❌ Batalkan', callback_data: 'cancel' }
        ]
      ]
    };
  }

  static getConfirmKeyboard(action, data) {
    return {
      inline_keyboard: [
        [
          { text: '✅ Ya', callback_data: `confirm_${action}_${data}` },
          { text: '❌ Tidak', callback_data: 'cancel' }
        ]
      ]
    };
  }
}

module.exports = KeyboardHelper;

# Togel Telegram Bot V2 - AI Prediction with Statistics

## Overview
Bot Telegram untuk prediksi togel dengan analisis statistik mendalam, machine learning sederhana, dan tracking akurasi real-time.

## Recent Changes (November 1, 2025)
### Major Update V2 - Migration to Full Telegram Bot
- ✅ Removed all CLI components (index.js, cli folder, CLI dependencies)
- ✅ Implemented Backtesting System untuk validasi akurasi
- ✅ Added Prediction Tracking - simpan prediksi vs hasil aktual
- ✅ Improved Pattern Analysis dengan Markov Chain & Conditional Probability
- ✅ Removed duplicate formulas (kept 10 unique formulas)
- ✅ Added Auto Scheduler untuk prediksi terjadwal (pagi/siang/malam)
- ✅ Win Rate Tracking per pasaran
- ✅ Export data via Telegram
- ✅ Improved error handling & validation
- ✅ Statistical methods: Markov Chain, smoothing, trend detection
- ✅ Confidence levels based on data quantity
- ✅ **Web Scraper Integration** - Auto import data dari website
- ✅ **Data Retention: 90 hari** (upgraded dari 16 hari untuk akurasi lebih baik)

## Project Architecture

### Directory Structure
```
.
├── bot/
│   ├── telegram.js          # Main bot handler
│   ├── keyboards.js         # Inline keyboard helpers
│   └── scheduler.js         # Auto prediction scheduler
├── services/
│   ├── prediction.js        # AI prediction engine
│   ├── backtesting.js       # Backtest & validation
│   └── storage.js           # Data persistence & tracking
├── utils/
│   ├── formulas.js          # 10 optimized formulas
│   ├── pattern.js           # Pattern analysis
│   └── statistics.js        # Markov Chain & statistics
├── config/
│   └── config.js            # Configuration
├── data/
│   ├── togel_data.json      # History & predictions
│   └── scheduler.json       # Scheduler subscriptions
├── exports/                 # Exported files
├── bot.js                   # Main entry point
└── package.json             # Dependencies
```

### Key Features V2

#### 1. **Advanced Prediction Engine**
- Markov Chain for digit sequence prediction
- Conditional Probability analysis
- Weighted predictions from multiple methods
- Trend detection (increasing/decreasing/stable)
- Hot/Cold number analysis with smoothing
- BBFS generated from predicted digits (not random)
- 4D combinations dari AS, KOP, Kepala, Ekor predictions

#### 2. **Backtesting System**
- Test akurasi dengan data historis
- Configurable test size (10-50 draw)
- Accuracy per category (AI, Kepala, Ekor, AS, KOP, BBFS, 4D)
- Formula effectiveness ranking
- Statistical validation

#### 3. **Win Rate Tracking**
- Real-time accuracy tracking
- Automatic verification saat input hasil
- Per-category hit rates
- Percentage calculations
- Historical tracking

#### 4. **Auto Scheduler**
- Scheduled predictions: Pagi (09:00), Siang (14:00), Malam (20:00)
- Per-user subscriptions
- Per-pasaran configuration
- Persistent storage
- Automatic notifications

#### 5. **Export Functionality**
- Complete data export
- History, predictions, win rates
- Text format
- Direct Telegram file upload

#### 6. **Improved Formulas**
Removed duplicates, kept 10 unique:
- Mistik, ML, IX, M1, M3, M5, M7, M8, M9, TY

## Bot Commands

### Main Commands
- `/start` - Welcome message & intro
- `/menu` - Interactive main menu
- `/help` - Complete guide
- `/prediksi` - Generate prediction
- `/backtest` - Test prediction accuracy
- `/winrate` - View hit rate statistics
- `/schedule` - Setup auto predictions
- `/export` - Export data
- `/input SGP 1234` - Input result manually
- `/history` - View past results
- `/stats` - View statistics
- `/list` - View all pasaran status

### Interactive Menu Features
- 🎯 Prediksi - AI-powered predictions
- 📊 History - Past results
- 📈 Statistik - Pattern analysis
- 🎯 Backtest - Accuracy validation
- ⏰ Auto Prediksi - Scheduled predictions
- 💾 Export - Data export
- 📍 Info Pasaran - Pasaran status

## Prediction Methods

### Statistical Analysis
1. **Markov Chain**: Predicts next digit based on transition probabilities
2. **Conditional Probability**: Frequency-based prediction
3. **Weighted Combination**: Combines multiple methods with weights
4. **Trend Detection**: Identifies increasing/decreasing patterns
5. **Smoothing**: Reduces noise in frequency data

### Confidence Levels
- **Very Low** (<5 data): 🔴 Prediksi mungkin tidak akurat
- **Low** (5-9 data): 🟠 Butuh lebih banyak data
- **Medium** (10-19 data): 🟡 Cukup baik
- **High** (20-49 data): 🟢 Akurasi bagus
- **Very High** (50+ data): 🔵 Akurasi optimal

## Data Management

### Automatic Features
- Prediction tracking saat generate prediksi
- Auto verification saat input hasil
- Win rate update otomatis
- Scheduler subscription persistence

### Data Files
- `data/togel_data.json` - History, predictions, tracking, win rates
- `data/scheduler.json` - User subscriptions
- `exports/` - Generated export files

## Supported Pasaran
- 🇸🇬 **SGP** (Singapore)
- 🇭🇰 **HK** (Hong Kong)
- 🇦🇺 **SDY** (Sydney)

## Input Methods

### Manual Input
```
/input SGP 1234
/input HK 5678
/input SDY 9012
```

### Forward Messages
Bot can auto-parse forwarded messages containing:
- "PRIZE 1: 1234"
- "SGP: 1234"
- Date formats (English/Indonesian)
- 4-digit numbers with selection menu

## Technical Details

### Dependencies
- `node-telegram-bot-api` - Telegram bot framework
- `node-cron` - Scheduler
- `lodash` - Utilities
- `dotenv` - Environment variables

### Environment Variables
- `TELEGRAM_BOT_TOKEN` - Bot token dari @BotFather

### Performance
- Efficient data storage (JSON)
- Optimized prediction algorithms
- Parallel statistical calculations
- Minimal memory footprint

## Best Practices

### For Users
1. Input minimal 10 data untuk hasil terbaik
2. Update hasil secara konsisten
3. Check backtest untuk validasi
4. Monitor win rate secara berkala
5. Gunakan scheduler untuk konsistensi

### For Development
1. All predictions tracked automatically
2. Win rates update on each result input
3. Scheduler runs as cron jobs
4. Error handling pada semua operations
5. Logging untuk debugging

## Accuracy Improvement Strategy

### Data Quality
- Semakin banyak data historis, semakin akurat prediksi
- Minimal 10 data untuk statistical significance
- Optimal di 20+ data

### Validation
- Gunakan backtest untuk test akurasi
- Monitor win rate trends
- Compare different time periods
- Adjust strategies based on results

## Disclaimer
Tool ini untuk referensi dan pembelajaran. Prediksi tidak menjamin hasil. Gunakan dengan bijak dan bertanggung jawab!

## Version History
- **V2.0.0** (Nov 1, 2025) - Major upgrade: Full Telegram bot, AI/Statistics, Backtesting, Win Rate Tracking
- **V1.0.0** - Initial CLI version

# Togel Prediction Bot - Telegram Bot

Telegram bot untuk prediksi togel otomatis dengan analisis pattern dan berbagai rumus transformasi.

## Fitur

- 🎯 Generate AI (Angka Ikut) 5 Digit
- 🔢 Prediksi Kepala & Ekor
- 🎲 Prediksi AS & KOP
- 📊 BBFS (Bolak-Balik Full Set)
- 🧮 16 Rumus: Mistik, ML, IX, MB, MC, M0-M9, TY
- 📈 Pattern Analyzer (Hot/Cold Numbers)
- 💾 History Tracking
- 📱 Interactive Telegram Interface

## Setup Bot Telegram

### 1. Buat Bot Telegram

1. Chat dengan [@BotFather](https://t.me/botfather) di Telegram
2. Kirim command `/newbot`
3. Ikuti instruksi untuk beri nama bot
4. Copy **Bot Token** yang diberikan

### 2. Set Environment Variable

Di Replit:
1. Klik tab **Secrets** (🔒 ikon kunci)
2. Tambahkan secret baru:
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: Token bot Anda

Atau buat file `.env`:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Jalankan Bot

```bash
npm start
```

## Cara Pakai Bot

### Command Telegram

**Start Bot:**
```
/start - Mulai bot dan lihat menu
/help - Panduan penggunaan
```

**Generate Prediksi:**
```
/prediksi - Pilih pasaran (SGP/HK/SDY)
```

**Input Hasil:**
```
/input SGP 1234
/input HK 5678
/input SDY 9012
```

**Lihat Data:**
```
/history - Pilih pasaran untuk history
/stats - Pilih pasaran untuk statistik
/list - Info semua pasaran
```

## Output Prediksi

Bot akan memberikan:

### Prediksi Utama
- **AI (Angka Ikut)**: 5 digit prediksi
- **Kepala & Ekor**: Prediksi 2D
- **AS & KOP**: Untuk 4D
- **BBFS**: 7 digit kombinasi
- **Top 10 Line 4D**: Kombinasi terbaik

### Analisis
- **Hot/Cold Numbers**: Angka panas & dingin
- **Pattern**: Ganjil/Genap, Besar/Kecil
- **Frequency**: Kepala & Ekor favorit

## Pasaran yang Didukung

- 🇸🇬 **SGP** (Singapore)
- 🇭🇰 **HK** (Hong Kong)  
- 🇦🇺 **SDY** (Sydney)

## Tips Penggunaan

1. **Input Data Rutin**: Semakin banyak data history, semakin akurat prediksi
2. **Minimal 5 Data**: Untuk hasil terbaik
3. **Gunakan /stats**: Untuk analisis mendalam
4. **Interactive Buttons**: Klik button untuk lebih mudah

## Struktur Data

Data disimpan di `./data/togel_data.json` dengan format:
- history: Array of results
- predictions: Array of generated predictions

## Development

### CLI Mode (untuk testing)
```bash
npm run cli
```

### Bot Mode
```bash
npm start
```

## Tech Stack

- Node.js
- node-telegram-bot-api
- Lodash (utilities)
- JSON file storage

## Disclaimer

⚠️ Tool ini hanya untuk referensi dan pembelajaran. Gunakan dengan bijak dan bertanggung jawab!

## Support

Jika ada masalah dengan bot:
1. Pastikan bot token sudah benar
2. Cek bot sudah running (`npm start`)
3. Pastikan bot tidak di-block di Telegram

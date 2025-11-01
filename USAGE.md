# Panduan Penggunaan Togel CLI

## Quick Start

### 1. Interactive Menu (Paling Mudah)
```bash
npm start
```
Atau:
```bash
node index.js
```

Menu interaktif akan muncul dengan pilihan:
- 🎯 Generate Prediksi
- 📝 Input Hasil Togel
- 📊 Lihat History
- 📈 Lihat Statistik
- 💾 Export Prediksi
- 📍 List Pasaran

### 2. Command Line (Lebih Cepat)

**Generate Prediksi:**
```bash
node index.js prediksi SGP
node index.js prediksi HK
node index.js prediksi SDY
```

**Input Hasil:**
```bash
node index.js input SGP 1234
node index.js input HK 5678
```

**Lihat History:**
```bash
node index.js history SGP
node index.js history HK --limit 20
```

**Statistik & Analisis:**
```bash
node index.js stats SGP
```

**Export ke File:**
```bash
node index.js export SGP
```
File akan disimpan di folder `exports/`

**List Pasaran:**
```bash
node index.js list
```

## Output Prediksi

Setiap prediksi akan menampilkan:

### Prediksi Utama
- **AI (Angka Ikut)**: 5 digit prediksi utama
- **Kepala**: Prediksi digit kepala
- **Ekor**: Prediksi digit ekor
- **AS (Ribuan)**: Digit ribuan untuk 4D
- **KOP (Ratusan)**: Digit ratusan untuk 4D
- **BBFS**: Bolak-Balik Full Set (7 digit)
- **Top 4D**: 10 kombinasi 4D terbaik

### Rumus Transformasi (16 Rumus)
- Mistik, ML, IX, MB, MC
- M0, M1, M2, M3, M4, M5, M6, M7, M8, M9
- TY

### Analisis Pattern
- **Hot Numbers**: 5 angka paling sering keluar
- **Cold Numbers**: 5 angka paling jarang keluar
- **Ganjil vs Genap**: Perbandingan hasil
- **Besar vs Kecil**: Trend angka besar (5-9) vs kecil (0-4)

## Tips Penggunaan

1. **Input Data Rutin**: Semakin banyak data history, semakin akurat prediksi
2. **Minimal 5 Data**: Untuk hasil terbaik, input minimal 5 hasil sebelumnya
3. **Export Prediksi**: Simpan prediksi untuk tracking akurasi
4. **Lihat Statistik**: Gunakan stats untuk analisis mendalam

## Pasaran yang Didukung
- SGP (Singapore)
- HK (Hong Kong)
- SDY (Sydney)

## Data Storage
Semua data disimpan otomatis di:
- `data/togel_data.json` - History dan prediksi
- `exports/` - File prediksi yang di-export

## Contoh Workflow

1. Input hasil kemarin:
   ```bash
   node index.js input SGP 1234
   ```

2. Generate prediksi hari ini:
   ```bash
   node index.js prediksi SGP
   ```

3. Lihat statistik:
   ```bash
   node index.js stats SGP
   ```

4. Export hasil:
   ```bash
   node index.js export SGP
   ```

## Disclaimer
⚠️ Tool ini hanya untuk referensi dan pembelajaran. Hasil prediksi tidak menjamin kemenangan. Gunakan dengan bijak dan bertanggung jawab!

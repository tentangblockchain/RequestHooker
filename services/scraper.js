const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class ScraperService {
  static getConfig() {
    try {
      const configPath = path.join(__dirname, '../config/scraper_config.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      return {
        urls: {},
        schedules: {},
        autoScrape: { enabled: false }
      };
    }
  }

  static async scrapeTogelData(url, pasaran) {
    try {
      console.log(`   📍 Scraping ${url}...`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status === 403) {
        console.log(`   ❌ Access forbidden (403)`);
        throw new Error('Access forbidden (403)');
      }

      if (response.status !== 200) {
        console.log(`   ⚠️  HTTP ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`   ✅ Response OK (${response.status})`);

      const $ = cheerio.load(response.data);
      const results = [];

      // Parse table dengan class "table table-bordered theTable legend"
      $('table.theTable tbody tr').each((index, element) => {
        const tds = $(element).find('td');
        
        // Format: Periode | Hari | Tanggal | Nomor | Nomor 2 | Nomor 3
        // Index: 0=Periode, 1=Hari, 2=Tanggal, 3=Nomor (4D utama)
        if (tds.length >= 4) {
          const periode = $(tds[0]).text().trim();
          const hari = $(tds[1]).text().trim();
          const tanggalRaw = $(tds[2]).text().trim(); // "2025-10-31 | 23:18:13"
          const nomor = $(tds[3]).text().trim(); // "2624"

          // Extract tanggal saja (YYYY-MM-DD) dari format "2025-10-31 | 23:18:13"
          const tanggal = tanggalRaw.split('|')[0].trim(); // "2025-10-31"
          
          // Validasi nomor 4 digit
          if (nomor && nomor.length === 4 && /^\d{4}$/.test(nomor)) {
            results.push({
              pasaran: pasaran.toUpperCase(),
              date: new Date(tanggal).toISOString(), // Parse langsung dari YYYY-MM-DD
              result: nomor,
              periode: periode,
              hari: hari
            });
          }
        }
      });

      return {
        success: true,
        pasaran,
        count: results.length,
        data: results
      };

    } catch (error) {
      return {
        success: false,
        pasaran,
        error: error.message,
        data: []
      };
    }
  }

  static parseVespaDate(dateStr) {
    try {
      // Format: "2025-10-31 | 23:18:13"
      const cleaned = dateStr.trim();
      const datePart = cleaned.split('|')[0].trim();
      
      // Parse YYYY-MM-DD
      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(datePart).toISOString();
      }

      return new Date(datePart).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  static parseDate(dateStr) {
    try {
      const cleaned = dateStr.trim();
      
      if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(cleaned).toISOString();
      }

      const parts = cleaned.split(/[-\/]/);
      if (parts.length === 3) {
        const year = parts[0].length === 4 ? parts[0] : parts[2];
        const month = parts[1];
        const day = parts[0].length === 4 ? parts[2] : parts[0];
        return new Date(`${year}-${month}-${day}`).toISOString();
      }

      return new Date(cleaned).toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  static async scrapeAll() {
    const config = this.getConfig();
    const urls = config.urls || {};

    const results = {};

    // Scrape one by one with delay to avoid rate limiting
    for (const [pasaran, url] of Object.entries(urls)) {
      if (url && url !== '') {
        console.log(`🔄 Scraping ${pasaran}...`);
        const result = await this.scrapeTogelData(url, pasaran);
        results[pasaran] = result;
        
        // Add 2 second delay between requests
        const pasaranKeys = Object.keys(urls);
        if (pasaranKeys.indexOf(pasaran) < pasaranKeys.length - 1) {
          console.log(`⏳ Waiting 2 seconds before next scrape...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        results[pasaran] = {
          success: false,
          pasaran,
          error: 'URL not configured in scraper_config.json',
          data: []
        };
      }
    }

    const totalSuccess = Object.values(results).filter(r => r.success).length;
    const totalData = Object.values(results).reduce((sum, r) => sum + r.count, 0);

    return {
      success: totalSuccess > 0,
      results,
      summary: {
        totalPasaran: Object.keys(urls).length,
        successCount: totalSuccess,
        totalDataScraped: totalData
      }
    };
  }

  static mergeWithExisting(existingData, scrapedData) {
    const merged = [...existingData];
    const existingKeys = new Set(
      existingData.map(item => `${item.pasaran}-${item.date}-${item.result}`)
    );

    scrapedData.forEach(item => {
      const key = `${item.pasaran}-${item.date}-${item.result}`;
      if (!existingKeys.has(key)) {
        merged.push(item);
        existingKeys.add(key);
      }
    });

    merged.sort((a, b) => {
      if (a.pasaran !== b.pasaran) {
        return a.pasaran.localeCompare(b.pasaran);
      }
      return new Date(a.date) - new Date(b.date);
    });

    return merged;
  }

  static getScraperStatus() {
    const config = this.getConfig();
    const urls = config.urls || {};
    const schedules = config.schedules || {};

    const status = {};
    for (const [pasaran, url] of Object.entries(urls)) {
      const schedule = schedules[pasaran] || {};
      status[pasaran] = {
        configured: !!(url && url !== ''),
        url: url ? url.substring(0, 50) + '...' : 'Not set',
        name: schedule.name || pasaran,
        offDays: schedule.offDays || []
      };
    }

    return status;
  }

  static async testScraper(url, pasaran) {
    const result = await this.scrapeTogelData(url, pasaran);
    
    return {
      ...result,
      preview: result.data.slice(0, 5)
    };
  }
}

module.exports = ScraperService;

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
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const results = [];

      $('table tr').each((index, element) => {
        if (index === 0) return;

        const tds = $(element).find('td');
        if (tds.length >= 3) {
          const date = $(tds[0]).text().trim();
          const periode = $(tds[1]).text().trim();
          const nomor = $(tds[2]).text().trim();

          if (date && nomor && nomor.length === 4 && /^\d{4}$/.test(nomor)) {
            results.push({
              pasaran: pasaran.toUpperCase(),
              date: this.parseDate(date),
              result: nomor,
              periode: periode
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
    const promises = [];

    for (const [pasaran, url] of Object.entries(urls)) {
      if (url && url !== '') {
        promises.push(
          this.scrapeTogelData(url, pasaran)
            .then(result => {
              results[pasaran] = result;
            })
        );
      } else {
        results[pasaran] = {
          success: false,
          pasaran,
          error: 'URL not configured in scraper_config.json',
          data: []
        };
      }
    }

    await Promise.all(promises);

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

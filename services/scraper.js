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
      // First request to get session cookie
      const baseUrl = new URL(url).origin;
      const listPage = `${baseUrl}/wap/pasaran.html`;
      
      const sessionResponse = await axios.get(listPage, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=0',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Priority': 'u=0, i'
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500
      }).catch(() => null);

      // Extract cookies
      let cookies = '';
      if (sessionResponse && sessionResponse.headers['set-cookie']) {
        cookies = sessionResponse.headers['set-cookie']
          .map(cookie => cookie.split(';')[0])
          .join('; ');
      }

      // Add delay to simulate human behavior
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Main request with session
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Connection': 'keep-alive',
          'Cache-Control': 'max-age=0',
          'Referer': listPage,
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Priority': 'u=0, i',
          'Cookie': cookies
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 500
      });

      if (response.status === 403) {
        throw new Error('Cloudflare block. Website terlalu ketat proteksinya.');
      }

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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

    // Scrape one by one with delay to avoid rate limiting
    for (const [pasaran, url] of Object.entries(urls)) {
      if (url && url !== '') {
        console.log(`🔄 Scraping ${pasaran}...`);
        const result = await this.scrapeTogelData(url, pasaran);
        results[pasaran] = result;
        
        // Add 3 second delay between requests
        const pasaranKeys = Object.keys(urls);
        if (pasaranKeys.indexOf(pasaran) < pasaranKeys.length - 1) {
          console.log(`⏳ Waiting 3 seconds before next scrape...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
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

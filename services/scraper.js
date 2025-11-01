const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

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
      const baseUrl = new URL(url).origin;
      const listPage = `${baseUrl}/wap/pasaran.html`;
      
      // Step 1: Visit homepage first
      console.log(`   📍 Step 1: Visiting ${baseUrl}...`);
      await client.get(baseUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        },
        maxRedirects: 5,
        validateStatus: () => true
      }).catch(() => null);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Visit pasaran list
      console.log(`   📍 Step 2: Visiting pasaran list...`);
      await client.get(listPage, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Referer': baseUrl + '/',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5,
        validateStatus: () => true
      }).catch(() => null);

      await new Promise(resolve => setTimeout(resolve, 2500));

      // Step 3: Finally visit target URL
      console.log(`   📍 Step 3: Scraping target URL...`);
      const response = await client.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Referer': listPage,
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5,
        validateStatus: () => true
      });

      if (response.status === 403) {
        console.log(`   ❌ Cloudflare blocked request`);
        throw new Error('Cloudflare protection detected. Coba manual atau gunakan proxy.');
      }

      if (response.status === 503) {
        console.log(`   ⏸️  Server sedang maintenance atau rate limit`);
        throw new Error('Server unavailable (503)');
      }

      if (response.status !== 200) {
        console.log(`   ⚠️  HTTP ${response.status}: ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`   ✅ Response OK (${response.status})`);

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
        
        // Add 5 second delay between requests
        const pasaranKeys = Object.keys(urls);
        if (pasaranKeys.indexOf(pasaran) < pasaranKeys.length - 1) {
          console.log(`⏳ Waiting 5 seconds before next scrape...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
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

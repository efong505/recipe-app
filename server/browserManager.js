const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

class BrowserManager {
  static async createBrowser() {
    return await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor"
      ],
      executablePath: process.env.CHROME_PATH || 'C:\\Users\\Ed\\Documents\\Programming\\Angular\\webscraping\\Project\\recipe-app\\server\\chrome\\win64-129.0.6668.100\\chrome-win64\\chrome.exe'
    });
  }

  static async setupPage(page) {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });
    
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceUrl = request.url();
      const resourceType = request.resourceType();
      
      if (
        resourceUrl.includes("subscribe") ||
        resourceUrl.includes("login") ||
        resourceUrl.includes("modal") ||
        resourceUrl.includes("popup") ||
        resourceUrl.includes("paywall") ||
        resourceUrl.includes("auth") ||
        ["image", "stylesheet", "font"].includes(resourceType)
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });
  }

  static async scrapePage(url, selectors) {
    let browser;
    try {
      browser = await this.createBrowser();
      const page = await browser.newPage();
      await this.setupPage(page);
      
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      
      const keySelector = selectors.content || selectors.ingredients || selectors.title;
      if (keySelector) {
        try {
          await page.waitForSelector(keySelector, { timeout: 10000 });
        } catch (e) {
          console.warn(`Selector ${keySelector} not found`);
        }
      }
      
      return await page.content();
    } finally {
      if (browser) await browser.close();
    }
  }
}

module.exports = BrowserManager;
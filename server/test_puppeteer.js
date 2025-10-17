const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

(async () => {
  try {
    const chromePath = 'C:\\Users\\Ed\\Documents\\Programming\\Angular\\webscraping\\Project\\recipe-app\\server\\chrome\\win64-129.0.6668.100\\chrome-win64\\chrome.exe';
    console.log('Checking Chrome path:', chromePath);
    if (!fs.existsSync(chromePath)) {
      throw new Error(`Chrome binary not found at ${chromePath}`);
    }
    console.log('Launching Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: chromePath,
      dumpio: true
    });
    console.log('Browser launched successfully');
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded successfully');
    await browser.close();
    console.log('Browser closed');
  } catch (error) {
    console.error('Puppeteer error:', error);
  }
})();

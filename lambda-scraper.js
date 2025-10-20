const chromium = require('chrome-aws-lambda');
const cheerio = require('cheerio');

// Website configurations
const configs = {
  'allrecipes.com': {
    type: 'recipe',
    recipeName: 'h1.entry-title, h1[data-module="RecipeTitle"]',
    description: '.recipe-summary__text, [data-module="RecipeSummary"] p',
    ingredients: '.recipe-ingredient, [data-module="RecipeIngredients"] li',
    instructions: '.recipe-instruction, [data-module="RecipeInstructions"] li'
  },
  'bonappetit.com': {
    type: 'recipe',
    recipeName: 'h1[data-testid="ContentHeaderHed"]',
    description: 'div[data-testid="ContentHeaderDek"] p',
    ingredients: 'div[class*="List-"] li',
    instructions: 'div[class*="InstructionsWrapper"] li p'
  },
  'theepochtimes.com': {
    type: 'news',
    title: 'h1.post_title, h1.article-title',
    author: '.author-name, .byline-author',
    published: 'time, .post-date',
    content: '.post_content p, .article-content p'
  }
};

exports.handler = async (event) => {
  let browser = null;
  
  try {
    // Get URL from query parameters
    const url = event.queryStringParameters?.url;
    if (!url) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'URL parameter is required' })
      };
    }

    // Get hostname for config
    const hostname = new URL(url).hostname.replace('www.', '');
    const config = configs[hostname];
    
    if (!config) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Unsupported website' })
      };
    }

    // Launch browser
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Set user agent and other headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Get page content
    const html = await page.content();
    const $ = cheerio.load(html);

    let result = { type: config.type };

    if (config.type === 'recipe') {
      result.recipeName = $(config.recipeName).first().text().trim();
      result.description = $(config.description).first().text().trim();
      result.ingredients = [];
      result.instructions = [];

      $(config.ingredients).each((i, el) => {
        const text = $(el).text().trim();
        if (text) result.ingredients.push(text);
      });

      $(config.instructions).each((i, el) => {
        const text = $(el).text().trim();
        if (text) result.instructions.push({ text });
      });

    } else if (config.type === 'news') {
      result.title = $(config.title).first().text().trim();
      result.author = $(config.author).first().text().trim();
      result.published = {
        humanReadable: $(config.published).first().text().trim(),
        epoch: Date.now()
      };
      result.content = [];

      $(config.content).each((i, el) => {
        const text = $(el).text().trim();
        if (text) {
          result.content.push({
            type: 'paragraph',
            text: text
          });
        }
      });
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: result })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
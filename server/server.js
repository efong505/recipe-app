const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

let config;
try {
  config = require("./config.json");
  console.log("Config loaded:", Object.keys(config));
} catch (error) {
  console.error("Error loading config.json:", error.message);
  process.exit(1);
}

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("URL is required");
  }

  let hostname;
  try {
    hostname = new URL(url).hostname.replace("www.", "");
    console.log(`Extracted hostname: ${hostname}`);
  } catch (error) {
    console.error("Invalid URL: ", error.message);
    return res.status(400).send("Invalid URL");
  }

  const selectors = config[hostname];
  if (!selectors || !selectors.type) {
    console.error(`No config for ${hostname} or missing type`);
    return res.status(400).send("Unsupported website or missing type");
  }

  try {
    let data;
    if (selectors.type === "news" && hostname === "theepochtimes.com") {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceUrl = request.url();
        if (
          resourceUrl.includes('subscribe') ||
          resourceUrl.includes('login') ||
          resourceUrl.includes('modal') ||
          resourceUrl.includes('popup') ||
          resourceUrl.includes('paywall') ||
          resourceUrl.includes('auth')
        ) {
          console.log(`Blocking request: ${resourceUrl}`);
          request.abort();
        } else {
          request.continue();
        }
      });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      try {
        await page.waitForSelector(selectors.content, { timeout: 15000 });
        console.log(`Found content selector: ${selectors.content}`);
      } catch (e) {
        console.warn(`Content selector ${selectors.content} not found`);
      }
      data = await page.content();
      await browser.close();
    } else {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      data = response.data;
    }

    console.log("Scraped HTML (first 1000 chars):", data.substring(0, 1000));
    const $ = cheerio.load(data);

    if (selectors.type === "recipe") {
      const recipeName = $(selectors.recipeName).text().trim();
      const description = $(selectors.description).text().trim();
      const recipeImage = $(selectors.recipeImage).attr("src");
      console.log("Recipe Image:", recipeImage);
      const ingredients = [];
      $(selectors.ingredients).each((i, elem) => {
        ingredients.push($(elem).text().trim());
      });
      const instructions = [];
      $(selectors.instructions).each((i, elem) => {
        const instructionHtml = $(elem).html();
        const instructionText = instructionHtml
          .replace(/<img[^>]*>/g, "")
          .replace(/<\/?[^>]+(>|$)/g, "")
          .trim();
        console.log("Instruction Text:", instructionText);
        const imageUrl = $(elem).find("img").attr("src");
        instructions.push({ text: instructionText, image: imageUrl });
      });

      if (!recipeName && !description && !recipeImage && ingredients.length === 0 && instructions.length === 0) {
        console.error("No recipe data found for", url);
        return res.status(404).send("No recipe found");
      }

      res.json({
        type: "recipe",
        url,
        data: {
          recipeName: recipeName || "N/A",
          description: description || "N/A",
          recipeImage: recipeImage || "N/A",
          ingredients: ingredients.length ? ingredients : [],
          instructions: instructions.length ? instructions : []
        }
      });
    } else if (selectors.type === "news") {
      const publishedTime = $(selectors.publishedTime).attr("datetime") || $(selectors.publishedTime).text();
      let epochTime = null;
      let humanReadable = null;
      if (publishedTime) {
        const date = new Date(publishedTime);
        if (!isNaN(date.getTime())) {
          epochTime = Math.floor(date.getTime() / 1000);
          humanReadable = date.toISOString();
        }
      }

      const title = $(selectors.title).text().trim();
      const author = $(selectors.author).text().trim();
      let image = $(selectors.image).attr("src");
      if (image && !image.startsWith('http')) {
        image = `https://www.theepochtimes.com${image}`;
      }
      const contentElements = $(selectors.content);
      const content = [];
      contentElements.children().each((i, elem) => {
        const tag = elem.tagName.toLowerCase();
        const parent = $(elem).parent();
        if (
          !$(elem).hasClass('eet-ad') &&
          !$(elem).closest('div[data-testid="shortcode_related_article"]').length
        ) {
          if (tag === 'p') {
            const text = $(elem).text().trim();
            if (
              text &&
              !text.toLowerCase().includes('subscribe') &&
              !text.toLowerCase().includes('support traditional journalism')
            ) {
              const my5Parent = $(elem).closest('div.my-5');
              if (!my5Parent.length || my5Parent.find('h2').length || my5Parent.children().length > 1) {
                content.push({ type: 'paragraph', text });
              }
            }
          } else if (tag === 'h2') {
            const text = $(elem).text().trim();
            if (text) {
              console.log(`Found h2: ${text}`); // Debug log
              content.push({ type: 'heading', text });
            }
          } else if (tag === 'div' && $(elem).hasClass('my-5')) {
            $(elem).contents().each((j, node) => {
              if (node.type === 'text') {
                const text = $(node).text().trim();
                if (
                  text &&
                  !text.toLowerCase().includes('subscribe') &&
                  !text.toLowerCase().includes('support traditional journalism')
                ) {
                  console.log(`Found div.my-5 text: ${text}`); // Debug log
                  content.push({ type: 'paragraph', text });
                }
              } else if (node.type === 'tag' && node.tagName.toLowerCase() !== 'h2') {
                const text = $(node).text().trim();
                if (
                  text &&
                  !text.toLowerCase().includes('subscribe') &&
                  !text.toLowerCase().includes('support traditional journalism')
                ) {
                  console.log(`Found div.my-5 inline tag text: ${text}`); // Debug log
                  content.push({ type: 'paragraph', text });
                }
              }
            });
          }
        }
      });

      console.log('Content array:', JSON.stringify(content, null, 2)); // Debug log
      if (!epochTime && !title && !author && content.length === 0) {
        console.error("No news article data found for", url);
        return res.status(404).send("No article metadata or content found");
      }

      res.json({
        type: "news",
        url,
        data: {
          title: title || "N/A",
          author: author || "N/A",
          published: {
            epoch: epochTime || null,
            humanReadable: humanReadable || "N/A"
          },
          image: image || "N/A",
          content: content.length ? content : [{ type: 'paragraph', text: 'N/A' }]
        }
      });
    } else {
      return res.status(400).send("Invalid config type");
    }
  } catch (error) {
    console.error("Error scraping the website:", error.message);
    res.status(500).send("Error scraping the website");
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

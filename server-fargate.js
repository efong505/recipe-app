const express = require("express");
const cors = require("cors");
const AWS = require("aws-sdk");
const BrowserManager = require("./browserManager");
const ContentExtractor = require("./contentExtractor");

const app = express();
const PORT = process.env.PORT || 3000;

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Scrape endpoint
app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    
    // Get selectors from DynamoDB
    const config = await dynamodb.get({
      TableName: process.env.CONFIG_TABLE_NAME || 'WebsiteConfigs',
      Key: { hostname }
    }).promise();

    if (!config.Item) {
      return res.status(400).json({ error: "Unsupported website" });
    }

    const selectors = config.Item;
    const data = await BrowserManager.scrapePage(url, selectors);
    const $ = require('cheerio').load(data);

    let extractedData;
    if (selectors.type === "recipe") {
      extractedData = ContentExtractor.extractRecipe($, selectors, hostname);
    } else {
      extractedData = ContentExtractor.extractNews($, selectors, hostname);
    }

    res.json({
      type: selectors.type,
      url,
      data: extractedData
    });

  } catch (error) {
    console.error("Error scraping:", error);
    res.status(500).json({ error: "Scraping failed" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
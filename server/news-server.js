const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const config = require("./config.json");

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*', // Allow all origins for testing purposes
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// app.use(cors({
//   origin: '*', // Allow all origins for testing purposes
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type']
// }));


app.get("/scrape", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("URL is required");
  }

  try {
    new URL(url); // Validate URL
  } catch (error) {
    return res.status(400).send("Invalid URL");
  }

  const hostname = new URL(url).hostname.replace("www.", "");
  console.log(`Hostname: ${hostname}`);
  const selectors = config[hostname];

  if (!selectors) {
    return res.status(400).send("Unsupported website");
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const recipeName = $(selectors.recipeName).text();
    const description = $(selectors.description).text();
    const recipeImage = $(selectors.recipeImage).attr("src");
    console.log("Recipe Image:", recipeImage);
    const ingredients = [];
    $(selectors.ingredients).each((i, elem) => {
      ingredients.push($(elem).text());
    });
    const instructions = [];
    $(selectors.instructions).each((i, elem) => {
      const instructionHtml = $(elem).html();
      console.log("Instruction HTML:", instructionHtml);
      const instructionText = instructionHtml
        .replace(/<img[^>]*>/g, "")
        .replace(/<\/?[^>]+(>|$)/g, "");
      console.log("Instruction Text:", instructionText);
      const imageUrl = $(elem).find("img").attr("src");
      instructions.push({ text: instructionText, image: imageUrl });
    });

    // Check if all key fields are empty
    if (!recipeName && !description && !recipeImage && ingredients.length === 0 && instructions.length === 0) {
      return res.status(404).send('No recipe found');
  }

    res.json({
      recipeName,
      description,
      recipeImage,
      ingredients,
      instructions,
    });
  } catch (error) {
    console.error("Error scraping the website:", error);
    res.status(500).send("Error scraping the website");
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

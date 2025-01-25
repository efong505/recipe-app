const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const recipeName = $('h1.recipe-title').text();
        const ingredients = [];
        $('ul.ingredients-list li').each((i, elem) => {
            ingredients.push($(elem).text());
        });
        const instructions = [];
        $('ol.instructions-list li').each((i, elem) => {
            instructions.push($(elem).text());
        });

        res.json({ recipeName, ingredients, instructions });
    } catch (error) {
        res.status(500).send('Error scraping the website');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

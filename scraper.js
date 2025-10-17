const chromium = require('chrome-aws-lambda');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const { url } = event.queryStringParameters || {};
    
    if (!url) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'URL required' })
        };
    }

    try {
        const hostname = new URL(url).hostname.replace('www.', '');
        
        // Get selectors from DynamoDB
        const config = await dynamodb.get({
            TableName: process.env.CONFIG_TABLE_NAME,
            Key: { hostname }
        }).promise();

        if (!config.Item) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Unsupported website' })
            };
        }

        const selectors = config.Item;
        
        // Launch browser
        const browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        
        // Setup page
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        );
        
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            const resourceUrl = request.url();
            
            if (
                resourceUrl.includes('subscribe') ||
                resourceUrl.includes('login') ||
                resourceUrl.includes('modal') ||
                resourceUrl.includes('popup') ||
                resourceUrl.includes('paywall') ||
                ['image', 'stylesheet', 'font'].includes(resourceType)
            ) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const html = await page.content();
        await browser.close();

        // Parse content
        const $ = cheerio.load(html);
        const data = extractContent($, selectors, hostname);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                type: selectors.type,
                url,
                data
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Scraping failed' })
        };
    }
};

function extractContent($, selectors, hostname) {
    if (selectors.type === 'recipe') {
        return extractRecipe($, selectors, hostname);
    } else {
        return extractNews($, selectors, hostname);
    }
}

function extractRecipe($, selectors, hostname) {
    const recipeName = $(selectors.recipeName).text().trim();
    const description = $(selectors.description).text().trim();
    const recipeImage = $(selectors.recipeImage).attr('src') || $(selectors.recipeImage).attr('content');

    const ingredients = [];
    if (hostname === 'bonappetit.com') {
        const listItems = $("div[class*='List-']").children();
        for (let i = 0; i < listItems.length; i += 2) {
            const amount = $(listItems[i]).text().trim();
            const description = $(listItems[i + 1]).text().trim();
            if (description) {
                ingredients.push(amount ? `${amount} ${description}` : description);
            }
        }
    } else {
        $(selectors.ingredients).each((i, elem) => {
            ingredients.push($(elem).text().trim());
        });
    }

    const instructions = [];
    $(selectors.instructions).each((i, elem) => {
        const instructionText = $(elem).text().trim();
        const imageUrl = $(elem).find('img').attr('src');
        instructions.push({ text: instructionText, image: imageUrl });
    });

    return {
        recipeName: recipeName || 'N/A',
        description: description || 'N/A',
        recipeImage: recipeImage || 'N/A',
        ingredients: ingredients.length ? ingredients : [],
        instructions: instructions.length ? instructions : [],
    };
}

function extractNews($, selectors, hostname) {
    const publishedTime = $(selectors.publishedTime).attr('datetime') || $(selectors.publishedTime).text();
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
    let image = $(selectors.image).attr('src');
    
    if (image && !image.startsWith('http') && hostname === 'theepochtimes.com') {
        image = `https://www.theepochtimes.com${image}`;
    }

    const contentElements = $(selectors.content);
    const content = [];

    contentElements.find('p, h2').each((i, elem) => {
        const tag = elem.tagName.toLowerCase();
        const text = $(elem).text().trim();
        
        if (text && !text.toLowerCase().includes('subscribe')) {
            if (tag === 'p') {
                content.push({ type: 'paragraph', text });
            } else if (tag === 'h2') {
                content.push({ type: 'heading', text });
            }
        }
    });

    return {
        title: title || 'N/A',
        author: author || 'N/A',
        published: {
            epoch: epochTime || null,
            humanReadable: humanReadable || 'N/A',
        },
        image: image || 'N/A',
        content: content.length ? content : [{ type: 'paragraph', text: 'N/A' }],
    };
}
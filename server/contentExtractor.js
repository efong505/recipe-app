const cheerio = require("cheerio");

class ContentExtractor {
  static extractRecipe($, selectors, hostname) {
    const recipeName = $(selectors.recipeName).text().trim();
    const description = $(selectors.description).text().trim();
    const recipeImage = $(selectors.recipeImage).attr("src") || $(selectors.recipeImage).attr("content");

    const ingredients = [];
    if (hostname === "bonappetit.com") {
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
      const instructionHtml = $(elem).html();
      const instructionText = instructionHtml
        .replace(/<img[^>]*>/g, "")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .trim();
      const imageUrl = $(elem).find("img").attr("src");
      instructions.push({ text: instructionText, image: imageUrl });
    });

    return {
      recipeName: recipeName || "N/A",
      description: description || "N/A",
      recipeImage: recipeImage || "N/A",
      ingredients: ingredients.length ? ingredients : [],
      instructions: instructions.length ? instructions : [],
    };
  }

  static extractNews($, selectors, hostname) {
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
    
    if (image && !image.startsWith("http") && hostname === "theepochtimes.com") {
      image = `https://www.theepochtimes.com${image}`;
    }

    const contentElements = $(selectors.content);
    const content = [];

    contentElements.find("p, h2, div.my-5").each((i, elem) => {
      const tag = elem.tagName.toLowerCase();
      if (
        !$(elem).hasClass("eet-ad") &&
        !$(elem).closest('div[data-testid="shortcode_related_article"]').length
      ) {
        const text = $(elem).text().trim();
        if (
          text &&
          !text.toLowerCase().includes("subscribe") &&
          !text.toLowerCase().includes("support traditional journalism")
        ) {
          if (tag === "p") {
            content.push({ type: "paragraph", text });
          } else if (tag === "h2") {
            content.push({ type: "heading", text });
          } else if (tag === "div" && $(elem).hasClass("my-5")) {
            const divContent = [];
            $(elem).contents().each((j, node) => {
              if (node.type === "text") {
                const nodeText = $(node).text().trim();
                if (nodeText && !nodeText.toLowerCase().includes("subscribe")) {
                  divContent.push({ type: "text", value: nodeText });
                }
              } else if (node.type === "tag" && node.tagName.toLowerCase() === "a") {
                const linkText = $(node).text().trim();
                const href = $(node).attr("href");
                if (linkText && !linkText.toLowerCase().includes("subscribe")) {
                  divContent.push({ type: "link", text: linkText, href: href || "#" });
                }
              }
            });
            if (divContent.length > 0) {
              content.push({ type: "div", content: divContent });
            }
          }
        }
      }
    });

    return {
      title: title || "N/A",
      author: author || "N/A",
      published: {
        epoch: epochTime || null,
        humanReadable: humanReadable || "N/A",
      },
      image: image || "N/A",
      content: content.length ? content : [{ type: "paragraph", text: "N/A" }],
    };
  }
}

module.exports = ContentExtractor;
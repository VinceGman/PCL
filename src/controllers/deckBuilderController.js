// require utilized models
const deckBuilderModel = require("../models/deckBuilderModel");
const sharp = require("sharp");
const axios = require("axios");

class DeckBuilderController {
  // Handles API GET method to receive card data
  async getCards(req, res) {
    const cards = await deckBuilderModel.getCards();
    res.render("pages/cards", { cards: cards });
  }

  async generateCardSheet(req, res) {
    try {
      const urls = (req.query.urls || "").split(",").filter(Boolean);
      if (!urls.length || urls.length < 2 || urls.length > 69)
        return res
          .status(400)
          .send(
            "Image count must be between 2 and 69 for Tabletop Simulator decks"
          );

      const cardWidth = 850; // 5" @ 300 DPI
      const cardHeight = 1190; // 7" @ 300 DPI
      const totalSlots = urls.length + 1 < 4 ? 4 : urls.length + 1;
      let columns = Math.ceil(Math.sqrt(totalSlots));
      let rows = Math.ceil(totalSlots / columns);

      if (rows > 7 || totalSlots >= 64) {
        rows = 7;
        columns = Math.ceil(totalSlots / 7);
      }

      const paddedUrls = urls.slice(0, totalSlots);
      while (paddedUrls.length < totalSlots) paddedUrls.push(null);

      const resized = await Promise.all(
        paddedUrls.map(async (url) => {
          if (!url) {
            // Transparent placeholder for empty slots
            return sharp({
              create: {
                width: cardWidth,
                height: cardHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
              },
            })
              .png()
              .toBuffer();
          }
          const { data } = await axios.get(url, {
            responseType: "arraybuffer",
          });
          return sharp(data).resize(cardWidth, cardHeight).toBuffer();
        })
      );

      const sheetWidth = cardWidth * columns;
      const sheetHeight = cardHeight * rows;

      const composites = resized.map((img, i) => ({
        input: img,
        top: Math.floor(i / columns) * cardHeight,
        left: (i % columns) * cardWidth,
      }));

      const sheet = await sharp({
        create: {
          width: sheetWidth,
          height: sheetHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite(composites)
        .png()
        .toBuffer();

      res.set(
        "Content-Disposition",
        `attachment; filename=w${columns}_h${rows}_n${urls.length}.png`
      );
      res.type("png").send(sheet);
    } catch (err) {
      console.error("Failed to generate sheet:", err);
      res.status(500).send("Error creating sheet");
    }
  }
}

module.exports = new DeckBuilderController();

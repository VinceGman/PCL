const csv = require("../libraries/csv");

class CardModel {
  constructor() {
    // Model creates a collection variable to use
    // this.collection = firestore.collection('cards');
  }

  // Interacts with Firestore database to get cards
  async getCards() {
    const cards = (await csv.getCSVCards())
      .filter((card) => card.eligible == "TRUE")
      .map((card) => ({
        ...card,
        id: +card.id,
        cmc: +card.cmc,
        copies: +card.copies,
        image: `https://raw.githubusercontent.com/VinceGman/PCL/refs/heads/main/Cards/${card.image_reference}.webp`,
      }))
      .sort((a, b) => {
        if (a.identity !== b.identity)
          return b.identity.localeCompare(a.identity);
        if (a.cmc !== b.cmc) return a.cmc - b.cmc;
        if (a.name !== b.name) return a.name.localeCompare(b.name);
      });

    return cards;
  }
}

module.exports = new CardModel();

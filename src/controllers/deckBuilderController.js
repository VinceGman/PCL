// require utilized models
const deckBuilderModel = require("../models/deckBuilderModel");

class DeckBuilderController {
  // Handles API GET method to receive card data
  async getCards(req, res) {
    const cards = await deckBuilderModel.getCards();
    res.render("pages/cards", { cards: cards });
  }

  async sendCardsAPI(req, res) {
    const cards = await deckBuilderModel.getCards();
    res.send({ cards });
  }
}

module.exports = new DeckBuilderController();

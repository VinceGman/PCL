// require utilized models
const rankTrackerModel = require("../models/rankTrackerModel");

class RankTrackerController {
  // Handles API GET method to receive card data
  async getPlayers(req, res) {
    const players = await rankTrackerModel.getPlayers();
    res.render("pages/players", { players: players });
  }

  async getPlayersJSON(req, res) {
    const players = await rankTrackerModel.getPlayers();
    res.json(players); // send JSON instead of rendering EJS
  }
}

module.exports = new RankTrackerController();

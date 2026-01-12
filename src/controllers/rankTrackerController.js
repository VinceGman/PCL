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

  async getLogsJSON(req, res) {
    const logs = await rankTrackerModel.getLogs();
    res.json(logs);
  }
}

module.exports = new RankTrackerController();

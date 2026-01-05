const storage = require("../libraries/storage");

class PlayerModel {
  constructor() {}

  async getPlayers() {
    const players = [];

    const service = await storage.pull("services:rankTracker");
    const accounts = service.accounts;

    for (const account of accounts) {
      const player = await storage.pull(
        `services:rankTracker:users:${account.puuid}`
      );

      if (!player) continue;

      players.push(player);
    }

    return players;
  }
}

module.exports = new PlayerModel();

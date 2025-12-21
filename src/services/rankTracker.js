// User: https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/oLTyYjIVyWNZdM8ethquIUVZGNkF_WxlWlcLy0x20y265UqgfTxx1AVwazMn07UHEW_0ynB5U8-RRQ/ids?queue=420&type=ranked&start=0&count=20&api_key=RGAPI-5ffb18ab-11b4-4ebd-9b8b-192d0a76407f

// Summoner: https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/oLTyYjIVyWNZdM8ethquIUVZGNkF_WxlWlcLy0x20y265UqgfTxx1AVwazMn07UHEW_0ynB5U8-RRQ?api_key=RGAPI-5ffb18ab-11b4-4ebd-9b8b-192d0a76407f

const storage = require("../libraries/storage");
const cron = require("node-cron");
const axios = require("axios");

module.exports = {
  name: "rankTracker",
  type: "development",
  async execute() {
    updateRanks();

    cron.schedule("*/10 * * * *", () => {
      updateRanks();
    });
  },
};

async function updateRanks() {
  const service = await storage.pull(`services:rankTracker`);
  const accounts = service.accounts;

  for (const acc of accounts) {
    const playerData = (await storage.pull(
      `services:rankTracker:users:${acc.puuid}`
    )) ?? {
      name: acc.name,
      puuid: acc.puuid,
      wins: 0,
      losses: 0,
      timeseries: [],
      tier: "UNPLACED",
      rank: "X",
      lp: 0,
      hotStreak: false,
    };

    try {
      const url = `https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/${acc.puuid}?api_key=${process.env.RIOT_KEY}`;
      const response = await axios.get(url);
      const rankedData = response.data.filter(
        (data) => data.queueType == "RANKED_SOLO_5x5"
      )?.[0];
      if (!rankedData) continue;

      const games = rankedData.wins + rankedData.losses;
      if (
        playerData.timeseries.length >= games ||
        playerData.timeseries.some((o) => o.game === games)
      )
        continue;

      let mmr = +rankedData.leaguePoints;
      switch (rankedData.tier) {
        case "IRON":
          mmr += 0;
          break;
        case "BRONZE":
          mmr += 400;
          break;
        case "SILVER":
          mmr += 800;
          break;
        case "GOLD":
          mmr += 1200;
          break;
        case "PLATINUM":
          mmr += 1600;
          break;
        case "EMERALD":
          mmr += 2000;
          break;
        case "DIAMOND":
          mmr += 2400;
          break;
        case "MASTER":
          mmr += 2800;
          break;
        case "GRANDMASTER":
          mmr += 3200;
          break;
        case "CHALLENGER":
          mmr += 3600;
          break;
        default:
          mmr += 0;
      }

      switch (rankedData.rank) {
        case "IV":
          mmr += 0;
          break;
        case "III":
          mmr += 100;
          break;
        case "II":
          mmr += 200;
          break;
        case "I":
          mmr += 300;
          break;
        default:
          mmr += 0;
      }

      playerData.wins = rankedData.wins;
      playerData.losses = rankedData.losses;
      playerData.timeseries.push({ game: games, mmr: mmr });
      playerData.tier = rankedData.tier;
      playerData.rank = rankedData.rank;
      playerData.lp = rankedData.leaguePoints;
      playerData.hotStreak = rankedData.hotStreak;

      await storage.push(`services:rankTracker:users:${acc.puuid}`, playerData);
    } catch (err) {
      console.error(err);
    }
  }
}

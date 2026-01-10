const storage = require("../libraries/storage");
const cron = require("node-cron");
const axios = require("axios");

// let service_locked = false;

// beginning of season timestamp in seconds: 1767902400

// (async () => {
//   const lostpuuid =
//     "FYvHFsiAngBO2k0gYJRRq35R8FljFCZvoeICszRdUg7QZ6UFpzskFOR8OqvsGP5lr-Hk1xDEpL4coQ";
//   const lostUser = await storage.pull(
//     `services:rankTracker:users:${lostpuuid}`
//   );

//   const lpgains = [0, -10, -10, -10]; // has to start with a 0
//   const startingLP = 1455;
//   let cummulative = 0;
//   lostUser.timeseries = [];
//   for (let i = 0; i < lpgains.length; i++) {
//     cummulative += lpgains[i];
//     lostUser.timeseries.push({
//       game: i + 5,
//       mmr: startingLP + cummulative,
//     });
//   }

//   await storage.push(`services:rankTracker:users:${lostpuuid}`, lostUser);
// })();

module.exports = {
  name: "rankTracker",
  type: "production",
  async execute() {
    updateRanks();

    cron.schedule("* * * * *", () => {
      updateRanks();
    });
  },
};

async function updateRanks() {
  // if (service_locked) return;
  // service_locked = true;

  try {
    const service = await storage.pull(`services:rankTracker`);
    const accounts = service.accounts;
    const delay = service.delay;

    for (const acc of accounts) {
      try {
        const url = `https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/${acc.puuid}?api_key=${process.env.RIOT_KEY}`;
        const response = await axios.get(url);
        const rankedData = response.data.filter(
          (data) => data.queueType == "RANKED_SOLO_5x5"
        )?.[0];
        if (!rankedData) continue;

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
          remakes: 0,
          mmr: 0,
        };

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

        playerData.mmr = mmr;
        playerData.wins = rankedData.wins;
        playerData.losses = rankedData.losses;
        playerData.timeseries.push({ game: games, mmr: mmr });
        playerData.tier = rankedData.tier;
        playerData.rank = rankedData.rank;
        playerData.lp = rankedData.leaguePoints;
        playerData.hotStreak = rankedData.hotStreak;

        await storage.push(
          `services:rankTracker:users:${acc.puuid}`,
          playerData
        );

        // await storage.push(`services:rankTracker:games:${acc.puuid}-${games}`, {
        //   puuid: acc.puuid,
        //   game: games,
        //   mmr: mmr,
        //   hotStreak: playerData.hotStreak,
        // }); // individual game data
      } catch (err) {
        console.error(err);
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  } finally {
    // service_locked = false;
  }
}

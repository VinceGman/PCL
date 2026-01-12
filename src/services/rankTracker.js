const storage = require("../libraries/storage");
const cron = require("node-cron");
const axios = require("axios");

const allowed_calls = 100;

let service_locked = false;
let current_calls = 0;

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
  if (service_locked) {
    console.log("SERVICE: DENIED");
    return;
  }
  console.log("SERVICE: LOCKED");
  service_locked = true;
  current_calls = 0;

  try {
    const service = await storage.pull(`services:rankTracker`);
    const accounts = service.accounts;
    const delay = service.delay;

    for (const acc of accounts) {
      try {
        await new Promise((r) => setTimeout(r, delay));
        const rank_url = `https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/${acc.puuid}?api_key=${process.env.RIOT_KEY}`;
        console.log(`PULLING: ${acc.name}`);
        current_calls += 1;
        const rank_res = await axios.get(rank_url);
        const rankedData = rank_res.data.filter(
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
        console.log(playerData.timeseries.length, games);
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

        const lastMMR = playerData?.timeseries?.at(-1)?.mmr;
        const lpChange = lastMMR != null ? mmr - lastMMR : 0;

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

        const tierNames = ["I", "B", "S", "G", "P", "E", "D", "M", "GM", "CH"];
        const rankNames = ["4", "3", "2", "1"];

        // Compute old tier/rank
        let oldTierIndex = Math.floor((lastMMR ?? 0) / 400);
        let oldRankIndex = Math.floor(((lastMMR ?? 0) % 400) / 100);

        // Compute new tier/rank
        let newTierIndex = Math.floor(mmr / 400);
        let newRankIndex = Math.floor((mmr % 400) / 100);

        let note = "";
        if (lastMMR != null) {
          if (
            newTierIndex > oldTierIndex ||
            (newTierIndex === oldTierIndex && newRankIndex > oldRankIndex)
          ) {
            note = `Promoted ${tierNames[newTierIndex]}${rankNames[newRankIndex]}`;
          } else if (
            newTierIndex < oldTierIndex ||
            (newTierIndex === oldTierIndex && newRankIndex < oldRankIndex)
          ) {
            note = `Demoted ${tierNames[newTierIndex]}${rankNames[newRankIndex]}`;
          } else {
            note = `${lpChange > 0 ? "+" : lpChange == 0 ? "-" : ""}${lpChange}`;
          }
        } else {
          note = `Enters ${tierNames[newTierIndex]}${rankNames[newRankIndex]}`;
        }

        await storage.logPush(`${acc.name}: ${note}`);

        if (current_calls > allowed_calls) continue;

        await new Promise((r) => setTimeout(r, delay));
        const gameID_url = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${acc.puuid}/ids?queue=420&type=ranked&count=1&api_key=${process.env.RIOT_KEY}`;
        console.log(`PULLING LATEST MATCH: ${acc.name}`);
        current_calls += 1;
        const gameID_res = await axios.get(gameID_url);
        const gameID = gameID_res.data?.[0];
        if (!gameID) continue;

        console.log(`FOUND: ${gameID}`);

        await storage.push(`services:rankTracker:games:${gameID}`, {
          puuid: acc.puuid,
          game: games,
          mmr: mmr,
          hotStreak: playerData.hotStreak,
        }); // individual game data
      } catch (err) {
        console.error(err);
      }
    }
  } finally {
    console.log("SERVICE: UNLOCKED");
    service_locked = false;
    current_calls = 0;
  }
}

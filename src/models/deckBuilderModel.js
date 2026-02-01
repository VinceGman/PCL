const csv = require("../libraries/csv");
const fs = require("fs");
const path = require("path");

class CardModel {
  constructor() {
    // Model creates a collection variable to use
    // this.collection = firestore.collection('cards');
  }

  // Interacts with Firestore database to get cards
  async getCards() {
    const keywords = await csv.fetchCSV(process.env.GOOGLE_SHEETS_KEYWORDS_CSV);

    const cards = (await csv.fetchCSV(process.env.GOOGLE_SHEETS_CARDS_CSV))
      .filter((card) =>
        fs.existsSync(path.join(process.cwd(), "Cards", `${card.id}.jpg`))
      )
      .map((card) => {
        card.info = card.metadata;
        card.metadata += card.metadata ? "<br><br>" : "";

        if (
          ((card.type.includes("Creature") &&
            card.rarity.includes("Legendary")) ||
            card.text.includes("Commander")) &&
          !card.identity.includes("neutral")
        ) {
          card.metadata += `This may be used as your <b>Commander</b>.<br><br>`;
        }

        if (card.text.toLowerCase().includes("counter")) {
          if (!card.text.toLowerCase().includes("spell")) {
            card.metadata += `<b>Counters</b>: When a permanent gains a specific counter, it will usually use them to track how many times something has happened. When a creature gets "+x/+x" counters, it means it adds that many stats.<br><br>`;
          } else {
            card.metadata += `<b>Counter</b>: You may target a spell that was casted and prevent it from casting.<br><br>`;
          }
        }

        if (card.type.includes("Rune")) {
          card.metadata += `<b>Rune</b>: Add this to your cards if your deck is using this rune in its identity.<br><br>`;
        }

        if (card.type.includes("Token")) {
          card.metadata += `<b>Token</b>: This card type is only needed in your deck if one of your cards generates a token.<br><br>`;
        }

        if (card.type.includes("Instant Spell")) {
          card.metadata += `<b>Instant Spell</b>: This is a spell that you may cast at anytime, even if it's not your turn as long as you're responding to something.<br><br>`;
        }

        if (card.type.includes("Titan")) {
          card.metadata += `<b>Titan</b>: This creature's tap abilities may only be used once (each) until it enters the battlefield again. You may only control one Titan creature at a time.<br><br>`;
        }

        if (card.type.includes("Weapon")) {
          try {
            card.metadata += `<b>Weapon</b>: This artifact has ${
              card.stats.split("/")[0]
            } attack and ${
              card.stats.split("/")[1]
            } durability counters. Weapons lose 1 durability counter when they attack and are sacrificed when they reach 0 durability counters.<br><br>`;
          } catch (err) {}
        }

        const text = (card.text || "").toLowerCase();

        const matchedKeywords = keywords
          .filter((kw) => text.includes(kw.keyword.toLowerCase()))
          .map((kw) => `<b>${kw.keyword}</b>: ${kw.description}`)
          .join("<br><br>");

        return {
          ...card,
          identity: card.identity
            .replace("{", "")
            .replaceAll("}", "")
            .split("{")
            .map((rune) => rune.charAt(0).toUpperCase() + rune.slice(1))
            .join("/"),
          id: +card.id,
          cmc: +card.cmc,
          copies: +card.copies,
          image: `https://raw.githubusercontent.com/VinceGman/PCL/refs/heads/main/Cards/${card.id}.jpg`,
          metadata: card.metadata
            ? card.metadata + matchedKeywords
            : matchedKeywords,
        };
      })
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

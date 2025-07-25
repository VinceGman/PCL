const deck = [];
const cards = [...window.cards];
let totalCards = 0;
let totalRunes = 0;
let totalTokens = 0;
let totalDeck = 0;

console.log(cards);

// DONE
function addCard(id) {
  const card = cards.find((c) => c.id == id);
  if (!card) return;
  if (totalCards >= 69) return;

  const deckCard = deck.find((c) => c.id == id);

  if (!deckCard) {
    deck.push({ ...card, deckCopies: 1 });
  } else if (deckCard.deckCopies < deckCard.copies) {
    deckCard.deckCopies += 1;
  } else {
    return;
  }

  deck.sort((a, b) => {
    if (a.identity !== b.identity) return b.identity.localeCompare(a.identity);
    if (a.cmc !== b.cmc) return a.cmc - b.cmc;
    if (a.name !== b.name) return a.name.localeCompare(b.name);
  });

  updateSelection(id);
  updateCardCounts();

  renderDeckList();
  renderDeckListPeripherals();
  // filterCardListCards();
}

// DONE
function removeCard(id) {
  const index = deck.findIndex((card) => card.id == id);
  if (index == -1) return;
  const card = deck.find((card) => card.id == id);
  if (!card) return;

  if (card.deckCopies <= 1) {
    deck.splice(index, 1);
  } else {
    card.deckCopies -= 1;
  }

  updateSelection(id);
  updateCardCounts();

  renderDeckList();
  renderDeckListPeripherals();

  flashCardAnimation(`[data-id="${String(id)}"]`);
  flashCardAnimation(`.decklistCard[data-id="${id}"]`);
}

// DONE
document.querySelector(".copy-code-btn").addEventListener("click", () => {
  const deckCode = document.getElementById("deckCode");
  deckCode.select();
  document.execCommand("copy");
  deckCode.classList.add("flash");
  setTimeout(() => deckCode.classList.remove("flash"), 500);
  deckCode.setSelectionRange(0, 0);
  deckCode.blur();
  setTimeout(() => {
    deckCode.scrollLeft = deckCode.scrollWidth;
  }, 0);
});

// DONE
document.querySelector(".enter-code-btn").addEventListener("click", () => {
  loadDeckList();
  // filterCardListCards();
  renderDeckList();
  renderDeckPanel();
});

// DONE
document.querySelector(".filter-btn").addEventListener("click", (e) => {
  e.preventDefault();

  filterCardListCards();

  setTimeout(() => {
    const cardList = document.getElementById("card-list-panel");
    cardList.scrollTo({ top: 0, behavior: "smooth" });
  }, 0);
});

// DONE
document.querySelector(".download-deck-btn").addEventListener("click", (e) => {
  e.preventDefault();

  const url = `/deckbuilder/tts-sheet?urls=${encodeURIComponent(
    deck.flatMap((card) => Array(card.deckCopies).fill(card.image)).join(",")
  )}`;

  window.location.href = url;
});

// DONE
function renderCardList(filteredCards) {
  const cardList = document.getElementById("card-list-panel");
  cardList.innerHTML = filteredCards
    .map((card) => {
      const deckCard = deck.find((dc) => dc.id == card.id);
      const disabled =
        deckCard && deckCard.deckCopies >= deckCard.copies ? "disabled" : "";
      return `
        <div class="card ${disabled}" draggable="true" data-id="${card.id}">
          <img src="${card.image}" />
        </div>
      `;
    })
    .join("");

  setCardListCardEvents();
}

function renderDeckList() {
  const deckList = document.getElementById("deck-list-panel");
  deckList.innerHTML = deck
    .map(
      (card) => `
    <div class="decklistCard" data-id="${card.id}" style="background-image: url('${card.image}');"></div>
    <div id="cardCount">${card.deckCopies}</div>
    `
    )
    .join("");

  setDeckListCardsClickable();
}

// // DONE
// function renderDeckList() {
//   const deckList = document.getElementById("deck-list-panel");
//   deckList.innerHTML = deck
//     .map(
//       (card) => `
//       <div class="decklistCard" data-id="${card.id}">
//         <img src="${card.image}" />
//       </div>
// 	  <div id="cardCount">${card.deckCopies}</div>
// 	  `
//     )
//     .join("");

//   setDeckListCardsClickable();
// }

// DONE
document.addEventListener("DOMContentLoaded", () => {
  const filterInput = document.getElementById("filter-input");
  const filterValue = filterInput.value.toLowerCase();
  if (filterValue) {
    filterCardListCards();
  } else {
    setCardListCardEvents();
  }

  const deckCode = document.getElementById("deckCode").value;
  if (deckCode) {
    loadDeckList();
    renderDeckList();
  }

  renderDeckListPeripherals();
});

// DONE
function setCardListCardsDraggable() {
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".card");
    if (card) {
      e.dataTransfer.setData("id", card.dataset.id);
    }
  });

  const deckList = document.getElementById("deck-list-panel");
  deckList.addEventListener("dragover", (e) => e.preventDefault());

  deckList.addEventListener("drop", (e) => {
    e.preventDefault();

    const id = e.dataTransfer.getData("id");
    addCard(id);

    flashCardAnimation(`[data-id="${String(id)}"]`);
  });
}

// DONE
function setDeckListCardsClickable() {
  const deckList = document.getElementById("deck-list-panel");
  deckList.querySelectorAll(".decklistCard").forEach((div) => {
    div.addEventListener("click", (e) => {
      const container = e.target.closest(".decklistCard");
      if (!container) return;

      // const infoBox = document.getElementById("card-info");
      // if (infoBox.style.display == "block") return;

      const id = container.dataset.id;
      removeCard(id);
    });

    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const infoBox = document.getElementById("card-info");

      const container = e.target.closest(".decklistCard");
      if (!container) return;

      const id = container.dataset.id;
      const card = cards.find((c) => c.id == id);

      infoBox.innerHTML = `
    <div class="popUpCard">
      <img src="${card.image}"/>
    </div>
    <div class="popUpDetails">
      <strong>${card.name}</strong><br/>
      Converted Mana Cost: ${card.cmc}<br/>
      Identity: ${card.identity}<br/>
      ${card.metadata ? "Details —\n" + card.metadata + "<br/>" : ""}
    </div>
  `;

      infoBox.style.left = `${Math.min(
        Math.max(e.pageX - infoBox.offsetWidth / 2, window.innerWidth * 0.05),
        window.innerWidth * 0.83 - infoBox.offsetWidth
      )}px`;
      infoBox.style.top = `${Math.max(
        Math.min(
          e.pageY - infoBox.offsetHeight / 2,
          window.innerHeight * 0.985 - infoBox.offsetHeight
        ),
        window.innerHeight * 0.175
      )}px`;
      infoBox.style.display = "block";
    });
  });
}

document.addEventListener("click", () => {
  const infoBox = document.getElementById("card-info");
  infoBox.style.left = `1vw`;
  infoBox.style.top = `1vw`;
  infoBox.innerHTML = "";
  infoBox.style.display = "none";
});

document.getElementById("card-list-panel").addEventListener("scroll", () => {
  const infoBox = document.getElementById("card-info");
  infoBox.style.left = `1vw`;
  infoBox.style.top = `1vw`;
  infoBox.innerHTML = "";
  infoBox.style.display = "none";
});

// document.getElementById("card-list-panel").addEventListener("scroll", () => {
//   document.getElementById("card-info").style.display = "none";
// });

// DONE
function setCardListCardsClickable() {
  const cardList = document.getElementById("card-list-panel");
  cardList.querySelectorAll(".card").forEach((div) => {
    div.addEventListener("click", (e) => {
      const container = e.target.closest(".card");
      if (!container || container.classList.contains("disabled")) return;

      const infoBox = document.getElementById("card-info");
      if (infoBox.style.display == "block") return;

      container.classList.remove("flashCard");
      void container.offsetWidth;
      container.classList.add("flashCard");

      const id = container.dataset.id;
      addCard(id);
    });

    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const infoBox = document.getElementById("card-info");

      const container = e.target.closest(".card");
      if (!container) return;

      const id = container.dataset.id;
      const card = cards.find((c) => c.id == id);

      infoBox.innerHTML = `
    <div class="popUpCard">
      <img src="${card.image}"/>
    </div>
    <div class="popUpDetails">
      <strong>${card.name}</strong><br/>
      Converted Mana Cost: ${card.cmc}<br/>
      Identity: ${card.identity}<br/>
      ${card.metadata ? "Details —\n" + card.metadata + "<br/>" : ""}
    </div>
  `;
      infoBox.style.left = `${Math.min(
        Math.max(e.pageX - infoBox.offsetWidth / 2, window.innerWidth * 0.05),
        window.innerWidth * 0.83 - infoBox.offsetWidth
      )}px`;
      infoBox.style.top = `${Math.max(
        Math.min(
          e.pageY - infoBox.offsetHeight / 2,
          window.innerHeight * 0.985 - infoBox.offsetHeight
        ),
        window.innerHeight * 0.175
      )}px`;
      infoBox.style.display = "block";
    });
  });
}

// DONE
function filterCardListCards() {
  console.log("filterCardListCards");
  const filterInput = document.getElementById("filter-input");
  const filteredCards = cards.filter((card) => {
    const filterValue = filterInput.value.toLowerCase();
    if (filterValue === "") return true;
    return (
      card.name.toString().toLowerCase().includes(filterValue) ||
      card.cost.toString().toLowerCase().includes(filterValue) ||
      card.text.toString().toLowerCase().includes(filterValue) ||
      card.identity.toString().toLowerCase().includes(filterValue) ||
      card.type.toString().toLowerCase().includes(filterValue) ||
      card.stats.toString().toLowerCase().includes(filterValue) ||
      card.rarity.toString().toLowerCase().includes(filterValue) ||
      card.cmc.toString().toLowerCase().includes(filterValue) ||
      card.metadata.toString().toLowerCase().includes(filterValue)
    );
  });

  renderCardList(filteredCards);
}

// DONE
function setCardListCardEvents() {
  setCardListCardsClickable();
  setCardListCardsDraggable();
}

// DONE
function loadDeckList() {
  deck.length = 0;
  updateCardCounts();

  const deckCode = document.getElementById("deckCode");
  const encodedDeckCode = deckCode.value;
  if (!encodedDeckCode) {
    filterCardListCards();
    return;
  }

  const deckCodeString = pako.inflate(
    Uint8Array.from(atob(encodedDeckCode), (c) => c.charCodeAt(0)),
    { to: "string" }
  );

  const deckCodeArray = deckCodeString.split(":");

  for (const cardString of deckCodeArray) {
    const id = parseInt(cardString.slice(0, -1), 16);
    const deckCopies = parseInt(cardString.slice(-1), 16);

    const card = cards.find((card) => card.id == id);
    if (!card) {
      continue;
    }

    deck.push({ ...card, deckCopies });
    updateSelection(id);
  }

  deck.sort((a, b) => {
    if (a.identity !== b.identity) return b.identity.localeCompare(a.identity);
    if (a.cmc !== b.cmc) return a.cmc - b.cmc;
    if (a.name !== b.name) return a.name.localeCompare(b.name);
  });

  updateCardCounts();
}

// DONE
function renderDeckListPeripherals() {
  renderDeckCode();
  renderDeckPanel();
}

// DONE
function renderDeckCode() {
  const deckCode = document.getElementById("deckCode");
  if (deck.length == 0) {
    deckCode.value = "";
    return;
  }

  const deckCodeString = deck
    .map(
      (card) =>
        `${Number(card.id).toString(16).toUpperCase()}${Number(card.deckCopies)
          .toString(16)
          .toUpperCase()}`
    )
    .join(":");

  const encodedDeckCode = btoa(
    String.fromCharCode(...pako.deflate(deckCodeString))
  );

  deckCode.value = encodedDeckCode;
  deckCode.scrollLeft = deckCode.scrollWidth;
}

// DONE
function renderDeckPanel() {
  const totalCardsText = document.getElementById("totalCards");
  totalCardsText.innerHTML = `Cards: ${totalCards}/69`;

  const totalDeckText = document.getElementById("totalDeck");
  totalDeckText.innerHTML = `Deck: ${totalDeck}/60`;

  const totalRunesText = document.getElementById("totalRunes");
  if (totalRunes > 0) {
    totalRunesText.innerHTML = `Runes: ${totalRunes}`;
  } else {
    totalRunesText.innerHTML = ``;
  }

  const totalTokensText = document.getElementById("totalTokens");
  if (totalTokens > 0) {
    totalTokensText.innerHTML = `Tokens: ${totalTokens}`;
  } else {
    totalTokensText.innerHTML = ``;
  }
}

function updateCardCounts() {
  totalCards = deck.reduce((sum, card) => sum + card.deckCopies, 0);

  totalRunes = deck
    .filter((card) => card.type.toLowerCase() === "rune")
    .reduce((sum, card) => sum + card.deckCopies, 0);

  totalTokens = deck
    .filter((card) => card.type.toLowerCase() === "token")
    .reduce((sum, card) => sum + card.deckCopies, 0);

  totalDeck = totalCards - totalRunes - totalTokens;
}

function updateSelection(id) {
  const clc = document.querySelector(`[data-id="${String(id)}"]`);
  if (!clc) return;
  const selectedCard = deck.find((c) => c.id == id);
  if (!selectedCard) {
    clc.classList.remove("disabled");
    return;
  }

  if (selectedCard.deckCopies == selectedCard.copies) {
    clc.classList.add("disabled");
  } else {
    clc.classList.remove("disabled");
  }
}

function flashCardAnimation(selectorString) {
  const container = document.querySelector(selectorString);
  if (!container) return;

  container.classList.remove("flashCard");
  void container.offsetWidth;
  container.classList.add("flashCard");
}

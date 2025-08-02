const deck = [];
const cards = [...window.cards];
let totalCards = 0;
let totalRunes = 0;
let totalTokens = 0;
let totalDeck = 0;
let totalSideboard = 0;

console.log(cards);

// DONE
function addCard(id, maxCount) {
  const deckCard = deck.find((c) => c.id == id);
  const card = cards.find((c) => c.id == id);
  if (!card) return;

  let countToAdd = 1;

  if (deckCard) {
    if (deckCard.deckCopies >= deckCard.copies) return;
    countToAdd = maxCount ? deckCard.copies - deckCard.deckCopies : 1;
  } else if (maxCount) {
    countToAdd = card.copies;
  }

  countToAdd = Math.min(69 - totalCards, countToAdd);
  if (countToAdd <= 0) return;

  if (!deckCard) {
    deck.push({ ...card, deckCopies: countToAdd });
  } else {
    deckCard.deckCopies += countToAdd;
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

  const target = document.querySelector(`.decklistCard[data-id="${id}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "auto", block: "nearest" });
  }

  flashCardAnimation(`[data-id="${String(id)}"]`);
  flashCardAnimation(`.decklistCard[data-id="${id}"]`);
}

// DONE
function removeCard(id, maxCount) {
  const index = deck.findIndex((card) => card.id == id);
  if (index == -1) return;
  const card = deck.find((card) => card.id == id);
  if (!card) return;

  if (card.deckCopies <= 1 || maxCount) {
    deck.splice(index, 1);
  } else {
    card.deckCopies -= 1;
  }

  updateSelection(id);
  updateCardCounts();

  renderDeckList();
  renderDeckListPeripherals();

  const target = document.querySelector(`[data-id="${String(id)}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "auto", block: "nearest" });
  }

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

document.querySelector(".delete-deck-btn").addEventListener("click", () => {
  deck.length = 0;
  updateCardCounts();

  const deckCode = document.getElementById("deckCode");
  deckCode.value = "";

  filterCardListCards();

  renderDeckList();
  renderDeckPanel();
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
    <div class="decklistCard" draggable="true" data-id="${card.id}" style="background-image: url('${card.image}');">
    <div id="rarity" style="background-image: url('${card.image}');"></div>
    </div>
    <div id="cardCount">${card.deckCopies}</div>
    `
    )
    .join("");

  setDeckListCardsClickable();
  setDeckListCardsDraggable();
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
    addCard(id, true);
  });
}

function setDeckListCardsDraggable() {
  document.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".decklistCard");
    if (card) {
      e.dataTransfer.setData("id", card.dataset.id);
    }
  });

  const cardList = document.getElementById("card-list-panel");
  cardList.addEventListener("dragover", (e) => e.preventDefault());

  cardList.addEventListener("drop", (e) => {
    e.preventDefault();

    const id = e.dataTransfer.getData("id");
    removeCard(id, true);
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

    div.addEventListener("mouseenter", (e) => {
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
      <b>Cost</b>: ${card.cmc}<br/>
      <b>Identity</b>: ${card.identity}<br/>
      ${card.metadata ? "<br>" + card.metadata + "<br/>" : ""}
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

document
  .getElementById("deck-list-panel")
  .addEventListener("mouseleave", () => {
    const infoBox = document.getElementById("card-info");
    infoBox.style.left = `1vw`;
    infoBox.style.top = `1vw`;
    infoBox.innerHTML = "";
    infoBox.style.display = "none";
  });

// DONE
function setCardListCardsClickable() {
  const cardList = document.getElementById("card-list-panel");
  cardList.querySelectorAll(".card").forEach((div) => {
    div.addEventListener("click", (e) => {
      const container = e.target.closest(".card");
      if (!container || container.classList.contains("disabled")) return;

      const infoBox = document.getElementById("card-info");
      if (infoBox.style.display == "block") return;

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
      <b>Cost</b>: ${card.cmc}<br/>
      <b>Identity</b>: ${card.identity}<br/>
      ${card.metadata ? "<br>" + card.metadata + "<br/>" : ""}
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
  const filterInput = document.getElementById("filter-input");
  const terms = filterInput.value
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter((term) => term !== "");

  const musts = terms.filter((t) => t.startsWith("+")).map((t) => t.slice(1));

  const excludes = terms
    .filter((t) => t.startsWith("-"))
    .map((t) => t.slice(1));

  const includes = terms.filter(
    (t) => !t.startsWith("+") && !t.startsWith("-")
  );

  const filteredCards = cards.filter((card) => {
    const text = [
      card.name,
      card.cost,
      card.text,
      card.identity,
      card.type,
      card.stats,
      card.rarity,
      card.cmc,
      card.metadata,
    ]
      .join(" ")
      .toLowerCase();

    if (musts.length && !musts.every((term) => text.includes(term))) {
      return false;
    }

    if (excludes.some((term) => text.includes(term))) {
      return false;
    }

    if (includes.length && !includes.some((term) => text.includes(term))) {
      return false;
    }

    return true;
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

  const totalSideboardText = document.getElementById("totalSideboard");
  if (totalSideboard > 0) {
    totalSideboardText.innerHTML = `Sideboard: ${totalSideboard}`;
  } else {
    totalSideboardText.innerHTML = ``;
  }
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

  totalSideboard = Math.max(0, totalDeck - 60);
  totalDeck -= totalSideboard;
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

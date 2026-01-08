let filteredNames = []; //, "Sore", "Hydrione", "John Snow"];
let filteredPlayers = [];
filteredPlayers = filterPlayers(window.players);

function drawGraph(players) {
  const margin = { top: 50, right: 20, bottom: 50, left: 50 };
  const container = document.querySelector(".rankTrackerGraph");

  // Flatten all timeseries for scales
  const allData = filteredPlayers.flatMap((p) => p.timeseries);
  const mmrMax = d3.max(allData, (d) => d.mmr);
  const yMax = Math.ceil(mmrMax / 400) * 400;
  const yMin = d3.min(allData, (d) => d.mmr);

  const colorScale = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain(window.players.map((p) => p.name));

  const circleScale = d3
    .scaleLinear()
    .domain(d3.extent(allData, (d) => d.mmr))
    .range([4, 10]);

  const valueline = d3
    .line()
    .x((d) => d.game)
    .y((d) => d.mmr);

  const lines = [
    { value: 2400, color: "purple" },
    { value: 2000, color: "green" },
    { value: 1600, color: "blue" },
    { value: 1200, color: "gold" },
    { value: 800, color: "silver" },
    { value: 400, color: "brown" },
    { value: 0, color: "gray" },
  ];

  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;

  // Clear previous SVG
  d3.select(container).selectAll("svg").remove();

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(allData, (d) => d.game))
    .range([0, width]);

  const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

  // Draw each player's line and points
  players.forEach((player) => {
    const data = player.timeseries;

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colorScale(player.name))
      .attr("stroke-width", 2)
      .attr(
        "d",
        valueline.x((d) => xScale(d.game)).y((d) => yScale(d.mmr))
      );

    svg
      .selectAll(`circle.${player.name}`)
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.game))
      .attr("cy", (d) => yScale(d.mmr))
      .attr("r", (d) => circleScale(10))
      .attr("fill", colorScale(player.name))
      .style("opacity", 0.8);
  });

  // Axes
  const [xMin, xMax] = xScale.domain();
  const step = Math.ceil((xMax - xMin + 1) / 10);

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(xMax - xMin + 1)
        .tickFormat((d) => (d % step === 0 ? d : ""))
    );

  svg
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format("d")));

  // Axis labels
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "700")
    .text("Game Count");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -35)
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "14px")
    .attr("font-weight", "700")
    .text("MMR");

  // Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .style("font-size", "16px")
    .attr("font-weight", "700")
    .attr("text-decoration", "underline")
    .text("Rank Tracker");

  // Horizontal reference lines
  lines.forEach((line) => {
    if (line.value >= yMin && line.value <= yMax) {
      svg
        .append("line")
        .attr("x1", 0)
        .attr("y1", yScale(line.value))
        .attr("x2", width)
        .attr("y2", yScale(line.value))
        .attr("stroke", line.color)
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "4 4");
    }
  });

  const minorLines = d3
    .range(Math.ceil(yMin / 100) * 100, yMax, 100)
    .filter((v) => v % 400 !== 0);

  svg
    .selectAll(".minor-mmr-line")
    .data(minorLines)
    .enter()
    .append("line")
    .attr("class", "minor-mmr-line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", (d) => yScale(d))
    .attr("y2", (d) => yScale(d))
    .attr("stroke", "#888888ff")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "2 4");

  const playerList = document.querySelector(".rankTrackerPlayers");
  playerList.innerHTML = window.players
    .map((player) => {
      return `
        <div class="player${
          filteredNames.includes(player.name) ? " selected" : ""
        }" data-puuid="${
        player.puuid
      }" style="border-left: 6px solid ${colorScale(
        player.name
      )}; padding-left: 8px;">
          <div class="name">${player.name}</div>
          <div class="rank">${
            player.tier.charAt(0).toUpperCase() +
            player.tier.slice(1).toLowerCase()
          } ${["I", "II", "III", "IV"].indexOf(player.rank) + 1}</div>
          <div class="lp">${player.lp} LP</div>
          <div class="winloss">${player.wins}W ${player.losses}L</div>
          <div class="winrate">${(
            (player.wins / (player.wins + player.losses)) *
            100
          ).toFixed(2)}% W/R</div>
        </div>
      `;
    })
    .join("");
}

const playerList = document.querySelector(".rankTrackerPlayers");
playerList.addEventListener("click", (e) => {
  const player_div = e.target.closest(".player");
  if (!player_div) return;

  const player = window.players.find(
    (p) => p.puuid == player_div.dataset.puuid
  );
  if (!player) return;

  if (filteredNames.includes(player.name)) {
    filteredNames = filteredNames.filter((name) => name !== player.name);
  } else {
    filteredNames.push(player.name);
  }

  filteredPlayers = filterPlayers(window.players);
  drawGraph(filteredPlayers);
});

// Initial draw
drawGraph(filteredPlayers);

// Redraw graph on window resize
window.addEventListener("resize", () =>
  drawGraph(filterPlayers(window.players))
);

function filterPlayers(players) {
  if (filteredNames.length > 0) {
    players = players.filter((p) => filteredNames.includes(p.name));
  }
  players.forEach((player) => {
    player.timeseries.sort((a, b) => a.game - b.game);
    player.timeseries.forEach((d, i) => (d.game = i + 1));
  });

  players.sort((a, b) => {
    const aLatest = a.timeseries[a.timeseries.length - 1]?.mmr || 0;
    const bLatest = b.timeseries[b.timeseries.length - 1]?.mmr || 0;
    return bLatest - aLatest; // highest MMR first
  });

  return players;
}

async function fetchPlayersAndDraw() {
  const res = await fetch("/rankTracker/json");
  window.players = await res.json();

  filteredPlayers = filterPlayers(window.players);

  // Clear previous graph if necessary
  d3.select(".rankTrackerGraph").selectAll("*").remove();

  drawGraph(filteredPlayers); // your graph drawing function using the new data
}

// Initial draw
fetchPlayersAndDraw();

// Refresh every minute
setInterval(fetchPlayersAndDraw, 60000); // 60,000 ms = 1 minute

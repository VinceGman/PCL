let filteredNames = [];
let removeList = ["bloom"];
window.players = window.players.filter((p) => !removeList.includes(p.name));
window.players = filterPlayers([...window.players], [], { firstSort: true });
window.logs = [];

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "graph-tooltip")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("background", "#eee")
  .style("color", "#000")
  .style("padding", "4px 8px")
  .style("border-radius", "4px")
  .style("font-size", "16px")
  .style("opacity", 0);

function drawGraph(players) {
  const margin = { top: 50, right: 20, bottom: 50, left: 50 };
  const container = document.querySelector(".rankTrackerGraph");

  // Flatten all timeseries for scales
  const allData = players.flatMap((p) => p.timeseries);
  const mmrMax = d3.max(allData, (d) => d.mmr);
  const yMax = Math.ceil(mmrMax / 400) * 400;
  const yMin = d3.min(allData, (d) => d.mmr);

  const colorScale = d3
    .scaleOrdinal(d3.schemeTableau10) // https://d3js.org/d3-scale-chromatic/categorical
    .domain(window.players.map((p) => p.name));

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

  players.forEach((player) => {
    const data = player.timeseries;

    const g = svg.append("g"); // group for this player

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colorScale(player.name))
      .attr("stroke-width", 2)
      .attr(
        "d",
        valueline.x((d) => xScale(d.game)).y((d) => yScale(d.mmr)),
      );

    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.game))
      .attr("cy", (d) => yScale(d.mmr))
      .attr("r", 3) // visual size
      .attr("fill", colorScale(player.name))
      .style("opacity", 0.8);

    // add invisible larger circle on top for easier hover
    g.selectAll("circle.hit")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "hit")
      .attr("cx", (d) => xScale(d.game))
      .attr("cy", (d) => yScale(d.mmr))
      .attr("r", 10) // larger hit area
      .style("fill", "transparent")
      .style("pointer-events", "all")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`${player.name}<br>game: ${d.game}<br>mmr: ${d.mmr}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
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
        .tickFormat((d) => (d % step === 0 ? d : "")),
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
          player.name,
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
          <div class="lpChangeLastXGames">${
            player.lpChangeLastXGames >= 0 ? "+" : ""
          }${player.lpChangeLastXGames} LP (Last ${
            player.lastXGames
          } Games)</div>
        </div>
      `;
    })
    .join("");

  const logList = document.querySelector(".log");
  logList.innerHTML = window.logs.data
    .filter((l) =>
      filteredNames.length > 0
        ? filteredNames.includes(l.text.split(":")?.[0])
        : true,
    )
    .map((log) => {
      const time = new Date(log.timestamp * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const color =
        log.text.includes("+") || log.text.includes("Promoted")
          ? "#90D5FF"
          : log.text.includes("-") || log.text.includes("Demoted")
            ? "#FF7F7F"
            : "#88E788";

      return `<div class="logItem" style="background-color:${color}">[${time}]: ${log.text}</div>`;
    })
    .join("");
}

const playerList = document.querySelector(".rankTrackerPlayers");
playerList.addEventListener("click", (e) => {
  const player_div = e.target.closest(".player");
  if (!player_div) return;

  const player = window.players.find(
    (p) => p.puuid == player_div.dataset.puuid,
  );
  if (!player) return;

  if (filteredNames.includes(player.name)) {
    filteredNames = filteredNames.filter((name) => name !== player.name);
  } else {
    filteredNames.push(player.name);
  }

  drawGraph(filterPlayers([...window.players], filteredNames));
});

// Redraw graph on window resize
window.addEventListener("resize", () =>
  drawGraph(filterPlayers([...window.players], filteredNames)),
);

const showLast10Toggle = document.querySelector("#showLast10");
showLast10Toggle.addEventListener("change", (e) => {
  drawGraph(filterPlayers([...window.players], filteredNames));
});

const showLast100LP = document.querySelector("#showLast100LP");
showLast100LP.addEventListener("change", (e) => {
  drawGraph(filterPlayers([...window.players], filteredNames));
});

const showLast3Losses = document.querySelector("#showLast3Losses");
showLast3Losses.addEventListener("change", (e) => {
  drawGraph(filterPlayers([...window.players], filteredNames));
});

const deselectOutliers = document.querySelector("#deselectOutliers");
deselectOutliers.addEventListener("click", (e) => {
  let players = window.players
    .map((p) => ({
      ...p,
      timeseries: p.timeseries.map((d) => ({ ...d })),
    }))
    .filter((p) => p.timeseries.length > 5);

  const counts = players.map((p) => p.timeseries.length).sort((a, b) => a - b);

  const n = counts.length;
  const q1 = counts[Math.floor(n * 0.25)];
  const q3 = counts[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  const k_low = 1.0;
  const k_high = 1.0;
  const low = q1 - k_low * iqr;
  const high = q3 + k_high * iqr;

  filteredNames = players
    .filter((p) => {
      const g = p.timeseries.length;
      return g >= low && g <= high;
    })
    .map((p) => p.name);

  drawGraph(filterPlayers([...window.players], filteredNames));
});

const platRace = document.querySelector("#platRace");
platRace.addEventListener("click", (e) => {
  filteredNames = [
    "Corruption",
    "ff 15 very fast",
    "KDA Player Akali",
    "Penguyen",
  ];
  drawGraph(filterPlayers([...window.players], filteredNames));
});

const allButton = document.querySelector("#selectAll");
allButton.addEventListener("click", (e) => {
  filteredNames = window.players.map((p) => p.name);
  drawGraph(filterPlayers([...window.players], filteredNames));
});

const clearButton = document.querySelector("#clear");
clearButton.addEventListener("click", (e) => {
  filteredNames = [];
  drawGraph(filterPlayers([...window.players], filteredNames));
});

function filterPlayers(players, names, options) {
  players = players.map((p) => ({
    ...p,
    timeseries: p.timeseries.map((d) => ({ ...d })),
  }));

  // players.forEach((player) => {
  //   player.timeseries.forEach((d, i) => (d.game = i + 1));
  // });

  if (names.length > 0) {
    players = players.filter((p) => names.includes(p.name));
  }

  players.forEach((player) => {
    player.timeseries.sort((a, b) => a.game - b.game);

    const first = player.timeseries[0]?.mmr || 0;
    const last = player.timeseries[player.timeseries.length - 1]?.mmr || 0;
    player.totalLPChange = last - first;

    player.lastXGames = Math.min(player.timeseries.length - 1, 10);

    const showLast10Toggle = document.querySelector("#showLast10");
    if (showLast10Toggle.checked && !options?.firstSort) {
      player.timeseries = player.timeseries.slice(-player.lastXGames);
      player.timeseries.forEach((d, i) => (d.game = i + 1));
    }

    const showLast100LP = document.querySelector("#showLast100LP");
    if (showLast100LP.checked && !options?.firstSort) {
      const ts = player.timeseries;
      const lastMMR = ts[ts.length - 1].mmr;

      let cutoffIndex = 0;
      for (let i = ts.length - 1; i >= 0; i--) {
        if (lastMMR - ts[i].mmr >= 95) {
          cutoffIndex = i;
          break;
        }
      }

      player.timeseries = ts.slice(cutoffIndex);
      player.timeseries.forEach((d, i) => (d.game = i + 1));
    }

    const showLast3Losses = document.querySelector("#showLast3Losses");
    if (showLast3Losses.checked && !options?.firstSort) {
      const ts = player.timeseries;

      let losses = 0;
      let cutoffIndex = 0;

      for (let i = ts.length - 1; i > 0; i--) {
        if (ts[i].mmr < ts[i - 1].mmr) {
          losses++;
          if (losses === 3) {
            cutoffIndex = Math.max(0, i - 1);
            break;
          }
        }
      }

      player.timeseries = ts.slice(cutoffIndex);
      player.timeseries.forEach((d, i) => (d.game = i + 1));
    }

    player.lpChangeLastXGames =
      (player.timeseries[player.timeseries.length - 1]?.mmr || 0) -
      (player.timeseries[player.timeseries.length - 1 - player.lastXGames]
        ?.mmr || 0);
  });

  const sortedPlayers = [...players].sort((a, b) => {
    const aLatest = a.timeseries[a.timeseries.length - 1]?.mmr || 0;
    const bLatest = b.timeseries[b.timeseries.length - 1]?.mmr || 0;
    return bLatest - aLatest;
  });

  return sortedPlayers;
}

async function fetchPlayersAndDraw() {
  const player_res = await fetch("/rankTracker/players");
  window.players = filterPlayers(
    (await player_res.json()).filter((p) => !removeList.includes(p.name)),
    [],
    {
      firstSort: true,
    },
  );

  const log_res = await fetch("/rankTracker/logs");
  window.logs = await log_res.json();

  // Clear previous graph if necessary
  d3.select(".rankTrackerGraph").selectAll("*").remove();

  drawGraph(filterPlayers([...window.players], filteredNames)); // your graph drawing function using the new data
}

// Initial draw
fetchPlayersAndDraw();

// Refresh every minute
setInterval(fetchPlayersAndDraw, 60000); // 60,000 ms = 1 minute

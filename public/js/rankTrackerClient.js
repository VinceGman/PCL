const names = ["Autumn", "Sore", "Hydrione", "John Snow"]; //, "John Snow", "Sore", "Hydrione"];
window.players = window.players.filter((p) => names.includes(p.name));
window.players.forEach((player) => {
  // Sort timeseries by game
  player.timeseries.sort((a, b) => a.game - b.game);

  // Replace game number with index
  player.timeseries.forEach((d, i) => {
    d.game = i; // 0-based index
  });
});

const margin = { top: 50, right: 20, bottom: 50, left: 50 };
const width = 800 * 1.5 - margin.left - margin.right;
const height = 470 * 1.5 - margin.top - margin.bottom;

// Create SVG container
const svg = d3
  .select(".center")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Flatten all timeseries to compute global scales
const allData = window.players.flatMap((p) => p.timeseries);

const mmrMax = d3.max(allData, (d) => d.mmr);
const yMax = Math.ceil(mmrMax / 400) * 400;
const yMin = d3.min(allData, (d) => d.mmr);

// Scales
const xScale = d3
  .scaleLinear()
  .domain(d3.extent(allData, (d) => d.game))
  .range([0, width]);

const yScale = d3.scaleLinear().domain([yMin, yMax]).range([height, 0]);

const circleScale = d3
  .scaleLinear()
  .domain(d3.extent(allData, (d) => d.mmr))
  .range([4, 10]);

const colorScale = d3
  .scaleOrdinal(d3.schemeCategory10)
  .domain(window.players.map((p) => p.name));

// Line generator
const valueline = d3
  .line()
  .x((d) => xScale(d.game))
  .y((d) => yScale(d.mmr));

// Draw each player's line + points
window.players.forEach((player) => {
  const data = player.timeseries;

  // Line
  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", colorScale(player.name))
    .attr("stroke-width", 2)
    .attr("d", valueline);

  // Scatter points
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
  .attr("transform", `translate(0, ${height})`)
  .call(
    d3
      .axisBottom(xScale)
      .ticks(xMax - xMin + 1) // one tick per game
      .tickFormat((d) => (d % step === 0 ? d : "")) // label subset
  );

svg.append("g").call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format("d")));

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

const lines = [
  { value: 2400, color: "purple" },
  { value: 2000, color: "green" },
  { value: 1600, color: "blue" },
  { value: 1200, color: "gold" },
  { value: 800, color: "silver" },
  { value: 400, color: "brown" },
  { value: 0, color: "gray" },
];

// const [yMin, yMax] = yScale.domain();

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

// Light dashed lines every 100 MMR (excluding multiples of 400)
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

// Legend
const legend = svg.append("g").attr("transform", `translate(${width - 80}, 0)`);

const legendItem = legend
  .selectAll(".legend-item")
  .data(window.players.map((p) => p.name))
  .enter()
  .append("g")
  .attr("class", "legend-item")
  .attr("transform", (_, i) => `translate(0, ${i * 20})`);

legendItem
  .append("line")
  .attr("x1", 0)
  .attr("y1", 10)
  .attr("x2", 20)
  .attr("y2", 10)
  .attr("stroke", (d) => colorScale(d))
  .attr("stroke-width", 3);

legendItem
  .append("text")
  .attr("x", 26)
  .attr("y", 10)
  .attr("dy", "0.35em")
  .attr("font-family", "sans-serif")
  .attr("font-size", "12px")
  .text((d) => d);

require("dotenv").config();

// initialize firestore singleton
const { firestore } = require("./database/firestore");

// initialize redis singleton
const redis = require("./cache/redis");
(async () => {
  // await redis.clear();
  // await redis.del("services:rankTracker");
  // console.log(await redis.keys("service", { sort: true }));
  // for (let key of await redis.keys("service", { sort: true })) {
  //   await redis.del(key);
  // }
  // console.log(await redis.keys());
})();

const serviceRunner = require("./src/libraries/serviceRunner");
serviceRunner.runServices();

// Load required modules
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");

// Load route handlers
const deckBuilderRoutes = require("./src/routes/deckBuilderRoutes");
const mangoChessRoutes = require("./src/routes/mangoChessRoutes");
const rankTrackerRoutes = require("./src/routes/rankTrackerRoutes");

// Initialize Express app
const app = express();

// Use environment variable for port or default to 5500
const port = process.env.PORT || 5500;

// Configure view engine and views directory for server-side templating
app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "ejs");

// Use bodyParser middleware to parse request bodies to JSON
app.use(bodyParser.json());

// Define routes for specific paths
app.use("/deckbuilder", deckBuilderRoutes);
app.use("/mangochess", mangoChessRoutes);
app.use("/ranktracker", rankTrackerRoutes);

// Serve static files from the 'public' directory
app.use(express.static("public"));

const server = app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

// Setup Socket.IO with proper CORS
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // Change to specific origin if needed
    methods: ["GET", "POST"],
  },
});

// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Listen for mouse data from client
  socket.on("mouse", (data) => {
    console.log(`Mouse data from ${socket.id}: x=${data.x}, y=${data.y}`);

    // Broadcast to everyone except sender
    socket.broadcast.emit("mouse", data);

    // If you want to send to everyone including sender:
    // io.emit('mouse', data);
  });

  // Handle disconnects
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} (${reason})`);
  });
});

module.exports = app;

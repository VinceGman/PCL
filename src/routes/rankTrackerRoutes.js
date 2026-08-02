const express = require("express");
const path = require("path");
const router = express.Router();
const rankTrackerController = require("../controllers/rankTrackerController");

router.get("/", rankTrackerController.getPlayers);
router.get("/players", rankTrackerController.getPlayersJSON);
router.get("/logs", rankTrackerController.getLogsJSON);
router.get("/riot.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public/txt/riot.txt"));
});

// Export router
module.exports = router;

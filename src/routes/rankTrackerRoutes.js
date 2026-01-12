const express = require("express");
const router = express.Router();
const rankTrackerController = require("../controllers/rankTrackerController");

router.get("/", rankTrackerController.getPlayers);
router.get("/players", rankTrackerController.getPlayersJSON);
router.get("/logs", rankTrackerController.getLogsJSON);

// Export router
module.exports = router;

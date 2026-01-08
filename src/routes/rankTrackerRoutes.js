const express = require("express");
const router = express.Router();
const rankTrackerController = require("../controllers/rankTrackerController");

router.get("/", rankTrackerController.getPlayers);
router.get("/json", rankTrackerController.getPlayersJSON);

// Export router
module.exports = router;

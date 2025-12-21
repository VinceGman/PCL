const express = require("express");
const router = express.Router();
const rankTrackerController = require("../controllers/rankTrackerController");

router.get("/", rankTrackerController.getPlayers);

// Export router
module.exports = router;

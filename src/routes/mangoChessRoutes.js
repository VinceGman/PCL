const express = require("express");
const router = express.Router();
const mangoChessController = require("../controllers/mangoChessController");

router.get("/", mangoChessController.newGame);
// router.get("/api", mangoChessController.sendCardsAPI);
// router.get("/tts-sheet", mangoChessController.generateCardSheet);

// Export router
module.exports = router;

const express = require("express");
const router = express.Router();
const deckBuilderController = require("../controllers/deckBuilderController");

router.get("/", deckBuilderController.getCards);
router.get("/api", deckBuilderController.sendCardsAPI);
router.get("/tts-sheet", deckBuilderController.generateCardSheet);

// Export router
module.exports = router;

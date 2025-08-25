// require utilized models
// const mangoChessModel = require("../models/mangoChessModel");
const sharp = require("sharp");
const axios = require("axios");

class MangoChessController {
  async newGame(req, res) {
    // const cards = await mangoChessModel.newGame();
    // res.render("pages/board", { cards: cards }); // eventually load with map
    res.render("pages/board");
  }
}

module.exports = new MangoChessController();

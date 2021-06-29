const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  english: String,
  description: String,
  example: String,
  turkish: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Card = mongoose.model("Card", CardSchema);
module.exports = Card;

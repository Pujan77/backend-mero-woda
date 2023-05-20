const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  trainings: Boolean,
  campaign: Boolean,
  garbage: Boolean,
  sanitation: Boolean,
});

const News = mongoose.model("News", newsSchema);

module.exports = News;

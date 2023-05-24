const mongoose = require("mongoose");

const allNewsSchema = new mongoose.Schema({
  typeOfNotice: {
    type: String,
    enum: ["trainings", "campaign", "garbage", "sanitation"],
    required: true,
  },
  publishedDate: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  viewPage: {
    type: String,
    required: true,
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const Notice = mongoose.model("Notice", allNewsSchema);

module.exports = Notice;

const mongoose = require("mongoose");

const complainSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to User model
  message: String,
  date: { type: Date, default: Date.now },
  typeOfComplain: {
    type: String,
    enum: ["Service", "Website", "Notification", "Other"],
    required: true,
  },
  addressedStatus: {
    type: Boolean,
    default: false,
  },
  addressMessage: {
    type: String,
    required: false,
    default: "",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Complain = mongoose.model("Complain", complainSchema);

module.exports = Complain;

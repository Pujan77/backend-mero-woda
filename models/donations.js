const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  amount: Number,
  createdAt: { type: Date, default: Date.now },
});

const Donation = mongoose.model("Donation", donationSchema);

const donationListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  donations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DonationList = mongoose.model("DonationList", donationListSchema);

module.exports = { Donation, DonationList };

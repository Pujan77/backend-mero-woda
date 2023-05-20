const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

module.exports = User;

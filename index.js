const express = require("express");
const cors = require("cors");
const passport = require("passport");
const config = require("./config/config");
require("./config/db");
require("./config/passport");

const bodyParser = require("body-parser");

const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/authentication");
const { port } = require("./config/config");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(cors());
// Routes
app.use("/api/", userRoutes);
app.use("/api-admin/", adminRoutes);
// Start server
const PORT = port || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

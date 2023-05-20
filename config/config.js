require("dotenv").config();

module.exports = {
  port: process.env.PORT,
  mongoURI: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRET,
  sgApi: process.env.SENDGRID_API_KEY,
  emailId: process.env.GMAIL_EMAIL,
};

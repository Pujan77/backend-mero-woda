const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admins = require("../models/authUsers");
const sgMail = require("@sendgrid/mail");
const config = require("../config/config");

const router = express.Router();
sgMail.setApiKey(config.sgApi);

router.post("/signup", async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  try {
    const user = await Admins.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Admins({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      createdAt: Date.now(),
    });

    await newUser.save();
    const msg = {
      to: email, // Change to your recipient
      from: config.emailId, // Change to your verified sender
      subject: "Welcome to Mero-Woda",
      text: "You are joining team as admin",
      html: `<p>Hello,</p><p>You have signed in to mero-woda as ${role}.</p><p>If you did not request this, please ignore this email.</p>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    if (error._message === "User validation failed") {
      res.status(403).json({ message: "Mark all checked inputs" });
    } else {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
});

router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user }, config.jwtSecret);
    res.json({
      data: {
        email: req.user.email,
        token: token,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        createdAt: req.user.createdAt,
      },
      message: "Successfully logged in.",
    });
  }
);

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Admins.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    // Generate a random token using bcrypt
    const token = await bcrypt.hash(
      Math.random().toString(36).substring(2),
      10
    );

    // Store the token in the user's record in the database
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send an email with the token
    const msg = {
      to: email, // Change to your recipient
      from: config.emailId, // Change to your verified sender
      subject: "Password Reset Request",
      text: "Use the link to reset password",
      html: `<p>Hello,</p><p>You have requested to reset your password. Please use the following link to reset your password:</p><p><strong><a href="https://snrp.xyz/reset-password?token=${token}">Reset</a></strong></p><p>This token will expire in 1 hour.</p><p>If you did not request a password reset, please ignore this email.</p>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
    res.status(200).json({ message: "Token sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required" });
    }

    const user = await Admins.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;

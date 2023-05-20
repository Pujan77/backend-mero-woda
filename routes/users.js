const express = require("express");
const User = require("../models/user");
const News = require("../models/news");
const config = require("../config/config");
const sgMail = require("@sendgrid/mail");
const { requireLogin, requireStaffRole } = require("../middleware/auth");

const router = express.Router();
sgMail.setApiKey(config.sgApi);

router.get("/user-messages", async (req, res) => {
  const { email, phone } = req.query;
  try {
    const user = await User.findOne({ email, phone });
    if (!user) {
      return res.status(404).send("User not found");
    }
    const news = await News.findOne({ user: user._id });
    res.send({ user, news });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/user-messages", async (req, res) => {
  const { email, phone } = req.query;
  const { firstName, lastName, trainings, campaign, garbage, sanitation } =
    req.body;

  try {
    let user = await User.findOne({ email, phone });

    if (!user) {
      user = new User({ email, phone, firstName, lastName });
    } else {
      user.firstName = firstName;
      user.lastName = lastName;
      user.updatedAt = new Date();
    }

    let news = await News.findOne({ user: user._id });

    if (!news) {
      news = new News({
        user: user._id,
        trainings,
        campaign,
        garbage,
        sanitation,
      });
    } else {
      news.trainings = trainings;
      news.campaign = campaign;
      news.garbage = garbage;
      news.sanitation = sanitation;
    }

    await user.save();
    await news.save();
    const msg = {
      to: email, // Change to your recipient
      from: config.emailId, // Change to your verified sender
      subject: "Welcome to Mero-Woda",
      text: "You will be getting notification shortly",
      html: `<p>Hello ${firstName} ${lastName},<br></p><p>You have signed in to mero-woda to receive the notification of the following: ${
        trainings === true ? "trainings" : ""
      }, ${sanitation === true ? "sanitation" : ""}, ${
        garbage === true ? "garbage" : ""
      }, ${
        campaign === true ? "campaign" : ""
      }</p><p>If you did not request a notification, please ignore this email.</p>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Email sent");
      })
      .catch((error) => {
        console.error(error);
      });
    res.send({ user, news });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/user-messages", async (req, res) => {
  const { email, phone } = req.query;
  const { firstName, lastName, trainings, campaign, garbage, sanitation } =
    req.body;

  try {
    const user = await User.findOne({ email, phone });

    if (!user) {
      return res.status(404).send("User not found");
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.updatedAt = new Date();
    let news = await News.findOne({ user: user._id });

    if (!news) {
      news = new News({
        user: user._id,
        trainings,
        campaign,
        garbage,
        sanitation,
      });
    } else {
      news.trainings = trainings;
      news.campaign = campaign;
      news.garbage = garbage;
      news.sanitation = sanitation;
    }

    await user.save();
    await news.save();

    res.send({ user, news });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.post(
  "/post-information",
  requireLogin,
  requireStaffRole,
  async (req, res) => {
    const { typeOf } = req.body;

    try {
      // Find all news entries with the specified typeOf and populate the associated user
      const newsEntries = await News.find({ [typeOf]: true }).populate("user");

      // Send email to each associated user
      for (const newsEntry of newsEntries) {
        const user = newsEntry.user;

        // Create the email content
        const mailOptions = {
          from: config.emailId,
          to: user.email,
          subject: `Important ${typeOf} Information`,
          text: `Dear ${user.firstName} ${user.lastName},\n\nWe have important ${typeOf} information to share with you.`,
          html: `<p>you received a mail for ${typeOf}.</p>`,
        };

        // Send the email
        sgMail
          .send(mailOptions)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      }

      res.status(200).json({ message: "Emails sent successfully" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  }
);

module.exports = router;

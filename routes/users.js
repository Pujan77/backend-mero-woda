const express = require("express");
const User = require("../models/user");
const News = require("../models/news");
const config = require("../config/config");
const sgMail = require("@sendgrid/mail");
const { requireLogin, requireStaffRole } = require("../middleware/auth");
const { Donation, DonationList } = require("../models/donations");

const router = express.Router();
sgMail.setApiKey(config.sgApi);

router.get("/user-messages", async (req, res) => {
  const { email, phone } = req.query;
  try {
    const user = await User.findOne({ email, phone });
    if (!user) {
      return res.status(404).send({
        message: "No user found.",
      });
    }
    const news = await News.findOne({ user: user._id });
    res.send({
      data: { user, news },
      message: "Success.",
    });
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
    } else if (user) {
      return res.status(207).send({
        data: { user },
        message: "Already Subscribed. Use Edit feature instead.",
      });
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
        trainings === true ? "trainings," : ""
      } ${sanitation === true ? "sanitation," : ""} ${
        garbage === true ? "garbage," : ""
      } ${
        campaign === true ? "campaign" : ""
      }</p><p>If you did not request a notification, please ignore this email.</p>`,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log(`Email sent to ${email}`);
      })
      .catch((error) => {
        console.error(error);
      });
    res.send({
      data: { user, news },
      message: "Successfully subscribed. Check your email.",
    });
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
      res.status(404).send({
        message: "User not found. Use Subscribe instead.",
      });
    } else {
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

      res.send({
        data: { user, news },
        message: "Successfully edited.",
      });
    }
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
            console.log(`Email sent to ${user.email}`);
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

router.get("/donations", requireLogin, requireStaffRole, async (req, res) => {
  try {
    const donations = await DonationList.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $lookup: {
          from: "donations",
          localField: "donations",
          foreignField: "_id",
          as: "donationDetails",
        },
      },
      {
        $addFields: {
          totalAmountDonated: { $sum: "$donationDetails.amount" },
        },
      },
      {
        $project: {
          "userDetails.email": 1,
          "userDetails.firstName": 1,
          "userDetails.lastName": 1,
          "donationDetails.amount": 1,
          totalAmountDonated: 1,
        },
      },
    ]);

    res.json(donations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/donations/:email", async (req, res) => {
  try {
    const { email } = req.params;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the donation list for the user
    const donationList = await DonationList.findOne({
      user: user._id,
    }).populate("donations");

    if (!donationList) {
      return res.status(404).json({ message: "Donation list not found" });
    }

    // Calculate the total donation amount
    const totalAmountDonated = donationList.donations.reduce(
      (sum, donation) => sum + donation.amount,
      0
    );

    res.json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      donationList: donationList.donations,
      totalAmountDonated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/donate", async (req, res) => {
  try {
    const { email } = req.query;
    const { amount, firstName, lastName, phone } = req.body;

    // Find the user by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user
      user = new User({ email, firstName, lastName, phone });

      // Set news entity values to false
      const news = new News({
        user: user._id,
        garbage: false,
        campaign: false,
        trainings: false,
        sanitation: false,
      });
      await news.save();

      user.news = news._id;
      await user.save();
      const msg = {
        to: email, // Change to your recipient
        from: config.emailId, // Change to your verified sender
        subject: "Thank you for donating.",
        text: "Welcome to Mero-woda",
        html: `<p>Hello ${firstName} ${lastName},<br></p><p>Thank you for a generous donation of $${amount}. We have included you in our system. If you would like to get notified about various activities. Please visit the site and get signed up.</p><p>If you did not request this, please ignore this email.</p>`,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log(`Email sent to ${email}`);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      const msg = {
        to: email, // Change to your recipient
        from: config.emailId, // Change to your verified sender
        subject: "Thank you for donating.",
        text: "Your contribution means a lot.",
        html: `<p>Hello ${user.firstName} ${user.lastName},<br></p><p>Thank you for a generous donation of $${amount}.</p><p>If you did not request this, please ignore this email.</p>`,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log(`Email sent to ${email}`);
        })
        .catch((error) => {
          console.error(error);
        });
    }

    // Create a new donation
    const donation = new Donation({ amount });
    await donation.save();

    // Update the user's donation list
    let donationList = await DonationList.findOne({ user: user._id });

    if (!donationList) {
      donationList = new DonationList({
        user: user._id,
        donations: [donation._id],
      });
    } else {
      donationList.donations.push(donation._id);
    }

    await donationList.save();

    res.json({ message: "Donation added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

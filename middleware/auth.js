// middleware/auth.js

const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");

exports.requireLogin = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized inner" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);

    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized outer" });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.id.role === role) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized role" });
  };
};

exports.requireStaffRole = requireRole("staff");

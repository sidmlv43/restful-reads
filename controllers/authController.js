const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

// Register a user (default role: Customer)
// Request: { name, email, password }
// Response: { token }
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedName = String(name || "").trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return next(
        ApiError.badRequest("Name, email, and password are required"),
      );
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) return next(ApiError.badRequest("User already exists"));

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
    });
    await user.save();

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "changeme", {
      expiresIn: "7d",
    });
    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

// Login
// Request: { email, password }
// Response: { token }
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      return next(ApiError.badRequest("Email and password are required"));
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return next(ApiError.badRequest("Invalid credentials"));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(ApiError.badRequest("Invalid credentials"));

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "changeme", {
      expiresIn: "7d",
    });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

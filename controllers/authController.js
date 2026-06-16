const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// Register a user (default role: Customer)
// Request: { name, email, password }
// Response: { token }
exports.register = async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return next(ApiError.badRequest('User already exists'));

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashed });
    await user.save();

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });
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
    const user = await User.findOne({ email });
    if (!user) return next(ApiError.badRequest('Invalid credentials'));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(ApiError.badRequest('Invalid credentials'));

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

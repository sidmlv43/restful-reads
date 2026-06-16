const User = require('../models/User');

const validateAddressPayload = (body) => {
  const { label, line1, city, state, postalCode, country } = body;
  if (!label || !line1 || !city || !state || !postalCode || !country) {
    return false;
  }
  return true;
};

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    addresses: user.addresses || []
  });
};

// GET /api/users/addresses
exports.listAddresses = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({ addresses: user.addresses || [] });
  } catch (err) { next(err); }
};

// POST /api/users/addresses
// Body: { label, line1, line2, city, state, postalCode, country, isDefault }
exports.addAddress = async (req, res, next) => {
  if (!validateAddressPayload(req.body)) return next(require('../utils/ApiError').badRequest('Missing required address fields'));
  try {
    const user = await User.findById(req.user._id);
    const address = {
      label: req.body.label,
      line1: req.body.line1,
      line2: req.body.line2 || '',
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
      isDefault: !!req.body.isDefault
    };
    if (!user.addresses) user.addresses = [];
    if (address.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }
    if (user.addresses.length === 0) address.isDefault = true;
    user.addresses.push(address);
    await user.save();
    res.status(201).json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/addresses/:id
exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);
    if (!address) return next(require('../utils/ApiError').notFound('Address not found'));

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
      address.isDefault = true;
    }
    ['label', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'].forEach((field) => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/addresses/:id
exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);
    if (!address) return next(require('../utils/ApiError').notFound('Address not found'));
    address.remove();
    if (user.addresses.length > 0 && !user.addresses.some((addr) => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

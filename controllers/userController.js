const User = require("../models/User");
const Book = require("../models/Book");
const Cart = require("../models/Cart");
const ApiError = require("../utils/ApiError");
const orderController = require("./orderController");

const validateAddressPayload = (body) => {
  const { label, line1, city, state, postalCode, country } = body;
  if (!label || !line1 || !city || !state || !postalCode || !country) {
    return false;
  }
  return true;
};

const calculateCartSummary = (items) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const taxRate = 0.08;
  const tax = Number((subtotal * taxRate).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  return { subtotal, tax, total, taxRate };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.book");
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const getCartItemBookId = (item) => {
  if (!item || !item.book) return null;
  return item.book._id ? item.book._id.toString() : item.book.toString();
};

// GET /api/users/profile
exports.getProfile = async (req, res) => {
  const user = req.user;
  const cart = await getOrCreateCart(user._id);
  const summary = calculateCartSummary(cart.items || []);

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    addresses: user.addresses || [],
    cart: {
      itemCount: cart.items.length,
      summary,
    },
  });
};

// GET /api/users/cart
exports.getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const summary = calculateCartSummary(cart.items || []);
    res.json({
      cart: {
        _id: cart._id,
        user: cart.user,
        items: cart.items || [],
        summary,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/cart/checkout
// Body: { addressId }
exports.checkoutCart = async (req, res, next) => {
  try {
    if (!req.body || !req.body.addressId) {
      return next(ApiError.badRequest("Address selection is required"));
    }
    return orderController.createOrder(req, res, next);
  } catch (err) {
    return next(err);
  }
};

// POST /api/users/cart/items
// Body: { bookId, quantity }
exports.addToCart = async (req, res, next) => {
  try {
    const { bookId, quantity = 1 } = req.body;
    if (!bookId) return next(ApiError.badRequest("Book ID is required"));
    if (!Number.isInteger(quantity) || quantity < 1) {
      return next(ApiError.badRequest("Quantity must be a positive integer"));
    }

    const book = await Book.findById(bookId);
    if (!book) return next(ApiError.notFound("Book not found"));

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find(
      (item) => getCartItemBookId(item) === bookId,
    );
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = book.price;
    } else {
      cart.items.push({ book: book._id, quantity, price: book.price });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate("items.book");
    const summary = calculateCartSummary(updatedCart.items || []);
    res.status(201).json({
      cart: {
        _id: updatedCart._id,
        user: updatedCart.user,
        items: updatedCart.items || [],
        summary,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/cart/items/:bookId
// Body: { quantity }
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return next(ApiError.badRequest("Quantity must be a positive integer"));
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find(
      (entry) => getCartItemBookId(entry) === req.params.bookId,
    );
    if (!item) return next(ApiError.notFound("Cart item not found"));

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate("items.book");
    const summary = calculateCartSummary(updatedCart.items || []);
    res.json({
      cart: {
        _id: updatedCart._id,
        user: updatedCart.user,
        items: updatedCart.items || [],
        summary,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/cart/items/:bookId
exports.removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter(
      (item) => getCartItemBookId(item) !== req.params.bookId,
    );
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate("items.book");
    const summary = calculateCartSummary(updatedCart.items || []);
    res.json({
      cart: {
        _id: updatedCart._id,
        user: updatedCart.user,
        items: updatedCart.items || [],
        summary,
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/cart
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json({
      cart: {
        _id: cart._id,
        user: cart.user,
        items: [],
        summary: calculateCartSummary([]),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/addresses
exports.listAddresses = async (req, res, next) => {
  try {
    const user = req.user;
    res.json({ addresses: user.addresses || [] });
  } catch (err) {
    next(err);
  }
};

// POST /api/users/addresses
// Body: { label, line1, line2, city, state, postalCode, country, isDefault }
exports.addAddress = async (req, res, next) => {
  if (!validateAddressPayload(req.body))
    return next(ApiError.badRequest("Missing required address fields"));
  try {
    const user = await User.findById(req.user._id);
    const address = {
      label: req.body.label,
      line1: req.body.line1,
      line2: req.body.line2 || "",
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
      isDefault: !!req.body.isDefault,
    };
    if (!user.addresses) user.addresses = [];
    if (address.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
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
    if (!address) return next(ApiError.notFound("Address not found"));

    if (req.body.isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
      address.isDefault = true;
    }
    [
      "label",
      "line1",
      "line2",
      "city",
      "state",
      "postalCode",
      "country",
    ].forEach((field) => {
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
    if (!address) return next(ApiError.notFound("Address not found"));
    address.remove();
    if (
      user.addresses.length > 0 &&
      !user.addresses.some((addr) => addr.isDefault)
    ) {
      user.addresses[0].isDefault = true;
    }
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

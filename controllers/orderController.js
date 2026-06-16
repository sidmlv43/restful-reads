const Order = require('../models/Order');
const Book = require('../models/Book');
const User = require('../models/User');
const handler = require('../utils/handlerFactory');

// POST /api/orders
// Body: { items: [{ bookId, quantity }], addressId }
exports.createOrder = async (req, res, next) => {
  const user = req.user;
  const { items, addressId } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items provided' });
  if (!addressId) return res.status(400).json({ message: 'Address selection is required' });
  try {
    const storedUser = await User.findById(user._id);
    const address = storedUser.addresses.id(addressId);
    if (!address) return next(require('../utils/ApiError').badRequest('Selected address not found'));
    const orderItems = [];
    for (const it of items) {
      const book = await Book.findById(it.bookId);
      if (!book) return res.status(400).json({ message: `Book not found: ${it.bookId}` });
      orderItems.push({ book: book._id, quantity: it.quantity || 1, price: book.price });
    }
    const shippingAddress = {
      addressId: address._id,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country
    };
    const order = new Order({ user: user._id, items: orderItems, shippingAddress });
    await order.save();
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  const user = req.user;
  try {
    const order = await Order.findById(req.params.id).populate('items.book');
    if (!order) return next(require('../utils/ApiError').notFound('Order not found'));
    if (user.role === 'Customer' && order.user.toString() !== user._id.toString()) {
      return next(require('../utils/ApiError').forbidden('Forbidden'));
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders
exports.listOrders = handler.list(Order, {
  populate: 'items.book',
  defaultSort: { createdAt: -1 },
  filterMap: {},
  baseFilter: (req) => {
    if (req.user && req.user.role === 'Customer') return { user: req.user._id };
    return {};
  }
});

// PUT /api/orders/:id/status (Admin)
// Body: { status }
exports.updateStatus = async (req, res, next) => {
  const { status } = req.body;
  const ApiError = require('../utils/ApiError');
  if (!['Pending', 'Processing', 'Shipped', 'Delivered'].includes(status)) {
    return next(ApiError.badRequest('Invalid status'));
  }
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(ApiError.notFound('Order not found'));
    order.status = status;
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

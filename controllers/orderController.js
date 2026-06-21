const Order = require("../models/Order");
const Book = require("../models/Book");
const User = require("../models/User");
const Cart = require("../models/Cart");
const ApiError = require("../utils/ApiError");
const handler = require("../utils/handlerFactory");

const buildShippingAddress = (address) => ({
  addressId: address._id,
  label: address.label,
  line1: address.line1,
  line2: address.line2,
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
});

// POST /api/orders
// Body: { items?: [{ bookId, quantity }], addressId }
exports.createOrder = async (req, res, next) => {
  const user = req.user;
  const { items, addressId } = req.body;

  try {
    const storedUser = await User.findById(user._id);
    if (!storedUser) return next(ApiError.notFound("User not found"));

    const address = storedUser.addresses.id(addressId);
    if (!address)
      return next(ApiError.badRequest("Selected address not found"));

    let selectedItems = items;
    if (
      !selectedItems ||
      !Array.isArray(selectedItems) ||
      selectedItems.length === 0
    ) {
      const cart = await Cart.findOne({ user: user._id }).populate(
        "items.book",
      );
      if (!cart || !cart.items || cart.items.length === 0) {
        return next(ApiError.badRequest("Cart is empty"));
      }
      selectedItems = cart.items.map((entry) => ({
        bookId: entry.book._id.toString(),
        quantity: entry.quantity,
      }));
    }

    const orderItems = [];
    for (const it of selectedItems) {
      const book = await Book.findById(it.bookId);
      if (!book) return next(ApiError.notFound(`Book not found: ${it.bookId}`));
      orderItems.push({
        book: book._id,
        quantity: it.quantity || 1,
        price: book.price,
      });
    }

    const shippingAddress = buildShippingAddress(address);
    const order = new Order({
      user: user._id,
      items: orderItems,
      shippingAddress,
    });
    await order.save();

    let clearedCart = null;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const cart = await Cart.findOne({ user: user._id });
      if (cart) {
        clearedCart = {
          _id: cart._id,
          itemCount: cart.items.length,
        };
        cart.items = [];
        await cart.save();
      }
    }

    const populatedOrder = await Order.findById(order._id).populate(
      "items.book",
    );

    const subtotal = populatedOrder.items.reduce(
      (sum, entry) => sum + entry.price * entry.quantity,
      0,
    );
    const taxRate = 0.08;
    const tax = Number((subtotal * taxRate).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
      summary: {
        subtotal,
        tax,
        total,
        taxRate,
      },
      cart: clearedCart,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  const user = req.user;
  try {
    const order = await Order.findById(req.params.id).populate("items.book");
    if (!order)
      return next(require("../utils/ApiError").notFound("Order not found"));
    if (
      user.role === "Customer" &&
      order.user.toString() !== user._id.toString()
    ) {
      return next(require("../utils/ApiError").forbidden("Forbidden"));
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders
exports.listOrders = handler.list(Order, {
  populate: "items.book",
  defaultSort: { createdAt: -1 },
  filterMap: {},
  baseFilter: (req) => {
    if (req.user && req.user.role === "Customer") return { user: req.user._id };
    return {};
  },
});

// PUT /api/orders/:id/status (Admin)
// Body: { status }
exports.updateStatus = async (req, res, next) => {
  const { status } = req.body;
  const ApiError = require("../utils/ApiError");
  if (!["Pending", "Processing", "Shipped", "Delivered"].includes(status)) {
    return next(ApiError.badRequest("Invalid status"));
  }
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(ApiError.notFound("Order not found"));
    order.status = status;
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

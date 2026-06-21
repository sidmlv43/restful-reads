const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const userController = require("../controllers/userController");

// GET /api/users/profile
router.get("/profile", auth, userController.getProfile);

// Cart routes
router.get("/cart", auth, userController.getCart);
router.post("/cart/checkout", auth, userController.checkoutCart);
router.post("/cart/items", auth, userController.addToCart);
router.put("/cart/items/:bookId", auth, userController.updateCartItem);
router.delete("/cart/items/:bookId", auth, userController.removeCartItem);
router.delete("/cart", auth, userController.clearCart);

// GET /api/users/addresses
router.get("/addresses", auth, userController.listAddresses);

// POST /api/users/addresses
router.post("/addresses", auth, userController.addAddress);

// PUT /api/users/addresses/:id
router.put("/addresses/:id", auth, userController.updateAddress);

// DELETE /api/users/addresses/:id
router.delete("/addresses/:id", auth, userController.deleteAddress);

module.exports = router;

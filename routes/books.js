const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/roles");
const bookController = require("../controllers/bookController");
const reviewController = require("../controllers/reviewController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
  limits: { files: 5 },
});
const bookImageUpload = upload.array("images", 5);

// Public: list and get
router.get("/get-featured", bookController.getFeaturedBooks);

router.get("/", bookController.listBooks);

router.get("/:id", bookController.getBook);

// Admin only
router.post(
  "/",
  auth,
  role("Admin"),
  bookImageUpload,
  bookController.createBook,
);
router.patch(
  "/:id",
  auth,
  role("Admin"),
  bookImageUpload,
  bookController.updateBook,
);
router.delete("/:id", auth, role("Admin"), bookController.deleteBook);

// Customer only: rate a book
router.post("/:id/rate", auth, role("Customer"), reviewController.addReview);

module.exports = router;

const mongoose = require("mongoose");
const handler = require("../utils/handlerFactory");
const ApiError = require("../utils/ApiError");

const filterMap = {
  minRating: (v) => ({ averageRating: { $gte: Number(v) } }),
};
const Book = require("../models/Book");

const getUploadedImages = (req) => {
  if (req.files && req.files.length > 0) {
    return req.files.map((file) => `/uploads/${file.filename}`);
  }
  return undefined;
};

const buildBookPayload = (req) => {
  const payload = { ...req.body };
  const uploadedImages = getUploadedImages(req);
  if (uploadedImages) {
    payload.images = uploadedImages;
  }
  return payload;
};

// GET /api/books?author=...&minRating=...&page=1&limit=10
exports.listBooks = handler.list(Book, {
  filterMap,
  defaultSort: { createdAt: -1 },
  populate: "",
});

// GET /api/books/:id
exports.getBook = handler.getOne(Book, { select: "" });

// POST /api/books (Admin)
// Body: multipart/form-data fields + images files
exports.createBook = async (req, res, next) => {
  try {
    const payload = buildBookPayload(req);
    const book = new Book(payload);
    await book.save();
    return res.status(201).json(book);
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/books/:id (Admin)
exports.deleteBook = handler.deleteOne(Book);

// PATCH /api/books/:id (Admin)
// Body: multipart/form-data fields + images files
exports.updateBook = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(ApiError.badRequest("Invalid book id"));
    }

    const book = await Book.findById(req.params.id);
    if (!book) return next(ApiError.notFound("Not found"));

    const payload = buildBookPayload(req);
    Object.assign(book, payload);
    await book.save();
    return res.json(book);
  } catch (err) {
    return next(err);
  }
};

const handler = require('../utils/handlerFactory');

const filterMap = {
  minRating: (v) => ({ averageRating: { $gte: Number(v) } })
};
const Book = require('../models/Book');

// GET /api/books?author=...&minRating=...&page=1&limit=10
exports.listBooks = handler.list(Book, { filterMap, defaultSort: { createdAt: -1 }, populate: '' });

// GET /api/books/:id
exports.getBook = handler.getOne(Book, { select: '' });

// POST /api/books (Admin)
// Body: { title, author, genre, price }
exports.createBook = handler.createOne(Book);

// DELETE /api/books/:id (Admin)
exports.deleteBook = handler.deleteOne(Book);

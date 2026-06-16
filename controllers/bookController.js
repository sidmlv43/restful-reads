const Book = require('../models/Book');

// GET /api/books?author=...&minRating=...
exports.listBooks = async (req, res) => {
  const { author, minRating } = req.query;
  const filter = {};
  if (author) filter.author = author;
  if (minRating) filter.averageRating = { $gte: Number(minRating) };
  try {
    const books = await Book.find(filter);
    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/books/:id
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/books (Admin)
// Body: { title, author, genre, price }
exports.createBook = async (req, res) => {
  const { title, author, genre, price } = req.body;
  try {
    const book = new Book({ title, author, genre, price });
    await book.save();
    res.status(201).json({ book });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/books/:id (Admin)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    await book.remove();
    res.json({ message: 'Book removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

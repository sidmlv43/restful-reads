const Review = require('../models/Review');
const Order = require('../models/Order');
const Book = require('../models/Book');

// POST /api/books/:id/rate
// Body: { rating: 1-5, reviewText, orderId }
exports.addReview = async (req, res) => {
  const user = req.user;
  const bookId = req.params.id;
  const { rating, reviewText, orderId } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Invalid rating' });
  try {
    // Verify order belongs to user, is Delivered, and contains the book
    const order = await Order.findOne({ _id: orderId, user: user._id, status: 'Delivered' });
    if (!order) return res.status(400).json({ message: 'No completed order found containing the book' });

    const contains = order.items.some(i => i.book.toString() === bookId);
    if (!contains) return res.status(400).json({ message: 'Book not found in the specified completed order' });

    // Check for existing review for this order/book by this user
    const existing = await Review.findOne({ user: user._id, book: bookId, order: orderId });
    if (existing) return res.status(409).json({ message: 'You have already reviewed this book for this purchase' });

    const review = new Review({ user: user._id, book: bookId, order: orderId, rating, reviewText });
    await review.save();

    // Update book averageRating and ratingsCount
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const totalRating = (book.averageRating * book.ratingsCount) + rating;
    book.ratingsCount = book.ratingsCount + 1;
    book.averageRating = +(totalRating / book.ratingsCount).toFixed(2);
    await book.save();

    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

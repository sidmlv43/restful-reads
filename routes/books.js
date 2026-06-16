const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/roles');
const bookController = require('../controllers/bookController');
const reviewController = require('../controllers/reviewController');

// Public: list and get
router.get('/', bookController.listBooks);
router.get('/:id', bookController.getBook);

// Admin only
router.post('/', auth, role('Admin'), bookController.createBook);
router.delete('/:id', auth, role('Admin'), bookController.deleteBook);

// Customer only: rate a book
router.post('/:id/rate', auth, role('Customer'), reviewController.addReview);

module.exports = router;

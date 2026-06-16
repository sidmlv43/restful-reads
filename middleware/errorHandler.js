const ApiError = require('../utils/ApiError');

module.exports = (err, req, res, next) => {
  // If error is an ApiError, use its status
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation error', details: messages });
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier', details: err.message });
  }

  // Default to 500
  console.error(err);
  return res.status(500).json({ message: 'Internal Server Error' });
};

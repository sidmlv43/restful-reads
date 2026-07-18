const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookstore';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    if (retries > 0) {
      console.warn(`MongoDB connection failed. Retrying in 5 seconds... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }

    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Book = require('./models/Book');
const bcrypt = require('bcryptjs');

async function seed() {
  await connectDB();
  console.log('Seeding database...');
  await User.deleteMany({});
  await Book.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('adminpass', salt);
  const custPass = await bcrypt.hash('custpass', salt);

  const admin = new User({ name: 'Admin User', email: 'admin@example.com', password: adminPass, role: 'Admin' });
  const cust1 = new User({
    name: 'Customer One',
    email: 'cust1@example.com',
    password: custPass,
    role: 'Customer',
    addresses: [
      {
        label: 'Home',
        line1: '123 Main St',
        city: 'Metropolis',
        state: 'State',
        postalCode: '12345',
        country: 'Country',
        isDefault: true
      }
    ]
  });
  const cust2 = new User({
    name: 'Customer Two',
    email: 'cust2@example.com',
    password: custPass,
    role: 'Customer',
    addresses: [
      {
        label: 'Home',
        line1: '456 Elm St',
        city: 'Gotham',
        state: 'State',
        postalCode: '67890',
        country: 'Country',
        isDefault: true
      }
    ]
  });
  await admin.save();
  await cust1.save();
  await cust2.save();

  const books = [];
  for (let i = 1; i <= 10; i++) {
    books.push(new Book({
      title: `Sample Book ${i}`,
      author: `Author ${i % 3}`,
      genre: ['Fiction', 'Non-Fiction', 'Sci-Fi'][i % 3],
      price: 10 + i
    }));
  }
  await Book.insertMany(books);

  console.log('Seed complete. Admin: admin@example.com / adminpass');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});

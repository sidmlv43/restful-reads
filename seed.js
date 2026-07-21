require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const Book = require("./models/Book");
const bcrypt = require("bcryptjs");

async function seed() {
  await connectDB();
  console.log("Seeding database...");

  await User.deleteMany({});
  await Book.deleteMany({});
  await mongoose.connection.db.dropCollection("carts").catch(() => {});

  // ---------------- USERS ----------------
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash("adminpass", salt);
  const custPass = await bcrypt.hash("custpass", salt);

  const users = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPass,
      role: "Admin",
    },
    {
      name: "Customer One",
      email: "cust1@example.com",
      password: custPass,
      role: "Customer",
      addresses: [
        {
          label: "Home",
          line1: "123 Main St",
          city: "Metropolis",
          state: "State",
          postalCode: "12345",
          country: "Country",
          isDefault: true,
        },
      ],
    },
    {
      name: "Customer Two",
      email: "cust2@example.com",
      password: custPass,
      role: "Customer",
      addresses: [
        {
          label: "Home",
          line1: "456 Elm St",
          city: "Gotham",
          state: "State",
          postalCode: "67890",
          country: "Country",
          isDefault: true,
        },
      ],
    },
  ];

  for (let i = 2; i <= 20; i += 1) {
    users.push({
      name: `Admin User ${i}`,
      email: `admin${i}@example.com`,
      password: adminPass,
      role: "Admin",
    });
  }

  for (let i = 3; i <= 20; i += 1) {
    users.push({
      name: `Customer ${i}`,
      email: `cust${i}@example.com`,
      password: custPass,
      role: "Customer",
      addresses: [
        {
          label: "Home",
          line1: `${100 + i} Example St`,
          city: i % 2 === 0 ? "Star City" : "Central City",
          state: "State",
          postalCode: `${10000 + i}`,
          country: "Country",
          isDefault: true,
        },
      ],
    });
  }

  await User.insertMany(users);

  // ---------------- BOOKS ----------------
  const authors = [
    "George Orwell",
    "J.K. Rowling",
    "Stephen King",
    "Agatha Christie",
    "J.R.R. Tolkien",
    "Dan Brown",
    "Paulo Coelho",
    "Ernest Hemingway",
    "Mark Twain",
    "Jane Austen",
    "Leo Tolstoy",
    "Fyodor Dostoevsky",
    "Haruki Murakami",
    "Chetan Bhagat",
    "R.K. Narayan",
    "Khaled Hosseini",
    "Suzanne Collins",
    "Rick Riordan",
  ];

  const genres = [
    "Fiction",
    "Non-Fiction",
    "Fantasy",
    "Sci-Fi",
    "Mystery",
    "Thriller",
    "Romance",
    "Classic",
  ];

  const titleWords = [
    "Shadow",
    "Dream",
    "Empire",
    "Secret",
    "Journey",
    "Legacy",
    "Chronicles",
    "Night",
    "Light",
    "Fire",
    "Game",
    "Story",
    "World",
    "Path",
    "Return",
  ];

  const books = [];

  for (let i = 1; i <= 220; i++) {
    const title = `${titleWords[i % titleWords.length]} of the ${titleWords[(i + 3) % titleWords.length]}`;
    const imageCount = Math.floor(Math.random() * 5) + 1;

    const book = {
      title: `${title} ${i}`,
      description: `A ${genres[i % genres.length].toLowerCase()} adventure about ${title.toLowerCase()}.`,
      images: Array.from(
        { length: imageCount },
        (_, idx) => `https://picsum.photos/seed/book${i}-${idx + 1}/500/700`,
      ),
      author: authors[i % authors.length],
      genre: genres[i % genres.length],
      price: Math.floor(Math.random() * 500) + 100, // ₹100–₹600
    };

    books.push(book);
  }

  await Book.insertMany(books);

  console.log("✅ Seed complete!");
  console.log("Admin: admin@example.com / adminpass");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

const mongoose = require("mongoose");
const Book = require("./models/book");

async function seed() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/libraryDB");
    console.log(" Connected to MongoDB");

    // Clear existing books
    await Book.deleteMany({});
    console.log(" Cleared existing books");

    // Sample books data
    const books = [
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Programming",
        publishedYear: 2008,
        availableCopies: 3,
      },
      {
        title: "Introduction to Algorithms",
        author: "Cormen, Leiserson, Rivest, Stein",
        category: "Computer Science",
        publishedYear: 2009,
        availableCopies: 5,
      },
      {
        title: "Design Patterns",
        author: "Erich Gamma",
        category: "Programming",
        publishedYear: 1994,
        availableCopies: 2,
      },
      {
        title: "Deep Learning",
        author: "Ian Goodfellow, Yoshua Bengio, Aaron Courville",
        category: "AI",
        publishedYear: 2016,
        availableCopies: 4,
      },
      {
        title: "You Don't Know JS",
        author: "Kyle Simpson",
        category: "Programming",
        publishedYear: 2015,
        availableCopies: 6,
      },
      {
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt, David Thomas",
        category: "Programming",
        publishedYear: 1999,
        availableCopies: 1,
      },
      {
        title: "Python Crash Course",
        author: "Eric Matthes",
        category: "Programming",
        publishedYear: 2016,
        availableCopies: 7,
      },
    ];

    const result = await Book.insertMany(books);
    console.log(` Seeded ${result.length} books successfully`);

    result.forEach((book, index) => {
      console.log(`${index + 1}. ${book.title} by ${book.author}`);
    });

    await mongoose.disconnect();
    console.log(" Database connection closed");
  } catch (error) {
    console.error(" Seed error:", error.message);
    process.exit(1);
  }
}

seed();

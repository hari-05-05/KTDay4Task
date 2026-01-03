const express = require("express");
const Book = require("../models/book");

const router = express.Router();

// ============================================
// GET ROUTES
// ============================================

// GET /api/books - All books
router.get("/", async (req, res) => {
  try {
    const { category, year } = req.query;

    // Filter by category
    if (category) {
      const books = await Book.find({ category });
      return res.json({
        message: `Books in category: ${category}`,
        count: books.length,
        data: books,
      });
    }

    // Filter by year (after specified year)
    if (year) {
      const books = await Book.find({ publishedYear: { $gt: parseInt(year) } });
      return res.json({
        message: `Books published after ${year}`,
        count: books.length,
        data: books,
      });
    }

    // Get all books
    const books = await Book.find({});
    res.json({
      message: "All books",
      count: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching books" });
  }
});

// GET /api/books/:id - Get single book by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({
      message: "Book found",
      data: book,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid book ID format" });
    }
    res.status(500).json({ error: "Server error fetching book" });
  }
});

// ============================================
// POST ROUTE
// ============================================

// POST /api/books - Create new book
router.post("/", async (req, res) => {
  try {
    const { title, author, category, publishedYear, availableCopies } = req.body;

    // Validate required fields
    if (!title || !author || !category || publishedYear === undefined || availableCopies === undefined) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["title", "author", "category", "publishedYear", "availableCopies"],
      });
    }

    const book = new Book(req.body);
    await book.save();

    res.status(201).json({
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ error: "Validation error: " + errorMessage });
    }
    res.status(500).json({ error: "Server error creating book" });
  }
});

// ============================================
// PATCH ROUTE (Partial Update)
// ============================================

// PATCH /api/books/:id - Update specific fields (delta or category)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { delta, category: newCategory } = req.body;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Update copies with delta (increment/decrement)
    if (delta !== undefined) {
      const newCopies = book.availableCopies + parseInt(delta);

      if (newCopies < 0) {
        return res.status(400).json({
          error: "Invalid update: negative stock not allowed",
          currentCopies: book.availableCopies,
          attemptedDelta: delta,
          resultantCopies: newCopies,
        });
      }

      book.availableCopies = newCopies;
    }

    // Update category
    if (newCategory) {
      if (typeof newCategory !== "string" || !newCategory.trim()) {
        return res.status(400).json({ error: "Invalid update: category must be non-empty string" });
      }
      book.category = newCategory.trim();
    }

    await book.save();

    res.json({
      message: "Book updated successfully (PATCH)",
      data: book,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid book ID format" });
    }
    res.status(500).json({ error: "Server error updating book" });
  }
});

// ============================================
// PUT ROUTE (Full Update)
// ============================================

// PUT /api/books/:id - Replace entire book document
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, publishedYear, availableCopies } = req.body;

    // PUT requires ALL fields
    if (
      !title ||
      !author ||
      !category ||
      publishedYear === undefined ||
      availableCopies === undefined
    ) {
      return res.status(400).json({
        error: "PUT requires all book fields",
        required: ["title", "author", "category", "publishedYear", "availableCopies"],
        received: req.body,
      });
    }

    // Prevent negative stock in PUT
    if (availableCopies < 0) {
      return res.status(400).json({ error: "Available copies cannot be negative" });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Replace all fields
    book.title = title.trim();
    book.author = author.trim();
    book.category = category.trim();
    book.publishedYear = publishedYear;
    book.availableCopies = availableCopies;

    await book.save();

    res.json({
      message: "Book updated successfully (PUT)",
      data: book,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errorMessage = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ error: "Validation error: " + errorMessage });
    }
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid book ID format" });
    }
    res.status(500).json({ error: "Server error updating book with PUT" });
  }
});

// ============================================
// DELETE ROUTE
// ============================================

// DELETE /api/books/:id - Delete book only if copies = 0
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (book.availableCopies !== 0) {
      return res.status(400).json({
        error: "Invalid delete: copies must be 0 to delete",
        currentCopies: book.availableCopies,
        bookDetails: {
          id: book._id,
          title: book.title,
          author: book.author,
        },
      });
    }

    await Book.deleteOne({ _id: id });

    res.json({
      message: "Book deleted successfully",
      deletedBook: book,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({ error: "Invalid book ID format" });
    }
    res.status(500).json({ error: "Server error deleting book" });
  }
});

module.exports = router;

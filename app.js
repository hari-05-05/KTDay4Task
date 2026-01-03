const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bookRoutes = require("./routes/books");

const app = express();

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.json({});
});

app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);


app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

mongoose
  .connect("mongodb://127.0.0.1:27017/libraryDB")
  .then(() => console.log("✅ Connected to MongoDB (libraryDB)"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Library Book Management API",
    version: "1.0.0",
    endpoints: {
      GET: [
        "GET /api/books - Get all books",
        "GET /api/books?category=Programming - Get by category",
        "GET /api/books?year=2015 - Get books after year",
        "GET /api/books/:id - Get book by ID",
      ],
      POST: ["POST /api/books - Create new book"],
      PATCH: ["PATCH /api/books/:id - Update copies or category (partial)"],
      PUT: ["PUT /api/books/:id - Replace entire book (full update)"],
      DELETE: ["DELETE /api/books/:id - Delete book (only if copies = 0)"],
    },
    examples: {
      PATCH: {
        url: "PATCH /api/books/:id",
        body: { delta: -1 },
        description: "Decrease copies by 1",
      },
      PUT: {
        url: "PUT /api/books/:id",
        body: {
          title: "New Title",
          author: "New Author",
          category: "AI",
          publishedYear: 2024,
          availableCopies: 5,
        },
        description: "Replace entire book",
      },
    },
  });
});


app.use("/api/books", bookRoutes);


app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", path: req.path });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
  console.log(`📖 Books endpoint: http://localhost:${PORT}/api/books`);
});

module.exports = app;

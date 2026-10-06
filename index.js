const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./db");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Connect MongoDB
connectDB();

// Test API
app.get("/", (req, res) => {
  res.json({
    message: "Bookleaf Backend API is running",
  });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
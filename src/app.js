const express = require("express");
const path = require("path");

const postRoutes = require("./routes/postRoutes");

const app = express();

// Middleware
app.use((req, res, next) => {
  // Basic CORS for browser-based frontend clients.
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve Frontend (static HTML/CSS/JS) from project root
const staticDir = path.join(__dirname, "..", "..");
app.use(express.static(staticDir));

// Routes
app.get("/", (req, res) => res.redirect("/kham-pha.html"));
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/posts", postRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;


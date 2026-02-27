const express = require("express");
const { getPosts } = require("../controllers/postController");

const router = express.Router();

// GET /api/posts
router.get("/", getPosts);

module.exports = router;


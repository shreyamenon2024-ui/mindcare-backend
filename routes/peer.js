// routes/peer.js
// Peer support community — anyone logged in can post and reply

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// All peer routes require login
router.use(authMiddleware);

// ─────────────────────────────────────────
// GET /api/peer/posts
// Get all peer support posts (newest first)
// ─────────────────────────────────────────
router.get('/posts', async (req, res) => {
  try {
    const [posts] = await db.query(
      `SELECT p.id, p.content, p.created_at,
              u.username AS posted_by,
              COUNT(r.id) AS reply_count
       FROM peer_posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN peer_replies r ON r.post_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    res.json({ posts });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Failed to fetch posts.' });
  }
});

// ─────────────────────────────────────────
// GET /api/peer/posts/:postId
// Get a single post with all its replies
// ─────────────────────────────────────────
router.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const [posts] = await db.query(
      `SELECT p.id, p.content, p.created_at, u.username AS posted_by
       FROM peer_posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const [replies] = await db.query(
      `SELECT r.id, r.content, r.created_at, u.username AS replied_by
       FROM peer_replies r
       JOIN users u ON r.user_id = u.id
       WHERE r.post_id = ?
       ORDER BY r.created_at ASC`,
      [postId]
    );

    res.json({ post: posts[0], replies });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// ─────────────────────────────────────────
// POST /api/peer/posts
// Create a new peer support post
// Body: { content }
// ─────────────────────────────────────────
router.post('/posts', async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Post content cannot be empty.' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO peer_posts (user_id, content) VALUES (?, ?)',
      [req.user.id, content]
    );
    res.status(201).json({ message: 'Post created!', postId: result.insertId });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// ─────────────────────────────────────────
// POST /api/peer/posts/:postId/reply
// Reply to a peer support post
// Body: { content }
// ─────────────────────────────────────────
router.post('/posts/:postId/reply', async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Reply content cannot be empty.' });
  }

  try {
    // Check post exists
    const [posts] = await db.query('SELECT id FROM peer_posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await db.query(
      'INSERT INTO peer_replies (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content]
    );
    res.status(201).json({ message: 'Reply posted!' });
  } catch (err) {
    console.error('Reply error:', err);
    res.status(500).json({ error: 'Failed to post reply.' });
  }
});

module.exports = router;

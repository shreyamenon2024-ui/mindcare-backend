// routes/counsellor.js
// All actions a counsellor can take

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, counsellorOnly } = require('../middleware/auth');

// All counsellor routes require login AND counsellor role
router.use(authMiddleware, counsellorOnly);

// ─────────────────────────────────────────
// GET /api/counsellor/open-sessions
// See all open sessions waiting to be claimed
// ─────────────────────────────────────────
router.get('/open-sessions', async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT s.id, s.status, s.created_at,
              u.username AS student_name
       FROM sessions s
       JOIN users u ON s.student_id = u.id
       WHERE s.status = 'open'
       ORDER BY s.created_at ASC`
    );
    res.json({ sessions });
  } catch (err) {
    console.error('Open sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch open sessions.' });
  }
});

// ─────────────────────────────────────────
// POST /api/counsellor/claim-session/:sessionId
// Counsellor claims an open session to start helping
// ─────────────────────────────────────────
router.post('/claim-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE id = ? AND status = "open"',
      [sessionId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found or already claimed.' });
    }

    await db.query(
      'UPDATE sessions SET counsellor_id = ?, status = "in_progress" WHERE id = ?',
      [req.user.id, sessionId]
    );

    res.json({ message: 'Session claimed! You can now view and respond.' });
  } catch (err) {
    console.error('Claim session error:', err);
    res.status(500).json({ error: 'Failed to claim session.' });
  }
});

// ─────────────────────────────────────────
// GET /api/counsellor/my-sessions
// Counsellor sees all sessions they are handling
// ─────────────────────────────────────────
router.get('/my-sessions', async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT s.id, s.status, s.created_at,
              u.username AS student_name
       FROM sessions s
       JOIN users u ON s.student_id = u.id
       WHERE s.counsellor_id = ?
       ORDER BY s.updated_at DESC`,
      [req.user.id]
    );
    res.json({ sessions });
  } catch (err) {
    console.error('My sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// ─────────────────────────────────────────
// GET /api/counsellor/session/:sessionId
// Counsellor views full session details
// ─────────────────────────────────────────
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE id = ? AND counsellor_id = ?',
      [sessionId, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found or not assigned to you.' });
    }

    // Initial answers from student
    const [initialAnswers] = await db.query(
      'SELECT question_text, answer_text, created_at FROM initial_answers WHERE session_id = ?',
      [sessionId]
    );

    // Follow-up questions sent by this counsellor + student replies
    const [followups] = await db.query(
      `SELECT fq.id AS question_id, fq.question_text, fq.created_at AS asked_at,
              fa.answer_text, fa.created_at AS answered_at
       FROM followup_questions fq
       LEFT JOIN followup_answers fa ON fa.question_id = fq.id
       WHERE fq.session_id = ?
       ORDER BY fq.created_at ASC`,
      [sessionId]
    );

    // Previous advice sent
    const [advice] = await db.query(
      'SELECT message, created_at FROM counsellor_advice WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    res.json({ session: sessions[0], initialAnswers, followups, advice });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
});

// ─────────────────────────────────────────
// POST /api/counsellor/ask-followup
// Counsellor sends a follow-up question to a student
// Body: { session_id, question_text }
// ─────────────────────────────────────────
router.post('/ask-followup', async (req, res) => {
  const { session_id, question_text } = req.body;

  if (!session_id || !question_text) {
    return res.status(400).json({ error: 'session_id and question_text are required.' });
  }

  try {
    await db.query(
      'INSERT INTO followup_questions (session_id, counsellor_id, question_text) VALUES (?, ?, ?)',
      [session_id, req.user.id, question_text]
    );
    res.status(201).json({ message: 'Follow-up question sent!' });
  } catch (err) {
    console.error('Ask followup error:', err);
    res.status(500).json({ error: 'Failed to send question.' });
  }
});

// ─────────────────────────────────────────
// POST /api/counsellor/send-advice
// Counsellor sends final advice/guidance to student
// Body: { session_id, message }
// ─────────────────────────────────────────
router.post('/send-advice', async (req, res) => {
  const { session_id, message } = req.body;

  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id and message are required.' });
  }

  try {
    await db.query(
      'INSERT INTO counsellor_advice (session_id, counsellor_id, message) VALUES (?, ?, ?)',
      [session_id, req.user.id, message]
    );
    res.status(201).json({ message: 'Advice sent to student!' });
  } catch (err) {
    console.error('Send advice error:', err);
    res.status(500).json({ error: 'Failed to send advice.' });
  }
});

// ─────────────────────────────────────────
// PATCH /api/counsellor/close-session/:sessionId
// Counsellor marks a session as resolved/closed
// ─────────────────────────────────────────
router.patch('/close-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    await db.query(
      'UPDATE sessions SET status = "closed" WHERE id = ? AND counsellor_id = ?',
      [sessionId, req.user.id]
    );
    res.json({ message: 'Session closed.' });
  } catch (err) {
    console.error('Close session error:', err);
    res.status(500).json({ error: 'Failed to close session.' });
  }
});

module.exports = router;

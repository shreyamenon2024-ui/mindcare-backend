// routes/student.js
// All actions a student can take

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// All student routes require login
router.use(authMiddleware);

// ─────────────────────────────────────────
// POST /api/student/start-session
// Student submits initial answers to start a session
// Body: { answers: [{ question_text, answer_text }, ...] }
// ─────────────────────────────────────────
router.post('/start-session', async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can start sessions.' });
  }

  const { answers } = req.body;

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Create a new session for this student
    const [sessionResult] = await conn.query(
      'INSERT INTO sessions (student_id, status) VALUES (?, "open")',
      [req.user.id]
    );
    const sessionId = sessionResult.insertId;

    // Save each answer
    for (const item of answers) {
      await conn.query(
        'INSERT INTO initial_answers (session_id, question_text, answer_text) VALUES (?, ?, ?)',
        [sessionId, item.question_text, item.answer_text]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Session started!', sessionId });
  } catch (err) {
    await conn.rollback();
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to start session.' });
  } finally {
    conn.release();
  }
});

// ─────────────────────────────────────────
// GET /api/student/my-sessions
// Student sees all their sessions and their status
// ─────────────────────────────────────────
router.get('/my-sessions', async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view their sessions.' });
  }

  try {
    const [sessions] = await db.query(
      `SELECT s.id, s.status, s.created_at,
              u.username AS counsellor_name
       FROM sessions s
       LEFT JOIN users u ON s.counsellor_id = u.id
       WHERE s.student_id = ?
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json({ sessions });
  } catch (err) {
    console.error('My sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// ─────────────────────────────────────────
// GET /api/student/session/:sessionId
// Student views full session: their answers, counsellor questions, advice
// ─────────────────────────────────────────
router.get('/session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    // Make sure this session belongs to this student
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE id = ? AND student_id = ?',
      [sessionId, req.user.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Get initial answers
    const [initialAnswers] = await db.query(
      'SELECT question_text, answer_text, created_at FROM initial_answers WHERE session_id = ?',
      [sessionId]
    );

    // Get follow-up questions with student's answers
    const [followups] = await db.query(
      `SELECT fq.id AS question_id, fq.question_text, fq.created_at AS asked_at,
              fa.answer_text, fa.created_at AS answered_at
       FROM followup_questions fq
       LEFT JOIN followup_answers fa ON fa.question_id = fq.id
       WHERE fq.session_id = ?
       ORDER BY fq.created_at ASC`,
      [sessionId]
    );

    // Get counsellor advice
    const [advice] = await db.query(
      'SELECT message, created_at FROM counsellor_advice WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );

    res.json({
      session: sessions[0],
      initialAnswers,
      followups,
      advice
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Failed to fetch session.' });
  }
});

// ─────────────────────────────────────────
// POST /api/student/answer-followup
// Student answers a follow-up question from counsellor
// Body: { question_id, answer_text }
// ─────────────────────────────────────────
router.post('/answer-followup', async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can answer follow-ups.' });
  }

  const { question_id, answer_text } = req.body;

  if (!question_id || !answer_text) {
    return res.status(400).json({ error: 'question_id and answer_text are required.' });
  }

  try {
    await db.query(
      'INSERT INTO followup_answers (question_id, student_id, answer_text) VALUES (?, ?, ?)',
      [question_id, req.user.id, answer_text]
    );
    res.status(201).json({ message: 'Answer submitted!' });
  } catch (err) {
    console.error('Answer followup error:', err);
    res.status(500).json({ error: 'Failed to submit answer.' });
  }
});

module.exports = router;

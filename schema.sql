-- ============================================
-- MindCare Database Schema
-- Run this file in MySQL to set up all tables
-- Command: mysql -u root -p < schema.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS mindcare_db;
USE mindcare_db;

-- Users table (students, counsellors, peer support)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'counsellor', 'peer') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions: one student <-> one counsellor conversation thread
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  counsellor_id INT,                        -- assigned later by counsellor
  status ENUM('open', 'in_progress', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id),
  FOREIGN KEY (counsellor_id) REFERENCES users(id)
);

-- Initial questions answered by student when they start a session
CREATE TABLE IF NOT EXISTS initial_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  question_text VARCHAR(500) NOT NULL,      -- the question shown to student
  answer_text TEXT NOT NULL,               -- student's answer
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Follow-up questions sent by counsellor to student
CREATE TABLE IF NOT EXISTS followup_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  counsellor_id INT NOT NULL,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (counsellor_id) REFERENCES users(id)
);

-- Student replies to follow-up questions
CREATE TABLE IF NOT EXISTS followup_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  student_id INT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES followup_questions(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Counsellor's final advice/guidance to student
CREATE TABLE IF NOT EXISTS counsellor_advice (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  counsellor_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (counsellor_id) REFERENCES users(id)
);

-- Peer support posts (anonymous sharing)
CREATE TABLE IF NOT EXISTS peer_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Replies to peer posts
CREATE TABLE IF NOT EXISTS peer_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES peer_posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

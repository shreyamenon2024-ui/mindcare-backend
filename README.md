# MindCare Backend

Node.js + Express + MySQL backend for the MindCare mental health support app.

---

## Prerequisites
- Node.js (v18+): https://nodejs.org
- MySQL (v8+): https://dev.mysql.com/downloads/

---

## Setup (Step by Step)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up the database
Open MySQL and run the schema file:
```bash
mysql -u root -p < schema.sql
```

### 3. Configure environment variables
Edit the `.env` file with your actual MySQL password:
```
DB_PASSWORD=your_actual_mysql_password
```

### 4. Run the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Visit http://localhost:5000 — you should see `MindCare API is running!`

---

## API Endpoints Summary

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | `{ username, password, role }` | Register new user |
| POST | /api/auth/login | `{ username, password }` | Login, get token |

> After login, include token in all requests:
> `Authorization: Bearer <token>`

### Student
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/student/start-session | `{ answers: [{question_text, answer_text}] }` | Submit initial answers |
| GET | /api/student/my-sessions | — | List my sessions |
| GET | /api/student/session/:id | — | View full session |
| POST | /api/student/answer-followup | `{ question_id, answer_text }` | Answer counsellor's question |

### Counsellor
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | /api/counsellor/open-sessions | — | See open sessions |
| POST | /api/counsellor/claim-session/:id | — | Claim a session |
| GET | /api/counsellor/my-sessions | — | My in-progress sessions |
| GET | /api/counsellor/session/:id | — | Full session view |
| POST | /api/counsellor/ask-followup | `{ session_id, question_text }` | Send follow-up question |
| POST | /api/counsellor/send-advice | `{ session_id, message }` | Send advice to student |
| PATCH | /api/counsellor/close-session/:id | — | Mark session closed |

### Peer Support
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | /api/peer/posts | — | Get all posts |
| GET | /api/peer/posts/:id | — | Get post + replies |
| POST | /api/peer/posts | `{ content }` | Create new post |
| POST | /api/peer/posts/:id/reply | `{ content }` | Reply to a post |

---

## Project Structure
```
mindcare-backend/
├── server.js          ← Entry point, starts the server
├── schema.sql         ← Run this to create the database tables
├── .env               ← Your secret config (never commit this to git!)
├── package.json
├── config/
│   └── db.js          ← MySQL connection
├── middleware/
│   └── auth.js        ← JWT token verification
└── routes/
    ├── auth.js        ← Register & Login
    ├── student.js     ← Student actions
    ├── counsellor.js  ← Counsellor actions
    └── peer.js        ← Peer support
```

---

## Deploying (Free Options)
- **Railway**: https://railway.app — connect GitHub repo, add MySQL plugin, done
- **Render**: https://render.com — similar, very easy
- Set your environment variables in the platform's dashboard

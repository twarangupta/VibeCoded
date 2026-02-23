# TextShare — Complete Beginner's Guide

Welcome to the deep dive into the **TextShare** application! This guide explains exactly how the app was built, what technologies were used, how everything connects, and how it was deployed to the internet. This is a great reference if you want to understand the code or build something similar.

---

## 🗺️ Big Picture — How the App Works

TextShare is a full-stack web app that lets you paste any text, get a short 6-character code, and then retrieve that text from any device using the code.

**The three layers:**

```
[ User's Browser ]  ←→  [ Express Backend ]  ←→  [ Supabase Database ]
  React (Vercel)          Node.js (Render)          PostgreSQL (Cloud)
```

1. The **Frontend** (React) runs in the user's browser. It shows UI, handles input, and makes HTTP requests.
2. The **Backend** (Express/Node.js) is a server that receives requests, does business logic, and talks to the database.
3. The **Database** (Supabase/PostgreSQL) permanently stores all text snippets.

---

## 🛠️ Tech Stack

### Frontend
| Technology | What it does |
|---|---|
| **React** | JavaScript library for building UI components |
| **Vite** | A super-fast local development server and build tool |
| **Lucide React** | Provides icons (the copy icon, share icon, etc.) |
| **`fetch` API** | Built into every browser; used to make HTTP requests to the backend |
| **Vercel** | Hosts the frontend for free at `https://textsharefront.vercel.app` |

### Backend
| Technology | What it does |
|---|---|
| **Node.js** | JavaScript runtime — runs JavaScript outside the browser |
| **Express.js** | Makes building an HTTP server simple — handles routes, requests, responses |
| **`nanoid`** | Generates cryptographically secure random short codes like `xV9k2A` |
| **`cors`** | Allows the frontend (different domain) to call the backend securely |
| **`pg`** | The official PostgreSQL driver for Node.js — lets us query the database |
| **`dotenv`** | Loads secret environment variables from a `.env` file locally |
| **Render** | Hosts the backend server for free at `https://vibecoded.onrender.com` |

### Database
| Technology | What it does |
|---|---|
| **PostgreSQL** | A powerful, production-grade relational database |
| **Supabase** | A cloud-hosted PostgreSQL service (like Firebase but SQL-based) |
| **Session Pooler** | Supabase's IPv4-compatible connection point — required for Render's free tier |

---

## 🌐 The REST API

This app uses a **REST API** — a standard way for the frontend and backend to communicate over HTTP. REST APIs use standard HTTP methods (GET, POST, etc.) and return data in JSON format.

We have **two API endpoints:**

### `POST /api/share`
**Purpose:** Save a new text snippet and return a short code.

- **Method:** `POST` (used when sending data to create something new)
- **URL:** `https://vibecoded.onrender.com/api/share`
- **Request body (JSON):**
  ```json
  { "text": "Hello from TextShare!" }
  ```
- **Success response (201 Created):**
  ```json
  { "code": "xV9k2A", "message": "Text shared successfully" }
  ```
- **Error response (500):**
  ```json
  { "error": "Failed to share text" }
  ```

### `GET /api/share/:code`
**Purpose:** Retrieve a text snippet using its short code.

- **Method:** `GET` (used when reading/fetching data)
- **URL:** `https://vibecoded.onrender.com/api/share/xV9k2A`
- **Success response (200 OK):**
  ```json
  { "text": "Hello from TextShare!" }
  ```
- **Error response (404 Not Found):**
  ```json
  { "error": "Snippet not found" }
  ```

REST is the most common API style on the web. Any website or app that says it "calls an API" almost certainly means it's using REST exactly like this.

---

## 1. The Backend Code

### File: `backend/database.js`
**Purpose:** Sets up the connection to our Supabase PostgreSQL database.

```javascript
const { Pool } = require('pg');
```
- **Why:** We import `Pool` from the `pg` library. A Pool is a collection of database connections that can be reused — much more efficient than opening a new connection for every request.

```javascript
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
});
```
- **Why:** We configure the database connection using **environment variables** (values stored secretly in Render's dashboard, not hardcoded in the code). The `ssl` option is required because Supabase enforces encrypted connections.
- The host we use is Supabase's **Session Pooler** (`aws-1-ap-northeast-2.pooler.supabase.com`) — this is IPv4 compatible, which is required because Render's free tier doesn't support outbound IPv6 connections.

```javascript
module.exports = pool;
```
- **Why:** Exports the pool so `server.js` can import and use it to query the database.

---

### File: `backend/server.js`
**Purpose:** The main server — listens for HTTP requests and responds to them.

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const pool = require('./database');
```
- **Why:**
  - `dotenv` loads the `.env` file so environment variables work when running locally.
  - `express` creates our HTTP server.
  - `cors` allows our frontend (on a different domain) to call the backend. Browsers block cross-domain requests by default — CORS is the permission slip.
  - `nanoid` generates our random 6-character codes.
  - `pool` is our database connection from `database.js`.

```javascript
const app = express();
app.use(cors());
app.use(express.json());
```
- **Why:** `express.json()` tells the server to automatically parse JSON sent in request bodies, so we can access it as `req.body`.

#### POST /api/share — Save a snippet
```javascript
app.post('/api/share', async (req, res) => {
    const { text } = req.body;
    const code = nanoid(6);

    try {
        await pool.query(
            `INSERT INTO snippets (code, content) VALUES ($1, $2)`,
            [code, text]
        );
        res.status(201).json({ code, message: 'Text shared successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to share text' });
    }
});
```
- **Why `async/await`:** Database queries take time (network calls). `async/await` lets us write clean code that "pauses" and waits for the result without blocking the entire server.
- **Why `$1, $2`:** PostgreSQL uses `$1`, `$2` as placeholders instead of `?` (like SQLite). Passing values separately prevents **SQL Injection attacks** — a common security vulnerability.
- **`201 Created`:** The correct HTTP status code when something new is created.

#### GET /api/share/:code — Retrieve a snippet
```javascript
app.get('/api/share/:code', async (req, res) => {
    const { code } = req.params;

    try {
        const result = await pool.query(
            `SELECT content FROM snippets WHERE code = $1`,
            [code]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Snippet not found' });
        }
        res.status(200).json({ text: result.rows[0].content });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve text' });
    }
});
```
- **`:code` in the URL:** This is a dynamic URL parameter. If someone visits `/api/share/xV9k2A`, then `req.params.code` equals `"xV9k2A"`.
- **`result.rows`:** With PostgreSQL's `pg` library, query results come back as an array of row objects.
- **`404 Not Found`:** The correct HTTP status code when we look something up and it doesn't exist.

---

## 2. The Frontend Code (React)

### File: `frontend/src/components/ShareText.jsx`
**Purpose:** The Share tab — user types text, clicks a button, gets a code.

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```
- **Why `import.meta.env`:** Vite (our frontend build tool) reads environment variables prefixed with `VITE_`. We set `VITE_API_URL` to our live Render backend URL on Vercel — so the deployed frontend automatically talks to the deployed backend.
- **The `|| 'http://localhost:3001/api'` fallback** means locally, it still works without needing to set the variable.

```javascript
const response = await fetch(`${API_BASE}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
});
const data = await response.json();
setCode(data.code);
```
- **Why:** The browser's built-in `fetch` function makes an HTTP POST request to our backend's REST API. We include a `Content-Type` header so the server knows we're sending JSON. The response gives us the `code` which we save into React state — React then re-renders and shows the code on screen.

### File: `frontend/src/components/RetrieveText.jsx`
**Purpose:** The Retrieve tab — user types a code, gets their text back.

```javascript
const response = await fetch(`${API_BASE}/share/${code.trim()}`);
```
- **Why:** This time we use a `GET` request (the default for `fetch`). We put the code directly into the URL e.g. `.../api/share/xV9k2A`. Our backend's Express route (`/api/share/:code`) captures it.

---

## 3. The Database — Supabase & PostgreSQL

The database stores one table called `snippets`:

```sql
CREATE TABLE snippets (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

| Column | Type | Purpose |
|---|---|---|
| `id` | Auto-incrementing number | Unique identifier for every row |
| `code` | Text (UNIQUE) | The 6-character short code |
| `content` | Text | The actual text the user shared |
| `created_at` | Timestamp with timezone | When the snippet was created |

**Why Supabase?** It gives us a production-grade PostgreSQL database in the cloud for free, with no servers to manage.

---

## 4. Deployment — How It All Got Online

### The Full Architecture

```
User Visit
    │
    ▼
Vercel (Frontend)          ← textsharefront.vercel.app
    │  HTTPS REST calls
    ▼
Render (Backend)           ← vibecoded.onrender.com
    │  SQL queries (TCP, IPv4)
    ▼
Supabase Session Pooler    ← aws-1-ap-northeast-2.pooler.supabase.com:5432
    │
    ▼
Supabase PostgreSQL DB     ← db.wyymohgpdpttenpmcuay.supabase.co
```

### Frontend → Vercel
- Vercel automatically builds the React app using `npm run build` (Vite)
- It serves the resulting static HTML/JS/CSS files from its global CDN
- Environment variable `VITE_API_URL` is set to the Render backend URL in Vercel's dashboard

### Backend → Render
- Render runs `node server.js` on a Linux container
- Environment variables (`PGHOST`, `PGUSER`, `PGPASSWORD` etc.) are set in Render's dashboard — never committed to code
- When you push to GitHub, Render auto-detects the change and redeploys

### Why the Session Pooler?
Render's free tier only supports **outbound IPv4** connections. Supabase's default direct database connection resolves to an **IPv6 address**. The fix: use Supabase's **Session Pooler**, which is IPv4-proxied and available at port `5432`.

### Environment Variables
Sensitive values like passwords are **never** stored in code. They live in:
- **Locally:** `backend/.env` file (gitignored, never committed to GitHub)
- **On Render:** Set manually in the dashboard under the "Environment" tab
- **On Vercel:** Set manually in the dashboard under "Project Settings → Environment Variables"

---

## 5. Real-World Walkthrough

Here's exactly what happens, end-to-end, when someone uses the live app:

### Sharing Text
1. User visits `https://textsharefront.vercel.app` — Vercel serves the React app from its CDN.
2. User types *"My secret recipe"* and clicks **Generate Secure Code**.
3. React runs `fetch('https://vibecoded.onrender.com/api/share', { method: 'POST', body: '{"text":"My secret recipe"}' })`.
4. Render receives the HTTPS request. Express extracts the text. `nanoid(6)` generates code `"xC9q2F"`.
5. `pg` sends a SQL query over TCP to Supabase's session pooler: `INSERT INTO snippets (code, content) VALUES ('xC9q2F', 'My secret recipe')`.
6. Supabase stores the row. Returns success.
7. Express responds with `{ "code": "xC9q2F" }`.
8. Vercel's React app receives it and displays **xC9q2F** on screen.

### Retrieving Text
1. User (or their friend) visits the site, clicks Retrieve, enters `xC9q2F`.
2. React calls `fetch('https://vibecoded.onrender.com/api/share/xC9q2F')`.
3. Express receives the GET request. Extracts `code = "xC9q2F"` from the URL.
4. Sends SQL: `SELECT content FROM snippets WHERE code = 'xC9q2F'`.
5. Supabase returns the row. Express sends `{ "text": "My secret recipe" }`.
6. React renders the text on screen. ✅

---

## 6. Summary

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend API | Node.js + Express | Render |
| Database | PostgreSQL | Supabase |
| Code Generation | nanoid | (library, runs on backend) |
| Cross-Origin Requests | CORS middleware | (runs on backend) |
| API Style | REST over HTTPS | — |

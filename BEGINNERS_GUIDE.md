# Comprehensive Code Guide (Line-by-Line Breakdown)

Welcome to the deep dive into the TextShare application! Here we will look at all the major files in our project, understand exactly what each block of code does, and *why* we wrote it that way. 

We split this into the **Backend** (the server) and the **Frontend** (the react app).

---

## 1. The Backend Code

### File: `backend/database.js`
**Purpose:** This file sets up the connection to our SQLite database to permanently store and retrieve data.

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
```
* **Why:** We import the `sqlite3` library to talk to the database. The `.verbose()` part makes it print extra details if there are errors (great for debugging). We also import `path` to help us find the exact folder our database file is in.

```javascript
const dbPath = path.resolve(__dirname, 'database.sqlite');
```
* **Why:** `__dirname` is the current folder. This tells Node to look for a file named `database.sqlite` right here. If it doesn't exist, SQLite will create it for us.

```javascript
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    // ... setup code
  }
});
```
* **Why:** We tell SQLite to connect to `dbPath`. We provide a function `(err) => {...}` that runs right after it tries to connect. If it fails, it prints an error. If it succeeds, it proceeds.

```javascript
db.run(
  `CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, ...
);
```
* **What this does:** SQL is the language we use to speak to the database. This creates a "SQL Table" (like a spreadsheet) named `snippets`. 
* `id` is a unique number that automatically goes up (1, 2, 3...). 
* `code` is our short 6-letter secret (e.g. `X8s9Lp`) and `UNIQUE` forces the database to ensure no two snippets share the same code. 
* `content` is the actual text the user typed.
* `created_at` automatically saves the exact time it was created.

```javascript
module.exports = db;
```
* **Why:** This makes our `db` variable available to other files (specifically `server.js`).

---

### File: `backend/server.js`
**Purpose:** This is the main engine. It listens for HTTP requests from the frontend and responds to them.

```javascript
const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const db = require('./database');
```
* **Why:** 
  * `express` is a tool that makes setting up a server extremely easy.
  * `cors` allows our frontend (running on, say, port 5173) to securely talk to our backend (running on port 3001). Browsers normally block this for security without `cors`.
  * `nanoid` is a library that securely generates random short codes (like `xV9k2A`).
  * `db` imports the database connection we just created in `database.js`.

```javascript
const app = express();
app.use(cors());
app.use(express.json());
```
* **Why:** We create the app. We tell it to use CORS. The `express.json()` part is crucial: it tells the server to understand incoming data that is formatted as JSON (which is how our React frontend sends text).

#### The "Share" Endpoint
```javascript
app.post('/api/share', (req, res) => {
    const { text } = req.body;
```
* **What this does:** When the frontend sends a `POST` request to `/api/share`, this code runs. `req.body` contains the data sent, and we pull out the `text`.

```javascript
    const code = nanoid(6);
```
* **Why:** This generates our 6-character random secret code for the text!

```javascript
    db.run(
        `INSERT INTO snippets (code, content) VALUES (?, ?)`,
        [code, text],
        function (err) {
            // ... if error, send 500 status. Otherwise, send success!
            res.status(201).json({ code, message: 'Text shared successfully' });
        }
    );
});
```
* **What this does:** It tells the database to insert a new row containing our generated `code` and the user's `text`. The `(?, ?)` syntax safely injects our variables, which prevents hackers from doing something called "SQL Injection". If everything works, we send the `code` back to the frontend with a `201 Created` success status!

#### The "Retrieve" Endpoint
```javascript
app.get('/api/share/:code', (req, res) => {
    const { code } = req.params;
```
* **What this does:** The `:code` part means this URL is dynamic (e.g. `/api/share/a1b2c3`). We grab that specific string from the URL `req.params`.

```javascript
    db.get(
        `SELECT content FROM snippets WHERE code = ?`,
        [code],
        (err, row) => {
            // ... checking for errors
            if (!row) {
                return res.status(404).json({ error: 'Snippet not found' });
            }
            res.status(200).json({ text: row.content });
        }
    );
});
```
* **What this does:** It searches the database for a row matching the `code`. If nothing is found (`!row`), we send a `404 Not Found` error. If found, we extract `row.content` and send it back successfully (`200 OK`).

---

## 2. The Frontend Code (React)

### File: `frontend/src/App.jsx`
**Purpose:** This is the main layout of our application. It holds the title, and switches between "Share Text" and "Retrieve Text" views.

```javascript
import { useState } from 'react';
import ShareText from './components/ShareText';
import RetrieveText from './components/RetrieveText';
```
* **Why:** We import `useState`, a React tool for remembering values. We also import our two main visual components.

```javascript
function App() {
  const [activeTab, setActiveTab] = useState('share'); // 'share' or 'retrieve'
```
* **What this does:** This creates a 'memory' variable called `activeTab` which defaults to `'share'`. The `setActiveTab` function allows us to change it. Every time this changes, React automatically redraws the screen!

```javascript
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
          <button
            className={`btn ${activeTab === 'share' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('share')}
          >
            Share Text
          </button>
```
* **What this does:** Two buttons for navigation. When clicked (`onClick`), we change the `activeTab` memory to `'share'` or `'retrieve'`. The `className` logic visually highlights the button if its tab is currently active.

```javascript
        {activeTab === 'share' ? <ShareText /> : <RetrieveText />}
```
* **What this does:** This is standard JavaScript conditional logic. If `activeTab` is 'share', display the `<ShareText />` component. Otherwise, display the `<RetrieveText />` component. 

---

### File: `frontend/src/components/ShareText.jsx`
**Purpose:** Handles user input, sends data to the server, and displays the generated secret code.

```javascript
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState(null);
    const [error, setError] = useState(null);
```
* **What this does:** These are states (memory buckets) for the component. 
  * `text`: whatever the user typed in the box.
  * `isLoading`: true/false while waiting for the server to reply.
  * `code`: what the server replies with.
  * `error`: if anything breaks, error text goes here.

```javascript
    const handleShare = async () => {
        setIsLoading(true);
        // ... some reset code ...
        
        try {
            const response = await fetch(`http://localhost:3001/api/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
```
* **What this does:** When the user clicks "Generate", handleShare runs. `fetch` is the browser's way of making a network request. It sends a `POST` request to our Express server URL, sending our `text` state as a JSON string. `await` forces JavaScript to pause and wait until the server responds before moving forward.

```javascript
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setCode(data.code);
```
* **What this does:** We decode the JSON response. If the server responded with an error, we throw it to the `catch` block to handle. If it succeeded, we take `data.code` (the 6-character short code) and save it in our memory bucket (`setCode`). Saving it to memory causes React to instantly redraw the screen and display the secret code to the user!

---

### File: `frontend/src/components/RetrieveText.jsx`
**Purpose:** Handles taking a secret code from the user, fetching it from the backend, and displaying the text.

*(The code is almost identical in logic to the Share logic!)*

```javascript
    const handleRetrieve = async () => {
        setIsLoading(true);
        //...
        try {
            const response = await fetch(`http://localhost:3001/api/share/${code.trim()}`);
            const data = await response.json();
            // ...
            setRetrievedText(data.text);
```
* **What this does:** The user enters the code to fetch. We place that `code` variable directly into the URL (e.g. `http://localhost:3001/api/share/aB34Xn`) exactly as our Backend `app.get` expects it.
* Once the server sends back `data.text`, we save it in our `retrievedText` state, and React redraws the screen instantly to show the secret message.

---

### Summary
* **React Frontend** manages what the user types into boxes using `useState()`, and uses `fetch()` to send that data to the server over network requests.
* **Express Backend** receives those requests, calculates things (like creating a short ID), talks to the database, and responds.
* **SQLite Database** blindly, faithfully writes data to disk or reads it from disk when the backend asks it to, keeping information completely safe forever.

---

## 3. Real-World Examples (How it all connects)

To make this completely clear, let's walk through an exact, real-world example of using the app from start to finish.

### Example 1: Sharing a secret recipe
**Step 1:** You open the website and click the "Share Text" button.
**Step 2:** In the big text box, you type:
> *"My secret cookie recipe: 2 cups flour, 1 cup sugar, lots of chocolate chips."*

**Step 3:** You click the **"Generate Secure Code"** button.
* *Behind the scenes:* The React frontend packages your recipe into a JSON message and sends it to `http://localhost:3001/api/share`.
* *Behind the scenes:* The Express backend receives it. The `nanoid` tool runs and decides your random code will be `xC9q2F`. The text and code are saved into the SQLite database file. The backend replies with "Success! Here is the code: `xC9q2F`".

**Step 4:** The frontend receives the success message and displays the code **`xC9q2F`** on your screen. You click "Copy Code".

### Example 2: Your friend retrieves the recipe
**Step 1:** You text your friend the code `xC9q2F`.
**Step 2:** They open the website on their computer and click the "Retrieve Text" button.
**Step 3:** In the small input box, they type `xC9q2F` and click **"Fetch Text"**.
* *Behind the scenes:* The React frontend sends a GET request to `http://localhost:3001/api/share/xC9q2F`.
* *Behind the scenes:* The Express backend looks at the URL, sees `xC9q2F`, and asks the database: "Hey, do you have anything for `xC9q2F`?". 
* *Behind the scenes:* The database finds the row we saved earlier and returns the recipe string. The backend sends that string back to your friend's computer.

**Step 4:** The frontend receives the string and displays:
> *"My secret cookie recipe: 2 cups flour, 1 cup sugar, lots of chocolate chips."*

Your friend can now see your secret recipe, and all it took was sharing a tiny 6-character code!

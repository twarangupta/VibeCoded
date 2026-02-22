const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint to save text and get a short code
app.post('/api/share', (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required' });
    }

    // Generate a short 6-character code
    const code = nanoid(6);

    db.run(
        `INSERT INTO snippets (code, content) VALUES (?, ?)`,
        [code, text],
        function (err) {
            if (err) {
                console.error('Error inserting data', err.message);
                return res.status(500).json({ error: 'Failed to share text' });
            }
            res.status(201).json({ code, message: 'Text shared successfully' });
        }
    );
});

// Endpoint to retrieve text by code
app.get('/api/share/:code', (req, res) => {
    const { code } = req.params;

    db.get(
        `SELECT content FROM snippets WHERE code = ?`,
        [code],
        (err, row) => {
            if (err) {
                console.error('Error retrieving data', err.message);
                return res.status(500).json({ error: 'Failed to retrieve text' });
            }
            if (!row) {
                return res.status(404).json({ error: 'Snippet not found' });
            }
            res.status(200).json({ text: row.content });
        }
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

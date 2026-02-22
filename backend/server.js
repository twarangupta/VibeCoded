require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const pool = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Endpoint to save text and get a short code
app.post('/api/share', async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text content is required' });
    }

    const code = nanoid(6);

    try {
        await pool.query(
            `INSERT INTO snippets (code, content) VALUES ($1, $2)`,
            [code, text]
        );
        res.status(201).json({ code, message: 'Text shared successfully' });
    } catch (err) {
        console.error('Error inserting data', err.message);
        res.status(500).json({ error: 'Failed to share text' });
    }
});

// Endpoint to retrieve text by code
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
        console.error('Error retrieving data', err.message);
        res.status(500).json({ error: 'Failed to retrieve text' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;

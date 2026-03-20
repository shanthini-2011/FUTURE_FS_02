const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
// Render-kku dynamic PORT thevai, illana 3000 use pannum
const PORT = process.env.PORT || 3000;

// 🛡️ ITHU THAAN MUKKIYAM: CORS Security Code
// Ithu unga GitHub Pages link-a mattum backend-kooda pesa allow pannum!
app.use(cors({
    origin: 'https://shanthini-2011.github.io', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Public folder-a veliya kaattum code
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const db = new sqlite3.Database('./crm_database.db', (err) => {
    if (err) console.error("Database error: ", err.message);
    else {
        console.log("✅ Connected to SQLite database.");
        db.run(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            source TEXT DEFAULT 'Website',
            status TEXT DEFAULT 'New',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// --- API ROUTES ---

app.get('/api/leads', (req, res) => {
    db.all("SELECT * FROM leads ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/leads', (req, res) => {
    const { name, email, source } = req.body;
    const sql = `INSERT INTO leads (name, email, source, status, notes) VALUES (?, ?, ?, 'New', '')`;
    db.run(sql, [name, email, source], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Lead added successfully!" });
    });
});

app.put('/api/leads/:id', (req, res) => {
    const { status, notes } = req.body;
    const id = req.params.id;
    const sql = `UPDATE leads SET status = ?, notes = ? WHERE id = ?`;
    db.run(sql, [status, notes, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Lead updated successfully!" });
    });
});

app.delete('/api/leads/:id', (req, res) => {
    const id = req.params.id;
    const sql = `DELETE FROM leads WHERE id = ?`;
    db.run(sql, id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Lead deleted successfully!" });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
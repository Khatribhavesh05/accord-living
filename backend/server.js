const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3002;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors({ origin: true, credentials: true })); // Allow all origins with credentials for demo
app.use(express.json());

const loadDB = () => {
    try {
        const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        if (!Array.isArray(parsed.visitor_entries)) parsed.visitor_entries = [];
        return parsed;
    } catch {
        return { visitor_entries: [] };
    }
};

const saveDB = (db) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 4));
};

const getId = () => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `visitor-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const normalizeRange = (range) => {
    const value = String(range || '').toLowerCase();
    if (value === '90' || value === '90days') return 90;
    if (value === 'all' || value === 'alltime') return null;
    return 30;
};

app.get('/api/security/visitors', (req, res) => {
    const db = loadDB();
    const rows = (db.visitor_entries || [])
        .slice()
        .sort((a, b) => new Date(b.check_in_at || b.created_at) - new Date(a.check_in_at || a.created_at));
    res.json({ success: true, data: rows });
});

app.post('/api/security/visitor/checkin', (req, res) => {
    const { name, purpose, flat } = req.body || {};

    if (!String(name || '').trim() || !String(purpose || '').trim() || !String(flat || '').trim()) {
        return res.status(400).json({ success: false, message: 'name, purpose and flat are required' });
    }

    const db = loadDB();
    const now = new Date().toISOString();
    const entry = {
        id: getId(),
        visitor_name: String(name).trim(),
        purpose: String(purpose).trim(),
        flat_number: String(flat).trim().toUpperCase(),
        check_in_at: now,
        check_out_at: null,
        status: 'active',
        created_at: now,
        updated_at: now,
    };

    db.visitor_entries = db.visitor_entries || [];
    db.visitor_entries.push(entry);
    saveDB(db);
    return res.status(201).json({ success: true, data: entry, message: 'Visitor checked in' });
});

app.put('/api/security/visitor/checkout', (req, res) => {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'id is required' });

    const db = loadDB();
    const rows = db.visitor_entries || [];
    const idx = rows.findIndex((row) => String(row.id) === String(id));
    if (idx < 0) return res.status(404).json({ success: false, message: 'Visitor not found' });

    const existing = rows[idx];
    if (existing.status === 'left') {
        return res.status(400).json({ success: false, message: 'Visitor already checked out' });
    }

    const now = new Date().toISOString();
    rows[idx] = {
        ...existing,
        check_out_at: now,
        status: 'left',
        updated_at: now,
    };
    db.visitor_entries = rows;
    saveDB(db);

    return res.json({ success: true, data: rows[idx], message: 'Visitor checked out' });
});

app.get('/api/admin/visitor-analytics', (req, res) => {
    const db = loadDB();
    const rangeDays = normalizeRange(req.query.range);
    const allRows = db.visitor_entries || [];

    const since = rangeDays === null ? null : new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
    const rows = allRows.filter((row) => {
        if (!since) return true;
        return new Date(row.check_in_at || row.created_at) >= since;
    });

    const dailyVisitors = {};
    const flats = new Set();
    const uniqueVisitors = new Set();

    let entriesCompleted = 0;
    let totalStayMinutes = 0;
    let approvedCount = 0;
    let cancelledCount = 0;

    rows.forEach((row) => {
        const dayKey = new Date(row.check_in_at || row.created_at).toISOString().split('T')[0];
        dailyVisitors[dayKey] = (dailyVisitors[dayKey] || 0) + 1;

        flats.add(String(row.flat_number || '').toUpperCase());
        uniqueVisitors.add(String(row.visitor_name || '').toLowerCase());

        if (row.status === 'left') {
            entriesCompleted += 1;
            approvedCount += 1;
            if (row.check_in_at && row.check_out_at) {
                const minutes = (new Date(row.check_out_at) - new Date(row.check_in_at)) / (1000 * 60);
                if (minutes > 0) totalStayMinutes += minutes;
            }
        } else if (row.status === 'active') {
            approvedCount += 1;
        } else {
            cancelledCount += 1;
        }
    });

    const avgStayTimeMinutes = entriesCompleted > 0 ? Math.round(totalStayMinutes / entriesCompleted) : 0;
    const conversionRate = approvedCount > 0 ? Math.round((entriesCompleted / approvedCount) * 100) : 0;

    return res.json({
        success: true,
        data: {
            totalApprovals: rows.length,
            entriesCompleted,
            conversionRate,
            avgStayTimeMinutes,
            approvedCount,
            cancelledCount,
            uniqueVisitors: uniqueVisitors.size,
            uniqueResidents: flats.size,
            dailyVisitors,
            visitors: rows,
        },
    });
});

// All Traceback/Lost & Found endpoints and data removed

// Start
app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
});

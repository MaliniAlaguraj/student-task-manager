// Smart Campus Complaint Management System - Express + SQLite API
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const PORT = process.env.PORT || 5000;
// DEMO credentials only - not production security
const ADMIN_USER = 'admin', ADMIN_PASS = 'admin123';
const CATEGORIES = ['Classroom','Projector','Wi-Fi','Drinking Water','Laboratory Equipment','Washroom','Hostel','Electrical','Other'];
const STATUSES = ['Pending','In Progress','Resolved'];

const db = new Database(path.join(__dirname, 'complaints.db'));
db.exec(`CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  register_no TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)`);

const now = () => new Date().toISOString();
const insert = db.prepare(`INSERT INTO complaints
  (complaint_id,student_name,register_no,department,category,description,status,created_at,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?)`);
function createComplaint(c, status = 'Pending', created = now()) {
  const next = db.prepare('SELECT COALESCE(MAX(id),0)+1 AS n FROM complaints').get().n;
  const cid = `CMP-${1000 + next}`;
  insert.run(cid, c.studentName, c.registerNo, c.department, c.category, c.description, status, created, created);
  return cid;
}

// Seed demo data on first run
if (db.prepare('SELECT COUNT(*) AS n FROM complaints').get().n === 0) {
  const day = 86400000, t = (d) => new Date(Date.now() - d * day).toISOString();
  [
    ['Arun Kumar','21CS001','Computer Science','Projector','Projector in Room 204 shows a green tint and flickers.','Pending',1],
    ['Divya R','21EC014','Electronics','Wi-Fi','Wi-Fi is very slow in the library reading hall after 4 PM.','In Progress',3],
    ['Karthik S','21ME023','Mechanical','Laboratory Equipment','Two lathe machines in the workshop are not working.','In Progress',5],
    ['Meena P','21IT007','Information Technology','Drinking Water','Water purifier on the 2nd floor has no supply.','Resolved',8],
    ['Suresh V','21CS045','Computer Science','Washroom','Taps in the ground floor washroom are leaking.','Pending',2],
    ['Priya M','21EE019','Electrical','Electrical','Fan and two tube lights are not working in Hostel Block B.','Resolved',10],
  ].forEach(([studentName, registerNo, department, category, description, status, d]) =>
    createComplaint({ studentName, registerNo, department, category, description }, status, t(d)));
}

const toApi = (r) => ({
  complaintId: r.complaint_id, studentName: r.student_name, registerNo: r.register_no,
  department: r.department, category: r.category, description: r.description,
  status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
});

const app = express();
app.use(cors());
app.use(express.json());

// ---- Simple demo admin auth (in-memory tokens) ----
const tokens = new Set();
const requireAdmin = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  if (!tokens.has(t)) return res.status(401).json({ error: 'Admin login required.' });
  next();
};

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USER || password !== ADMIN_PASS)
    return res.status(401).json({ error: 'Invalid username or password.' });
  const token = crypto.randomBytes(24).toString('hex');
  tokens.add(token);
  res.json({ token });
});

// ---- Student routes ----
app.post('/api/complaints', (req, res) => {
  const b = req.body || {};
  const c = {
    studentName: String(b.studentName || '').trim(), registerNo: String(b.registerNo || '').trim().toUpperCase(),
    department: String(b.department || '').trim(), category: String(b.category || '').trim(),
    description: String(b.description || '').trim(),
  };
  if (!c.studentName || !c.registerNo || !c.department || !c.category || !c.description)
    return res.status(400).json({ error: 'All fields are required.' });
  if (!CATEGORIES.includes(c.category)) return res.status(400).json({ error: 'Invalid category.' });
  if (c.description.length < 10) return res.status(400).json({ error: 'Description must be at least 10 characters.' });
  const cid = createComplaint(c);
  res.status(201).json(toApi(db.prepare('SELECT * FROM complaints WHERE complaint_id=?').get(cid)));
});

app.get('/api/complaints', (req, res) => {
  const reg = String(req.query.registerNo || '').trim().toUpperCase();
  if (!reg) return res.status(400).json({ error: 'Register number is required.' });
  const rows = db.prepare('SELECT * FROM complaints WHERE register_no=? ORDER BY id DESC').all(reg);
  res.json(rows.map(toApi));
});

app.get('/api/complaints/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM complaints WHERE complaint_id=?').get(req.params.id.trim().toUpperCase());
  if (!row) return res.status(404).json({ error: 'No complaint found with that ID.' });
  res.json(toApi(row));
});

// ---- Admin routes ----
app.get('/api/admin/complaints', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM complaints ORDER BY id DESC').all().map(toApi));
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const by = (col) => db.prepare(`SELECT ${col} AS k, COUNT(*) AS n FROM complaints GROUP BY ${col}`).all();
  const status = Object.fromEntries(by('status').map((r) => [r.k, r.n]));
  const total = Object.values(status).reduce((a, b) => a + b, 0);
  res.json({
    total, pending: status['Pending'] || 0, inProgress: status['In Progress'] || 0, resolved: status['Resolved'] || 0,
    byCategory: by('category').map((r) => ({ category: r.k, count: r.n })).sort((a, b) => b.count - a.count),
  });
});

app.patch('/api/admin/complaints/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const r = db.prepare('UPDATE complaints SET status=?, updated_at=? WHERE complaint_id=?').run(status, now(), req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Complaint not found.' });
  res.json(toApi(db.prepare('SELECT * FROM complaints WHERE complaint_id=?').get(req.params.id)));
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

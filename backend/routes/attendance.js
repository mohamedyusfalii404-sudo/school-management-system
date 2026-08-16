const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/attendance?date=YYYY-MM-DD&class_id=1
router.get('/', (req, res) => {
  const { date, class_id } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

  let sql = `
    SELECT a.*, s.first_name, s.last_name, s.admission_no, c.name AS class_name
    FROM attendance a
    JOIN students s ON s.id = a.student_id
    JOIN classes c ON c.id = a.class_id
    WHERE a.date = ?`;
  const params = [date];
  if (class_id) { sql += ` AND a.class_id = ?`; params.push(class_id); }
  sql += ` ORDER BY s.first_name`;
  res.json(db.prepare(sql).all(...params));
});

// GET /api/attendance/summary?class_id=1&from=&to=
router.get('/summary', (req, res) => {
  const { class_id, from, to } = req.query;
  let sql = `
    SELECT s.id AS student_id, s.first_name, s.last_name, s.admission_no,
      SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) AS present,
      SUM(CASE WHEN a.status='absent' THEN 1 ELSE 0 END) AS absent,
      SUM(CASE WHEN a.status='late' THEN 1 ELSE 0 END) AS late,
      SUM(CASE WHEN a.status='excused' THEN 1 ELSE 0 END) AS excused,
      COUNT(a.id) AS total
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id`;
  const conds = [];
  const params = [];
  if (class_id) { conds.push('s.class_id = ?'); params.push(class_id); }
  if (from) { conds.push('a.date >= ?'); params.push(from); }
  if (to) { conds.push('a.date <= ?'); params.push(to); }
  if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
  sql += ' GROUP BY s.id ORDER BY s.first_name';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/attendance — bulk mark { date, class_id, records: [{student_id, status, note}] }
router.post('/', roleRequired('admin', 'teacher'), (req, res) => {
  const { date, class_id, records } = req.body || {};
  if (!date || !class_id || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'date, class_id and records[] required' });
  }
  const stmt = db.prepare(`
    INSERT INTO attendance (student_id, class_id, date, status, note, marked_by)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(student_id, date) DO UPDATE SET status=excluded.status, note=excluded.note, marked_by=excluded.marked_by`);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      stmt.run(r.student_id, class_id, date, r.status || 'present', r.note || null, req.user.id);
    }
  });
  tx(records);
  res.json({ message: `Attendance saved for ${records.length} students` });
});

module.exports = router;
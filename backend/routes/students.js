const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/students — list with class name
router.get('/', (req, res) => {
  const { search, class_id, status } = req.query;
  let sql = `
    SELECT s.*, c.name AS class_name
    FROM students s
    LEFT JOIN classes c ON c.id = s.class_id
    WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_no LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  if (class_id) { sql += ` AND s.class_id = ?`; params.push(class_id); }
  if (status) { sql += ` AND s.status = ?`; params.push(status); }
  sql += ` ORDER BY s.first_name`;
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// GET /api/students/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT s.*, c.name AS class_name
    FROM students s LEFT JOIN classes c ON c.id = s.class_id
    WHERE s.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Student not found' });
  res.json(row);
});

// POST /api/students — admin/teacher
router.post('/', roleRequired('admin', 'teacher'), (req, res) => {
  const b = req.body || {};
  if (!b.first_name || !b.last_name) return res.status(400).json({ error: 'first_name and last_name required' });

  const admission_no = b.admission_no || `S${String(Date.now()).slice(-6)}`;
  const info = db.prepare(`
    INSERT INTO students (admission_no, first_name, last_name, gender, dob, phone, email, address, guardian_name, guardian_phone, class_id, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(admission_no, b.first_name, b.last_name, b.gender || null, b.dob || null, b.phone || null,
      b.email || null, b.address || null, b.guardian_name || null, b.guardian_phone || null,
      b.class_id || null, b.status || 'active');

  res.status(201).json(db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/students/:id
router.put('/:id', roleRequired('admin', 'teacher'), (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Student not found' });

  db.prepare(`
    UPDATE students SET first_name=?, last_name=?, gender=?, dob=?, phone=?, email=?, address=?,
    guardian_name=?, guardian_phone=?, class_id=?, status=? WHERE id=?`)
    .run(b.first_name ?? existing.first_name, b.last_name ?? existing.last_name,
      b.gender ?? existing.gender, b.dob ?? existing.dob, b.phone ?? existing.phone,
      b.email ?? existing.email, b.address ?? existing.address,
      b.guardian_name ?? existing.guardian_name, b.guardian_phone ?? existing.guardian_phone,
      b.class_id ?? existing.class_id, b.status ?? existing.status, req.params.id);

  res.json(db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id));
});

// DELETE /api/students/:id — admin only
router.delete('/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Student not found' });
  res.json({ message: 'Student deleted' });
});

module.exports = router;
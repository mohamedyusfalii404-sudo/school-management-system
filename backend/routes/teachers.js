const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/teachers
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = `SELECT * FROM teachers WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR staff_no LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }
  sql += ` ORDER BY first_name`;
  res.json(db.prepare(sql).all(...params));
});

// GET /api/teachers/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Teacher not found' });
  res.json(row);
});

// POST /api/teachers — admin only
router.post('/', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.first_name || !b.last_name) return res.status(400).json({ error: 'first_name and last_name required' });
  const staff_no = b.staff_no || `T${String(Date.now()).slice(-6)}`;
  const info = db.prepare(`
    INSERT INTO teachers (staff_no, first_name, last_name, gender, phone, email, address, qualification, subject, salary, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(staff_no, b.first_name, b.last_name, b.gender || null, b.phone || null, b.email || null,
      b.address || null, b.qualification || null, b.subject || null, b.salary || 0, b.status || 'active');
  res.status(201).json(db.prepare('SELECT * FROM teachers WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/teachers/:id
router.put('/:id', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Teacher not found' });
  db.prepare(`
    UPDATE teachers SET first_name=?, last_name=?, gender=?, phone=?, email=?, address=?,
    qualification=?, subject=?, salary=?, status=? WHERE id=?`)
    .run(b.first_name ?? existing.first_name, b.last_name ?? existing.last_name,
      b.gender ?? existing.gender, b.phone ?? existing.phone, b.email ?? existing.email,
      b.address ?? existing.address, b.qualification ?? existing.qualification,
      b.subject ?? existing.subject, b.salary ?? existing.salary, b.status ?? existing.status, req.params.id);
  res.json(db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id));
});

// DELETE /api/teachers/:id — admin only
router.delete('/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM teachers WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Teacher not found' });
  res.json({ message: 'Teacher deleted' });
});

module.exports = router;
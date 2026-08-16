const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/classes — with teacher name + student count
router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name AS teacher_name,
      (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) AS student_count
    FROM classes c
    LEFT JOIN teachers t ON t.id = c.teacher_id
    ORDER BY c.name`).all();
  res.json(rows);
});

// GET /api/classes/:id
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.*, t.first_name || ' ' || t.last_name AS teacher_name
    FROM classes c LEFT JOIN teachers t ON t.id = c.teacher_id
    WHERE c.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Class not found' });
  res.json(row);
});

// POST /api/classes — admin only
router.post('/', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'Class name required' });
  const info = db.prepare('INSERT INTO classes (name, room, teacher_id, capacity) VALUES (?,?,?,?)')
    .run(b.name, b.room || null, b.teacher_id || null, b.capacity || 40);
  res.status(201).json(db.prepare('SELECT * FROM classes WHERE id = ?').get(info.lastInsertRowid));
});

// PUT /api/classes/:id
router.put('/:id', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Class not found' });
  db.prepare('UPDATE classes SET name=?, room=?, teacher_id=?, capacity=? WHERE id=?')
    .run(b.name ?? existing.name, b.room ?? existing.room, b.teacher_id ?? existing.teacher_id,
      b.capacity ?? existing.capacity, req.params.id);
  res.json(db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id));
});

// DELETE /api/classes/:id — admin only
router.delete('/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Class not found' });
  res.json({ message: 'Class deleted' });
});

module.exports = router;
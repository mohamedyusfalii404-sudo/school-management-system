const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/subjects
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM subjects ORDER BY name').all());
});

// POST /api/subjects — admin only
router.post('/', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.code) return res.status(400).json({ error: 'name and code required' });
  const info = db.prepare('INSERT INTO subjects (name, code) VALUES (?,?)').run(b.name, b.code.toUpperCase());
  res.status(201).json(db.prepare('SELECT * FROM subjects WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/subjects/:id — admin only
router.delete('/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Subject not found' });
  res.json({ message: 'Subject deleted' });
});

module.exports = router;
const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

function letterGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// GET /api/grades?student_id=&term=&subject_id=
router.get('/', (req, res) => {
  const { student_id, term, subject_id } = req.query;
  let sql = `
    SELECT g.*, s.first_name, s.last_name, sub.name AS subject_name, sub.code AS subject_code
    FROM grades g
    JOIN students s ON s.id = g.student_id
    JOIN subjects sub ON sub.id = g.subject_id
    WHERE 1=1`;
  const params = [];
  if (student_id) { sql += ' AND g.student_id = ?'; params.push(student_id); }
  if (term) { sql += ' AND g.term = ?'; params.push(term); }
  if (subject_id) { sql += ' AND g.subject_id = ?'; params.push(subject_id); }
  sql += ' ORDER BY sub.name';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/grades/report-card/:studentId?term=
router.get('/report-card/:studentId', (req, res) => {
  const term = req.query.term || 'Term 1';
  const rows = db.prepare(`
    SELECT g.*, sub.name AS subject_name, sub.code AS subject_code
    FROM grades g JOIN subjects sub ON sub.id = g.subject_id
    WHERE g.student_id = ? AND g.term = ? ORDER BY sub.name`)
    .all(req.params.studentId, term);
  const student = db.prepare(`
    SELECT s.*, c.name AS class_name FROM students s LEFT JOIN classes c ON c.id = s.class_id
    WHERE s.id = ?`).get(req.params.studentId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const total = rows.reduce((sum, r) => sum + r.score, 0);
  const average = rows.length ? Math.round((total / rows.length) * 10) / 10 : 0;
  res.json({ student, term, subjects: rows, total, average, grade: letterGrade(average) });
});

// POST /api/grades — admin/teacher
router.post('/', roleRequired('admin', 'teacher'), (req, res) => {
  const b = req.body || {};
  if (!b.student_id || !b.subject_id || !b.term || b.score === undefined) {
    return res.status(400).json({ error: 'student_id, subject_id, term and score required' });
  }
  const score = Number(b.score);
  if (isNaN(score) || score < 0 || score > 100) return res.status(400).json({ error: 'Score must be 0-100' });

  const info = db.prepare(`
    INSERT INTO grades (student_id, subject_id, term, score, grade, remarks, recorded_by)
    VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(student_id, subject_id, term) DO UPDATE SET
      score=excluded.score, grade=excluded.grade, remarks=excluded.remarks, recorded_by=excluded.recorded_by`)
    .run(b.student_id, b.subject_id, b.term, score, letterGrade(score), b.remarks || null, req.user.id);

  res.status(201).json({ message: 'Grade saved', id: Number(info.lastInsertRowid) });
});

// DELETE /api/grades/:id — admin only
router.delete('/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM grades WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Grade not found' });
  res.json({ message: 'Grade deleted' });
});

module.exports = router;
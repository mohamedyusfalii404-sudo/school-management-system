const express = require('express');
const db = require('../db');
const { authRequired, roleRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/finance/overview — totals
router.get('/overview', (req, res) => {
  const income = db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM payments').get().total;
  const expense = db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM expenses').get().total;
  const paymentsCount = db.prepare('SELECT COUNT(*) AS c FROM payments').get().c;
  const expensesCount = db.prepare('SELECT COUNT(*) AS c FROM expenses').get().c;
  res.json({ income, expense, balance: income - expense, paymentsCount, expensesCount });
});

// GET /api/finance/payments?student_id=&term=
router.get('/payments', (req, res) => {
  const { student_id, term } = req.query;
  let sql = `
    SELECT p.*, s.first_name, s.last_name, s.admission_no, u.full_name AS received_by_name
    FROM payments p
    JOIN students s ON s.id = p.student_id
    LEFT JOIN users u ON u.id = p.received_by
    WHERE 1=1`;
  const params = [];
  if (student_id) { sql += ' AND p.student_id = ?'; params.push(student_id); }
  if (term) { sql += ' AND p.term = ?'; params.push(term); }
  sql += ' ORDER BY p.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/finance/payments — admin only
router.post('/payments', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.student_id || !b.term || !b.amount) {
    return res.status(400).json({ error: 'student_id, term and amount required' });
  }
  const amount = Number(b.amount);
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });

  const info = db.prepare(`
    INSERT INTO payments (student_id, term, amount, method, reference, note, received_by)
    VALUES (?,?,?,?,?,?,?)`)
    .run(b.student_id, b.term, amount, b.method || 'cash', b.reference || `REC-${Date.now()}`, b.note || null, req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/finance/payments/:id — admin only
router.delete('/payments/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM payments WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Payment not found' });
  res.json({ message: 'Payment deleted' });
});

// GET /api/finance/expenses
router.get('/expenses', (req, res) => {
  res.json(db.prepare(`
    SELECT e.*, u.full_name AS recorded_by_name
    FROM expenses e LEFT JOIN users u ON u.id = e.recorded_by
    ORDER BY e.created_at DESC`).all());
});

// POST /api/finance/expenses — admin only
router.post('/expenses', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.amount) return res.status(400).json({ error: 'title and amount required' });
  const amount = Number(b.amount);
  if (isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Amount must be positive' });
  const info = db.prepare('INSERT INTO expenses (title, category, amount, description, recorded_by) VALUES (?,?,?,?,?)')
    .run(b.title, b.category || 'Other', amount, b.description || null, req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid));
});

// DELETE /api/finance/expenses/:id — admin only
router.delete('/expenses/:id', roleRequired('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
});

// GET /api/finance/fee-structures
router.get('/fee-structures', (req, res) => {
  res.json(db.prepare(`
    SELECT f.*, c.name AS class_name FROM fee_structures f
    JOIN classes c ON c.id = f.class_id ORDER BY c.name`).all());
});

// POST /api/finance/fee-structures — admin only
router.post('/fee-structures', roleRequired('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.class_id || !b.term || !b.amount) return res.status(400).json({ error: 'class_id, term and amount required' });
  const info = db.prepare('INSERT INTO fee_structures (class_id, term, amount, description) VALUES (?,?,?,?)')
    .run(b.class_id, b.term, Number(b.amount), b.description || null);
  res.status(201).json(db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(info.lastInsertRowid));
});

// GET /api/finance/student-balance/:studentId — what they owe vs paid
router.get('/student-balance/:studentId', (req, res) => {
  const sid = req.params.studentId;
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(sid);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const fees = db.prepare(`
    SELECT f.term, f.amount, f.description FROM fee_structures f
    WHERE f.class_id = ? ORDER BY f.term`).all(student.class_id);
  const paid = db.prepare('SELECT term, SUM(amount) AS total FROM payments WHERE student_id = ? GROUP BY term').all(sid);

  const paidMap = {};
  for (const p of paid) paidMap[p.term] = p.total;

  const lines = fees.map(f => ({
    term: f.term,
    fee: f.amount,
    paid: paidMap[f.term] || 0,
    balance: f.amount - (paidMap[f.term] || 0)
  }));
  const totalFee = lines.reduce((s, l) => s + l.fee, 0);
  const totalPaid = lines.reduce((s, l) => s + l.paid, 0);

  res.json({ student, lines, totalFee, totalPaid, totalBalance: totalFee - totalPaid });
});

module.exports = router;
const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/stats — dashboard numbers
router.get('/', (req, res) => {
  const students = db.prepare("SELECT COUNT(*) AS c FROM students WHERE status='active'").get().c;
  const teachers = db.prepare("SELECT COUNT(*) AS c FROM teachers WHERE status='active'").get().c;
  const classes = db.prepare('SELECT COUNT(*) AS c FROM classes').get().c;
  const income = db.prepare('SELECT COALESCE(SUM(amount),0) AS t FROM payments').get().t;
  const expense = db.prepare('SELECT COALESCE(SUM(amount),0) AS t FROM expenses').get().t;
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = db.prepare("SELECT COUNT(*) AS c FROM attendance WHERE date=? AND status='present'").get(today).c;
  const absentToday = db.prepare("SELECT COUNT(*) AS c FROM attendance WHERE date=? AND status='absent'").get(today).c;

  const recentPayments = db.prepare(`
    SELECT p.*, s.first_name, s.last_name FROM payments p
    JOIN students s ON s.id = p.student_id
    ORDER BY p.created_at DESC LIMIT 5`).all();

  const classDistribution = db.prepare(`
    SELECT c.name, COUNT(s.id) AS count FROM classes c
    LEFT JOIN students s ON s.class_id = c.id
    GROUP BY c.id ORDER BY c.name`).all();

  res.json({
    students, teachers, classes,
    income, expense, balance: income - expense,
    presentToday, absentToday,
    recentPayments, classDistribution
  });
});

module.exports = router;
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDb = require('./db');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const classRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const gradeRoutes = require('./routes/grades');
const financeRoutes = require('./routes/finance');
const subjectRoutes = require('./routes/subjects');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/stats', statsRoutes);

// Serve frontend build if present (production)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDb.init().then((db) => {
  app.locals.db = db;
  app.listen(PORT, () => {
    console.log(`🎓 School Management API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
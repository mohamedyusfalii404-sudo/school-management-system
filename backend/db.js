const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'school.db');

// ============ SINGLETON WRAPPER ============
// sql.js is WASM SQLite (runs in memory, persisted via export).
// Routes require('../db') and call db.prepare(...).all(...) etc.
// The wrapper delegates to the internal raw db which is set by init().

let rawDb = null;

function persist() {
  if (!rawDb) throw new Error('Database not initialized');
  const data = rawDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function prepare(sql) {
  if (!rawDb) throw new Error('Database not initialized');
  const stmt = rawDb.prepare(sql);
  return {
    get(...params) {
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    },
    all(...params) {
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
    run(...params) {
      stmt.bind(params);
      stmt.step();
      stmt.free();
      const changes = rawDb.getRowsModified();
      const last = rawDb.exec('SELECT last_insert_rowid() AS id');
      const lastInsertRowid = last.length ? last[0].values[0][0] : 0;
      persist();
      return { lastInsertRowid, changes };
    }
  };
}

function exec(sql) {
  if (!rawDb) throw new Error('Database not initialized');
  rawDb.exec(sql);
  persist();
}

function transaction(fn) {
  if (!rawDb) throw new Error('Database not initialized');
  rawDb.exec('BEGIN');
  try {
    const result = fn();
    rawDb.exec('COMMIT');
    persist();
    return result;
  } catch (e) {
    rawDb.exec('ROLLBACK');
    throw e;
  }
}

function all(sql, ...params) { return prepare(sql).all(...params); }
function get(sql, ...params) { return prepare(sql).get(...params); }
function run(sql, ...params) { return prepare(sql).run(...params); }

// ============ SCHEMA ============
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','teacher','student')),
  email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admission_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  dob TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  class_id INTEGER,
  enrollment_date TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','graduated')),
  user_id INTEGER,
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_no TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  qualification TEXT,
  subject TEXT,
  hire_date TEXT DEFAULT (datetime('now')),
  salary REAL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  user_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  room TEXT,
  teacher_id INTEGER,
  capacity INTEGER DEFAULT 40,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present','absent','late','excused')),
  note TEXT,
  marked_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(student_id, date),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (class_id) REFERENCES classes(id),
  FOREIGN KEY (marked_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS grades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  term TEXT NOT NULL,
  score REAL NOT NULL,
  grade TEXT,
  remarks TEXT,
  recorded_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(student_id, subject_id, term),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (subject_id) REFERENCES subjects(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  term TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  UNIQUE(class_id, term),
  FOREIGN KEY (class_id) REFERENCES classes(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  term TEXT NOT NULL,
  amount REAL NOT NULL,
  method TEXT DEFAULT 'cash' CHECK (method IN ('cash','bank','mobile','card')),
  reference TEXT,
  note TEXT,
  received_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (received_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT,
  amount REAL NOT NULL,
  description TEXT,
  recorded_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);
`;

// ============ SEED DATA ============
function seed() {
  const count = get('SELECT COUNT(*) AS c FROM users').c;
  if (count > 0) return;

  const adminHash = bcrypt.hashSync('admin123', 10);
  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const studentHash = bcrypt.hashSync('student123', 10);

  run('INSERT INTO users (username, password_hash, full_name, role, email) VALUES (?,?,?,?,?)',
    'admin', adminHash, 'System Administrator', 'admin', 'admin@school.edu');
  run('INSERT INTO users (username, password_hash, full_name, role, email) VALUES (?,?,?,?,?)',
    'teacher1', teacherHash, 'Ahmed Hassan', 'teacher', 'ahmed@school.edu');
  run('INSERT INTO users (username, password_hash, full_name, role, email) VALUES (?,?,?,?,?)',
    'student1', studentHash, 'Ali Omar', 'student', 'ali@school.edu');

  run('INSERT INTO teachers (staff_no, first_name, last_name, gender, phone, email, qualification, subject, salary, user_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'T001', 'Ahmed', 'Hassan', 'M', '+252612345678', 'ahmed@school.edu', 'BSc Mathematics', 'Mathematics', 450, 2);
  run('INSERT INTO teachers (staff_no, first_name, last_name, gender, phone, email, qualification, subject, salary, user_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'T002', 'Fatima', 'Ali', 'F', '+252612345679', 'fatima@school.edu', 'MSc English', 'English', 500, null);
  run('INSERT INTO teachers (staff_no, first_name, last_name, gender, phone, email, qualification, subject, salary, user_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'T003', 'Mohamed', 'Abdi', 'M', '+252612345680', 'mohamed@school.edu', 'BSc Physics', 'Physics', 450, null);

  run('INSERT INTO classes (name, room, teacher_id, capacity) VALUES (?,?,?,?)', 'Form 1A', 'Room 101', 1, 40);
  run('INSERT INTO classes (name, room, teacher_id, capacity) VALUES (?,?,?,?)', 'Form 2A', 'Room 102', 2, 40);
  run('INSERT INTO classes (name, room, teacher_id, capacity) VALUES (?,?,?,?)', 'Form 3A', 'Room 103', 3, 40);

  run('INSERT INTO students (admission_no, first_name, last_name, gender, dob, phone, email, guardian_name, guardian_phone, class_id, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    'S001', 'Ali', 'Omar', 'M', '2010-05-12', '+252611111111', 'ali@school.edu', 'Omar Farah', '+252611111112', 1, 3);
  run('INSERT INTO students (admission_no, first_name, last_name, gender, dob, phone, email, guardian_name, guardian_phone, class_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'S002', 'Hodan', 'Abdi', 'F', '2011-03-22', '+252611111113', 'hodan@school.edu', 'Abdi Nur', '+252611111114', 1);
  run('INSERT INTO students (admission_no, first_name, last_name, gender, dob, phone, email, guardian_name, guardian_phone, class_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'S003', 'Yusuf', 'Mohamed', 'M', '2009-09-01', '+252611111115', 'yusuf@school.edu', 'Mohamed Ali', '+252611111116', 2);
  run('INSERT INTO students (admission_no, first_name, last_name, gender, dob, phone, email, guardian_name, guardian_phone, class_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'S004', 'Amina', 'Hassan', 'F', '2010-01-15', '+252611111117', 'amina@school.edu', 'Hassan Omar', '+252611111118', 2);
  run('INSERT INTO students (admission_no, first_name, last_name, gender, dob, phone, email, guardian_name, guardian_phone, class_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
    'S005', 'Khadar', 'Farah', 'M', '2008-07-30', '+252611111119', 'khadar@school.edu', 'Farah Ali', '+252611111120', 3);

  run('INSERT INTO subjects (name, code) VALUES (?,?)', 'Mathematics', 'MATH');
  run('INSERT INTO subjects (name, code) VALUES (?,?)', 'English', 'ENG');
  run('INSERT INTO subjects (name, code) VALUES (?,?)', 'Physics', 'PHY');
  run('INSERT INTO subjects (name, code) VALUES (?,?)', 'Chemistry', 'CHEM');
  run('INSERT INTO subjects (name, code) VALUES (?,?)', 'Biology', 'BIO');
  run('INSERT INTO subjects (name, code) VALUES (?,?)', 'Somali', 'SOM');

  run('INSERT INTO fee_structures (class_id, term, amount, description) VALUES (?,?,?,?)', 1, 'Term 1', 150, 'Tuition fee per term');
  run('INSERT INTO fee_structures (class_id, term, amount, description) VALUES (?,?,?,?)', 2, 'Term 1', 180, 'Tuition fee per term');
  run('INSERT INTO fee_structures (class_id, term, amount, description) VALUES (?,?,?,?)', 3, 'Term 1', 200, 'Tuition fee per term');

  run('INSERT INTO payments (student_id, term, amount, method, reference, received_by) VALUES (?,?,?,?,?,?)',
    1, 'Term 1', 150, 'cash', 'REC-1001', 1);
  run('INSERT INTO payments (student_id, term, amount, method, reference, received_by) VALUES (?,?,?,?,?,?)',
    2, 'Term 1', 100, 'mobile', 'REC-1002', 1);
  run('INSERT INTO payments (student_id, term, amount, method, reference, received_by) VALUES (?,?,?,?,?,?)',
    3, 'Term 1', 180, 'bank', 'REC-1003', 1);

  run('INSERT INTO expenses (title, category, amount, description, recorded_by) VALUES (?,?,?,?,?)',
    'Chalk & Stationery', 'Supplies', 50, 'Classroom supplies', 1);
  run('INSERT INTO expenses (title, category, amount, description, recorded_by) VALUES (?,?,?,?,?)',
    'Electricity Bill', 'Utilities', 120, 'Monthly electricity', 1);

  const today = new Date().toISOString().slice(0, 10);
  run('INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES (?,?,?,?,?)', 1, 1, today, 'present', 1);
  run('INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES (?,?,?,?,?)', 2, 1, today, 'absent', 1);
  run('INSERT INTO attendance (student_id, class_id, date, status, marked_by) VALUES (?,?,?,?,?)', 3, 2, today, 'present', 1);

  run('INSERT INTO grades (student_id, subject_id, term, score, grade, remarks, recorded_by) VALUES (?,?,?,?,?,?,?)',
    1, 1, 'Term 1', 85, 'A', 'Excellent', 1);
  run('INSERT INTO grades (student_id, subject_id, term, score, grade, remarks, recorded_by) VALUES (?,?,?,?,?,?,?)',
    1, 2, 'Term 1', 78, 'B+', 'Very good', 1);
  run('INSERT INTO grades (student_id, subject_id, term, score, grade, remarks, recorded_by) VALUES (?,?,?,?,?,?,?)',
    2, 1, 'Term 1', 65, 'B', 'Good', 1);
  run('INSERT INTO grades (student_id, subject_id, term, score, grade, remarks, recorded_by) VALUES (?,?,?,?,?,?,?)',
    3, 1, 'Term 1', 92, 'A', 'Outstanding', 1);

  console.log('✅ Database seeded with demo data');
}

// ============ INIT ============
async function init() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    rawDb = new SQL.Database(fileBuffer);
  } else {
    rawDb = new SQL.Database();
  }
  exec(SCHEMA);
  seed();
  return module.exports;
}

module.exports = { prepare, exec, transaction, all, get, run, init };
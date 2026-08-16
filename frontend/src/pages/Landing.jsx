import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../App.jsx';

const FEATURES = [
  { icon: '👨‍🎓', title: 'Student Management', desc: 'Admissions, profiles, guardians, class assignment and status tracking for every student.' },
  { icon: '👩‍🏫', title: 'Teacher Management', desc: 'Staff records, qualifications, subjects taught, salaries and assignment to classes.' },
  { icon: '🏫', title: 'Class Management', desc: 'Create classes, assign homeroom teachers, set capacities and view student counts.' },
  { icon: '✅', title: 'Attendance Tracking', desc: 'Mark present, absent, late or excused — daily and summary reports per student.' },
  { icon: '📊', title: 'Grades & Report Cards', desc: 'Record scores per subject and term, automatic letter grades and averages.' },
  { icon: '💰', title: 'Finance & Fees', desc: 'Fee structures, payments, expenses, and per-student balance tracking in real time.' }
];

export default function Landing() {
  const [health, setHealth] = useState(null);
  const loggedIn = !!getToken();

  useEffect(() => {
    api('/health').then(d => setHealth(d)).catch(() => setHealth(null));
  }, []);

  return (
    <div>
      <nav className="landing-nav">
        <div className="container">
          <div className="logo">🎓 EduSmart</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            {loggedIn ? (
              <Link to="/app" className="btn btn-primary">Dashboard</Link>
            ) : (
              <Link to="/login" className="btn btn-primary">Login</Link>
            )}
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="container">
          <h1>Manage your entire school<br />with <span>one smart system</span></h1>
          <p>EduSmart is a complete school management platform — students, teachers, classes, attendance, grades and finance — all in one place.</p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>Get Started →</Link>
            <a href="#features" className="btn btn-outline" style={{ padding: '14px 32px', fontSize: 16 }}>Explore Features</a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><div className="num">10+</div><div className="label">Modules</div></div>
            <div className="hero-stat"><div className="num">3</div><div className="label">User Roles</div></div>
            <div className="hero-stat"><div className="num">100%</div><div className="label">Web Based</div></div>
            <div className="hero-stat"><div className="num">{health ? '✓' : '—'}</div><div className="label">API Status</div></div>
          </div>
        </div>
      </header>

      <section id="features" className="features">
        <div className="container">
          <h2>Everything your school needs</h2>
          <p className="sub">Powerful modules that work together seamlessly</p>
          <div className="feature-grid">
            {FEATURES.map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta" id="about">
        <div className="container">
          <h2>Ready to modernize your school?</h2>
          <p>Built with React, Node.js and SQLite. Secure login, role-based access, real-time dashboards.</p>
          <Link to="/login" className="btn" style={{ padding: '14px 36px', fontSize: 16 }}>Login to Dashboard</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          © 2026 EduSmart School Management System — Built with React, Node.js & SQLite
        </div>
      </footer>
    </div>
  );
}
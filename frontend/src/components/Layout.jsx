import React from 'react';
import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/app', end: true, icon: '📊', label: 'Dashboard' },
  { to: '/app/students', icon: '👨‍🎓', label: 'Students' },
  { to: '/app/teachers', icon: '👩‍🏫', label: 'Teachers' },
  { to: '/app/classes', icon: '🏫', label: 'Classes' },
  { to: '/app/attendance', icon: '✅', label: 'Attendance' },
  { to: '/app/grades', icon: '📝', label: 'Grades' },
  { to: '/app/finance', icon: '💰', label: 'Finance' }
];

export default function Layout({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">🎓 EduSmart</div>
        <nav>
          {LINKS.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => isActive ? 'active' : ''}>
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="user-box">
            <div className="name">{user.full_name}</div>
            <div className="role">{user.role}</div>
            <button className="logout-btn" onClick={onLogout}>Log out</button>
          </div>
        )}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
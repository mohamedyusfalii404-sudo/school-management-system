import React, { useState, useEffect } from 'react';
import { api } from '../App.jsx';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/stats').then(setStats).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return <div className="loading">Loading dashboard…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Welcome back! Here's your school at a glance.</div>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">👨‍🎓</div>
          <div className="stat-value">{stats.students}</div>
          <div className="stat-label">Active Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👩‍🏫</div>
          <div className="stat-value">{stats.teachers}</div>
          <div className="stat-label">Teachers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-value">{stats.classes}</div>
          <div className="stat-label">Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.presentToday}</div>
          <div className="stat-label">Present Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{stats.absentToday}</div>
          <div className="stat-label">Absent Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">${stats.balance}</div>
          <div className="stat-label">Balance (Income − Expense)</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <div className="card">
          <h3>🪙 Recent Payments</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Term</th><th>Amount</th><th>Method</th></tr>
              </thead>
              <tbody>
                {stats.recentPayments.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray)' }}>No payments yet</td></tr>
                )}
                {stats.recentPayments.map(p => (
                  <tr key={p.id}>
                    <td>{p.first_name} {p.last_name}</td>
                    <td>{p.term}</td>
                    <td>${p.amount}</td>
                    <td><span className="badge badge-blue">{p.method}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>🏫 Students per Class</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Class</th><th>Students</th></tr>
              </thead>
              <tbody>
                {stats.classDistribution.map(c => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td><span className="badge badge-green">{c.count}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
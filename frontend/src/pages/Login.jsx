import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setAuth } from '../App.jsx';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setAuth(data.token, data.user);
      onLogin(data.user);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function quickFill(u, p) {
    setUsername(u);
    setPassword(p);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">🎓 EduSmart</div>
        <h2>Welcome back</h2>
        <p className="sub">Sign in to the school management dashboard</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="demo-box">
          <strong>Demo accounts</strong>
          <div style={{ marginBottom: 6 }}>
            <code>admin</code> / <code>admin123</code> — <button className="btn btn-outline btn-sm" onClick={() => quickFill('admin', 'admin123')}>Use</button>
          </div>
          <div style={{ marginBottom: 6 }}>
            <code>teacher1</code> / <code>teacher123</code> — <button className="btn btn-outline btn-sm" onClick={() => quickFill('teacher1', 'teacher123')}>Use</button>
          </div>
          <div>
            <code>student1</code> / <code>student123</code> — <button className="btn btn-outline btn-sm" onClick={() => quickFill('student1', 'student123')}>Use</button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <Link to="/" style={{ color: 'var(--primary)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
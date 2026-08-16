import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Classes from './pages/Classes.jsx';
import Attendance from './pages/Attendance.jsx';
import Grades from './pages/Grades.jsx';
import Finance from './pages/Finance.jsx';
import Layout from './components/Layout.jsx';

export const API = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('sms_token');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('sms_user') || 'null');
  } catch { return null; }
}

export function setAuth(token, user) {
  localStorage.setItem('sms_token', token);
  localStorage.setItem('sms_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('sms_token');
  localStorage.removeItem('sms_user');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function Protected({ children }) {
  const token = getToken();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const t = getToken();
    if (t && !user) {
      api('/auth/me').then(d => {
        setUser(d.user);
        localStorage.setItem('sms_user', JSON.stringify(d.user));
      }).catch(() => clearAuth());
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login onLogin={setUser} />} />
      <Route path="/app" element={
        <Protected>
          <Layout user={user} onLogout={() => { clearAuth(); setUser(null); }}>
            <Routes>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="teachers" element={<Teachers />} />
              <Route path="classes" element={<Classes />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="grades" element={<Grades />} />
              <Route path="finance" element={<Finance />} />
            </Routes>
          </Layout>
        </Protected>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
import React, { useState, useEffect } from 'react';
import { api, getUser } from '../App.jsx';

const STATUSES = ['present', 'absent', 'late', 'excused'];

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const user = getUser();
  const canMark = user && (user.role === 'admin' || user.role === 'teacher');

  useEffect(() => {
    api('/classes').then(setClasses).catch(e => setError(e.message));
  }, []);

  async function loadStudents() {
    if (!classId) return;
    setError('');
    try {
      const students = await api(`/students?class_id=${classId}`);
      const existing = await api(`/attendance?date=${date}&class_id=${classId}`);
      const map = {};
      existing.forEach(a => { map[a.student_id] = a.status; });
      setRecords(students.map(s => ({ student_id: s.id, name: `${s.first_name} ${s.last_name}`, admission_no: s.admission_no, status: map[s.id] || 'present' })));
      setSaved(false);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { loadStudents(); }, [classId, date]);

  function setStatus(id, status) {
    setRecords(records.map(r => r.student_id === id ? { ...r, status } : r));
  }

  async function save() {
    setError('');
    try {
      await api('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          date,
          class_id: Number(classId),
          records: records.map(r => ({ student_id: r.student_id, status: r.status }))
        })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <div className="sub">Mark daily attendance per class</div>
        </div>
      </div>

      <div className="toolbar">
        <select value={classId} onChange={e => setClassId(e.target.value)} style={{ minWidth: 180 }}>
          <option value="">— Select Class —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {error && <div className="error-msg">{error}</div>}
      {saved && <div className="success-msg">✅ Attendance saved successfully!</div>}

      {classId && (
        <div className="card">
          <h3>{records.length} students — {date}</h3>
          {records.map(r => (
            <div className="attendance-row" key={r.student_id}>
              <span className="student-name">{r.name} <small style={{ color: 'var(--gray)' }}>({r.admission_no})</small></span>
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`status-btn ${r.status === s ? `active-${s}` : ''}`}
                  onClick={() => canMark && setStatus(r.student_id, s)}
                  disabled={!canMark}
                >
                  {s}
                </button>
              ))}
            </div>
          ))}
          {canMark && (
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-success" onClick={save}>💾 Save Attendance</button>
            </div>
          )}
        </div>
      )}

      {!classId && <div className="empty-state"><div className="icon">📋</div>Select a class and date to mark attendance</div>}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { api, getUser } from '../App.jsx';

const TERMS = ['Term 1', 'Term 2', 'Term 3'];

export default function Grades() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [grades, setGrades] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const user = getUser();
  const canEdit = user && (user.role === 'admin' || user.role === 'teacher');

  useEffect(() => {
    Promise.all([api('/students'), api('/subjects')])
      .then(([s, sub]) => { setStudents(s); setSubjects(sub); })
      .catch(e => setError(e.message));
  }, []);

  async function loadGrades() {
    if (!studentId) return;
    setError('');
    try {
      const g = await api(`/grades?student_id=${studentId}&term=${encodeURIComponent(term)}`);
      setGrades(g);
      const r = await api(`/grades/report-card/${studentId}?term=${encodeURIComponent(term)}`);
      setReport(r);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => { loadGrades(); }, [studentId, term]);

  async function saveGrade(subjectId, score) {
    setError('');
    try {
      await api('/grades', {
        method: 'POST',
        body: JSON.stringify({ student_id: Number(studentId), subject_id: subjectId, term, score: Number(score) })
      });
      loadGrades();
    } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Grades & Report Cards</h1>
          <div className="sub">Record scores and view report cards</div>
        </div>
      </div>

      <div className="toolbar">
        <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ minWidth: 220 }}>
          <option value="">— Select Student —</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>)}
        </select>
        <select value={term} onChange={e => setTerm(e.target.value)}>
          {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {report && (
        <>
          <div className="card">
            <h3>📄 Report Card — {report.student.first_name} {report.student.last_name} ({report.student.admission_no})</h3>
            <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap', marginBottom: 16, fontSize: 14 }}>
              <span>Class: <strong>{report.student.class_name || '—'}</strong></span>
              <span>Term: <strong>{report.term}</strong></span>
              <span>Average: <strong>{report.average}%</strong></span>
              <span>Grade: <strong style={{ color: 'var(--primary)' }}>{report.grade}</strong></span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Subject</th><th>Score</th><th>Grade</th><th>Remarks</th>{canEdit && <th>Update</th>}</tr>
                </thead>
                <tbody>
                  {report.subjects.map(g => (
                    <tr key={g.id}>
                      <td>{g.subject_name}</td>
                      <td>{g.score}</td>
                      <td><span className="badge badge-blue">{g.grade}</span></td>
                      <td>{g.remarks || '—'}</td>
                      {canEdit && (
                        <td>
                          <input
                            type="number" min="0" max="100" defaultValue={g.score}
                            style={{ width: 80, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 6 }}
                            onBlur={e => e.target.value && saveGrade(g.subject_id, e.target.value)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                  {report.subjects.length === 0 && <tr><td colSpan={canEdit ? 5 : 4} className="empty-state">No grades recorded yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {canEdit && (
            <div className="card">
              <h3>➕ Add / Update Grade</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {subjects.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>{sub.name}</label>
                    <input
                      type="number" min="0" max="100" placeholder="Score"
                      style={{ width: 90, padding: '8px', border: '1px solid var(--border)', borderRadius: 6 }}
                      onBlur={e => e.target.value && saveGrade(sub.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!studentId && <div className="empty-state"><div className="icon">📝</div>Select a student to view or record grades</div>}
    </div>
  );
}
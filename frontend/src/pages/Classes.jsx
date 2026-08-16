import React, { useState, useEffect } from 'react';
import { api, getUser } from '../App.jsx';

const EMPTY = { name: '', room: '', teacher_id: '', capacity: 40 };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  async function load() {
    const [c, t] = await Promise.all([api('/classes'), api('/teachers')]);
    setClasses(c);
    setTeachers(t);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(c) { setEditing(c); setForm({ ...c, teacher_id: c.teacher_id || '' }); setShowModal(true); }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api(`/classes/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/classes', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      load();
    } catch (err) { setError(err.message); }
  }

  async function remove(c) {
    if (!confirm(`Delete class ${c.name}?`)) return;
    try { await api(`/classes/${c.id}`, { method: 'DELETE' }); load(); }
    catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Classes</h1>
          <div className="sub">{classes.length} classes</div>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Class</button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Class</th><th>Room</th><th>Homeroom Teacher</th><th>Capacity</th><th>Students</th>{isAdmin && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {classes.length === 0 && <tr><td colSpan={isAdmin ? 6 : 5} className="empty-state">No classes found</td></tr>}
              {classes.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.room || '—'}</td>
                  <td>{c.teacher_name || '—'}</td>
                  <td>{c.capacity}</td>
                  <td><span className="badge badge-green">{c.student_count}</span></td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Del</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Class' : 'Add New Class'}</h3>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group"><label>Class Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Room</label><input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Homeroom Teacher</label>
                  <select value={form.teacher_id} onChange={e => setForm({ ...form, teacher_id: e.target.value })}>
                    <option value="">— None —</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Class'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
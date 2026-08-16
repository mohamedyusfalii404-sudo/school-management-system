import React, { useState, useEffect } from 'react';
import { api, getUser } from '../App.jsx';

const EMPTY = { first_name: '', last_name: '', gender: 'M', dob: '', phone: '', email: '', guardian_name: '', guardian_phone: '', class_id: '', status: 'active' };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const user = getUser();
  const canEdit = user && (user.role === 'admin' || user.role === 'teacher');

  async function load() {
    const [s, c] = await Promise.all([
      api(`/students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
      api('/classes')
    ]);
    setStudents(s);
    setClasses(c);
  }

  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  useEffect(() => { const t = setTimeout(() => load().catch(() => {}), 300); return () => clearTimeout(t); }, [search]);

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(s) { setEditing(s); setForm({ ...s, class_id: s.class_id || '' }); setShowModal(true); }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api(`/students/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await api('/students', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false);
      load();
    } catch (err) { setError(err.message); }
  }

  async function remove(s) {
    if (!confirm(`Delete student ${s.first_name} ${s.last_name}? This cannot be undone.`)) return;
    try { await api(`/students/${s.id}`, { method: 'DELETE' }); load(); }
    catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <div className="sub">{students.length} students enrolled</div>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>}
      </div>

      <div className="toolbar">
        <input placeholder="Search name or admission no…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 260 }} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Adm No</th><th>Name</th><th>Gender</th><th>Class</th><th>Guardian</th><th>Phone</th><th>Status</th>{canEdit && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {students.length === 0 && <tr><td colSpan={canEdit ? 8 : 7} className="empty-state">No students found</td></tr>}
              {students.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.admission_no}</strong></td>
                  <td>{s.first_name} {s.last_name}</td>
                  <td>{s.gender}</td>
                  <td>{s.class_name || '—'}</td>
                  <td>{s.guardian_name || '—'}</td>
                  <td>{s.phone || '—'}</td>
                  <td><span className={`badge ${s.status === 'active' ? 'badge-green' : s.status === 'graduated' ? 'badge-blue' : 'badge-gray'}`}>{s.status}</span></td>
                  {canEdit && (
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)} style={{ marginRight: 6 }}>Edit</button>
                      {user.role === 'admin' && <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Del</button>}
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
            <h3>{editing ? 'Edit Student' : 'Add New Student'}</h3>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-row">
                <div className="form-group"><label>First Name *</label><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required /></div>
                <div className="form-group"><label>Last Name *</label><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Gender</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="M">Male</option><option value="F">Female</option>
                  </select>
                </div>
                <div className="form-group"><label>Date of Birth</label><input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Class</label>
                  <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                    <option value="">— Select —</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Guardian Name</label><input value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} /></div>
                <div className="form-group"><label>Guardian Phone</label><input value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
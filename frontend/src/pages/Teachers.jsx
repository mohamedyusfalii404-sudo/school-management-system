import React, { useState, useEffect } from 'react';
import { api, getUser } from '../App.jsx';

const EMPTY = { first_name: '', last_name: '', gender: 'M', phone: '', email: '', qualification: '', subject: '', salary: '', status: 'active' };

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  async function load() {
    setTeachers(await api('/teachers'));
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true); }
  function openEdit(t) { setEditing(t); setForm({ ...t, salary: t.salary || '' }); setShowModal(true); }

  async function save(e) {
    e.preventDefault();
    setError('');
    try {
      if (editing) await api(`/teachers/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) });
      else await api('/teachers', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      load();
    } catch (err) { setError(err.message); }
  }

  async function remove(t) {
    if (!confirm(`Delete teacher ${t.first_name} ${t.last_name}?`)) return;
    try { await api(`/teachers/${t.id}`, { method: 'DELETE' }); load(); }
    catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Teachers</h1>
          <div className="sub">{teachers.length} staff members</div>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Staff No</th><th>Name</th><th>Subject</th><th>Qualification</th><th>Phone</th><th>Salary</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {teachers.length === 0 && <tr><td colSpan={isAdmin ? 8 : 7} className="empty-state">No teachers found</td></tr>}
              {teachers.map(t => (
                <tr key={t.id}>
                  <td><strong>{t.staff_no}</strong></td>
                  <td>{t.first_name} {t.last_name}</td>
                  <td>{t.subject || '—'}</td>
                  <td>{t.qualification || '—'}</td>
                  <td>{t.phone || '—'}</td>
                  <td>${t.salary || 0}</td>
                  <td><span className={`badge ${t.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{t.status}</span></td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} style={{ marginRight: 6 }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>Del</button>
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
            <h3>{editing ? 'Edit Teacher' : 'Add New Teacher'}</h3>
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
                <div className="form-group"><label>Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Qualification</label><input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
                <div className="form-group"><label>Salary ($)</label><input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Add Teacher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
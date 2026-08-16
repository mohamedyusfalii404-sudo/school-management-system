import React, { useState, useEffect } from 'react';
import { api, getUser } from '../App.jsx';

export default function Finance() {
  const [overview, setOverview] = useState(null);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [students, setStudents] = useState([]);
  const [balance, setBalance] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [payForm, setPayForm] = useState({ student_id: '', term: 'Term 1', amount: '', method: 'cash', note: '' });
  const [expForm, setExpForm] = useState({ title: '', category: 'Other', amount: '', description: '' });
  const [error, setError] = useState('');
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  async function load() {
    const [o, p, e, s] = await Promise.all([
      api('/finance/overview'), api('/finance/payments'), api('/finance/expenses'), api('/students')
    ]);
    setOverview(o); setPayments(p); setExpenses(e); setStudents(s);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  async function loadBalance() {
    if (!selectedStudent) { setBalance(null); return; }
    try { setBalance(await api(`/finance/student-balance/${selectedStudent}`)); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { loadBalance(); }, [selectedStudent]);

  async function addPayment(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/finance/payments', { method: 'POST', body: JSON.stringify(payForm) });
      setShowPayment(false);
      setPayForm({ student_id: '', term: 'Term 1', amount: '', method: 'cash', note: '' });
      load(); loadBalance();
    } catch (err) { setError(err.message); }
  }

  async function addExpense(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/finance/expenses', { method: 'POST', body: JSON.stringify(expForm) });
      setShowExpense(false);
      setExpForm({ title: '', category: 'Other', amount: '', description: '' });
      load();
    } catch (err) { setError(err.message); }
  }

  async function removePayment(id) {
    if (!confirm('Delete this payment?')) return;
    try { await api(`/finance/payments/${id}`, { method: 'DELETE' }); load(); loadBalance(); }
    catch (err) { alert(err.message); }
  }

  async function removeExpense(id) {
    if (!confirm('Delete this expense?')) return;
    try { await api(`/finance/expenses/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { alert(err.message); }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Finance</h1>
          <div className="sub">Fees, payments, expenses and balances</div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-success" onClick={() => setShowPayment(true)}>+ Record Payment</button>
            <button className="btn btn-outline" onClick={() => setShowExpense(true)}>+ Add Expense</button>
          </div>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {overview && (
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-icon">💵</div><div className="stat-value">${overview.income}</div><div className="stat-label">Total Income</div></div>
          <div className="stat-card"><div className="stat-icon">🧾</div><div className="stat-value">${overview.expense}</div><div className="stat-label">Total Expenses</div></div>
          <div className="stat-card"><div className="stat-icon">⚖️</div><div className="stat-value">${overview.balance}</div><div className="stat-label">Balance</div></div>
          <div className="stat-card"><div className="stat-icon">🪙</div><div className="stat-value">{overview.paymentsCount}</div><div className="stat-label">Payments</div></div>
        </div>
      )}

      <div className="card">
        <h3>🧮 Student Balance Check</h3>
        <div className="toolbar">
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} style={{ minWidth: 240 }}>
            <option value="">— Select Student —</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>)}
          </select>
        </div>
        {balance && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Term</th><th>Fee</th><th>Paid</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {balance.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{l.term}</td>
                    <td>${l.fee}</td>
                    <td>${l.paid}</td>
                    <td><span className={`badge ${l.balance <= 0 ? 'badge-green' : 'badge-red'}`}>${l.balance}</span></td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td>Total</td><td>${balance.totalFee}</td><td>${balance.totalPaid}</td>
                  <td><span className={`badge ${balance.totalBalance <= 0 ? 'badge-green' : 'badge-red'}`}>${balance.totalBalance}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        <div className="card">
          <h3>🪙 Payments</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Student</th><th>Term</th><th>Amount</th><th>Method</th>{isAdmin && <th></th>}</tr></thead>
              <tbody>
                {payments.length === 0 && <tr><td colSpan={isAdmin ? 5 : 4} className="empty-state">No payments</td></tr>}
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.first_name} {p.last_name}</td>
                    <td>{p.term}</td>
                    <td><strong>${p.amount}</strong></td>
                    <td><span className="badge badge-blue">{p.method}</span></td>
                    {isAdmin && <td><button className="btn btn-danger btn-sm" onClick={() => removePayment(p.id)}>Del</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>🧾 Expenses</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th>{isAdmin && <th></th>}</tr></thead>
              <tbody>
                {expenses.length === 0 && <tr><td colSpan={isAdmin ? 4 : 3} className="empty-state">No expenses</td></tr>}
                {expenses.map(x => (
                  <tr key={x.id}>
                    <td>{x.title}</td>
                    <td><span className="badge badge-yellow">{x.category}</span></td>
                    <td><strong>${x.amount}</strong></td>
                    {isAdmin && <td><button className="btn btn-danger btn-sm" onClick={() => removeExpense(x.id)}>Del</button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Record Payment</h3>
            <form onSubmit={addPayment}>
              <div className="form-group"><label>Student *</label>
                <select value={payForm.student_id} onChange={e => setPayForm({ ...payForm, student_id: e.target.value })} required>
                  <option value="">— Select —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Term</label>
                  <select value={payForm.term} onChange={e => setPayForm({ ...payForm, term: e.target.value })}>
                    <option>Term 1</option><option>Term 2</option><option>Term 3</option>
                  </select>
                </div>
                <div className="form-group"><label>Amount ($) *</label><input type="number" min="1" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Method</label>
                  <select value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
                    <option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile">Mobile</option><option value="card">Card</option>
                  </select>
                </div>
                <div className="form-group"><label>Note</label><input value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} /></div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowPayment(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpense && (
        <div className="modal-overlay" onClick={() => setShowExpense(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Expense</h3>
            <form onSubmit={addExpense}>
              <div className="form-group"><label>Title *</label><input value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} required /></div>
              <div className="form-row">
                <div className="form-group"><label>Category</label>
                  <select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                    <option>Supplies</option><option>Utilities</option><option>Salaries</option><option>Maintenance</option><option>Transport</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group"><label>Amount ($) *</label><input type="number" min="1" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea rows="2" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowExpense(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
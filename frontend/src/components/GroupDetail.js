import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencyByCountryCode, formatCurrency } from '../utils/countries';

const CATEGORIES = [
  'General', 'Food', 'Transport', 'Entertainment', 'Utilities',
  'Rent', 'Groceries', 'Dining out', 'Travel', 'Shopping',
  'Health', 'Education', 'Subscriptions', 'Gifts', 'Other'
];

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const curr = getCurrencyByCountryCode(user?.country_code || '+92');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState('expenses');
  const [newExpense, setNewExpense] = useState({
    description: '', amount: '', category: 'general', split_type: 'equal'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchGroupData(); }, [id]);

  const fetchGroupData = async () => {
    try {
      const [groupData, expenseData, balanceData] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/expenses?group_id=${id}`),
        api.get(`/groups/${id}/balances`)
      ]);
      setGroup(groupData);
      setExpenses(expenseData.expenses || []);
      setBalances(balanceData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        group_id: parseInt(id), description: newExpense.description,
        amount: parseFloat(newExpense.amount), category: newExpense.category,
        split_type: newExpense.split_type,
        splits: group.members.map(m => ({ user_id: m.id, amount: parseFloat(newExpense.amount) / group.members.length }))
      });
      setNewExpense({ description: '', amount: '', category: 'general', split_type: 'equal' });
      setShowAddExpense(false);
      fetchGroupData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!group) return <div className="card"><p>Group not found</p></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>{group.name}</h2>
          <p>{group.description || `${group.members?.length || 0} members`}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>+ Add Expense</button>
          <button className="btn btn-outline" onClick={() => navigate('/chat', { state: { groupId: id } })}>Chat</button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Members</div>
          <div className="value neutral">{group.members?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Expenses</div>
          <div className="value">{expenses.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Amount</div>
          <div className="value positive">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0), curr.symbol)}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>Expenses</button>
        <button className={`tab ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>Balances</button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
      </div>

      {activeTab === 'expenses' && (
        <div className="card">
          {expenses.length === 0 ? (
            <div className="empty-state"><div className="icon">💸</div><h3>No expenses yet</h3><p>Add the first expense for this group</p></div>
          ) : (
            <div className="expense-list">
              {expenses.map(expense => (
                <div className="expense-item" key={expense.id}>
                  <div className="expense-icon" style={{ background: 'rgba(192, 192, 192, 0.06)' }}>{expense.category || 'General'}</div>
                  <div className="expense-details">
                    <div className="description">{expense.description}</div>
                    <div className="meta">Paid by {expense.paid_by_name} · {new Date(expense.date).toLocaleDateString()}</div>
                  </div>
                  <div className="expense-amount">
                    <div className="amount">{formatCurrency(expense.amount, curr.symbol)}</div>
                    {expense.paid_by === user?.id ? <div className="you-paid">You paid</div> : <div className="you-owe">You owe {formatCurrency(expense.amount / (expense.split_count || group.members.length), curr.symbol)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'balances' && (
        <div className="card">
          {balances.length === 0 ? (
            <div className="empty-state"><p style={{ color: 'var(--text-muted)' }}>All settled up!</p></div>
          ) : (
            balances.map(b => (
              <div className="balance-item" key={b.userId}>
                <div className="user"><div className="avatar">{b.name.charAt(0).toUpperCase()}</div><span>{b.name}</span></div>
                <div className={`amount ${b.balance < 0 ? 'negative' : 'positive'}`}>{b.balance < 0 ? `-${formatCurrency(Math.abs(b.balance), curr.symbol)}` : `+${formatCurrency(b.balance, curr.symbol)}`}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card">
          {group.members?.map(member => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar" style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--gradient-silver)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000' }}>{member.name.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</div>
              </div>
              {member.role === 'admin' && <span style={{ padding: '3px 10px', background: 'rgba(192, 192, 192, 0.1)', color: 'var(--silver-light)', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Admin</span>}
            </div>
          ))}
        </div>
      )}

      {showAddExpense && (
        <div className="modal-overlay" onClick={() => setShowAddExpense(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Expense to {group.name}</h3>
            <form onSubmit={addExpense}>
              <div className="input-group"><label>Description</label><input type="text" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="What was this for?" required /></div>
              <div className="input-group"><label>Amount ({curr.symbol})</label><input type="number" step="0.01" min="0" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0.00" required /></div>
              <div className="input-group"><label>Category</label><select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 16, fontFamily: 'inherit' }}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="input-group"><label>Split Type</label><select value={newExpense.split_type} onChange={(e) => setNewExpense({ ...newExpense, split_type: e.target.value })}><option value="equal">Equal Split</option><option value="percentage">By Percentage</option><option value="exact">Exact Amounts</option></select></div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Split equally among {group.members?.length || 0} members {newExpense.amount && `(${formatCurrency(parseFloat(newExpense.amount) / (group.members?.length || 1), curr.symbol)} each)`}</p>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShowAddExpense(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Expense</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

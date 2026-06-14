import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencyByCountryCode, formatCurrency } from '../utils/countries';

export default function SettleUp() {
  const { user } = useAuth();
  const curr = getCurrencyByCountryCode(user?.country_code || '+92');
  const [balances, setBalances] = useState([]);
  const [simplified, setSimplified] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('balances');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleForm, setSettleForm] = useState({ payee_id: '', amount: '', note: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [b, s, h] = await Promise.all([api.get('/settlements/balances'), api.get('/settlements/simplify'), api.get('/settlements')]);
      setBalances(b); setSimplified(s); setSettlements(h);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const settle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/settlements', { payee_id: parseInt(settleForm.payee_id), amount: parseFloat(settleForm.amount), note: settleForm.note });
      setSettleForm({ payee_id: '', amount: '', note: '' }); setShowSettleModal(false); fetchData();
    } catch (err) { console.error(err); }
  };

  const quickSettle = (userId, amount) => {
    setSettleForm({ payee_id: String(userId), amount: String(Math.abs(amount).toFixed(2)), note: '' }); setShowSettleModal(true);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const totalYouOwe = balances.filter(b => b.you_owe).reduce((sum, b) => sum + b.amount, 0);
  const totalOwedToYou = balances.filter(b => b.they_owe).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      <div className="page-header"><h2>Settle Up</h2><p>View balances and settle debts</p></div>
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="label">Total You Owe</div><div className="value negative">-{formatCurrency(totalYouOwe, curr.symbol)}</div></div>
        <div className="stat-card"><div className="label">Total Owed to You</div><div className="value positive">+{formatCurrency(totalOwedToYou, curr.symbol)}</div></div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>Individual</button>
        <button className={`tab ${activeTab === 'simplified' ? 'active' : ''}`} onClick={() => setActiveTab('simplified')}>Simplified</button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
      </div>

      {activeTab === 'balances' && (
        <div className="card">
          {balances.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><h3>All settled up!</h3><p>No pending balances</p></div>
          ) : balances.map(b => (
            <div className="balance-item" key={b.userId}>
              <div className="user">
                <div className="avatar">{b.name?.charAt(0).toUpperCase()}</div>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.you_owe ? 'You owe them' : 'They owe you'}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`amount ${b.you_owe ? 'negative' : 'positive'}`}>{formatCurrency(b.amount, curr.symbol)}</div>
                <button className="btn btn-primary btn-sm" onClick={() => quickSettle(b.userId, b.you_owe ? -b.amount : b.amount)}>Settle</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'simplified' && (
        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Optimized Settlements</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Minimum transactions needed to settle all debts</p>
          {simplified.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><h3>No settlements needed</h3></div>
          ) : simplified.map((s, i) => (
            <div key={i} style={{ padding: 18, background: 'var(--bg-input)', borderRadius: 12, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar" style={{ width: 42, height: 42 }}>{s.from_name?.charAt(0).toUpperCase()}</div>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.from_name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>pays</div></div>
                <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>→</div>
                <div className="avatar" style={{ width: 42, height: 42 }}>{s.to_name?.charAt(0).toUpperCase()}</div>
                <div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.to_name}</div></div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>{formatCurrency(s.amount, curr.symbol)}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          {settlements.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>No settlement history</h3></div>
          ) : settlements.map(s => (
            <div key={s.id} style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{s.payer_name} paid {s.payee_name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(s.created_at).toLocaleDateString()}{s.group_name && ` · ${s.group_name}`}{s.note && ` · ${s.note}`}</div></div>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(s.amount, curr.symbol)}</div>
            </div>
          ))}
        </div>
      )}

      {showSettleModal && (
        <div className="modal-overlay" onClick={() => setShowSettleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Record Settlement</h3>
            <form onSubmit={settle}>
              <div className="input-group"><label>Pay To</label><select value={settleForm.payee_id} onChange={(e) => setSettleForm({ ...settleForm, payee_id: e.target.value })} required><option value="">Select person</option>{balances.map(b => <option key={b.userId} value={b.userId}>{b.name}</option>)}</select></div>
              <div className="input-group"><label>Amount ({curr.symbol})</label><input type="number" step="0.01" min="0" value={settleForm.amount} onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })} placeholder="0.00" required /></div>
              <div className="input-group"><label>Note (optional)</label><input type="text" value={settleForm.note} onChange={(e) => setSettleForm({ ...settleForm, note: e.target.value })} placeholder="e.g., Paid via Venmo" /></div>
              <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={() => setShowSettleModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Record Payment</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

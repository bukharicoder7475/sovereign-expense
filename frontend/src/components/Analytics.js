import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencyByCountryCode, formatCurrency } from '../utils/countries';

const COLORS = ['#6C5CE7', '#00cec9', '#fdcb6e', '#ff6b6b', '#a29bfe', '#55efc4', '#fab1a0', '#74b9ff'];

export default function Analytics() {
  const { user } = useAuth();
  const curr = getCurrencyByCountryCode(user?.country_code || '+92');
  const [report, setReport] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('report');
  const [emailModal, setEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [r, a] = await Promise.all([api.get('/analytics/monthly-report'), api.get('/analytics/ai-analysis')]);
      setReport(r); setAnalysis(a);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const sendEmail = async () => {
    try { await api.post('/email/send-expense-summary', { recipientEmail: email }); setEmailModal(false); setEmail(''); alert('Email sent!'); } catch (err) { alert('Failed to send email'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const categoryData = report?.category_breakdown ? Object.entries(report.category_breakdown).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })) : [];
  const monthlyData = analysis?.monthly_trend ? Object.entries(analysis.monthly_trend).map(([month, amount]) => ({ month, amount: Math.round(amount * 100) / 100 })) : [];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h2>Analytics</h2><p>Insights into your spending patterns</p></div>
        <button className="btn btn-primary" onClick={() => setEmailModal(true)}>📧 Email Report</button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>Monthly Report</button>
        <button className={`tab ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>AI Analysis</button>
      </div>

      {activeTab === 'report' && report && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <div className="stat-card"><div className="label">Total Spent</div><div className="value negative">{formatCurrency(report.total_spent || 0, curr.symbol)}</div></div>
            <div className="stat-card"><div className="label">Expenses</div><div className="value neutral">{report.total_expenses || 0}</div></div>
            <div className="stat-card"><div className="label">You Paid</div><div className="value positive">{formatCurrency(report.paid_by_me || 0, curr.symbol)}</div></div>
            <div className="stat-card"><div className="label">Your Share</div><div className="value">{formatCurrency(report.my_share || 0, curr.symbol)}</div></div>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 15 }}>Category Breakdown</h3>
              {categoryData.length > 0 ? (
                <div className="chart-container"><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => formatCurrency(v, curr.symbol)} /></PieChart></ResponsiveContainer></div>
              ) : <div className="empty-state" style={{ padding: 20 }}><p>No data available</p></div>}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 15 }}>Monthly Trend</h3>
              {monthlyData.length > 0 ? (
                <div className="chart-container"><ResponsiveContainer width="100%" height={300}><LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="month" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" /><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} /><Line type="monotone" dataKey="amount" stroke="#C0C0C0" strokeWidth={2} dot={{ fill: '#C0C0C0' }} /></LineChart></ResponsiveContainer></div>
              ) : <div className="empty-state" style={{ padding: 20 }}><p>No data available</p></div>}
            </div>
          </div>
        </>
      )}

      {activeTab === 'analysis' && analysis && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div className="stat-card"><div className="label">90-Day Spending</div><div className="value negative">{formatCurrency(analysis.total_spent || 0, curr.symbol)}</div></div>
            <div className="stat-card"><div className="label">Avg per Expense</div><div className="value neutral">{formatCurrency(analysis.avg_per_expense || 0, curr.symbol)}</div></div>
            <div className="stat-card"><div className="label">Total Expenses</div><div className="value">{analysis.total_expenses || 0}</div></div>
          </div>
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 15 }}>AI Insights</h3>
              <ul className="insights-list">{analysis.insights?.map((insight, i) => <li key={i}>{insight}</li>)}</ul>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 15 }}>Spending by Category (90 days)</h3>
              {Object.keys(analysis.category_breakdown || {}).length > 0 ? (
                <div className="chart-container"><ResponsiveContainer width="100%" height={300}><BarChart data={Object.entries(analysis.category_breakdown).map(([name, value]) => ({ name, amount: Math.round(value * 100) / 100 }))}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" stroke="var(--text-muted)" /><YAxis stroke="var(--text-muted)" /><Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} formatter={(v) => formatCurrency(v, curr.symbol)} /><Bar dataKey="amount" fill="#C0C0C0" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
              ) : <div className="empty-state" style={{ padding: 20 }}><p>No data available</p></div>}
            </div>
          </div>
        </>
      )}

      {emailModal && (
        <div className="modal-overlay" onClick={() => setEmailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Email Expense Report</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>Receive a detailed expense summary via email</p>
            <div className="input-group"><label>Recipient Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
            <div className="modal-actions"><button className="btn btn-outline" onClick={() => setEmailModal(false)}>Cancel</button><button className="btn btn-primary" onClick={sendEmail}>Send Report</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

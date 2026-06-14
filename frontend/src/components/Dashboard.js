import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getCurrencyByCountryCode, formatCurrency } from '../utils/countries';

const CATEGORIES = {
  Food: 'food', Transport: 'transport', Entertainment: 'entertainment', Utilities: 'utilities',
  Rent: 'rent', Groceries: 'groceries', 'Dining out': 'dining_out', Travel: 'travel',
  Shopping: 'shopping', Health: 'health', Education: 'education', Subscriptions: 'subscriptions',
  Gifts: 'gifts', General: 'general', Other: 'other'
};

const TIPS = [
  "Track every coffee — small expenses add up to big savings.",
  "Settle debts weekly to keep relationships healthy.",
  "Use groups to organize expenses by trip or household.",
  "Check your analytics monthly to spot spending patterns.",
  "Split bills immediately to avoid forgotten debts.",
  "Settle up before the end of each month for clarity."
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ totalOwed: 0, totalOwing: 0, netBalance: 0, totalExpenses: 0 });
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [animateStats, setAnimateStats] = useState(false);
  const curr = getCurrencyByCountryCode(user?.country_code || '+92');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceData, expenseData, groupData, notifData] = await Promise.all([
          api.get('/settlements/balances'),
          api.get('/expenses?limit=10'),
          api.get('/groups'),
          api.get('/notifications')
        ]);

        setBalances(balanceData);
        setRecentExpenses(expenseData.expenses || []);
        setGroups(groupData);
        setNotifications(notifData.notifications || []);

        const totalOwed = balanceData.filter(b => b.they_owe).reduce((sum, b) => sum + b.amount, 0);
        const totalOwing = balanceData.filter(b => b.you_owe).reduce((sum, b) => sum + b.amount, 0);

        setStats({
          totalOwed: Math.round(totalOwed * 100) / 100,
          totalOwing: Math.round(totalOwing * 100) / 100,
          netBalance: Math.round((totalOwed - totalOwing) * 100) / 100,
          totalExpenses: expenseData.total || 0
        });

        if (expenseData.expenses?.length === 0 && groupData.length === 0) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
      setTimeout(() => setAnimateStats(true), 100);
    };

    fetchData();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      {!user && localStorage.getItem('guest') === '1' && (
        <div className="guest-banner" style={{
          padding: '12px 16px', marginBottom: 16, background: 'linear-gradient(135deg, rgba(27,37,89,0.06) 0%, rgba(27,37,89,0.05) 100%)',
          border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>You're browsing as a <strong style={{ color: 'var(--text-primary)' }}>guest</strong>. Sign up to save your data.</div>
          <Link to="/login" className="btn btn-primary btn-sm" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap' }}>Sign Up Free</Link>
        </div>
      )}
      {showWelcome && (
        <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
          <div className="welcome-card" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <img src="/logo.svg" alt="Ledgerly" style={{ width: 64, height: 64, marginBottom: 16 }} />
              <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, marginBottom: 8 }}>WELCOME TO LEDGERLY</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>Your premium expense management platform.<br/>Start by creating a group or adding your first expense.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/groups" className="btn btn-primary" style={{ justifyContent: 'center', padding: 14 }} onClick={() => setShowWelcome(false)}>Create Your First Group</Link>
              <Link to="/expenses" className="btn btn-outline" style={{ justifyContent: 'center', padding: 14 }} onClick={() => setShowWelcome(false)}>Add an Expense</Link>
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Skip for now →</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div className="dashboard-greeting">
          <h2>{getGreeting()}, <span className="dashboard-user-name">{user?.name}</span></h2>
          <p>Here's your financial overview</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {unreadCount > 0 && (
            <Link to="/notifications" className="notification-badge" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              background: 'var(--accent-dim)', border: '1px solid var(--border)',
              borderRadius: 8, fontSize: 11, color: 'var(--text-primary)', textDecoration: 'none'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadCount}
            </Link>
          )}
        </div>
      </div>

      <div className={`stats-grid ${animateStats ? 'stats-animated' : ''}`}>
        <div className="stat-card-hero stat-positive">
          <div className="stat-card-hero-bg"></div>
          <div className="stat-card-hero-content">
            <div className="stat-card-hero-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div className="stat-card-hero-label">You're Owed</div>
            <div className="stat-card-hero-value">+{formatCurrency(stats.totalOwed, curr.symbol)}</div>
            <div className="stat-card-hero-sub">Money coming your way</div>
          </div>
        </div>

        <div className="stat-card-hero stat-negative">
          <div className="stat-card-hero-bg"></div>
          <div className="stat-card-hero-content">
            <div className="stat-card-hero-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            </div>
            <div className="stat-card-hero-label">You Owe</div>
            <div className="stat-card-hero-value">-{formatCurrency(stats.totalOwing, curr.symbol)}</div>
            <div className="stat-card-hero-sub">Outstanding balance</div>
          </div>
        </div>

        <div className="stat-card-hero stat-net">
          <div className="stat-card-hero-bg"></div>
          <div className="stat-card-hero-content">
            <div className="stat-card-hero-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div className="stat-card-hero-label">Net Balance</div>
            <div className={`stat-card-hero-value ${stats.netBalance >= 0 ? 'positive' : 'negative'}`}>
              {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(stats.netBalance), curr.symbol)}
            </div>
            <div className="stat-card-hero-sub">{stats.netBalance >= 0 ? 'You\'re ahead' : 'You\'re behind'}</div>
          </div>
        </div>

        <div className="stat-card-hero stat-groups">
          <div className="stat-card-hero-bg"></div>
          <div className="stat-card-hero-content">
            <div className="stat-card-hero-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div className="stat-card-hero-label">Groups</div>
            <div className="stat-card-hero-value">{groups.length}</div>
            <div className="stat-card-hero-sub">Active groups</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        <Link to="/expenses" className="quick-action" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div className="quick-action-icon">💸</div>
          <span>Add Expense</span>
        </Link>
        <Link to="/groups" className="quick-action" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div className="quick-action-icon">👥</div>
          <span>New Group</span>
        </Link>
        <Link to="/settle" className="quick-action" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div className="quick-action-icon">💳</div>
          <span>Settle Up</span>
        </Link>
        <Link to="/analytics" className="quick-action" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div className="quick-action-icon">📊</div>
          <span>Analytics</span>
        </Link>
        <Link to="/chat" className="quick-action" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <div className="quick-action-icon">💬</div>
          <span>Chat</span>
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: 18, display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card-bg)', flexWrap: 'wrap' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(46, 204, 113, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Your data is encrypted and secure</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>256-bit SSL encryption · SOC 2 compliant · GDPR ready</div>
        </div>
        <div className="security-pulse"></div>
      </div>

      <div className="dashboard-content-grid">
        <div className="dashboard-main-col">
          <div className="card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <Link to="/expenses" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="expense-list">
              {recentExpenses.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="icon" style={{ fontSize: 40 }}>✨</div>
                  <h3 style={{ fontSize: 16 }}>No expenses yet</h3>
                  <p style={{ fontSize: 13 }}>Add your first expense to start tracking</p>
                  <Link to="/expenses" className="btn btn-primary" style={{ marginTop: 16 }}>Add First Expense</Link>
                </div>
              ) : (
                recentExpenses.slice(0, 6).map((expense, i) => (
                  <div className="expense-item" key={expense.id} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="expense-icon">
                      {expense.category || 'General'}
                    </div>
                    <div className="expense-details">
                      <div className="description">{expense.description}</div>
                      <div className="meta">
                        Paid by {expense.paid_by_name}
                        {expense.group_name && <span> · {expense.group_name}</span>}
                        <span> · {new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="expense-amount">
                      <div className="amount">{formatCurrency(expense.amount, curr.symbol)}</div>
                      {expense.paid_by === user?.id ? (
                        <div className="you-paid">You paid</div>
                      ) : (
                        <div className="you-owe">You owe {formatCurrency(expense.amount / (expense.split_count || 1), curr.symbol)}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-side-col">
          <div className="card">
            <div className="card-header">
              <h3>Balances</h3>
              <Link to="/settle" className="btn btn-outline btn-sm">Settle</Link>
            </div>
            {balances.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>All settled up</p>
              </div>
            ) : (
              balances.slice(0, 4).map(b => (
                <div className="balance-item" key={b.userId}>
                  <div className="user">
                    <div className="avatar">{b.name?.charAt(0).toUpperCase()}</div>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>{b.name}</span>
                  </div>
                  <div className={`amount ${b.you_owe ? 'negative' : 'positive'}`}>
                    {b.you_owe ? `-${formatCurrency(b.amount, curr.symbol)}` : `+${formatCurrency(b.amount, curr.symbol)}`}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Groups</h3>
              <Link to="/groups" className="btn btn-outline btn-sm">View All</Link>
            </div>
            {groups.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 16px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No groups yet</p>
                <Link to="/groups" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Create Group</Link>
              </div>
            ) : (
              groups.slice(0, 3).map(group => (
                <Link to={`/groups/${group.id}`} key={group.id} className="group-list-item">
                  <div className="group-list-avatar">{group.name.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{group.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{group.member_count} members</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))
            )}
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>💡</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Tip of the Day</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

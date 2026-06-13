import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => { try { const d = await api.get('/notifications'); setNotifications(d.notifications || []); } catch (e) { console.error(e); } setLoading(false); };
  const markAsRead = async (id) => { try { await api.put(`/notifications/${id}/read`); setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)); } catch (e) { console.error(e); } };
  const markAllAsRead = async () => { try { await api.put('/notifications/read-all'); setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 }))); } catch (e) { console.error(e); } };
  const deleteNotification = async (id) => { try { await api.delete(`/notifications/${id}`); setNotifications(prev => prev.filter(n => n.id !== id)); } catch (e) { console.error(e); } };

  const getIcon = (type) => {
    switch (type) {
      case 'expense_added': return '💸';
      case 'settlement': return '💰';
      case 'contact_request': return '👤';
      case 'group_invite': return '👥';
      default: return '🔔';
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h2>Notifications</h2><p>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p></div>
        {unreadCount > 0 && <button className="btn btn-outline" onClick={markAllAsRead}>Mark All Read</button>}
      </div>
      <div className="card">
        {notifications.length === 0 ? (
          <div className="empty-state"><div className="icon">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
        ) : notifications.map(n => (
          <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`} onClick={() => !n.is_read && markAsRead(n.id)}>
            <div className="icon">{getIcon(n.type)}</div>
            <div className="content">
              <div className="title">{n.title}</div>
              <div className="message">{n.message}</div>
              <div className="time">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, fontSize: 16, borderRadius: 6, transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

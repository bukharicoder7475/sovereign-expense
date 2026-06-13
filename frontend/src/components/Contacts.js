import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [pending, setPending] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try { const [c, p] = await Promise.all([api.get('/contacts'), api.get('/contacts/pending')]); setContacts(c); setPending(p); } catch (e) { console.error(e); }
    setLoading(false);
  };

  const searchUsers = async (query) => {
    if (!query) return setSearchResults([]);
    try { const d = await api.get(`/auth/search?q=${query}`); setSearchResults(d.filter(u => !contacts.find(c => c.id === u.id))); } catch (e) { console.error(e); }
  };

  const addContact = async (userId) => { try { await api.post('/contacts', { contactId: userId }); setSearchResults([]); setSearchQuery(''); fetchContacts(); } catch (e) { console.error(e); } };
  const removeContact = async (contactId) => { if (!window.confirm('Remove this contact?')) return; try { await api.delete(`/contacts/${contactId}`); fetchContacts(); } catch (e) { console.error(e); } };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header"><h2>Contacts</h2><p>Manage your contacts for easy expense splitting</p></div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Add New Contact</h3>
        <div className="input-group" style={{ marginBottom: 0 }}><input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }} placeholder="Search by username or email..." /></div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {searchResults.map(user => (
              <div key={user.id} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 38, height: 38 }}>{user.name.charAt(0).toUpperCase()}</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div></div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => addContact(user.id)}>Add</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: 15 }}>Pending ({pending.length})</h3>
          {pending.map(req => (
            <div key={req.id} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: 10, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)' }}>
              <div className="avatar" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #fdcb6e, #e17055)' }}>{req.name?.charAt(0).toUpperCase()}</div>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{req.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.email}</div></div>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <h3 style={{ marginBottom: 14, fontSize: 15 }}>Your Contacts ({contacts.length})</h3>
        {contacts.length === 0 ? <div className="empty-state" style={{ padding: 20 }}><p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No contacts yet. Search above to add friends!</p></div> : contacts.map(contact => (
          <div key={contact.id} style={{ padding: '14px 16px', background: 'var(--bg-input)', borderRadius: 10, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar" style={{ width: 42, height: 42 }}>{contact.name.charAt(0).toUpperCase()}</div>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{contact.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{contact.email}</div></div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => removeContact(contact.id)} style={{ color: 'var(--danger)', borderColor: 'rgba(255,107,107,0.3)' }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

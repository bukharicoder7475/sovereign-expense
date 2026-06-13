import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', members: [] });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await api.get('/groups');
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 2) return setSearchResults([]);
    try {
      const data = await api.get(`/auth/search?q=${query}`);
      setSearchResults(data.filter(u => !newGroup.members.find(m => m.id === u.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = (member) => {
    setNewGroup({ ...newGroup, members: [...newGroup.members, member] });
    setSearchResults([]);
    setSearchQuery('');
  };

  const removeMember = (memberId) => {
    setNewGroup({ ...newGroup, members: newGroup.members.filter(m => m.id !== memberId) });
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;
    setError('');
    setCreating(true);

    try {
      await api.post('/groups', {
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        memberIds: newGroup.members.map(m => m.id)
      });
      setNewGroup({ name: '', description: '', members: [] });
      setShowModal(false);
      fetchGroups();
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
    setCreating(false);
  };

  const openModal = () => {
    setError('');
    setNewGroup({ name: '', description: '', members: [] });
    setSearchQuery('');
    setSearchResults([]);
    setShowModal(true);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2>Groups</h2>
          <p>Manage your shared expenses</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>+ New Group</button>
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">👥</div>
            <h3>No groups yet</h3>
            <p>Create a group to start splitting expenses with friends</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openModal}>Create Your First Group</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {groups.map(group => (
            <div className="group-card" key={group.id} onClick={() => navigate(`/groups/${group.id}`)}>
              <div className="group-header">
                <div className="group-avatar">{group.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="group-name">{group.name}</div>
                  <div className="group-members">{group.member_count} members</div>
                </div>
              </div>
              {group.description && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{group.description}</p>
              )}
              <div className="group-stats">
                <div className="group-stat">
                  <div className="label">Created</div>
                  <div className="value" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(group.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Group</h3>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(231, 76, 60, 0.1)', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#E74C3C' }}>
                {error}
              </div>
            )}
            <form onSubmit={createGroup}>
              <div className="input-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g., Roommates, Paris Trip"
                  required
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="What's this group for?"
                />
              </div>

              <div className="input-group">
                <label>Add Members</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Search by username or email"
                />
                {searchResults.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {searchResults.map(user => (
                      <div
                        key={user.id}
                        onClick={() => addMember(user)}
                        className="search-result-item"
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-silver)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000'
                        }}>{user.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {newGroup.members.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Members ({newGroup.members.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {newGroup.members.map(m => (
                      <span key={m.id} className="member-tag">
                        {m.name}
                        <span onClick={() => removeMember(m.id)} style={{ cursor: 'pointer', fontWeight: 700, marginLeft: 4 }}>×</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating || !newGroup.name.trim()}>
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

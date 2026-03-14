import { useState, useEffect } from 'react';
import api from '../utils/api';
import { CATEGORIES, getErrorMessage, timeAgo } from '../utils/helper';
import { Avatar, Badge, Button, Spinner, EmptyState, toast } from '../components/ui/Index';
import { useAuth } from '../context/AuthContext';

const ROLES   = ['member', 'manager', 'admin'];
const DOMAINS = ['tech', 'marketing', 'events', 'partnerships', 'media', 'operations', 'general'];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId]   = useState(null);
  const [editForm, setEditForm] = useState({ role:'member', domain:'general' });

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(res.data.data))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (u) => { setEditId(u._id); setEditForm({ role: u.role, domain: u.domain }); };
  const cancelEdit = () => setEditId(null);

  const saveEdit = async (id) => {
    try {
      const res = await api.patch(`/users/${id}/role`, editForm);
      setUsers(prev => prev.map(u => u._id === id ? res.data.data : u));
      toast.success('Role updated');
      setEditId(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      const res = await api.patch(`/users/${id}/deactivate`);
      setUsers(prev => prev.map(u => u._id === id ? res.data.data : u));
      toast.success('User deactivated');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const roleColor = { admin:'#f59e0b', manager:'#818cf8', member:'#9b9898' };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', marginTop:'6rem' }}><Spinner size={28} color="var(--accent)" /></div>;

  return (
    <div className="page-enter">
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>Users</h1>
        <p style={{ fontSize:'0.8rem', color:'var(--text-tertiary)', marginTop:'0.2rem' }}>{users.length} total members</p>
      </div>

      <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        {/* Header row */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 100px 120px 100px 80px', padding:'0.625rem 1.25rem', borderBottom:'1px solid var(--border-subtle)', fontSize:'0.72rem', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>
          <span>User</span><span>Role</span><span>Domain</span><span>Joined</span><span>Actions</span>
        </div>

        {users.length === 0 ? (
          <EmptyState icon="👥" title="No users yet" />
        ) : (
          users.map((u, i) => (
            <div key={u._id} style={{ display:'grid', gridTemplateColumns:'2fr 100px 120px 100px 80px', alignItems:'center', gap:'0.5rem', padding:'0.875rem 1.25rem', borderBottom: i < users.length-1 ? '1px solid var(--border-subtle)' : 'none', background: !u.isActive ? 'rgba(107,114,128,0.05)' : 'transparent', opacity: !u.isActive ? 0.6 : 1 }}>
              {/* User info */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', minWidth:0 }}>
                <Avatar user={u} size={34} />
                <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                    <span style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-primary)' }}>{u.name}</span>
                    {u._id === currentUser._id && <span style={{ fontSize:'0.68rem', color:'var(--accent)', fontFamily:'var(--font-mono)', fontWeight:600 }}>YOU</span>}
                    {!u.isActive && <span style={{ fontSize:'0.68rem', color:'#6b7280', fontFamily:'var(--font-mono)' }}>INACTIVE</span>}
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</div>
                </div>
              </div>

              {/* Role — editable */}
              {editId === u._id ? (
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role:e.target.value }))} style={{ fontSize:'0.78rem', padding:'0.3rem 0.5rem' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <span style={{ fontSize:'0.78rem', color: roleColor[u.role], fontFamily:'var(--font-mono)', fontWeight:600, textTransform:'uppercase' }}>{u.role}</span>
              )}

              {/* Domain — editable */}
              {editId === u._id ? (
                <select value={editForm.domain} onChange={e => setEditForm(p => ({ ...p, domain:e.target.value }))} style={{ fontSize:'0.78rem', padding:'0.3rem 0.5rem' }}>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <Badge label={CATEGORIES[u.domain]?.label || u.domain} color={CATEGORIES[u.domain]?.color} bg={CATEGORIES[u.domain]?.color+'15'} />
              )}

              {/* Joined */}
              <span style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>{timeAgo(u.createdAt)}</span>

              {/* Actions */}
              <div style={{ display:'flex', gap:'0.375rem' }}>
                {editId === u._id ? (
                  <>
                    <Button variant="primary" size="sm" onClick={() => saveEdit(u._id)} style={{ padding:'0.25rem 0.5rem', fontSize:'0.72rem' }}>✓</Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit} style={{ padding:'0.25rem 0.5rem', fontSize:'0.72rem' }}>✕</Button>
                  </>
                ) : (
                  <>
                    {u._id !== currentUser._id && u.isActive && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(u)} style={{ padding:'0.25rem 0.5rem', fontSize:'0.72rem' }}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => deactivate(u._id)} style={{ padding:'0.25rem 0.5rem', fontSize:'0.72rem' }}>✕</Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
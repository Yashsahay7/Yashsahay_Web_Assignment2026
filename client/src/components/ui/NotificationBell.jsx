import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { timeAgo } from '../../utils/helper';

const TYPE_ICONS = {
  query_assigned:  '📋',
  comment_added:   '💬',
  status_changed:  '🔄',
  query_created:   '✨',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen]           = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnread(res.data.unreadCount);
    } catch {}
    finally { setLoading(false); }
  };

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const handleClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    if (notif.query?._id) navigate(`/queries/${notif.query._id}`);
    setOpen(false);
  };

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        style={{ position:'relative', background:'none', border:'none', cursor:'pointer', padding:'0.4rem', borderRadius:'var(--radius-md)', color:'var(--text-secondary)', fontSize:'1.1rem', lineHeight:1, transition:'background 0.15s, color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='var(--bg-elevated)'; e.currentTarget.style.color='var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-secondary)'; }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{ position:'absolute', top:2, right:2, minWidth:16, height:16, borderRadius:8, background:'var(--accent)', color:'#000', fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', fontFamily:'var(--font-mono)', lineHeight:1 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:360, maxHeight:480, background:'var(--bg-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-lg)', zIndex:200, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.875rem 1rem', borderBottom:'1px solid var(--border-subtle)' }}>
            <span style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-primary)' }}>Notifications {unread > 0 && <span style={{ color:'var(--accent)' }}>({unread})</span>}</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize:'0.75rem', color:'var(--accent)', cursor:'pointer', background:'none', border:'none' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY:'auto', flex:1 }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-tertiary)', fontSize:'0.85rem' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding:'2.5rem 1rem', textAlign:'center', color:'var(--text-tertiary)', fontSize:'0.85rem' }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div key={n._id}
                  onClick={() => handleClick(n)}
                  style={{ display:'flex', gap:'0.75rem', padding:'0.875rem 1rem', borderBottom:'1px solid var(--border-subtle)', cursor: n.query ? 'pointer' : 'default', background: !n.read ? 'rgba(245,158,11,0.04)' : 'transparent', transition:'background 0.12s' }}
                  onMouseEnter={e => { if (n.query) e.currentTarget.style.background = n.read ? 'var(--bg-hover)' : 'rgba(245,158,11,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = !n.read ? 'rgba(245,158,11,0.04)' : 'transparent'; }}
                >
                  <span style={{ fontSize:'1.1rem', flexShrink:0, marginTop:2 }}>{TYPE_ICONS[n.type] || '📌'}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                      <span style={{ fontSize:'0.82rem', fontWeight: n.read ? 400 : 600, color:'var(--text-primary)', lineHeight:1.4 }}>{n.title}</span>
                      {!n.read && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flexShrink:0, marginTop:4 }} />}
                    </div>
                    <p style={{ fontSize:'0.78rem', color:'var(--text-tertiary)', marginTop:'0.2rem', lineHeight:1.5 }}>{n.message}</p>
                    <span style={{ fontSize:'0.7rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', marginTop:'0.25rem', display:'block' }}>{timeAgo(n.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Index';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: '▦',  roles: ['admin','manager','member'] },
  { to: '/queries',     label: 'All Queries',  icon: '◈',  roles: ['admin','manager','member'] },
  { to: '/queries/new', label: 'New Query',    icon: '+',  roles: ['admin','manager','member'] },
  { to: '/users',       label: 'Users',        icon: '⚙',  roles: ['admin'] },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const visible = navItems.filter(i => i.roles.includes(user?.role));

  const sidebarStyle = {
    width: 240,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  // Mobile overlay sidebar
  const mobileSidebarStyle = {
    ...sidebarStyle,
    position: 'fixed',
    left: mobileOpen ? 0 : -260,
    top: 0,
    transition: 'left 0.25s ease',
    boxShadow: mobileOpen ? 'var(--shadow-lg)' : 'none',
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }} />
      )}

      <aside style={window.innerWidth <= 768 ? mobileSidebarStyle : sidebarStyle}>
        {/* Logo */}
        <div style={{ padding:'1.5rem 1.25rem 1rem', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
            <div style={{ width:50, height:32, background:'var(--accent)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:'#000' }}>E-CELL</div>
            <div>
              <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>E-Cell Query Portal</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-tertiary)', letterSpacing:'0.02em' }}>IIT Bombay</div>
            </div>
          </div>
          {window.innerWidth <= 768 && (
            <button onClick={onClose} style={{ color:'var(--text-tertiary)', fontSize:'1.25rem', cursor:'pointer' }}>✕</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'1rem 0.75rem', display:'flex', flexDirection:'column', gap:2 }}>
          {visible.map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              style={({ isActive }) => ({
                display:'flex', alignItems:'center', gap:'0.625rem',
                padding:'0.575rem 0.75rem', borderRadius:'var(--radius-md)',
                fontSize:'0.875rem', fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                transition:'all 0.15s', textDecoration:'none',
              })}
            >
              <span style={{ fontSize:'0.8rem', opacity:0.8 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding:'1rem 0.75rem', borderTop:'1px solid var(--border-subtle)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 0.75rem', background:'var(--bg-tertiary)', borderRadius:'var(--radius-md)', border:'1px solid var(--border-subtle)', marginBottom:'0.5rem' }}>
            <Avatar user={user} size={32} />
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:'0.8rem', fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>{user?.role} · {user?.domain}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', borderRadius:'var(--radius-md)', fontSize:'0.8rem', color:'var(--text-tertiary)', background:'transparent', border:'none', cursor:'pointer', transition:'color 0.15s, background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-tertiary)'; e.currentTarget.style.background='transparent'; }}
          >
            <span>↩</span> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
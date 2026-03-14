import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from '../ui/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Index';

export default function AppLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      {!isMobile && <Sidebar mobileOpen={false} onClose={() => {}} />}
      {isMobile  && <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />}

      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent: isMobile ? 'space-between' : 'flex-end', padding:'0.75rem 1.5rem', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border-subtle)', position:'sticky', top:0, zIndex:50, gap:'1rem' }}>
          {isMobile && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <button onClick={() => setMobileOpen(true)} style={{ fontSize:'1.2rem', color:'var(--text-secondary)', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>☰</button>
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <div style={{ width:22, height:22, background:'var(--accent)', borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.55rem', fontWeight:700, color:'#000' }}>EC</div>
                <span style={{ fontSize:'0.85rem', fontWeight:600 }}>E-Cell Query Portal</span>
              </div>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <NotificationBell />
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Avatar user={user} size={28} />
              {!isMobile && <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:500 }}>{user?.name}</span>}
            </div>
          </div>
        </div>

        <main style={{ flex:1, padding: isMobile ? '1.25rem' : '2rem', overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
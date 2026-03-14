import { getInitials } from '../../utils/helper';

/* ============================================================
   Button
   variants: primary | secondary | ghost | danger
   ============================================================ */
export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  onClick, type = 'button', style = {}, className = '',
}) => {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s',
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
    ...(size === 'sm' ? { padding: '0.375rem 0.75rem', fontSize: '0.8rem' } : {}),
    ...(size === 'md' ? { padding: '0.625rem 1.25rem', fontSize: '0.875rem' } : {}),
    ...(size === 'lg' ? { padding: '0.875rem 1.75rem', fontSize: '1rem' } : {}),
    ...(variant === 'primary' ? {
      background: 'var(--accent)',
      color: '#000',
      borderColor: 'var(--accent)',
    } : {}),
    ...(variant === 'secondary' ? {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border-default)',
    } : {}),
    ...(variant === 'ghost' ? {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    } : {}),
    ...(variant === 'danger' ? {
      background: 'rgba(248,113,113,0.12)',
      color: '#f87171',
      borderColor: 'rgba(248,113,113,0.3)',
    } : {}),
    ...style,
  };

  return (
    <button type={type} style={styles} onClick={onClick} disabled={disabled || loading} className={className}>
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
};

/* ============================================================
   Badge — status, priority, category chips
   ============================================================ */
export const Badge = ({ label, color, bg, size = 'sm' }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: size === 'sm' ? '0.2rem 0.6rem' : '0.3rem 0.75rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
    color: color || 'var(--text-primary)',
    background: bg || 'var(--bg-elevated)',
    border: `1px solid ${color || 'var(--border-default)'}22`,
    whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

/* ============================================================
   Avatar — circular user icon with initials fallback
   ============================================================ */
export const Avatar = ({ user, size = 36 }) => {
  const initials = getInitials(user?.name);
  // Generate a stable color from the user's name
  const colors = ['#818cf8', '#f472b6', '#fb923c', '#34d399', '#60a5fa', '#a78bfa', '#f59e0b'];
  const idx = user?.name ? user.name.charCodeAt(0) % colors.length : 0;

  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <span style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `${colors[idx]}22`,
      border: `1px solid ${colors[idx]}44`,
      color: colors[idx],
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36,
      fontWeight: 600,
      flexShrink: 0,
      fontFamily: 'var(--font-sans)',
    }}>
      {initials}
    </span>
  );
};

/* ============================================================
   Spinner
   ============================================================ */
export const Spinner = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

/* ============================================================
   Empty state
   ============================================================ */
export const EmptyState = ({ icon = '📭', title, message, action }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-tertiary)',
  }}>
    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</span>
    <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>{title}</h3>
    {message && <p style={{ fontSize: '0.85rem', maxWidth: 360 }}>{message}</p>}
    {action && <div style={{ marginTop: '1.5rem' }}>{action}</div>}
  </div>
);

/* ============================================================
   Toast notification (simple, self-contained)
   ============================================================ */
let toastContainer = null;

export const toast = {
  show: (message, type = 'info') => {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(toastContainer);
    }

    const el = document.createElement('div');
    const colors = { success: '#34d399', error: '#f87171', info: '#60a5fa', warning: '#fb923c' };
    el.style.cssText = `
      background:#22222a;border:1px solid ${colors[type]}44;border-left:3px solid ${colors[type]};
      color:#f0ede8;padding:12px 18px;border-radius:10px;font-family:'DM Sans',sans-serif;
      font-size:0.875rem;max-width:340px;box-shadow:0 4px 16px rgba(0,0,0,0.5);
      animation:slideInRight 0.2s ease;
    `;
    el.textContent = message;

    const style = document.createElement('style');
    style.textContent = '@keyframes slideInRight{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(style);

    toastContainer.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3500);
  },
  success: (msg) => toast.show(msg, 'success'),
  error: (msg) => toast.show(msg, 'error'),
  info: (msg) => toast.show(msg, 'info'),
};
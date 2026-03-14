import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { STATUSES, PRIORITIES, CATEGORIES, timeAgo, getErrorMessage } from '../utils/helper';
import { Badge, Button, Avatar, Spinner, EmptyState } from '../components/ui/Index';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS   = ['open', 'in_progress', 'pending_info', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const CATEGORY_OPTIONS = ['tech', 'marketing', 'events', 'partnerships', 'media', 'operations', 'general'];

// Tabs only shown to managers
const MANAGER_TABS = [
  { key: 'assigned', label: 'Assigned to Me', icon: '📋' },
  { key: 'created',  label: 'Created by Me',  icon: '✏️' },
];

export default function QueriesPage() {
  const { isAdmin, isManager } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [queries, setQueries]         = useState([]);
  const [pagination, setPagination]   = useState({});
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState(isManager ? 'domain' : 'all');

  const [search,   setSearch]   = useState(searchParams.get('search')   || '');
  const [status,   setStatus]   = useState(searchParams.get('status')   || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [page,     setPage]     = useState(parseInt(searchParams.get('page') || '1'));

  const fetchQueries = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search)   params.set('search', search);
      if (status)   params.set('status', status);
      if (priority) params.set('priority', priority);
      if (category) params.set('category', category);
      // Managers always filter by tab (no "all domain" view anymore)
      if (isManager) params.set('view', activeTab);
      params.set('page', page);
      params.set('limit', 15);

      const res = await api.get('/queries?' + params);
      setQueries(res.data.data);
      setPagination(res.data.pagination);
      setSearchParams(params);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status, priority, category, page, activeTab]);

  useEffect(() => { fetchQueries(); }, [fetchQueries]);

  const switchTab = (key) => {
    setActiveTab(key);
    setSearch(''); setStatus(''); setPriority(''); setCategory(''); setPage(1);
  };

  const clearFilters = () => { setSearch(''); setStatus(''); setPriority(''); setCategory(''); setPage(1); };
  const hasFilters = search || status || priority || category;

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:600 }}>Queries</h1>
          {pagination.total !== undefined && (
            <p style={{ fontSize:'0.8rem', color:'var(--text-tertiary)', marginTop:'0.2rem' }}>{pagination.total} total</p>
          )}
        </div>
        <Link to="/queries/new"><Button variant="primary" size="sm">+ New Query</Button></Link>
      </div>

      {/* Manager tabs */}
      {isManager && (
        <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.25rem', background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'0.375rem' }}>
          {MANAGER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
                background: activeTab === tab.key ? 'var(--accent-muted)' : 'transparent',
                border: activeTab === tab.key ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', flexWrap:'wrap', gap:'0.75rem', alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label>Search</label>
          <div style={{ display:'flex', gap:'0.5rem' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && setPage(1)} placeholder="Search queries..." style={{ margin:0 }} />
            <Button variant="secondary" size="sm" onClick={() => setPage(1)} style={{ flexShrink:0 }}>Go</Button>
          </div>
        </div>
        <div style={{ minWidth:140 }}>
          <label>Status</label>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUSES[s]?.label}</option>)}
          </select>
        </div>
        <div style={{ minWidth:130 }}>
          <label>Priority</label>
          <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}>
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITIES[p]?.label}</option>)}
          </select>
        </div>
        {isAdmin && (
          <div style={{ minWidth:140 }}>
            <label>Category</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{CATEGORIES[c]?.label}</option>)}
            </select>
          </div>
        )}
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} style={{ alignSelf:'flex-end', marginBottom:2 }}>✕ Clear</Button>}
      </div>

      {error && <div style={{ background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:'var(--radius-md)', padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#f87171' }}>{error}</div>}

      {/* Table */}
      <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}><Spinner size={28} color="var(--accent)" /></div>
        ) : queries.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No queries found"
            message={
              hasFilters ? 'Try adjusting your filters.' :
              activeTab === 'domain'  ? 'No queries in your domain yet.' :
              activeTab === 'created' ? "You haven't created any queries yet." :
              'No queries yet.'
            }
            action={!hasFilters && <Link to="/queries/new"><Button variant="primary" size="sm">+ New Query</Button></Link>}
          />
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 110px 90px 120px 140px 80px', padding:'0.625rem 1.25rem', borderBottom:'1px solid var(--border-subtle)', fontSize:'0.72rem', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>
              <span>Title</span><span>Category</span><span>Priority</span><span>Status</span>
              {/* Column header changes based on active tab */}
              <span>{activeTab === 'created' ? 'Assigned to' : 'Submitted by'}</span>
              <span>Created</span>
            </div>

            {queries.map((q, i) => {
              const st  = STATUSES[q.status];
              const pr  = PRIORITIES[q.priority];
              const cat = CATEGORIES[q.category];

              return (
                <Link key={q._id} to={`/queries/${q._id}`}
                  style={{ display:'grid', gridTemplateColumns:'2fr 110px 90px 120px 140px 80px', alignItems:'center', padding:'0.875rem 1.25rem', borderBottom: i < queries.length-1 ? '1px solid var(--border-subtle)' : 'none', textDecoration:'none', transition:'background 0.12s', gap:'0.5rem' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:pr?.color, flexShrink:0 }} />
                      <span style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{q.title}</span>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', paddingLeft:'1rem' }}>
                      by {q.createdBy?.name} · {q.comments?.length || 0} comments
                    </div>
                  </div>
                  <Badge label={cat?.label} color={cat?.color} bg={cat?.color+'15'} />
                  <span style={{ fontSize:'0.78rem', color:pr?.color, fontFamily:'var(--font-mono)', fontWeight:600 }}>{pr?.label}</span>
                  <Badge label={st?.label} color={st?.color} bg={st?.bg} />
                  {q.assignedTo?.length > 0 ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      {/* Show up to 3 avatars stacked */}
                      <div style={{ display:'flex' }}>
                        {q.assignedTo.slice(0, 3).map((a, idx) => (
                          <div key={a._id || idx} style={{ marginLeft: idx > 0 ? -8 : 0, zIndex: 3 - idx }}>
                            <Avatar user={a} size={22} />
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {q.assignedTo.length === 1
                          ? q.assignedTo[0].name
                          : `${q.assignedTo[0].name} +${q.assignedTo.length - 1}`}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize:'0.78rem', color:'var(--text-tertiary)' }}>
                      {activeTab === 'created' ? 'Unassigned' : '—'}
                    </span>
                  )}
                  <span style={{ fontSize:'0.75rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>{timeAgo(q.createdAt)}</span>
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'1.25rem' }}>
          <Button variant="secondary" size="sm" onClick={() => setPage(p=>p-1)} disabled={page<=1}>← Prev</Button>
          <span style={{ fontSize:'0.8rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', padding:'0 0.5rem' }}>{page} / {pagination.totalPages}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p=>p+1)} disabled={page>=pagination.totalPages}>Next →</Button>
        </div>
      )}
    </div>
  );
}

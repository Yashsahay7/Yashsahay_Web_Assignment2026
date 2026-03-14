import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { STATUSES, PRIORITIES, CATEGORIES, timeAgo, formatFileSize, getErrorMessage } from '../utils/helper';
import { Badge, Button, Avatar, Spinner, EmptyState, toast } from '../components/ui/Index';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS   = ['open', 'in_progress', 'pending_info', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

export default function QueryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, canManage, isAdmin } = useAuth();

  const [query, setQuery]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [comment, setComment]     = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [managers, setManagers]   = useState([]);
  const [updating, setUpdating]   = useState(false);
  const commentsEndRef = useRef(null);

  const fetchQuery = async () => {
    try {
      const res = await api.get(`/queries/${id}`);
      setQuery(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await api.get('/users/managers');
      setManagers(res.data.data);
    } catch {}
  };

  useEffect(() => {
    fetchQuery();
    if (canManage) fetchManagers();
  }, [id]);

  // Scroll to bottom of comments on load
  useEffect(() => {
    if (query) commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [query?.comments?.length]);

  const handleUpdate = async (field, value) => {
    setUpdating(true);
    try {
      const body = { [field]: value };
      if (field === 'status') body.note = `Status changed to ${STATUSES[value]?.label}`;
      const res = await api.patch(`/queries/${id}`, body);
      // Replace the full query object — shallow merge breaks nested arrays like assignedTo
      setQuery(res.data.data);
      toast.success('Updated successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      const res = await api.post(`/queries/${id}/comments`, { text: comment.trim(), isInternal });
      setQuery(prev => ({ ...prev, comments: [...(prev.comments || []), res.data.data] }));
      setComment('');
      setIsInternal(false);
      toast.success('Comment added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this query permanently?')) return;
    try {
      await api.delete(`/queries/${id}`);
      toast.success('Query deleted');
      navigate('/queries');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', marginTop:'6rem' }}><Spinner size={28} color="var(--accent)" /></div>;
  if (error)   return <div style={{ padding:'2rem', color:'#f87171' }}>{error}</div>;
  if (!query)  return null;

  const status   = STATUSES[query.status];
  const priority = PRIORITIES[query.priority];
  const category = CATEGORIES[query.category];
  const isResolved = ['resolved', 'closed'].includes(query.status);

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem', fontSize:'0.85rem' }}>
        <Link to="/queries" style={{ color:'var(--text-tertiary)' }}>Queries</Link>
        <span style={{ color:'var(--text-tertiary)' }}>›</span>
        <span style={{ color:'var(--text-secondary)', maxWidth:300, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{query.title}</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'1.5rem', alignItems:'start' }}>
        {/* LEFT — main content */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* Query header card */}
          <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', marginBottom:'1rem' }}>
              <div style={{ flex:1 }}>
                <h1 style={{ fontSize:'1.25rem', fontWeight:600, color:'var(--text-primary)', lineHeight:1.4, marginBottom:'0.625rem' }}>{query.title}</h1>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', alignItems:'center' }}>
                  <Badge label={status?.label} color={status?.color} bg={status?.bg} />
                  <Badge label={priority?.label} color={priority?.color} bg={priority?.color+'15'} />
                  <Badge label={category?.label} color={category?.color} bg={category?.color+'15'} />
                </div>
              </div>
              {isAdmin && (
                <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
              )}
            </div>

            <p style={{ fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:1.75, whiteSpace:'pre-wrap', borderTop:'1px solid var(--border-subtle)', paddingTop:'1rem' }}>
              {query.description}
            </p>

            {/* Meta */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'1.5rem', marginTop:'1rem', paddingTop:'1rem', borderTop:'1px solid var(--border-subtle)', fontSize:'0.8rem', color:'var(--text-tertiary)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Avatar user={query.createdBy} size={22} />
                <span>Submitted by <strong style={{ color:'var(--text-secondary)' }}>{query.createdBy?.name}</strong></span>
              </div>
              <span>Created {timeAgo(query.createdAt)}</span>
              {query.resolvedAt && <span>Resolved {timeAgo(query.resolvedAt)}</span>}
            </div>
          </div>

          {/* Attachments */}
          {query.attachments?.length > 0 && (
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1.25rem 1.5rem' }}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.875rem', fontFamily:'var(--font-mono)' }}>
                Attachments ({query.attachments.length})
              </h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {query.attachments.map((att, i) => (
                  <a key={i} href={att.url} target="_blank" rel="noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', background:'var(--bg-tertiary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', textDecoration:'none', transition:'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-subtle)'}
                  >
                    <span style={{ fontSize:'1.1rem' }}>{att.mimetype?.startsWith('image/') ? '🖼️' : '📄'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.8rem', fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{att.filename}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-tertiary)' }}>{formatFileSize(att.size)}</div>
                    </div>
                    <span style={{ fontSize:'0.75rem', color:'var(--accent)' }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments / Discussion */}
          <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
            <div style={{ padding:'1rem 1.5rem', borderBottom:'1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize:'0.85rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)' }}>
                Discussion ({query.comments?.length || 0})
              </h3>
            </div>

            {/* Comment list */}
            <div style={{ padding:'0.5rem 0' }}>
              {!query.comments?.length ? (
                <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-tertiary)', fontSize:'0.85rem' }}>No comments yet. Be the first to add one.</div>
              ) : (
                query.comments.map((c, i) => (
                  <div key={c._id || i} style={{
                    padding:'1rem 1.5rem',
                    borderBottom: i < query.comments.length-1 ? '1px solid var(--border-subtle)' : 'none',
                    background: c.isInternal ? 'rgba(245,158,11,0.04)' : 'transparent',
                    borderLeft: c.isInternal ? '3px solid var(--accent)' : '3px solid transparent',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.5rem' }}>
                      <Avatar user={c.author} size={28} />
                      <div>
                        <span style={{ fontSize:'0.85rem', fontWeight:500, color:'var(--text-primary)' }}>{c.author?.name}</span>
                        <span style={{ fontSize:'0.72rem', color:'var(--text-tertiary)', marginLeft:'0.5rem', fontFamily:'var(--font-mono)' }}>{c.author?.role}</span>
                        {c.isInternal && <span style={{ marginLeft:'0.5rem', fontSize:'0.7rem', color:'var(--accent)', fontFamily:'var(--font-mono)', fontWeight:600 }}>INTERNAL</span>}
                      </div>
                      <span style={{ marginLeft:'auto', fontSize:'0.72rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)' }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap', paddingLeft:'2.25rem' }}>{c.text}</p>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Add comment form */}
            {!isResolved && (
              <form onSubmit={handleComment} style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border-subtle)', background:'var(--bg-tertiary)' }}>
                <div style={{ display:'flex', gap:'0.625rem', alignItems:'flex-start' }}>
                  <Avatar user={user} size={32} />
                  <div style={{ flex:1 }}>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Add a comment..."
                      style={{ minHeight:80, marginBottom:'0.625rem', resize:'vertical' }}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleComment(e); }}
                    />
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      {canManage && (
                        <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', textTransform:'none', fontSize:'0.8rem', color:'var(--text-tertiary)', fontWeight:400 }}>
                          <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} style={{ width:'auto', cursor:'pointer' }} />
                          Internal note (hidden from members)
                        </label>
                      )}
                      <div style={{ marginLeft:'auto' }}>
                        <Button variant="primary" size="sm" type="submit" loading={commentLoading} disabled={!comment.trim()}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
            {isResolved && (
              <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border-subtle)', textAlign:'center', fontSize:'0.8rem', color:'var(--text-tertiary)' }}>
                This query is {query.status}. Reopen it to add comments.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Status & actions — managers/admins only */}
          {canManage && (
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1.25rem' }}>
              <h3 style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)', marginBottom:'0.875rem' }}>Manage</h3>

              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                <div>
                  <label style={{ fontSize:'0.75rem', marginBottom:'0.3rem' }}>Status</label>
                  <select value={query.status} onChange={e => handleUpdate('status', e.target.value)} disabled={updating} style={{ fontSize:'0.85rem' }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUSES[s]?.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:'0.75rem', marginBottom:'0.3rem' }}>Priority</label>
                  <select value={query.priority} onChange={e => handleUpdate('priority', e.target.value)} disabled={updating} style={{ fontSize:'0.85rem' }}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITIES[p]?.label}</option>)}
                  </select>
                </div>
                {isAdmin && (
                <div>
                  <label style={{ fontSize:'0.75rem', marginBottom:'0.5rem' }}>Assigned to</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:160, overflowY:'auto' }}>
                    {managers.length === 0 && <span style={{ fontSize:'0.78rem', color:'var(--text-tertiary)' }}>No managers found</span>}
                    {managers.map(m => {
                      const isChecked = (query.assignedTo || []).some(a => {
                        const id = a?._id ? a._id.toString() : a?.toString();
                        return id === m._id.toString();
                      });
                      return (
                        <label key={m._id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor: updating ? 'not-allowed' : 'pointer', textTransform:'none', fontSize:'0.8rem', fontWeight:400, color:'var(--text-secondary)', padding:'0.3rem 0.4rem', borderRadius:'var(--radius-sm)', background: isChecked ? 'var(--accent-muted)' : 'transparent', border: isChecked ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent', transition:'all 0.15s' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={updating}
                            style={{ width:'auto', cursor: updating ? 'not-allowed' : 'pointer', accentColor:'var(--accent)' }}
                            onChange={() => {
                              const currentIds = (query.assignedTo || []).map(a => (a._id || a)?.toString());
                              const newIds = isChecked
                                ? currentIds.filter(aid => aid !== m._id.toString())
                                : [...currentIds, m._id];
                              handleUpdate('assignedTo', newIds);
                            }}
                          />
                          <Avatar user={m} size={20} />
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</span>
                          <span style={{ marginLeft:'auto', fontSize:'0.68rem', color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{m.domain}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Query details */}
          <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1.25rem' }}>
            <h3 style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)', marginBottom:'0.875rem' }}>Details</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.82rem' }}>
              {[
                { label:'Category', value: <Badge label={category?.label} color={category?.color} bg={category?.color+'15'} /> },
                { label:'Status',   value: <Badge label={status?.label} color={status?.color} bg={status?.bg} /> },
                { label:'Priority', value: <span style={{ color:priority?.color, fontWeight:600, fontFamily:'var(--font-mono)' }}>{priority?.label}</span> },
                { label:'Created',  value: <span style={{ color:'var(--text-secondary)', fontFamily:'var(--font-mono)', fontSize:'0.75rem' }}>{new Date(query.createdAt).toLocaleDateString('en-IN')}</span> },
                { label:'Comments', value: <span style={{ color:'var(--text-secondary)' }}>{query.comments?.length || 0}</span> },
                { label:'Files',    value: <span style={{ color:'var(--text-secondary)' }}>{query.attachments?.length || 0}</span> },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:'0.75rem', borderBottom:'1px solid var(--border-subtle)' }}>
                  <span style={{ color:'var(--text-tertiary)' }}>{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>

          {/* Status history */}
          {query.statusHistory?.length > 0 && (
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1.25rem' }}>
              <h3 style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:'var(--font-mono)', marginBottom:'0.875rem' }}>History</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {[...query.statusHistory].reverse().map((h, i) => (
                  <div key={i} style={{ fontSize:'0.78rem', paddingBottom:'0.625rem', borderBottom:'1px solid var(--border-subtle)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.2rem' }}>
                      <Badge label={STATUSES[h.status]?.label || h.status} color={STATUSES[h.status]?.color} bg={STATUSES[h.status]?.bg} size="xs" />
                      <span style={{ color:'var(--text-tertiary)', fontFamily:'var(--font-mono)', fontSize:'0.72rem' }}>{timeAgo(h.changedAt)}</span>
                    </div>
                    {h.changedBy && <div style={{ color:'var(--text-tertiary)', fontSize:'0.72rem' }}>by {h.changedBy?.name || 'System'}</div>}
                    {h.note && <div style={{ color:'var(--text-tertiary)', fontStyle:'italic', marginTop:'0.2rem' }}>{h.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

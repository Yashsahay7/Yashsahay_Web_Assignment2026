import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { CATEGORIES, PRIORITIES, getErrorMessage, formatFileSize } from '../utils/helper';
import { Button, toast } from '../components/ui/Index';

export default function NewQueryPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title:'', description:'', category:'tech', priority:'medium' });
  const [files, setFiles]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.length < 5)       e.title = 'Title must be at least 5 characters';
    if (!form.description.trim() || form.description.length < 10) e.description = 'Description must be at least 10 characters';
    if (!form.category) e.category = 'Please select a category';
    return e;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    const valid = selected.filter(f => f.size <= 10*1024*1024);
    if (valid.length < selected.length) toast.error('Some files exceed 10MB and were skipped.');
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('priority', form.priority);
      files.forEach(f => fd.append('attachments', f));

      const res = await api.post('/queries', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Query submitted successfully!');
      navigate(`/queries/${res.data.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const charCount = form.description.length;

  return (
    <div className="page-enter" style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ marginBottom:'1.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.375rem' }}>
          <Link to="/queries" style={{ color:'var(--text-tertiary)', fontSize:'0.85rem' }}>Queries</Link>
          <span style={{ color:'var(--text-tertiary)' }}>›</span>
          <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>New query</span>
        </div>
        <h1 style={{ fontSize:'1.4rem', fontWeight:600, color:'var(--text-primary)' }}>Submit a query</h1>
        <p style={{ fontSize:'0.85rem', color:'var(--text-tertiary)', marginTop:'0.25rem' }}>
          Describe your issue clearly so it can be routed to the right team.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-lg)', padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* Title */}
          <div className="form-group" style={{ margin:0 }}>
            <label>Title <span style={{ color:'#f87171' }}>*</span></label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="Brief summary of the issue" maxLength={150} />
            {errors.title && <div className="form-error">{errors.title}</div>}
            <div style={{ fontSize:'0.72rem', color:'var(--text-tertiary)', marginTop:'0.25rem', textAlign:'right' }}>{form.title.length}/150</div>
          </div>

          {/* Category + Priority row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="form-group" style={{ margin:0 }}>
              <label>Category <span style={{ color:'#f87171' }}>*</span></label>
              <select name="category" value={form.category} onChange={handleChange}>
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
              {errors.category && <div className="form-error">{errors.category}</div>}
            </div>
            <div className="form-group" style={{ margin:0 }}>
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {Object.entries(PRIORITIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group" style={{ margin:0 }}>
            <label>Description <span style={{ color:'#f87171' }}>*</span></label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail. Include steps to reproduce, screenshots context, or any relevant information..."
              maxLength={5000}
              style={{ minHeight:160 }}
            />
            {errors.description && <div className="form-error">{errors.description}</div>}
            <div style={{ fontSize:'0.72rem', color: charCount > 4800 ? '#fb923c' : 'var(--text-tertiary)', marginTop:'0.25rem', textAlign:'right' }}>{charCount}/5000</div>
          </div>

          {/* File attachments */}
          <div>
            <label>Attachments <span style={{ color:'var(--text-tertiary)', fontWeight:400, textTransform:'none', fontSize:'0.75rem' }}>— optional, max 5 files, 10MB each</span></label>
            <label htmlFor="file-upload" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem',
              padding:'1.5rem', borderRadius:'var(--radius-md)',
              border:'1.5px dashed var(--border-strong)',
              background:'var(--bg-tertiary)',
              cursor:'pointer', transition:'border-color 0.15s, background 0.15s',
              textTransform:'none', fontSize:'0.875rem', fontWeight:400, color:'var(--text-secondary)',
              marginBottom: files.length ? '0.75rem' : 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-muted)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-strong)'; e.currentTarget.style.background='var(--bg-tertiary)'; }}
            >
              <span style={{ fontSize:'1.5rem' }}>📎</span>
              <div>
                <div style={{ fontWeight:500, color:'var(--text-primary)' }}>Click to attach files</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-tertiary)', marginTop:'0.2rem' }}>Images, PDF, DOC, TXT</div>
              </div>
            </label>
            <input id="file-upload" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFiles} style={{ display:'none' }} />

            {files.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', background:'var(--bg-tertiary)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)' }}>
                    <span style={{ fontSize:'1rem' }}>{f.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.8rem', fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{f.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-tertiary)' }}>{formatFileSize(f.size)}</div>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} style={{ color:'var(--text-tertiary)', fontSize:'1rem', cursor:'pointer', background:'none', border:'none', padding:'0.25rem', borderRadius:4 }}
                      onMouseEnter={e => e.currentTarget.style.color='#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--text-tertiary)'}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
          <Link to="/queries"><Button variant="secondary" type="button">Cancel</Button></Link>
          <Button variant="primary" type="submit" loading={loading}>Submit Query</Button>
        </div>
      </form>
    </div>
  );
}
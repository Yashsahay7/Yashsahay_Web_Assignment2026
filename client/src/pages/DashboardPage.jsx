import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { STATUSES, PRIORITIES, CATEGORIES, timeAgo } from '../utils/helper';
import { Badge, Spinner, EmptyState, Button } from '../components/ui/Index';

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'border-color 0.2s',
  }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
  >
    <div style={{
      width: 44, height: 44, borderRadius: 'var(--radius-md)',
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.25rem', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.75rem', fontWeight: 600, color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, canManage } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, queriesRes] = await Promise.all([
          api.get('/queries/stats'),
          api.get('/queries?limit=5'),
        ]);
        setStats(statsRes.data.data);
        setRecentQueries(queriesRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusCount = (status) => {
    return stats?.byStatus?.find((s) => s._id === status)?.count || 0;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6rem' }}>
        <Spinner size={28} color="var(--accent)" />
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
          Here's what's happening in the portal today.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total queries" value={stats?.total || 0} color="var(--text-secondary)" icon="◈" />
        <StatCard label="Open" value={getStatusCount('open')} color="var(--status-open)" icon="○" />
        <StatCard label="In progress" value={getStatusCount('in_progress')} color="var(--status-in-progress)" icon="◑" />
        <StatCard label="Resolved" value={getStatusCount('resolved')} color="var(--status-resolved)" icon="●" />
      </div>

      {/* Recent queries */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>Recent queries</h2>
          <Link to="/queries">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>

        {recentQueries.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No queries yet"
            message="Queries will appear here once they've been submitted."
            action={<Link to="/queries/new"><Button variant="primary" size="sm">+ New Query</Button></Link>}
          />
        ) : (
          <div>
            {recentQueries.map((q, i) => {
              const status = STATUSES[q.status];
              const priority = PRIORITIES[q.priority];
              const category = CATEGORIES[q.category];
              return (
                <Link
                  key={q._id}
                  to={`/queries/${q._id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: i < recentQueries.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.15s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Priority dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: priority?.color, flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {q.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {q.createdBy?.name} · {timeAgo(q.createdAt)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <Badge label={category?.label} color={category?.color} bg={`${category?.color}15`} />
                    <Badge label={status?.label} color={status?.color} bg={status?.bg} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
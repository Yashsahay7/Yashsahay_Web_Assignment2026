// Query categories and their display labels
export const CATEGORIES = {
  tech:          { label: 'Technology',    color: 'var(--cat-tech)' },
  marketing:     { label: 'Marketing',     color: 'var(--cat-marketing)' },
  events:        { label: 'Events',        color: 'var(--cat-events)' },
  partnerships:  { label: 'Partnerships',  color: 'var(--cat-partnerships)' },
  media:         { label: 'Media',         color: 'var(--cat-media)' },
  operations:    { label: 'Operations',    color: 'var(--cat-operations)' },
  general:       { label: 'General',       color: 'var(--cat-general)' },
};

export const STATUSES = {
  open:         { label: 'Open',         color: 'var(--status-open)',        bg: 'var(--status-open-bg)' },
  in_progress:  { label: 'In Progress',  color: 'var(--status-in-progress)', bg: 'var(--status-in-progress-bg)' },
  pending_info: { label: 'Pending Info', color: 'var(--status-pending)',     bg: 'var(--status-pending-bg)' },
  resolved:     { label: 'Resolved',     color: 'var(--status-resolved)',    bg: 'var(--status-resolved-bg)' },
  closed:       { label: 'Closed',       color: 'var(--status-closed)',      bg: 'var(--status-closed-bg)' },
};

export const PRIORITIES = {
  low:      { label: 'Low',      color: 'var(--priority-low)' },
  medium:   { label: 'Medium',   color: 'var(--priority-medium)' },
  high:     { label: 'High',     color: 'var(--priority-high)' },
  critical: { label: 'Critical', color: 'var(--priority-critical)' },
};

// Format a date string to relative time (e.g. "2 hours ago")
export const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Format file size bytes to human readable
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Get initials from name for avatar placeholder
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

// Extract error message from axios error
export const getErrorMessage = (err) => {
  return err.response?.data?.message
    || err.response?.data?.errors?.[0]?.msg
    || err.message
    || 'Something went wrong';
};
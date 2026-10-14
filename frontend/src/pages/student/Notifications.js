import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TYPE_ICON = { match: '🎯', contact: '📬', handover: '📅', returned: '🎉', info: '📋', admin: '🔧', warning: '⚠️' };
const TYPE_BG = { match: '#dbeafe', contact: '#fef3c7', handover: '#dcfce7', returned: '#dcfce7', info: '#f3f4f6', admin: '#fce7f3', warning: '#fef3c7' };
const TYPE_COLOR = { match: '#1d4ed8', contact: '#b45309', handover: '#15803d', returned: '#15803d', info: '#374151', admin: '#9d174d', warning: '#b45309' };

export default function Notifications() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications?limit=60');
      setNotifs(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async id => {
    await api.put(`/notifications/${id}/read`).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read');
  };

  const handleClick = notif => {
    if (!notif.is_read) markRead(notif.id);
    if (notif.related_type === 'match' && notif.related_id) navigate(`/matches/${notif.related_id}`);
  };

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🔔 Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={markAllRead}>✓ Mark All Read</button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>No Notifications Yet</h3>
          <p>Notifications about matches, contact requests, and handovers will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => handleClick(n)}
              style={{
                background: n.is_read ? 'white' : '#eff6ff',
                border: `1px solid ${n.is_read ? '#e5e7eb' : '#bfdbfe'}`,
                borderRadius: 12, padding: '1rem 1.25rem',
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                cursor: n.related_id ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: TYPE_BG[n.type] || '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
              }}>
                {TYPE_ICON[n.type] || '📋'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.9rem', marginBottom: '0.2rem', color: TYPE_COLOR[n.type] || '#374151' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5 }}>{n.message}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                  {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {n.related_id && <span style={{ marginLeft: '0.5rem', color: '#2563eb' }}>→ View</span>}
                </div>
              </div>
              {!n.is_read && (
                <div style={{ width: 10, height: 10, background: '#2563eb', borderRadius: '50%', marginTop: 4, flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

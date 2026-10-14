import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STAT_CARDS = [
  { key: 'my_lost_items', label: 'My Lost Items', icon: '🔍', color: '#fee2e2', iconBg: '#fca5a5', link: '/my-reports' },
  { key: 'my_found_items', label: 'My Found Items', icon: '📦', color: '#dcfce7', iconBg: '#86efac', link: '/my-reports' },
  { key: 'possible_matches', label: 'Possible Matches', icon: '🎯', color: '#dbeafe', iconBg: '#93c5fd', link: '/matches' },
  { key: 'returned_items', label: 'Returned Items', icon: '✅', color: '#f0fdf4', iconBg: '#4ade80', link: '/my-reports' },
];

const statusBadge = (status) => {
  const map = {
    active: { cls: 'badge-success', text: '🟢 Active' },
    possible_match: { cls: 'badge-primary', text: '🎯 Match Found' },
    matched: { cls: 'badge-primary', text: '🤝 Matched' },
    returned: { cls: 'badge-success', text: '✅ Returned' },
    pending: { cls: 'badge-warning', text: '⏳ Pending' },
    closed: { cls: 'badge-gray', text: '❌ Closed' },
    owner_contacted: { cls: 'badge-info', text: '📬 Contacted' },
  };
  const b = map[status] || { cls: 'badge-gray', text: status };
  return <span className={`badge ${b.cls}`}>{b.text}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/users/dashboard');
        setData(res.data.dashboard);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>
          👋 Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          {user?.department} • {user?.student_id} • Here's your portal overview
        </p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <Link to="/report-lost" className="btn btn-danger">📋 Report Lost Item</Link>
        <Link to="/report-found" className="btn btn-success">📦 Report Found Item</Link>
        <Link to="/lost-items" className="btn btn-outline">🔍 Search Items</Link>
        <Link to="/matches" className="btn btn-outline">🎯 My Matches</Link>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {STAT_CARDS.map(card => (
          <div key={card.key} className="stat-card" style={{ cursor: 'pointer', borderLeft: `4px solid ${card.iconBg}` }}
            onClick={() => navigate(card.link)}>
            <div className="stat-icon" style={{ background: card.color }}>
              <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{data?.stats?.[card.key] ?? 0}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid-2">
        {/* Recent Lost Items */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">🔍 My Recent Lost Reports</span>
            <Link to="/my-reports" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {!data?.recent_lost?.length ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">📋</div>
                <p>No lost item reports yet</p>
                <Link to="/report-lost" className="btn btn-primary btn-sm">Report Lost Item</Link>
              </div>
            ) : (
              <div>
                {data.recent_lost.map(item => (
                  <div key={item.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => navigate(`/item/lost/${item.id}`)} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.item_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                        📍 {item.building} • {new Date(item.lost_date).toLocaleDateString()}
                      </div>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Matches */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">🎯 Active Matches</span>
            <Link to="/matches" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {!data?.active_matches?.length ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">🎯</div>
                <p>No matches yet. Report your lost items to find matches.</p>
              </div>
            ) : (
              data.active_matches.map(match => (
                <div key={match.id} onClick={() => navigate(`/matches/${match.id}`)}
                  style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{match.lost_item_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.2rem' }}>
                        Found: {match.found_item_name} • {match.building}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: match.match_score >= 80 ? '#16a34a' : '#d97706', fontSize: '1rem' }}>
                        {match.match_score}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>match</div>
                    </div>
                  </div>
                  <div className="score-bar" style={{ marginTop: '0.5rem' }}>
                    <div className="score-bar-fill" style={{ width: `${match.match_score}%`, background: match.match_score >= 80 ? '#16a34a' : match.match_score >= 60 ? '#d97706' : '#2563eb' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Found Items */}
      {data?.recent_found?.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-title">📦 My Recent Found Reports</span>
            <Link to="/my-reports" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
            {data.recent_found.map(item => (
              <div key={item.id} className="card" style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => navigate(`/item/found/${item.id}`)}>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.item_name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', margin: '0.3rem 0' }}>{item.building}</div>
                  {statusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

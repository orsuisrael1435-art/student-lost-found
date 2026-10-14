import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_LABEL = {
  pending: '🟡 Pending',
  contact_requested: '📬 Contact Sent',
  contact_accepted: '💬 Chatting',
  contact_rejected: '❌ Rejected',
  verifying: '🔎 Verifying',
  handover_scheduled: '📅 Handover Set',
  returned: '✅ Returned',
  false_match: '❌ False Match',
  closed: '🔒 Closed',
};
const STATUS_CLASS = {
  pending: 'badge-warning',
  contact_requested: 'badge-info',
  contact_accepted: 'badge-primary',
  contact_rejected: 'badge-danger',
  verifying: 'badge-info',
  handover_scheduled: 'badge-primary',
  returned: 'badge-success',
  false_match: 'badge-danger',
  closed: 'badge-gray',
};

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/matches?limit=50')
      .then(r => setMatches(r.data.matches || []))
      .catch(() => toast.error('Failed to load matches'))
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = s => s >= 85 ? '#16a34a' : s >= 65 ? '#d97706' : '#2563eb';

  const filtered = filter === 'all' ? matches
    : matches.filter(m => m.match_status === filter);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🎯 My Matches</h1>
        <p className="page-subtitle">Possible matches found by the smart matching engine</p>
      </div>

      <div className="tabs">
        {[['all', 'All'], ['pending', 'Pending'], ['contact_requested', 'Contact Sent'],
          ['contact_accepted', 'Chatting'], ['returned', 'Returned']].map(([val, label]) => (
          <div key={val} className={`tab ${filter === val ? 'active' : ''}`}
            onClick={() => setFilter(val)}>
            {label}
            {val === 'all' && (
              <span style={{ marginLeft: '0.4rem', background: '#e5e7eb', borderRadius: 99, padding: '0.05rem 0.45rem', fontSize: '0.72rem' }}>
                {matches.length}
              </span>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3>No Matches Found</h3>
          <p>Report your lost items and the system will automatically find possible matches.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(match => (
            <div key={match.id} className="match-card" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/matches/${match.id}`)}>
              <div className="match-score-badge">
                {match.match_score >= 85 ? '🎯' : '✅'} {match.match_score}% Match
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: '#fef2f2', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>YOUR LOST ITEM</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{match.lost_item_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {match.category}{match.colour ? ` • ${match.colour}` : ''}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>{match.lost_id}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#9ca3af' }}>⇄</div>

                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>POSSIBLE FOUND ITEM</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{match.found_item_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    📍 {match.building}{match.room_number ? ` Room ${match.room_number}` : ''}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>{match.found_id}</span>
                  </div>
                </div>
              </div>

              <div className="score-bar" style={{ marginBottom: '0.75rem' }}>
                <div className="score-bar-fill"
                  style={{ width: `${match.match_score}%`, background: scoreColor(match.match_score) }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${STATUS_CLASS[match.match_status] || 'badge-gray'}`}>
                  {STATUS_LABEL[match.match_status] || match.match_status}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                    {new Date(match.matched_at).toLocaleDateString()}
                  </span>
                  <button className="btn btn-primary btn-sm"
                    onClick={e => { e.stopPropagation(); navigate(`/matches/${match.id}`); }}>
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

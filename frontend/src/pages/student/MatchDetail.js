import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const HANDOVER_LOCATIONS = [
  'College Security Office', 'Student Help Desk', 'Department Office',
  'Admin Office', 'College Library', 'Cafeteria Counter'
];

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHandover, setShowHandover] = useState(false);
  const [handoverForm, setHandoverForm] = useState({ location: '', handover_date: '', handover_time: '', notes: '' });

  const loadMatch = () =>
    api.get(`/matches/${id}`)
      .then(r => setMatch(r.data.match))
      .catch(() => { toast.error('Match not found'); navigate('/matches'); })
      .finally(() => setLoading(false));

  useEffect(() => { loadMatch(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOwner = user?.id === match?.owner_id;
  const isFinder = user?.id === match?.finder_id;
  const scoreColor = s => s >= 85 ? '#16a34a' : s >= 65 ? '#d97706' : '#2563eb';

  const doAction = async (fn, successMsg) => {
    setActionLoading(true);
    try { await fn(); toast.success(successMsg); loadMatch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  const requestContact = () => doAction(
    () => api.post(`/matches/${id}/contact`),
    '📬 Contact request sent to the finder!'
  );
  const acceptContact = () => doAction(
    () => api.put(`/matches/${id}/status`, { status: 'contact_accepted' }),
    '✅ Contact accepted! You can now chat.'
  );
  const rejectContact = () => doAction(
    () => api.put(`/matches/${id}/status`, { status: 'contact_rejected' }),
    'Match rejected.'
  );
  const confirmReturned = () => doAction(
    () => api.put(`/matches/${id}/status`, { status: 'returned' }),
    '🎉 Item marked as returned!'
  );

  const submitHandover = async e => {
    e.preventDefault();
    if (!handoverForm.location || !handoverForm.handover_date || !handoverForm.handover_time) {
      toast.error('Fill all handover fields'); return;
    }
    setActionLoading(true);
    try {
      await api.post('/handovers', { match_id: parseInt(id), ...handoverForm });
      toast.success('📅 Handover scheduled! Both students notified.');
      setShowHandover(false);
      loadMatch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;
  if (!match) return null;

  const breakdown = typeof match.match_breakdown === 'string'
    ? JSON.parse(match.match_breakdown || '{}') : (match.match_breakdown || {});
  const s = match.match_score || 0;

  return (
    <div>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>← Matches</button>
        <span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>Match #{match.id}</span>
      </div>

      {/* Score Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${scoreColor(s)}, ${scoreColor(s)}bb)`,
        color: 'white', borderRadius: 16, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '0.9rem', opacity: 0.85, marginBottom: '0.25rem' }}>
          {s >= 85 ? '🎯 HIGH PROBABILITY MATCH' : s >= 65 ? '✅ POSSIBLE MATCH' : '🔍 PARTIAL MATCH'}
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>{s}%</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: '0.3rem' }}>Match Confidence Score</div>
        <div className="score-bar" style={{ maxWidth: 300, margin: '1rem auto 0', background: 'rgba(255,255,255,0.3)' }}>
          <div className="score-bar-fill" style={{ width: `${s}%`, background: 'white' }} />
        </div>
      </div>

      {/* Item Comparison */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ border: '2px solid #fca5a5' }}>
          <div className="card-header" style={{ background: '#fef2f2' }}>
            <span style={{ fontWeight: 700, color: '#dc2626' }}>🔍 LOST ITEM</span>
            <span className="badge badge-danger" style={{ float: 'right', fontFamily: 'monospace', fontSize: '0.72rem' }}>{match.lost_id}</span>
          </div>
          <div className="card-body">
            {match.lost_image && (
              <img src={match.lost_image} alt="lost" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />
            )}
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{match.lost_item_name}</div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.9 }}>
              {match.category && <div>🏷️ {match.category}</div>}
              {match.colour && <div>🎨 {match.colour}</div>}
              <div>📍 {match.building}{match.room_number ? ` – Room ${match.room_number}` : ''}</div>
              <div>📅 {match.lost_date && new Date(match.lost_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ border: '2px solid #86efac' }}>
          <div className="card-header" style={{ background: '#f0fdf4' }}>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>📦 FOUND ITEM</span>
            <span className="badge badge-success" style={{ float: 'right', fontFamily: 'monospace', fontSize: '0.72rem' }}>{match.found_id}</span>
          </div>
          <div className="card-body">
            {match.found_image && (
              <img src={match.found_image} alt="found" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />
            )}
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{match.found_item_name}</div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.9 }}>
              <div>📍 {match.building}{match.room_number ? ` – Room ${match.room_number}` : ''}</div>
              <div>📅 {match.found_date && new Date(match.found_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              {['contact_accepted', 'verifying', 'handover_scheduled', 'returned'].includes(match.status) && (
                <div>👤 Finder: {match.finder_name} ({match.finder_dept})</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="section-title">📊 Score Breakdown</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {[['item_name', 'Item Name', 25], ['category', 'Category', 15], ['colour', 'Colour', 15],
                ['brand', 'Brand', 10], ['building', 'Building', 10], ['room_number', 'Room', 10],
                ['date', 'Date', 5], ['description', 'Description', 10]].map(([key, label, max]) =>
                breakdown[key] !== undefined ? (
                  <div key={key} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700 }}>{breakdown[key]}/{max}</span>
                      <span style={{ fontSize: '0.75rem', color: scoreColor(breakdown[key] / max * 100) }}>
                        {Math.round(breakdown[key] / max * 100)}%
                      </span>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill"
                        style={{ width: `${breakdown[key] / max * 100}%`, background: scoreColor(breakdown[key] / max * 100) }} />
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match Reason */}
      {match.match_reason && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <span>💡</span>
          <div><strong>Why this match?</strong><br />{match.match_reason}</div>
        </div>
      )}

      {/* Actions Panel */}
      <div className="card">
        <div className="card-header">
          <span className="section-title">⚡ Actions</span>
          <span className={`badge ${STATUS_CLASS[match.status] || 'badge-gray'}`} style={{ float: 'right' }}>
            {STATUS_LABEL[match.status] || match.status}
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Owner actions */}
            {isOwner && match.status === 'pending' && (
              <button className="btn btn-primary" onClick={requestContact} disabled={actionLoading}>
                {actionLoading ? '⏳ Sending...' : '📬 Request Contact with Finder'}
              </button>
            )}
            {isOwner && match.status === 'contact_requested' && (
              <div className="alert alert-info" style={{ width: '100%' }}>
                <span>⏳</span><div>Contact request sent. Waiting for the finder to respond.</div>
              </div>
            )}

            {/* Finder actions */}
            {isFinder && match.status === 'contact_requested' && (
              <>
                <button className="btn btn-success" onClick={acceptContact} disabled={actionLoading}>✅ Accept Contact</button>
                <button className="btn btn-danger" onClick={rejectContact} disabled={actionLoading}>❌ Reject This Match</button>
              </>
            )}

            {/* Both: chat when accepted */}
            {['contact_accepted', 'verifying', 'handover_scheduled'].includes(match.status) && (
              <Link to="/messages" className="btn btn-primary">💬 Open Secure Chat</Link>
            )}

            {/* Schedule handover */}
            {['contact_accepted', 'verifying'].includes(match.status) && !showHandover && (
              <button className="btn btn-warning" onClick={() => setShowHandover(true)}>📅 Schedule Handover</button>
            )}

            {/* Confirm returned */}
            {match.status === 'handover_scheduled' && (
              <button className="btn btn-success" onClick={confirmReturned} disabled={actionLoading}>
                {actionLoading ? '...' : '✅ I Have Received / Handed Over Item'}
              </button>
            )}
          </div>

          {/* Handover Form */}
          {showHandover && (
            <form onSubmit={submitHandover}
              style={{ marginTop: '1.5rem', background: '#f9fafb', borderRadius: 12, padding: '1.25rem', border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 700, marginBottom: '1rem' }}>📅 Schedule Handover Meeting</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Handover Location <span className="required">*</span></label>
                  <select className="form-control" value={handoverForm.location}
                    onChange={e => setHandoverForm(p => ({ ...p, location: e.target.value }))} required>
                    <option value="">Select safe location</option>
                    {HANDOVER_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date <span className="required">*</span></label>
                  <input type="date" className="form-control" value={handoverForm.handover_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setHandoverForm(p => ({ ...p, handover_date: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time <span className="required">*</span></label>
                  <input type="time" className="form-control" value={handoverForm.handover_time}
                    onChange={e => setHandoverForm(p => ({ ...p, handover_time: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={handoverForm.notes}
                    onChange={e => setHandoverForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Any special instructions..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowHandover(false)}>Cancel</button>
                <button type="submit" className="btn btn-warning" disabled={actionLoading}>
                  {actionLoading ? '⏳ Scheduling...' : '📅 Confirm Handover'}
                </button>
              </div>
            </form>
          )}

          {match.status === 'returned' && (
            <div className="alert alert-success" style={{ marginTop: '1rem' }}>
              <span>🎉</span><div><strong>Successfully Returned!</strong> This case is closed. Thank you for using the portal!</div>
            </div>
          )}
          {match.status === 'contact_rejected' && (
            <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
              <span>⚠️</span><div>This match was rejected. Search for other items that might match yours.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL = {
  pending: '🟡 Pending', contact_requested: '📬 Contact Sent',
  contact_accepted: '💬 Chatting', contact_rejected: '❌ Rejected',
  verifying: '🔎 Verifying', handover_scheduled: '📅 Handover Set',
  returned: '✅ Returned', false_match: '❌ False Match',
};
const STATUS_CLASS = {
  pending: 'badge-warning', contact_requested: 'badge-info',
  contact_accepted: 'badge-primary', contact_rejected: 'badge-danger',
  verifying: 'badge-info', handover_scheduled: 'badge-primary',
  returned: 'badge-success', false_match: 'badge-danger',
};

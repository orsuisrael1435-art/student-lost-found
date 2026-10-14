import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CAT_ICONS = { 'Mobile Phone':'📱','Laptop':'💻','Wallet':'👛','ID Card':'🪪','Keys':'🔑','Books':'📚','Bag':'🎒','Watch':'⌚','Earphones':'🎧','Documents':'📄','Calculator':'🧮','Clothing':'👕','Water Bottle':'🫖','Jewellery':'💍','Tablet':'📟','Umbrella':'☂️','Charger':'🔌','Other':'📦' };

const statusBadge = s => {
  const m = { active:{c:'badge-success',t:'🟢 Active'}, possible_match:{c:'badge-primary',t:'🎯 Match Found!'}, matched:{c:'badge-primary',t:'🤝 Matched'}, returned:{c:'badge-success',t:'✅ Returned'}, pending:{c:'badge-warning',t:'⏳ Pending'}, closed:{c:'badge-gray',t:'🔒 Closed'}, owner_contacted:{c:'badge-info',t:'📬 Owner Contacted'} };
  const b = m[s] || {c:'badge-gray',t:s};
  return <span className={`badge ${b.c}`}>{b.t}</span>;
};

export default function ItemDetail() {
  const { type, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/${type}/${id}`)
      .then(r => setItem(r.data.item))
      .catch(() => { toast.error('Item not found'); navigate(-1); })
      .finally(() => setLoading(false));
  }, [type, id]);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;
  if (!item) return null;

  const isOwner = user?.id === item.user_id;
  const isLost = type === 'lost';
  const dateLabel = isLost ? 'Date Lost' : 'Date Found';
  const dateVal = isLost ? item.lost_date : item.found_date;
  const timeVal = isLost ? item.lost_time : item.found_time;
  const reportId = isLost ? item.lost_id : item.found_id;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <span>/</span>
        <span>{isLost ? '🔍 Lost Items' : '📦 Found Items'}</span>
        <span>/</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{item.item_name}</span>
        <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: '0.72rem', marginLeft: '0.5rem' }}>{reportId}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main Column */}
        <div>
          {/* Item Image or Icon */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            {item.image_url ? (
              <img src={item.image_url} alt={item.item_name}
                style={{ width: '100%', maxHeight: 360, objectFit: 'cover' }} />
            ) : (
              <div style={{ height: 220, background: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem' }}>
                {CAT_ICONS[item.category] || '📦'}
              </div>
            )}
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>{item.item_name}</h1>
                <span className={`badge ${isLost ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.8rem', flexShrink: 0 }}>
                  {isLost ? '🔍 LOST' : '📦 FOUND'}
                </span>
              </div>

              {/* Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  ['🏷️ Category', item.category],
                  ['🎨 Colour', item.colour],
                  ['🔖 Brand', item.brand],
                  [dateLabel, dateVal && new Date(dateVal).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })],
                  ['🕐 Time', timeVal],
                  ['🏢 Building', item.building],
                  ['🚪 Room', item.room_number],
                  ['📍 Specific Location', item.specific_location],
                ].map(([label, val]) => val ? (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{val}</div>
                  </div>
                ) : null)}
              </div>

              {item.description && (
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: 10, marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</div>
                  <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.description}</p>
                </div>
              )}

              {(item.additional_info || item.additional_details) && (
                <div style={{ padding: '1rem', background: '#fffbeb', borderRadius: 10, border: '1px solid #fcd34d' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Information</div>
                  <p style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.additional_info || item.additional_details}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header"><span className="section-title">📋 Report Info</span></div>
            <div className="card-body">
              <div style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 2.2 }}>
                <div>🆔 <strong>{reportId}</strong></div>
                <div>📅 Reported: <strong>{new Date(item.created_at).toLocaleDateString('en-IN')}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  Status: {statusBadge(item.status)}
                </div>
              </div>

              {isOwner && !['returned', 'closed'].includes(item.status) && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/report-${type}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>✏️ Edit</Link>
                </div>
              )}
            </div>
          </div>

          {item.status === 'possible_match' && (
            <div className="card" style={{ marginBottom: '1rem', border: '2px solid #93c5fd' }}>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '0.5rem' }}>Possible Match Found!</div>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                  A possible match has been detected. Check your matches to contact the other student.
                </p>
                <Link to="/matches" className="btn btn-primary btn-sm">View Matches →</Link>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body">
              <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span>🔒</span>
                <span>Personal contact details are never shown publicly. All communication goes through our secure in-app messaging system.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

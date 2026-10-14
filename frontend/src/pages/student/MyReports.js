import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusBadge = s => {
  const m = {
    active: { c: 'badge-success', t: '🟢 Active' },
    possible_match: { c: 'badge-primary', t: '🎯 Match!' },
    matched: { c: 'badge-primary', t: '🤝 Matched' },
    returned: { c: 'badge-success', t: '✅ Returned' },
    pending: { c: 'badge-warning', t: '⏳ Pending' },
    closed: { c: 'badge-gray', t: '🔒 Closed' },
    owner_contacted: { c: 'badge-info', t: '📬 Contacted' },
  };
  const b = m[s] || { c: 'badge-gray', t: s };
  return <span className={`badge ${b.c}`}>{b.t}</span>;
};

export default function MyReports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lost');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [l, f] = await Promise.all([
          api.get('/lost?my_items=true&limit=100'),
          api.get('/found?my_items=true&limit=100'),
        ]);
        setLostItems(l.data.items || []);
        setFoundItems(f.data.items || []);
      } catch { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const deleteItem = async (type, id) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await api.delete(`/${type}/${id}`);
      toast.success('Report deleted');
      if (type === 'lost') setLostItems(p => p.filter(i => i.id !== id));
      else setFoundItems(p => p.filter(i => i.id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const items = activeTab === 'lost' ? lostItems : foundItems;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📁 My Reports</h1>
          <p className="page-subtitle">Manage all your lost and found item reports</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/report-lost" className="btn btn-danger btn-sm">+ Lost</Link>
          <Link to="/report-found" className="btn btn-success btn-sm">+ Found</Link>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'lost' ? 'active' : ''}`} onClick={() => setActiveTab('lost')}>
          🔍 Lost Items
          <span style={{ marginLeft: '0.4rem', background: '#e5e7eb', borderRadius: 99, padding: '0.05rem 0.45rem', fontSize: '0.72rem' }}>{lostItems.length}</span>
        </div>
        <div className={`tab ${activeTab === 'found' ? 'active' : ''}`} onClick={() => setActiveTab('found')}>
          📦 Found Items
          <span style={{ marginLeft: '0.4rem', background: '#e5e7eb', borderRadius: 99, padding: '0.05rem 0.45rem', fontSize: '0.72rem' }}>{foundItems.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{activeTab === 'lost' ? '🔍' : '📦'}</div>
          <h3>No {activeTab === 'lost' ? 'Lost' : 'Found'} Reports</h3>
          <p>You haven't submitted any {activeTab} item reports yet.</p>
          <Link to={activeTab === 'lost' ? '/report-lost' : '/report-found'}
            className={`btn ${activeTab === 'lost' ? 'btn-danger' : 'btn-success'}`}>
            + Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
          </Link>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Item</th>
                <th>Category</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#f3f4f6', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      {item.lost_id || item.found_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.image_url && (
                        <img src={item.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.item_name}</div>
                        {item.colour && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.colour}{item.brand ? ` • ${item.brand}` : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{item.category}</td>
                  <td style={{ fontSize: '0.875rem' }}>{item.building}{item.room_number ? ` – ${item.room_number}` : ''}</td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {new Date(item.lost_date || item.found_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                  <td>{statusBadge(item.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/item/${activeTab}/${item.id}`)}>
                        View
                      </button>
                      {item.status === 'possible_match' && (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => navigate('/matches')}>
                          🎯 Match
                        </button>
                      )}
                      {!['returned', 'closed'].includes(item.status) && (
                        <button className="btn btn-danger btn-sm"
                          onClick={() => deleteItem(activeTab, item.id)}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

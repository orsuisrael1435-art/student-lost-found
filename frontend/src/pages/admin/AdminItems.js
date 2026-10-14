import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function AdminItemsPage({ type }) {
  const isLost = type === 'lost';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/${type}?${params}`);
      setItems(res.data.items); setPagination(res.data.pagination);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, type]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const approve = async (id) => {
    try {
      await api.put(`/admin/reports/${id}/approve`, { type });
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_approved: true, status: 'active' } : i));
      toast.success('Report approved');
    } catch { toast.error('Failed'); }
  };

  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await api.put(`/admin/reports/${id}/reject`, { type, reason });
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'closed' } : i));
      toast.success('Report rejected');
    } catch { toast.error('Failed'); }
  };

  const statusBadge = s => {
    const m = { active:'badge-success', possible_match:'badge-primary', returned:'badge-success', pending:'badge-warning', closed:'badge-gray', matched:'badge-primary', owner_contacted:'badge-info' };
    return <span className={`badge ${m[s] || 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>{s}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isLost ? '🔍 Lost Item Reports' : '📦 Found Item Reports'}</h1>
        <p className="page-subtitle">{pagination.total || 0} total reports</p>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <span>🔍</span>
            <input placeholder={`Search ${type} reports...`} value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: 140 }} value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="possible_match">Possible Match</option>
            <option value="returned">Returned</option>
            <option value="closed">Closed</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>Clear</button>
        </div>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Report ID</th><th>Item</th><th>Student</th><th>Location</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: '#f3f4f6', padding: '0.2rem 0.5rem', borderRadius: 4 }}>{item.lost_id || item.found_id}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {item.image_url && <img src={item.image_url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.item_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.category}{item.colour ? ` • ${item.colour}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.student_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.student_roll}</div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{item.building}{item.room_number ? ` – ${item.room_number}` : ''}</td>
                  <td style={{ fontSize: '0.875rem' }}>{new Date(item.lost_date || item.found_date).toLocaleDateString('en-IN')}</td>
                  <td>{statusBadge(item.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {!item.is_approved && item.status !== 'closed' && (
                        <button className="btn btn-success btn-sm" onClick={() => approve(item.id)}>✅ Approve</button>
                      )}
                      {item.status !== 'closed' && (
                        <button className="btn btn-danger btn-sm" onClick={() => reject(item.id)}>❌ Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
          <span style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Page {page}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p+1)} disabled={items.length < 20}>Next →</button>
        </div>
      )}
    </div>
  );
}

export function AdminLostItems() { return <AdminItemsPage type="lost" />; }
export function AdminFoundItems() { return <AdminItemsPage type="found" />; }

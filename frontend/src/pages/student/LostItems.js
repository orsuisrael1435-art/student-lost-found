import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Mobile Phone','Laptop','Tablet','Wallet','ID Card','Keys','Books','Bag','Watch','Earphones','Jewellery','Documents','Calculator','Clothing','Water Bottle','Umbrella','Charger','Other'];
const CAT_ICONS = { 'Mobile Phone':'📱','Laptop':'💻','Wallet':'👛','ID Card':'🪪','Keys':'🔑','Books':'📚','Bag':'🎒','Watch':'⌚','Earphones':'🎧','Documents':'📄','Calculator':'🧢','Clothing':'👕','Water Bottle':'🫖','Jewellery':'💍','Other':'📦','Tablet':'📟','Umbrella':'☂️','Charger':'🔌' };

const statusBadge = (s) => {
  const m = {active:{c:'badge-success',t:'🟢 Active'},possible_match:{c:'badge-primary',t:'🎯 Match!'},matched:{c:'badge-primary',t:'🤝 Matched'},returned:{c:'badge-success',t:'✅ Returned'},pending:{c:'badge-warning',t:'⏳ Pending'}};
  const b = m[s]||{c:'badge-gray',t:s};
  return <span className={`badge ${b.c}`}>{b.t}</span>;
};

export default function LostItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search:'', category:'', colour:'', building:'', date_from:'', date_to:'' });
  const [buildings, setBuildings] = useState([]);

  useEffect(() => { api.get('/buildings').then(r => setBuildings(r.data.buildings)).catch(() => {}); }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });
      const res = await api.get(`/lost?${params}`);
      setItems(res.data.items); setPagination(res.data.pagination);
    } catch { toast.error('Failed to load items'); } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const clearFilters = () => { setFilters({ search:'', category:'', colour:'', building:'', date_from:'', date_to:'' }); setPage(1); };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🔍 Lost Items</h1>
          <p className="page-subtitle">Browse all reported lost items on campus</p>
        </div>
        <Link to="/report-lost" className="btn btn-danger">+ Report Lost Item</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div className="search-bar" style={{ gridColumn: '1 / -1' }}>
            <span>🔍</span>
            <input placeholder="Search by name, brand, description..." value={filters.search} onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1); }} />
          </div>
          <select className="form-control" value={filters.category} onChange={e => { setFilters(p => ({ ...p, category: e.target.value })); setPage(1); }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <select className="form-control" value={filters.building} onChange={e => { setFilters(p => ({ ...p, building: e.target.value })); setPage(1); }}>
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b.id} value={b.building_name}>{b.building_name}</option>)}
          </select>
          <input type="date" className="form-control" value={filters.date_from} onChange={e => { setFilters(p => ({ ...p, date_from: e.target.value })); setPage(1); }} placeholder="Date from" />
          <input type="date" className="form-control" value={filters.date_to} onChange={e => { setFilters(p => ({ ...p, date_to: e.target.value })); setPage(1); }} placeholder="Date to" />
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Clear</button>
        </div>
        {pagination.total !== undefined && <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem' }}>{pagination.total} item{pagination.total !== 1 ? 's' : ''} found</div>}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No Lost Items Found</h3>
          <p>Try adjusting filters or be the first to report a lost item.</p>
          <Link to="/report-lost" className="btn btn-danger">Report Lost Item</Link>
        </div>
      ) : (
        <div className="grid-items">
          {items.map(item => (
            <div key={item.id} className="item-card" onClick={() => navigate(`/item/lost/${item.id}`)} style={{ cursor: 'pointer' }}>
              <div className="item-card-image">
                {item.image_url ? <img src={item.image_url} alt={item.item_name} /> : <span>{CAT_ICONS[item.category] || '📦'}</span>}
              </div>
              <div className="item-card-body">
                <div className="item-card-title">{item.item_name}</div>
                {item.colour && <div className="item-card-meta"><span>🎨</span> {item.colour}{item.brand ? ` • ${item.brand}` : ''}</div>}
                <div className="item-card-meta" style={{ marginTop: '0.25rem' }}><span>📍</span> {item.building}{item.room_number ? ` - Room ${item.room_number}` : ''}</div>
                <div className="item-card-meta" style={{ marginTop: '0.25rem' }}><span>📅</span> {new Date(item.lost_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                {item.description && <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem', lineHeight: 1.4 }}>{item.description.slice(0, 60)}{item.description.length > 60 ? '...' : ''}</div>}
              </div>
              <div className="item-card-footer">
                {statusBadge(item.status)}
                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}>Next →</button>
        </div>
      )}
    </div>
  );
}

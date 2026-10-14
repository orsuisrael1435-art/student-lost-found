import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Mobile Phone','Laptop','Tablet','Wallet','ID Card','Keys','Books','Bag','Watch','Earphones','Jewellery','Documents','Calculator','Clothing','Water Bottle','Umbrella','Charger','Other'];
const CAT_ICONS = { 'Mobile Phone':'📱','Laptop':'💻','Wallet':'👛','ID Card':'🪪','Keys':'🔑','Books':'📚','Bag':'🎒','Watch':'⌚','Earphones':'🎧','Documents':'📄','Calculator':'🧢','Clothing':'👕','Water Bottle':'🫖','Jewellery':'💍','Other':'📦','Tablet':'📟','Umbrella':'☂️','Charger':'🔌' };

const statusBadge = (s) => {
  const m = {active:{c:'badge-success',t:'🟢 Active'},possible_match:{c:'badge-primary',t:'🎯 Match!'},owner_contacted:{c:'badge-warning',t:'📬 Contacted'},returned:{c:'badge-success',t:'✅ Returned'}};
  const b = m[s]||{c:'badge-gray',t:s};
  return <span className={`badge ${b.c}`}>{b.t}</span>;
};

export default function FoundItems() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search:'', category:'', building:'' });
  const [buildings, setBuildings] = useState([]);

  useEffect(() => { api.get('/buildings').then(r => setBuildings(r.data.buildings)).catch(() => {}); }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });
      const res = await api.get(`/found?${params}`);
      setItems(res.data.items); setPagination(res.data.pagination);
    } catch { toast.error('Failed to load items'); } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📦 Found Items</h1>
          <p className="page-subtitle">Items found and reported by students on campus</p>
        </div>
        <Link to="/report-found" className="btn btn-success">+ Report Found Item</Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <div className="search-bar" style={{ gridColumn: '1 / -1' }}>
            <span>🔍</span>
            <input placeholder="Search found items..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          </div>
          <select className="form-control" value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <select className="form-control" value={filters.building} onChange={e => setFilters(p => ({ ...p, building: e.target.value }))}>
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b.id} value={b.building_name}>{b.building_name}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search:'', category:'', building:'' })}>✕ Clear</button>
        </div>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner spinner-lg" /></div> : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No Found Items</h3>
          <p>No found items reported yet. Did you find something?</p>
          <Link to="/report-found" className="btn btn-success">Report Found Item</Link>
        </div>
      ) : (
        <div className="grid-items">
          {items.map(item => (
            <div key={item.id} className="item-card" onClick={() => navigate(`/item/found/${item.id}`)} style={{ cursor: 'pointer' }}>
              <div className="item-card-image">
                {item.image_url ? <img src={item.image_url} alt={item.item_name} /> : <span>{CAT_ICONS[item.category] || '📦'}</span>}
              </div>
              <div className="item-card-body">
                <div className="item-card-title">{item.item_name}</div>
                {item.colour && <div className="item-card-meta"><span>🎨</span> {item.colour}{item.brand ? ` • ${item.brand}` : ''}</div>}
                <div className="item-card-meta" style={{ marginTop: '0.25rem' }}><span>📍</span> {item.building}{item.room_number ? ` - Room ${item.room_number}` : ''}</div>
                <div className="item-card-meta" style={{ marginTop: '0.25rem' }}><span>📅</span> {new Date(item.found_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="item-card-footer">
                {statusBadge(item.status)}
                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{item.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
          <span style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem' }}>Page {page} of {pagination.pages}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page === pagination.pages}>Next →</button>
        </div>
      )}
    </div>
  );
}

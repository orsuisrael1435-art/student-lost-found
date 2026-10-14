import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '📦' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories?all=true')
      .then(r => setCategories(r.data.categories || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  const addCategory = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Category name required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/categories', form);
      setCategories(prev => [...prev, res.data.category]);
      setForm({ name: '', description: '', icon: '📦' });
      setShowForm(false);
      toast.success('Category added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (id, current) => {
    try {
      const newStatus = current === 'active' ? 'inactive' : 'active';
      await api.put(`/categories/${id}`, { status: newStatus });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🏷️ Categories</h1>
          <p className="page-subtitle">{categories.length} item categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="section-title">Add New Category</span></div>
          <div className="card-body">
            <form onSubmit={addCategory}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Icon (Emoji) <span className="required">*</span></label>
                  <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} className="form-control" placeholder="📦" maxLength={4} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category Name <span className="required">*</span></label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="form-control" placeholder="e.g. Mobile Phone" required />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Description</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-control" placeholder="Brief description of this category" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Adding...' : '+ Add Category'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading-overlay"><div className="spinner spinner-lg" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '1rem' }}>
          {categories.map(cat => (
            <div key={cat.id} className="card" style={{ opacity: cat.status === 'inactive' ? 0.6 : 1 }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem', width: 48, height: 48, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {cat.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                  {cat.description && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.15rem' }}>{cat.description}</div>}
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`badge ${cat.status === 'active' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.68rem' }}>
                      {cat.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>
                <button className={`btn btn-sm ${cat.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => toggleStatus(cat.id, cat.status)} style={{ flexShrink: 0 }}>
                  {cat.status === 'active' ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

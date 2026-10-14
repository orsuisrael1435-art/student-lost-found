import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminBuildings() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ building_name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [rooms, setRooms] = useState({});
  const [roomForm, setRoomForm] = useState({ room_number: '', floor: '' });

  useEffect(() => {
    api.get('/buildings')
      .then(r => setBuildings(r.data.buildings || []))
      .catch(() => toast.error('Failed to load buildings'))
      .finally(() => setLoading(false));
  }, []);

  const addBuilding = async e => {
    e.preventDefault();
    if (!form.building_name.trim()) { toast.error('Building name required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/buildings', form);
      setBuildings(prev => [...prev, { ...res.data.building, room_count: 0 }]);
      setForm({ building_name: '', description: '' });
      setShowForm(false);
      toast.success('Building added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const loadRooms = async buildingId => {
    if (rooms[buildingId]) { setExpanded(expanded === buildingId ? null : buildingId); return; }
    try {
      const res = await api.get(`/buildings/${buildingId}/rooms`);
      setRooms(prev => ({ ...prev, [buildingId]: res.data.rooms || [] }));
      setExpanded(buildingId);
    } catch { toast.error('Failed to load rooms'); }
  };

  const addRoom = async (buildingId) => {
    if (!roomForm.room_number.trim()) { toast.error('Room number required'); return; }
    try {
      const res = await api.post(`/buildings/${buildingId}/rooms`, roomForm);
      setRooms(prev => ({ ...prev, [buildingId]: [...(prev[buildingId] || []), res.data.room] }));
      setBuildings(prev => prev.map(b => b.id === buildingId ? { ...b, room_count: (parseInt(b.room_count) || 0) + 1 } : b));
      setRoomForm({ room_number: '', floor: '' });
      toast.success('Room added!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🏛️ Buildings & Rooms</h1>
          <p className="page-subtitle">{buildings.length} campus buildings</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Building'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><span className="section-title">Add New Building</span></div>
          <div className="card-body">
            <form onSubmit={addBuilding}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Building Name <span className="required">*</span></label>
                  <input value={form.building_name} onChange={e => setForm(p => ({ ...p, building_name: e.target.value }))} className="form-control" placeholder="e.g. CSE Block" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-control" placeholder="Optional description" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '⏳ Adding...' : '+ Add Building'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="loading-overlay"><div className="spinner spinner-lg" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {buildings.map(b => (
            <div key={b.id} className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem' }}>🏢</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{b.building_name}</div>
                  {b.description && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{b.description}</div>}
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.25rem' }}>{b.room_count || 0} rooms registered</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => loadRooms(b.id)}>
                  {expanded === b.id ? '▲ Hide Rooms' : '▼ Show Rooms'}
                </button>
              </div>

              {expanded === b.id && (
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>Rooms in {b.building_name}</div>
                    {(rooms[b.id] || []).length === 0 ? (
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No rooms added yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {rooms[b.id].map(r => (
                          <span key={r.id} style={{ background: '#f3f4f6', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>
                            {r.room_number}{r.floor ? ` (Floor ${r.floor})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Room Number</label>
                      <input className="form-control" style={{ width: 120 }} placeholder="e.g. 204"
                        value={roomForm.room_number} onChange={e => setRoomForm(p => ({ ...p, room_number: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>Floor</label>
                      <input className="form-control" style={{ width: 80 }} placeholder="e.g. 2"
                        value={roomForm.floor} onChange={e => setRoomForm(p => ({ ...p, floor: e.target.value }))} />
                    </div>
                    <button className="btn btn-success btn-sm" onClick={() => addRoom(b.id)}>+ Add Room</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Mobile Phone','Laptop','Tablet','Wallet','ID Card','Keys','Books','Bag','Watch','Earphones','Jewellery','Documents','Calculator','Clothing','Water Bottle','Umbrella','Charger','Other'];
const COLOURS = ['Black','White','Red','Blue','Green','Yellow','Orange','Purple','Pink','Brown','Grey','Silver','Gold','Multicolor','Other'];

export default function ReportLost() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [form, setForm] = useState({
    item_name:'', category:'', colour:'', brand:'', description:'',
    lost_date: new Date().toISOString().split('T')[0], lost_time:'',
    building:'', room_number:'', specific_location:'', additional_info:''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    api.get('/buildings').then(r => setBuildings(r.data.buildings)).catch(() => {});
  }, []);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImage = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.category || !form.lost_date || !form.building) {
      toast.error('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);
      const res = await api.post('/lost', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Lost report ${res.data.lost_item.lost_id} submitted! Matching in progress...`);
      navigate('/my-reports');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📋 Report Lost Item</h1>
        <p className="page-subtitle">Fill in details to help us find your item</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        <form onSubmit={submit}>
          <div className="card">
            <div className="card-header"><span className="section-title">📝 Item Details</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Item Name <span className="required">*</span></label>
                <input name="item_name" value={form.item_name} onChange={handle} className="form-control" placeholder="e.g. Black Samsung Phone" required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category <span className="required">*</span></label>
                  <select name="category" value={form.category} onChange={handle} className="form-control" required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Colour</label>
                  <select name="colour" value={form.colour} onChange={handle} className="form-control">
                    <option value="">Select colour</option>
                    {COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Brand / Make</label>
                <input name="brand" value={form.brand} onChange={handle} className="form-control" placeholder="e.g. Samsung, Apple, Casio" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" value={form.description} onChange={handle} className="form-control" rows={3} placeholder="Describe the item in detail — any distinguishing features, contents, stickers, etc." />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header"><span className="section-title">📍 When & Where</span></div>
            <div className="card-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date Lost <span className="required">*</span></label>
                  <input type="date" name="lost_date" value={form.lost_date} onChange={handle} className="form-control" max={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Approximate Time</label>
                  <input type="time" name="lost_time" value={form.lost_time} onChange={handle} className="form-control" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Building <span className="required">*</span></label>
                <select name="building" value={form.building} onChange={handle} className="form-control" required>
                  <option value="">Select building</option>
                  {buildings.map(b => <option key={b.id} value={b.building_name}>{b.building_name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Room / Hall Number</label>
                  <input name="room_number" value={form.room_number} onChange={handle} className="form-control" placeholder="e.g. 204, Lab-1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Specific Location</label>
                  <input name="specific_location" value={form.specific_location} onChange={handle} className="form-control" placeholder="e.g. Near back row" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Additional Information</label>
                <textarea name="additional_info" value={form.additional_info} onChange={handle} className="form-control" rows={2} placeholder="Any other details that might help identify the item" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-danger btn-lg" style={{ flex: 1 }} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Submitting...</> : '📋 Submit Lost Report'}
            </button>
          </div>
        </form>

        {/* Sidebar: Photo Upload */}
        <div>
          <div className="card">
            <div className="card-header"><span className="section-title">📸 Item Photo</span></div>
            <div className="card-body">
              <div
                className={`upload-area ${dragOver ? 'dragover' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('img-input').click()}
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="upload-preview" />
                ) : (
                  <>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📷</div>
                    <div style={{ fontWeight: 600, color: '#374151' }}>Drop photo here or click to upload</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.35rem' }}>JPG, PNG, WEBP • Max 5MB</div>
                  </>
                )}
              </div>
              <input id="img-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
              {preview && <button className="btn btn-ghost btn-sm btn-block" style={{ marginTop: '0.75rem' }} onClick={() => { setImage(null); setPreview(null); }}>✕ Remove Photo</button>}
              <div className="form-hint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>Adding a photo greatly improves matching accuracy</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-body">
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>💡 Tips for Better Matching</div>
              <ul style={{ paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.875rem', lineHeight: 2 }}>
                <li>Be specific about colour and brand</li>
                <li>Mention unique features or damage</li>
                <li>Include contents if applicable</li>
                <li>Add the exact location or room number</li>
                <li>Upload a clear photo if possible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

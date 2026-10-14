import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Mobile Phone','Laptop','Tablet','Wallet','ID Card','Keys','Books','Bag','Watch','Earphones','Jewellery','Documents','Calculator','Clothing','Water Bottle','Umbrella','Charger','Other'];
const COLOURS = ['Black','White','Red','Blue','Green','Yellow','Orange','Purple','Pink','Brown','Grey','Silver','Gold','Multicolor','Other'];

export default function ReportFound() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [form, setForm] = useState({
    item_name:'', category:'', colour:'', brand:'', description:'',
    found_date: new Date().toISOString().split('T')[0], found_time: new Date().toTimeString().slice(0,5),
    building:'', room_number:'', specific_location:'', additional_details:''
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/buildings').then(r => setBuildings(r.data.buildings)).catch(() => {});
  }, []);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleImage = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImage(file); setPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.item_name || !form.category || !form.found_date || !form.building) {
      toast.error('Please fill all required fields'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (image) fd.append('image', image);
      const res = await api.post('/found', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Found report ${res.data.found_item.found_id} submitted! Thank you for helping! 🙏`);
      navigate('/my-reports');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 Report Found Item</h1>
        <p className="page-subtitle">Help someone get their item back by reporting it here</p>
      </div>
      <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
        <span>🙏</span>
        <div><strong>Thank you for being helpful!</strong> Your report will automatically be matched against lost item reports so the owner can be notified.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
        <form onSubmit={submit}>
          <div className="card">
            <div className="card-header"><span className="section-title">📝 Item Details</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Item Name <span className="required">*</span></label>
                <input name="item_name" value={form.item_name} onChange={handle} className="form-control" placeholder="e.g. Blue Water Bottle" required />
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
                <input name="brand" value={form.brand} onChange={handle} className="form-control" placeholder="e.g. Milton, Apple" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" value={form.description} onChange={handle} className="form-control" rows={3} placeholder="Describe what you found — colour, size, any markings or distinguishing features" />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Details</label>
                <textarea name="additional_details" value={form.additional_details} onChange={handle} className="form-control" rows={2} placeholder="Where you have kept the item or any other helpful details" />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-header"><span className="section-title">📍 When & Where Found</span></div>
            <div className="card-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Date Found <span className="required">*</span></label>
                  <input type="date" name="found_date" value={form.found_date} onChange={handle} className="form-control" max={new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Found</label>
                  <input type="time" name="found_time" value={form.found_time} onChange={handle} className="form-control" />
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
                  <label className="form-label">Room / Area</label>
                  <input name="room_number" value={form.room_number} onChange={handle} className="form-control" placeholder="e.g. 204" />
                </div>
                <div className="form-group">
                  <label className="form-label">Specific Location</label>
                  <input name="specific_location" value={form.specific_location} onChange={handle} className="form-control" placeholder="e.g. On a desk" />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-success btn-lg" style={{ flex: 1 }} disabled={loading}>
              {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Submitting...</> : '📦 Submit Found Report'}
            </button>
          </div>
        </form>

        <div>
          <div className="card">
            <div className="card-header"><span className="section-title">📸 Item Photo</span></div>
            <div className="card-body">
              <div className="upload-area" onClick={() => document.getElementById('img-input-found').click()}
                style={{ cursor: 'pointer' }}>
                {preview ? <img src={preview} alt="Preview" className="upload-preview" /> : (
                  <><div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📷</div>
                  <div style={{fontWeight:600,color:'#374151'}}>Click to upload a photo</div>
                  <div style={{fontSize:'0.8rem',color:'#9ca3af',marginTop:'0.35rem'}}>JPG, PNG, WEBP • Max 5MB</div></>
                )}
              </div>
              <input id="img-input-found" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
              {preview && <button className="btn btn-ghost btn-sm btn-block" style={{marginTop:'0.75rem'}} onClick={() => { setImage(null); setPreview(null); }}>✕ Remove</button>}
            </div>
          </div>
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-body">
              <div className="section-title" style={{ marginBottom: '0.75rem' }}>🔒 Privacy Notice</div>
              <ul style={{ paddingLeft: '1.25rem', color: '#4b5563', fontSize: '0.875rem', lineHeight: 2 }}>
                <li>Your phone number is never shared publicly</li>
                <li>Contact only via in-app secure chat</li>
                <li>Admin moderates all communications</li>
                <li>Only required details are shown publicly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

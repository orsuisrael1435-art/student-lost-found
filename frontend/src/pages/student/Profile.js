import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE','ECE','EEE','Mechanical','Civil','Chemical','MBA','MCA','BSc','BCA','Other'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    department: user?.department || '', year: user?.year || '', section: user?.section || ''
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePw = e => setPwForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await api.put('/users/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated! ✅');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  const changePassword = async e => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await api.put('/users/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed! 🔒');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPwLoading(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 My Profile</h1>
        <p className="page-subtitle">Manage your account and settings</p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#7c3aed)', height: 90, borderRadius: '10px 10px 0 0' }} />
        <div style={{ padding: '0 1.5rem 1.5rem', position: 'relative' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: '#dbeafe',
            border: '4px solid white', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800,
            color: '#2563eb', marginTop: -40, marginBottom: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            {initials}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.2rem' }}>{user?.name}</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                {user?.student_id} • {user?.department} • Year {user?.year}{user?.section ? ` Section ${user?.section}` : ''}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.2rem' }}>{user?.email}</div>
            </div>
            <span className={`badge ${user?.role === 'student' ? 'badge-success' : 'badge-primary'}`} style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>✏️ Edit Profile</div>
        <div className={`tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>🔒 Password</div>
      </div>

      {activeTab === 'profile' ? (
        <div className="card">
          <div className="card-header"><span className="section-title">Personal Information</span></div>
          <div className="card-body">
            <form onSubmit={saveProfile}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input name="name" value={form.name} onChange={handle} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input name="phone" value={form.phone} onChange={handle} className="form-control" placeholder="10-digit number" maxLength={10} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select name="department" value={form.department} onChange={handle} className="form-control">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select name="year" value={form.year} onChange={handle} className="form-control">
                    {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input name="section" value={form.section} onChange={handle} className="form-control" maxLength={5} placeholder="e.g. A" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email (read-only)</label>
                <input value={user?.email} className="form-control" disabled style={{ background: '#f9fafb', color: '#9ca3af' }} />
                <div className="form-hint">Email cannot be changed. Contact admin if needed.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Student ID (read-only)</label>
                <input value={user?.student_id} className="form-control" disabled style={{ background: '#f9fafb', color: '#9ca3af' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><span className="section-title">🔒 Change Password</span></div>
          <div className="card-body">
            <form onSubmit={changePassword} style={{ maxWidth: 420 }}>
              <div className="form-group">
                <label className="form-label">Current Password <span className="required">*</span></label>
                <input name="current_password" type="password" value={pwForm.current_password}
                  onChange={handlePw} className="form-control" required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password <span className="required">*</span></label>
                <input name="new_password" type="password" value={pwForm.new_password}
                  onChange={handlePw} className="form-control" required />
                <div className="form-hint">Minimum 8 chars with uppercase, lowercase, and number</div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password <span className="required">*</span></label>
                <input name="confirm_password" type="password" value={pwForm.confirm_password}
                  onChange={handlePw} className="form-control" required />
                {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                  <div className="form-error">Passwords do not match</div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? '⏳ Changing...' : '🔒 Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

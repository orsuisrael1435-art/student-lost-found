import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE','ECE','EEE','Mechanical','Civil','Chemical','MBA','MCA','BSc','BCA','Other'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', student_id:'', email:'', phone:'', department:'', year:'', section:'', password:'', confirm_password:'' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [step, setStep] = useState(1);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const nextStep = (e) => {
    e.preventDefault();
    if (!form.name || !form.student_id || !form.email) { toast.error('Please fill required fields'); return; }
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f0f4ff,#e8edff)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
      <div style={{width:'100%',maxWidth:500}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🎓</div>
          <h1 style={{fontSize:'1.5rem',fontWeight:800,color:'#1e293b'}}>Create Your Account</h1>
          <p style={{color:'#6b7280',marginTop:'0.25rem'}}>Join Campus Lost &amp; Found Portal</p>
          <div style={{display:'flex',gap:'0.5rem',justifyContent:'center',marginTop:'1rem'}}>
            {[1,2].map(s => (
              <div key={s} style={{width:80,height:4,borderRadius:2,background: step >= s ? '#2563eb' : '#e5e7eb'}} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div style={{fontWeight:700}}>{step === 1 ? '📋 Basic Information' : '🔒 Account Security'}</div></div>
          <div className="card-body">
            {step === 1 ? (
              <form onSubmit={nextStep}>
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input name="name" value={form.name} onChange={handle} className="form-control" placeholder="Alex Johnson" required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Student ID <span className="required">*</span></label>
                    <input name="student_id" value={form.student_id} onChange={handle} className="form-control" placeholder="21CSE001" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input name="phone" value={form.phone} onChange={handle} className="form-control" placeholder="9876543210" maxLength={10} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">College Email <span className="required">*</span></label>
                  <input name="email" type="email" value={form.email} onChange={handle} className="form-control" placeholder="yourname@college.edu" required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select name="department" value={form.department} onChange={handle} className="form-control">
                      <option value="">Select Dept.</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select name="year" value={form.year} onChange={handle} className="form-control">
                      <option value="">Select Year</option>
                      {[1,2,3,4,5,6].map(y => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input name="section" value={form.section} onChange={handle} className="form-control" placeholder="A" maxLength={5} />
                </div>
                <button type="submit" className="btn btn-primary btn-block btn-lg">Next →</button>
              </form>
            ) : (
              <form onSubmit={submit}>
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <div style={{position:'relative'}}>
                    <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle} className="form-control" placeholder="Min 8 chars, uppercase, number" required />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer'}}>{showPw ? '🙈' : '👁️'}</button>
                  </div>
                  <div className="form-hint">Must contain uppercase, lowercase and a number</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password <span className="required">*</span></label>
                  <input name="confirm_password" type="password" value={form.confirm_password} onChange={handle} className="form-control" placeholder="Repeat your password" required />
                  {form.confirm_password && form.password !== form.confirm_password && <div className="form-error">Passwords do not match</div>}
                </div>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{flex:1}} disabled={loading}>
                    {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Creating...</> : '🎉 Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:'1rem'}}>
          <span style={{color:'#6b7280',fontSize:'0.875rem'}}>Already have an account? <Link to="/login" style={{fontWeight:600}}>Sign In</Link></span>
        </div>
      </div>
    </div>
  );
}

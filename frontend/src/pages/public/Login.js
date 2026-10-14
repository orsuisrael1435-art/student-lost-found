import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(['admin','superadmin'].includes(user.role) ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  const fillDemo = (role) => {
    if (role === 'student') setForm({ email: 'israel@college.edu', password: 'Password@123' });
    else if (role === 'admin') setForm({ email: 'admin@college.edu', password: 'Password@123' });
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#f0f4ff,#e8edff)',display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:'3rem',marginBottom:'0.5rem'}}>🎓</div>
          <h1 style={{fontSize:'1.5rem',fontWeight:800,color:'#1e293b'}}>Welcome Back</h1>
          <p style={{color:'#6b7280',marginTop:'0.25rem'}}>Sign in to Campus Lost &amp; Found Portal</p>
        </div>
        <div className="card">
          <div className="card-body">
            {/* Demo Quick Login */}
            <div style={{background:'#f0f9ff',borderRadius:8,padding:'0.875rem',marginBottom:'1.5rem',border:'1px solid #bae6fd'}}>
              <div style={{fontSize:'0.75rem',fontWeight:700,color:'#0369a1',marginBottom:'0.5rem'}}>🔑 DEMO CREDENTIALS</div>
              <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                <button className="btn btn-sm" style={{background:'#0ea5e9',color:'white',fontSize:'0.75rem'}} onClick={() => fillDemo('student')}>Student Login</button>
                <button className="btn btn-sm" style={{background:'#7c3aed',color:'white',fontSize:'0.75rem'}} onClick={() => fillDemo('admin')}>Admin Login</button>
              </div>
              <div style={{fontSize:'0.7rem',color:'#6b7280',marginTop:'0.5rem'}}>Password: Password@123</div>
            </div>

            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Email or Student ID</label>
                <input name="email" value={form.email} onChange={handle} className="form-control" placeholder="israel@college.edu or 21CSE001" autoComplete="email" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{position:'relative'}}>
                  <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={handle} className="form-control" placeholder="Enter your password" style={{paddingRight:'2.5rem'}} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:'1rem'}}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                {loading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}} /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div style={{textAlign:'center',marginTop:'1.25rem',color:'#6b7280',fontSize:'0.875rem'}}>
              Don't have an account? <Link to="/register" style={{fontWeight:600}}>Register here</Link>
            </div>
          </div>
        </div>
        <div style={{textAlign:'center',marginTop:'1rem'}}>
          <Link to="/" style={{color:'#6b7280',fontSize:'0.875rem'}}>← Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

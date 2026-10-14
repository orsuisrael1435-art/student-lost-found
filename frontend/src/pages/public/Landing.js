import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const steps = [
    { n: 1, icon: '📝', title: 'Report Your Item', desc: 'Submit details about the item you lost or found on campus.' },
    { n: 2, icon: '🤖', title: 'Smart Matching', desc: 'Our algorithm automatically compares reports and finds possible matches.' },
    { n: 3, icon: '💬', title: 'Secure Contact', desc: 'Connect safely through our in-app messaging system.' },
    { n: 4, icon: '🤝', title: 'Handover & Confirm', desc: 'Arrange a safe handover and confirm the item is returned.' },
  ];
  const categories = [
    { icon: '📱', name: 'Mobile Phone' }, { icon: '💻', name: 'Laptop' }, { icon: '👛', name: 'Wallet' },
    { icon: '🪪', name: 'ID Card' }, { icon: '🔑', name: 'Keys' }, { icon: '📚', name: 'Books' },
    { icon: '🎒', name: 'Bag' }, { icon: '⌚', name: 'Watch' },
  ];
  return (
    <div>
      {/* Nav */}
      <nav style={{background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <span style={{fontSize:'1.5rem'}}>🎓</span>
          <span style={{fontWeight:800,fontSize:'1.1rem',color:'#1e293b'}}>Campus Lost &amp; Found</span>
        </div>
        <div style={{display:'flex',gap:'0.75rem',alignItems:'center'}}>
          <Link to="/how-it-works" style={{color:'#374151',fontWeight:500,fontSize:'0.9rem',textDecoration:'none'}}>How It Works</Link>
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="landing-hero">
        <h1 className="hero-title">Found Something? Lost Something?<br />We Can Help! 🎯</h1>
        <p className="hero-subtitle">A smart Lost &amp; Found portal for college students. Report items, get matched automatically, and reconnect with your belongings.</p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-hero" style={{background:'white',color:'#2563eb'}}>Get Started Free</Link>
          <Link to="/lost-items" className="btn btn-hero" style={{background:'rgba(255,255,255,0.15)',color:'white',border:'2px solid rgba(255,255,255,0.4)'}}>Browse Lost Items</Link>
        </div>
        <div style={{marginTop:'3rem',display:'flex',gap:'2.5rem',justifyContent:'center',flexWrap:'wrap'}}>
          {[['500+','Items Reported'],['85%','Return Rate'],['48h','Avg. Return Time'],['3','College Buildings']].map(([val,label]) => (
            <div key={label} style={{textAlign:'center'}}>
              <div style={{fontSize:'1.75rem',fontWeight:800}}>{val}</div>
              <div style={{fontSize:'0.8rem',opacity:0.75,marginTop:'0.2rem'}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{background:'white',padding:'4rem 1.5rem'}}>
        <div className="container">
          <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:800,marginBottom:'0.5rem'}}>How It Works</h2>
          <p style={{textAlign:'center',color:'#6b7280',marginBottom:'3rem'}}>Simple 4-step process to recover your lost items</p>
          <div className="grid-4">
            {steps.map(s => (
              <div key={s.n} className="how-step">
                <div className="step-number">{s.n}</div>
                <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>{s.icon}</div>
                <h3 style={{fontWeight:700,marginBottom:'0.5rem'}}>{s.title}</h3>
                <p style={{color:'#6b7280',fontSize:'0.9rem'}}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{padding:'4rem 1.5rem',background:'#f9fafb'}}>
        <div className="container">
          <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:800,marginBottom:'0.5rem'}}>Item Categories</h2>
          <p style={{textAlign:'center',color:'#6b7280',marginBottom:'3rem'}}>We handle all types of lost &amp; found items</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:'1rem'}}>
            {categories.map(c => (
              <div key={c.name} style={{background:'white',borderRadius:12,padding:'1.25rem',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',transition:'transform 0.2s'}} onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform=''}>
                <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>{c.icon}</div>
                <div style={{fontSize:'0.8rem',fontWeight:600,color:'#374151'}}>{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',color:'white',padding:'4rem 1.5rem',textAlign:'center'}}>
        <h2 style={{fontSize:'2rem',fontWeight:800,marginBottom:'1rem'}}>Ready to Find Your Lost Item?</h2>
        <p style={{opacity:0.85,marginBottom:'2rem',fontSize:'1.1rem'}}>Join thousands of students using the campus portal.</p>
        <Link to="/register" className="btn btn-lg" style={{background:'white',color:'#2563eb',borderRadius:'99px'}}>Create Free Account</Link>
      </div>

      {/* Footer */}
      <footer style={{background:'#1e293b',color:'rgba(255,255,255,0.6)',padding:'2rem 1.5rem',textAlign:'center',fontSize:'0.875rem'}}>
        <p>© 2026 Campus Lost &amp; Found Portal. All rights reserved.</p>
        <p style={{marginTop:'0.5rem',opacity:0.5}}>Built for students, by students.</p>
      </footer>
    </div>
  );
}

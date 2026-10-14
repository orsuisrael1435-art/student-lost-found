import React from 'react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return (
    <div>
      <nav style={{background:'white',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link to="/" style={{display:'flex',alignItems:'center',gap:'0.5rem',textDecoration:'none'}}>
          <span style={{fontSize:'1.5rem'}}>🎓</span>
          <span style={{fontWeight:800,color:'#1e293b'}}>Campus Lost &amp; Found</span>
        </Link>
        <div style={{display:'flex',gap:'0.75rem'}}>
          <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </div>
      </nav>
      <div style={{padding:'4rem 1.5rem',maxWidth:800,margin:'0 auto'}}>
        <h1 style={{fontSize:'2rem',fontWeight:800,marginBottom:'0.5rem'}}>How It Works</h1>
        <p style={{color:'#6b7280',marginBottom:'3rem'}}>A complete guide to using the Campus Lost & Found Portal</p>
        {[
          { step:1, title:'Register & Login', icon:'👤', desc:'Create your account using your college email and student ID. Your information is secure and only shared when you choose to connect with another student.' },
          { step:2, title:'Report Lost or Found Item', icon:'📋', desc:'Fill in the item details — name, category, colour, brand, location, date, and optionally upload a photo. The more detail you provide, the better the matching.' },
          { step:3, title:'Automatic Smart Matching', icon:'🤖', desc:'Our algorithm instantly compares your report against all existing reports. It scores each pair on item name, category, colour, brand, building, room, date, and description — up to 100 points.' },
          { step:4, title:'View Match & Request Contact', icon:'🎯', desc:'If a match is found (50%+ score), both students are notified. The owner can request contact; the finder can accept, reject, or ask for more information.' },
          { step:5, title:'Secure Chat', icon:'💬', desc:'Once contact is accepted, both students can chat through our secure in-app messaging. Personal contact details are never exposed.' },
          { step:6, title:'Schedule Handover', icon:'📅', desc:'Arrange to meet at a safe campus location (Security Office, Help Desk, Admin Office) and exchange the item.' },
          { step:7, title:'Confirm & Close', icon:'✅', desc:'Both parties confirm the handover. The system marks the case as RETURNED. A success notification is sent to both students.' },
        ].map(s => (
          <div key={s.step} style={{display:'flex',gap:'1.5rem',marginBottom:'2.5rem',alignItems:'flex-start'}}>
            <div style={{width:56,height:56,borderRadius:'50%',background:'#2563eb',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1.25rem',flexShrink:0}}>{s.step}</div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
                <span style={{fontSize:'1.5rem'}}>{s.icon}</span>
                <h3 style={{fontWeight:700,fontSize:'1.1rem'}}>{s.title}</h3>
              </div>
              <p style={{color:'#4b5563',lineHeight:1.7}}>{s.desc}</p>
            </div>
          </div>
        ))}
        <div style={{background:'linear-gradient(135deg,#2563eb,#7c3aed)',borderRadius:16,padding:'2rem',textAlign:'center',color:'white',marginTop:'3rem'}}>
          <h2 style={{fontSize:'1.5rem',fontWeight:800,marginBottom:'1rem'}}>Ready to Get Started?</h2>
          <Link to="/register" className="btn btn-lg" style={{background:'white',color:'#2563eb',borderRadius:99}}>Create Your Account</Link>
        </div>
      </div>
    </div>
  );
}

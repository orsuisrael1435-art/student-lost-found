import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const NAV = [
  { section: 'MAIN', items: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/lost-items', icon: '🔍', label: 'Lost Items' },
    { to: '/found-items', icon: '✅', label: 'Found Items' },
    { to: '/matches', icon: '🎯', label: 'My Matches' },
  ]},
  { section: 'REPORT', items: [
    { to: '/report-lost', icon: '📋', label: 'Report Lost Item' },
    { to: '/report-found', icon: '📦', label: 'Report Found Item' },
  ]},
  { section: 'ACCOUNT', items: [
    { to: '/my-reports', icon: '📁', label: 'My Reports' },
    { to: '/messages', icon: '💬', label: 'Messages' },
    { to: '/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ]},
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications?limit=1');
        setNotifCount(res.data.unread_count || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [location]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="layout">
      {/* Sidebar Overlay on mobile */}
      {sidebarOpen && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99}} onClick={() => setSidebarOpen(false)} />}

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{fontSize:'1.5rem', marginBottom:'0.25rem'}}>🎓</div>
          <div className="sidebar-logo-title">Lost &amp; Found</div>
          <div className="sidebar-logo-sub">Campus Portal</div>
        </div>

        <div className="sidebar-nav">
          {NAV.map(section => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                  {item.to === '/notifications' && notifCount > 0 && (
                    <span style={{marginLeft:'auto',background:'#ef4444',color:'white',fontSize:'0.7rem',fontWeight:700,borderRadius:'99px',padding:'0.1rem 0.45rem'}}>{notifCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.75rem'}}>
            <div className="avatar">{initials}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'0.85rem',fontWeight:600,color:'white',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.name}</div>
              <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.5)'}}>{user?.student_id} • {user?.department}</div>
            </div>
          </div>
          {['admin','superadmin'].includes(user?.role) && (
            <button className="btn btn-outline btn-sm btn-block" style={{marginBottom:'0.5rem',color:'#93c5fd',borderColor:'#93c5fd'}} onClick={() => navigate('/admin')}>
              🔧 Admin Panel
            </button>
          )}
          <button className="btn btn-ghost btn-sm btn-block" style={{color:'rgba(255,255,255,0.6)'}} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </nav>

      <div className="main-content">
        <header className="main-header">
          <button className="btn btn-ghost btn-icon" style={{display:'none',marginRight:'1rem'}} id="menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <button className="btn btn-ghost btn-icon" style={{marginRight:'1rem'}} onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div style={{flex:1}} />
          <NavLink to="/notifications" style={{position:'relative',marginRight:'0.5rem'}}>
            <button className="btn btn-ghost btn-icon" style={{fontSize:'1.25rem'}}>🔔</button>
            {notifCount > 0 && <span style={{position:'absolute',top:'4px',right:'4px',width:'9px',height:'9px',background:'#ef4444',borderRadius:'50%',border:'2px solid white'}} />}
          </NavLink>
          <NavLink to="/profile">
            <div className="avatar" style={{cursor:'pointer'}}>{initials}</div>
          </NavLink>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

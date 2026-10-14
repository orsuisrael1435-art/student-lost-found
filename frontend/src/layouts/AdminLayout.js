import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_NAV = [
  { section: 'OVERVIEW', items: [
    { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
    { to: '/admin/analytics', icon: '📈', label: 'Analytics' },
  ]},
  { section: 'MANAGE', items: [
    { to: '/admin/users', icon: '👥', label: 'Students' },
    { to: '/admin/lost-items', icon: '🔍', label: 'Lost Items' },
    { to: '/admin/found-items', icon: '✅', label: 'Found Items' },
    { to: '/admin/matches', icon: '🎯', label: 'Matches' },
  ]},
  { section: 'SETTINGS', items: [
    { to: '/admin/categories', icon: '🏷️', label: 'Categories' },
    { to: '/admin/buildings', icon: '🏛️', label: 'Buildings & Rooms' },
  ]},
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="layout">
      {sidebarOpen && <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:99}} onClick={() => setSidebarOpen(false)} />}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{background:'linear-gradient(180deg,#1e1b4b,#0f0a2b)'}}>
        <div className="sidebar-logo">
          <div style={{fontSize:'1.5rem',marginBottom:'0.25rem'}}>🔧</div>
          <div className="sidebar-logo-title">Admin Panel</div>
          <div className="sidebar-logo-sub">Lost &amp; Found Portal</div>
        </div>
        <div className="sidebar-nav">
          {ADMIN_NAV.map(section => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <span className="nav-item-icon">{item.icon}</span>{item.label}
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
              <div style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.5)',textTransform:'capitalize'}}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-block" style={{color:'#a5b4fc',marginBottom:'0.5rem'}} onClick={() => navigate('/dashboard')}>← Student View</button>
          <button className="btn btn-ghost btn-sm btn-block" style={{color:'rgba(255,255,255,0.5)'}} onClick={handleLogout}>🚪 Logout</button>
        </div>
      </nav>
      <div className="main-content">
        <header className="main-header">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div style={{flex:1}} />
          <span style={{fontSize:'0.85rem',color:'#6b7280',marginRight:'0.75rem'}}>👤 {user?.name} <span style={{color:'#9ca3af'}}>({user?.role})</span></span>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#059669'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data.dashboard))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const runMatching = async () => {
    setMatching(true);
    try {
      const res = await api.post('/admin/run-matching');
      toast.success(res.data.message);
    } catch { toast.error('Matching failed'); }
    finally { setMatching(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  const s = data?.stats || {};

  const STAT_CARDS = [
    { label: 'Total Students', value: s.total_students, icon: '👥', color: '#dbeafe', border: '#93c5fd' },
    { label: 'Lost Reports', value: s.total_lost, icon: '🔍', color: '#fee2e2', border: '#fca5a5' },
    { label: 'Found Reports', value: s.total_found, icon: '📦', color: '#dcfce7', border: '#86efac' },
    { label: 'Total Matches', value: s.total_matches, icon: '🎯', color: '#ede9fe', border: '#c4b5fd' },
    { label: 'Items Returned', value: s.returned, icon: '✅', color: '#dcfce7', border: '#4ade80' },
    { label: 'Pending Approval', value: s.pending_approval, icon: '⏳', color: '#fef3c7', border: '#fcd34d' },
    { label: 'Return Rate', value: `${s.return_rate || 0}%`, icon: '📈', color: '#f0fdf4', border: '#86efac' },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📊 Admin Dashboard</h1>
          <p className="page-subtitle">Campus Lost & Found Portal — Overview</p>
        </div>
        <button className="btn btn-primary" onClick={runMatching} disabled={matching}>
          {matching ? '⏳ Running...' : '🤖 Run Smart Matching'}
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {STAT_CARDS.map(c => (
          <div key={c.label} style={{ background: c.color, borderRadius: 12, padding: '1.25rem', border: `2px solid ${c.border}` }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{c.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{c.value ?? 0}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header"><span className="section-title">📊 Lost Items by Category</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(data?.lost_by_category || []).slice(0, 7)}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="section-title">📊 Found Items by Category</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={(data?.found_by_category || []).slice(0, 6)} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {(data?.found_by_category || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header"><span className="section-title">📈 Monthly Reports Trend (Last 6 Months)</span></div>
        <div className="card-body">
          {(data?.monthly_trend || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthly_trend.reduce((acc, d) => {
                const ex = acc.find(x => x.month === d.month);
                if (ex) ex[d.type] = parseInt(d.count);
                else acc.push({ month: d.month, [d.type]: parseInt(d.count) });
                return acc;
              }, [])}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="lost" fill="#dc2626" radius={[4, 4, 0, 0]} name="Lost" />
                <Bar dataKey="found" fill="#16a34a" radius={[4, 4, 0, 0]} name="Found" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}><p>No trend data yet</p></div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid-4">
        {[
          { to: '/admin/users', icon: '👥', label: 'Manage Students' },
          { to: '/admin/lost-items', icon: '🔍', label: 'Lost Reports' },
          { to: '/admin/found-items', icon: '📦', label: 'Found Reports' },
          { to: '/admin/matches', icon: '🎯', label: 'View Matches' },
        ].map(l => (
          <Link key={l.to} to={l.to} className="card" style={{ textDecoration: 'none', textAlign: 'center', padding: '1.5rem', cursor: 'pointer' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{l.icon}</div>
            <div style={{ fontWeight: 600, color: '#374151' }}>{l.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      {data?.recent_activity?.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="card-header"><span className="section-title">🕐 Recent Activity</span></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>User</th><th>Action</th><th>Description</th><th>Time</th></tr></thead>
              <tbody>
                {data.recent_activity.slice(0, 10).map(log => (
                  <tr key={log.id}>
                    <td><span style={{ fontWeight: 600 }}>{log.user_name || 'System'}</span></td>
                    <td><span className="badge badge-gray" style={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{log.action}</span></td>
                    <td style={{ maxWidth: 280, fontSize: '0.85rem', color: '#4b5563' }}>{log.description}</td>
                    <td style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#db2777','#059669'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(r => setData(r.data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>;

  const returnRate = data?.success_rate
    ? ((parseInt(data.success_rate.returned) / Math.max(1, parseInt(data.success_rate.total))) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Analytics</h1>
        <p className="page-subtitle">Insights and performance metrics for the portal</p>
      </div>

      {/* Key Metrics */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Matches', value: data?.success_rate?.total || 0, icon: '🎯', color: '#dbeafe' },
          { label: 'Items Returned', value: data?.success_rate?.returned || 0, icon: '✅', color: '#dcfce7' },
          { label: 'Return Rate', value: `${returnRate}%`, icon: '📊', color: '#f0fdf4' },
          { label: 'Avg Match Score', value: `${data?.avg_match_score || 0}%`, icon: '🏆', color: '#fef3c7' },
        ].map(c => (
          <div key={c.label} style={{ background: c.color, borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{c.icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.25rem' }}>{c.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Top Categories */}
        <div className="card">
          <div className="card-header"><span className="section-title">📊 Top Lost Item Categories</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.top_categories || []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Buildings */}
        <div className="card">
          <div className="card-header"><span className="section-title">🏢 Reports by Building</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.top_buildings || []} dataKey="reports" nameKey="building" cx="50%" cy="50%" outerRadius={80}
                  label={({ building, percent }) => `${building} ${(percent * 100).toFixed(0)}%`}>
                  {(data?.top_buildings || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="card">
        <div className="card-header"><span className="section-title">📅 Last 7 Days — Daily Reports</span></div>
        <div className="card-body">
          {(data?.weekly_reports || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(data?.weekly_reports || []).reduce((acc, d) => {
                const ex = acc.find(x => x.day === d.day);
                if (ex) ex[d.type] = parseInt(d.count);
                else acc.push({ day: d.day, [d.type]: parseInt(d.count) });
                return acc;
              }, [])}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="lost" fill="#dc2626" radius={[3, 3, 0, 0]} name="Lost" />
                <Bar dataKey="found" fill="#16a34a" radius={[3, 3, 0, 0]} name="Found" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No data for last 7 days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

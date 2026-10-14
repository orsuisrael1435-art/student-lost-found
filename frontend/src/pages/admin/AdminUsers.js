import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users); setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (userId, name) => {
    if (userId === me?.id) { toast.error("Can't deactivate yourself"); return; }
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: res.data.user.is_active } : u));
      toast.success(`${name} ${res.data.user.is_active ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Action failed'); }
  };

  const changeRole = async (userId, newRole, name) => {
    if (me?.role !== 'superadmin') { toast.error('Super Admin only'); return; }
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`${name}'s role changed to ${newRole}`);
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"? All their reports will also be deleted.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`User ${name} deleted`);
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👥 Students & Users</h1>
        <p className="page-subtitle">{pagination.total || 0} total users in the system</p>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <span>🔍</span>
            <input placeholder="Search by name, email, or student ID..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: 140 }} value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
            <option value="superadmin">Super Admins</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); }}>Clear</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th><th>ID / Email</th><th>Department</th>
                <th>Reports</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Year {u.year} {u.section && `• Sec ${u.section}`}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{u.student_id}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{u.email}</div>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{u.department}</td>
                  <td>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{u.lost_count}</span> lost /
                    <span style={{ color: '#16a34a', fontWeight: 600 }}> {u.found_count}</span> found
                  </td>
                  <td>
                    {me?.role === 'superadmin' ? (
                      <select className="form-control" style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', width: 120 }}
                        value={u.role} onChange={e => changeRole(u.id, e.target.value, u.name)}>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`badge ${u.role === 'student' ? 'badge-success' : 'badge-primary'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => toggleActive(u.id, u.name)} disabled={u.id === me?.id}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      {me?.role === 'superadmin' && u.id !== me?.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.name)}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>← Prev</button>
          <span style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>Page {page}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => p+1)} disabled={users.length < 20}>Next →</button>
        </div>
      )}
    </div>
  );
}

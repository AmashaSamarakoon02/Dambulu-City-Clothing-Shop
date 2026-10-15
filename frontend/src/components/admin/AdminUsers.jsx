import React, { useEffect, useState } from 'react';
import { Users, Trash2, Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { formatDate } from '../../utils/format';

const ROLES = ['USER', 'EMPLOYEE', 'ADMIN', 'DELIVERY'];
const ROLE_LABELS = { USER: 'Customer', EMPLOYEE: 'Employee', ADMIN: 'Admin', DELIVERY: 'Delivery' };

const roleBadgeClasses = {
  ADMIN: 'bg-purple-700 text-white',
  EMPLOYEE: 'bg-amber-600 text-white',
  USER: 'bg-black text-white',
  DELIVERY: 'bg-blue-600 text-white'
};

// Admin view of all accounts: change roles, remove accounts without orders.
const AdminUsers = () => {
  const { admin: currentUser } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    axiosInstance.get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch(() => setError('Could not load accounts.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (target, role) => {
    if (role === 'ADMIN' && !window.confirm(`Give ${target.name} full admin access?`)) return;
    try {
      const res = await axiosInstance.put(`/admin/users/${target.id}/role`, { role });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, ...res.data } : u)));
      toast.success(`${target.name} is now ${ROLE_LABELS[role]}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update role');
    }
  };

  const handleDelete = async (target) => {
    if (!window.confirm(`Delete the account for "${target.name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/admin/users/${target.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
      toast.success('Account deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete account');
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    return (roleFilter === 'ALL' || u.role === roleFilter)
      && (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone || '').includes(q));
  });

  const counts = users.reduce((acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }), {});

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="text-xl font-light tracking-wide flex items-center gap-3"><Users className="h-5 w-5" /> Customer Accounts</h2>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-widest text-gray-500">
          {ROLES.map((r) => <span key={r}>{ROLE_LABELS[r]}s: <strong className="text-gray-900">{counts[r] || 0}</strong></span>)}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none text-sm rounded"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-gray-200 bg-gray-50 text-sm rounded px-4 py-2.5">
          <option value="ALL">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-gray-500 border-b border-gray-200">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Contact</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4 text-right">Orders</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-gray-900">{u.name} {isSelf && <span className="text-xs text-gray-500">(you)</span>}</div>
                      {!u.isVerified && <div className="text-[11px] text-amber-600">Email not verified</div>}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      <div>{u.email}</div>
                      {u.phone && <div className="text-xs text-gray-500">{u.phone}</div>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase ${roleBadgeClasses[u.role] || 'bg-gray-200 text-gray-700'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{u.orderCount ?? 0}</td>
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-black disabled:opacity-40"
                          aria-label={`Role for ${u.name}`}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isSelf || u.orderCount > 0}
                          title={isSelf ? 'You cannot delete your own account' : u.orderCount > 0 ? 'Accounts with orders are kept for order history' : 'Delete account'}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">No accounts match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

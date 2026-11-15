import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, Loader2, RefreshCw, Banknote, ShoppingBag, TrendingUp, Users, PlusCircle, Clock, PackageX, Tags, Store, Trophy, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../../api/axiosInstance';
import { formatPrice, imageUrl } from '../../utils/format';
import { ORDER_STATUS } from '../../constants/shop';

const compactLkr = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)));
const shortDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const STATUS_COLORS = {
  PENDING: '#d97706',
  CONFIRMED: '#2563eb',
  PROCESSING: '#4f46e5',
  SHIPPED: '#9333ea',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626'
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const Card = ({ title, icon: Icon, action, children, className = '' }) => (
  <section className={`bg-white border border-line rounded-2xl shadow-sm shadow-black/5 p-5 sm:p-6 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="text-base font-semibold flex items-center gap-2 text-luxe-dark">
          {Icon && <Icon className="w-5 h-5 text-accent" />} {title}
        </h3>
        {action}
      </div>
    )}
    {children}
  </section>
);

const StatCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="bg-white border border-line rounded-2xl shadow-sm shadow-black/5 p-5 flex items-start gap-4">
    <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}>
      <Icon className="w-6 h-6" />
    </span>
    <div className="min-w-0">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-semibold mt-0.5 tabular-nums text-luxe-dark truncate">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, to, badge }) => {
  const cls = 'group relative flex items-center gap-3 bg-white border border-line rounded-2xl px-4 py-3.5 text-sm font-medium text-luxe-dark hover:border-accent hover:shadow-md hover:shadow-black/5 transition-all';
  const inner = (
    <>
      <span className="w-9 h-9 rounded-xl bg-page-alt text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge > 0 && <span className="min-w-6 h-6 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{badge}</span>}
    </>
  );
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
};

const RevenueTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-line shadow-lg rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-500">{shortDate(d.date)}</p>
      <p className="font-semibold tabular-nums text-sm">{formatPrice(d.revenue)}</p>
      <p className="text-gray-500">{d.orders} order{d.orders === 1 ? '' : 's'}</p>
    </div>
  );
};

const AdminDashboard = ({ onNavigate, adminName }) => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    axiosInstance.get('/admin/reports')
      .then((res) => setReport(res.data))
      .catch(() => setError('Could not load the sales report.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !report) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
  if (error) return <div className="text-center py-20 text-gray-600">{error} <button onClick={load} className="underline ml-2">Retry</button></div>;

  const statusData = Object.entries(ORDER_STATUS).map(([key, meta]) => ({ key, name: meta.label, value: report.ordersByStatus[key] || 0 }));
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0);
  const monthRevenue = report.dailySales.reduce((s, d) => s + d.revenue, 0);
  const topMax = Math.max(...report.topProducts.map((p) => p.unitsSold), 1);
  const firstName = (adminName || '').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-light text-luxe-dark">{greeting()}{firstName ? `, ${firstName}` : ''} 👋</h2>
          <p className="text-sm text-gray-600 mt-1">Here is how Dambulla City Clothing Shop is doing.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-gray-700 hover:border-accent hover:text-accent-dark">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Banknote} tone="bg-accent-soft text-accent-dark" label="Total revenue" value={formatPrice(report.totalRevenue)} hint="Excludes cancelled orders" />
        <StatCard icon={ShoppingBag} tone="bg-blue-50 text-blue-700" label="Total orders" value={report.totalOrders} hint={`${report.pendingOrders} awaiting fulfilment`} />
        <StatCard icon={TrendingUp} tone="bg-green-50 text-green-700" label="Average order" value={formatPrice(report.averageOrderValue)} hint={`${formatPrice(monthRevenue)} in the last 30 days`} />
        <StatCard icon={Users} tone="bg-purple-50 text-purple-700" label="Customers" value={report.customerCount} hint={`${report.productCount} products listed`} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <QuickAction icon={PlusCircle} label="Add product" onClick={() => onNavigate('products', { add: true })} />
        <QuickAction icon={Clock} label="Pending orders" badge={report.ordersByStatus.PENDING || 0} onClick={() => onNavigate('orders', { status: 'PENDING' })} />
        <QuickAction icon={PackageX} label="Low stock" badge={report.lowStockProducts.length} onClick={() => onNavigate('products', { lowStock: true })} />
        <QuickAction icon={Tags} label="Categories" onClick={() => onNavigate('categories')} />
        <QuickAction icon={Store} label="View store" to="/home" />
      </div>

      {/* Charts */}
      <div className="grid xl:grid-cols-3 gap-6">
        <Card
          title="Revenue · last 30 days"
          icon={TrendingUp}
          className="xl:col-span-2"
          action={<span className="text-sm font-semibold tabular-nums text-luxe-dark">{formatPrice(monthRevenue)}</span>}
        >
          <div className="h-64" role="img" aria-label={`Daily revenue for the last 30 days, total ${formatPrice(monthRevenue)}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.dailySales} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5e34" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5e34" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eee6da" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e7dfd3' }} minTickGap={24} />
                <YAxis tickFormatter={compactLkr} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#8b5e34', strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5e34" strokeWidth={2.5} fill="url(#revFill)" activeDot={{ r: 5, fill: '#8b5e34', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <details className="mt-3 text-xs text-gray-600">
            <summary className="cursor-pointer">View as table</summary>
            <table className="mt-2 w-full max-w-sm">
              <thead><tr className="text-left"><th className="py-1">Date</th><th className="text-right">Orders</th><th className="text-right">Revenue</th></tr></thead>
              <tbody>
                {report.dailySales.filter((d) => d.orders).map((d) => (
                  <tr key={d.date}><td className="py-0.5">{d.date}</td><td className="text-right">{d.orders}</td><td className="text-right tabular-nums">{formatPrice(d.revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>

        <Card title="Orders by status" icon={ShoppingBag}>
          <div className="relative h-44" role="img" aria-label={`Orders by status: ${statusData.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusTotal ? statusData.filter((d) => d.value) : [{ key: 'none', value: 1 }]} dataKey="value" innerRadius="62%" outerRadius="92%" paddingAngle={statusTotal ? 2 : 0} stroke="none" isAnimationActive={false}>
                  {(statusTotal ? statusData.filter((d) => d.value) : [{ key: 'none' }]).map((d) => (
                    <Cell key={d.key} fill={STATUS_COLORS[d.key] || '#e5e7eb'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-semibold tabular-nums">{statusTotal}</span>
              <span className="text-xs text-gray-500">orders</span>
            </div>
          </div>
          <ul className="mt-4 space-y-1">
            {statusData.map((d) => (
              <li key={d.key}>
                <button
                  onClick={() => onNavigate('orders', { status: d.key })}
                  className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-page-alt"
                  aria-label={`${d.name}: ${d.value} orders – show these orders`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.key] }} />
                  <span className="flex-1 text-left text-gray-700">{d.name}</span>
                  <span className="tabular-nums font-semibold">{d.value}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Lists */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Top selling products" icon={Trophy}>
          {report.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet.</p>
          ) : (
            <ol className="space-y-4">
              {report.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-[#e8c48a] text-[#1c1c1c]' : 'bg-page-alt text-gray-700'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="tabular-nums text-gray-700 shrink-0">{formatPrice(p.revenue)}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-page-alt rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${(p.unitsSold / topMax) * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums w-14 text-right">{p.unitsSold} sold</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card
          title={`Low stock (≤ ${report.lowStockThreshold})`}
          icon={AlertTriangle}
          action={report.lowStockProducts.length > 0 && (
            <button onClick={() => onNavigate('products', { lowStock: true })} className="text-sm font-medium text-accent-dark hover:underline underline-offset-4">Manage stock</button>
          )}
        >
          {report.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked. 🎉</p>
          ) : (
            <ul className="divide-y divide-line max-h-80 overflow-y-auto -mx-1">
              {report.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5 px-1">
                  <img src={imageUrl(p.image)} alt="" className="w-11 h-12 rounded-lg object-cover bg-page-alt" />
                  <span className="flex-grow text-sm">{p.name}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { formatPrice, imageUrl } from '../../utils/format';
import { ORDER_STATUS } from '../../constants/shop';

const compactLkr = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n)));

const StatTile = ({ label, value, hint }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-5">
    <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
    <p className="text-2xl md:text-3xl font-semibold mt-2 tabular-nums">{value}</p>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

// Single-series column chart of daily revenue (30 days) with per-bar hover tooltip.
const SalesChart = ({ data }) => {
  const [hover, setHover] = useState(null);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const ticks = [max, max / 2, 0];
  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <figure>
      <figcaption className="flex items-baseline justify-between mb-4">
        <span className="text-sm font-semibold">Revenue · last 30 days</span>
        <span className="text-sm text-gray-600 tabular-nums">{formatPrice(total)}</span>
      </figcaption>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between text-[10px] text-gray-500 tabular-nums h-48 py-0 text-right w-10 shrink-0">
          {ticks.map((t, i) => <span key={i} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{compactLkr(t)}</span>)}
        </div>
        <div className="relative flex-1 h-48 border-b border-gray-300">
          {/* recessive gridlines */}
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-gray-200" />
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-200" />
          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={d.date}
                className="flex-1 h-full flex items-end cursor-default"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                tabIndex={0}
                role="img"
                aria-label={`${d.date}: ${formatPrice(d.revenue)}, ${d.orders} orders`}
              >
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-black' : 'bg-gray-700'}`}
                  style={{ height: d.revenue ? `${Math.max((d.revenue / max) * 100, 2)}%` : 0 }}
                />
              </div>
            ))}
          </div>
          {hover !== null && (
            <div
              className="absolute -top-2 z-10 -translate-y-full bg-white border border-gray-200 shadow-lg rounded-md px-3 py-2 text-xs pointer-events-none whitespace-nowrap"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: `translate(${hover > data.length / 2 ? '-100%' : '0'}, -100%)` }}
            >
              <p className="text-gray-500">{new Date(data[hover].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
              <p className="font-semibold tabular-nums">{formatPrice(data[hover].revenue)}</p>
              <p className="text-gray-500">{data[hover].orders} order{data[hover].orders === 1 ? '' : 's'}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mt-2 ml-12">
        <span>{new Date(data[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
      <details className="mt-3 text-xs text-gray-500">
        <summary className="cursor-pointer">View as table</summary>
        <table className="mt-2 w-full max-w-sm">
          <thead><tr className="text-left"><th className="py-1">Date</th><th className="text-right">Orders</th><th className="text-right">Revenue</th></tr></thead>
          <tbody>
            {data.filter((d) => d.orders).map((d) => (
              <tr key={d.date}><td className="py-0.5">{d.date}</td><td className="text-right">{d.orders}</td><td className="text-right tabular-nums">{formatPrice(d.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
};

const AdminDashboard = ({ onNavigate }) => {
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

  const statusTotal = Object.values(report.ordersByStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light tracking-wide">Sales Overview</h2>
        <button onClick={load} className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-black">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Revenue" value={formatPrice(report.totalRevenue)} hint="Excludes cancelled orders" />
        <StatTile label="Total Orders" value={report.totalOrders} hint={`${report.pendingOrders} awaiting fulfilment`} />
        <StatTile label="Avg. Order Value" value={formatPrice(report.averageOrderValue)} />
        <StatTile label="Customers" value={report.customerCount} hint={`${report.productCount} products listed`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <SalesChart data={report.dailySales} />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Orders by Status</h3>
          <ul className="space-y-3">
            {Object.entries(ORDER_STATUS).map(([key, meta]) => {
              const count = report.ordersByStatus[key] || 0;
              return (
                <li key={key}>
                  <button onClick={() => onNavigate('orders', { status: key })} className="w-full text-left group">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700 group-hover:underline">{meta.label}</span>
                      <span className="tabular-nums text-gray-900 font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-800 rounded-full" style={{ width: `${(count / statusTotal) * 100}%` }} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4">Top Selling Products</h3>
          {report.topProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-gray-500 border-b border-gray-100">
                  <th className="py-2">Product</th><th className="py-2 text-right">Units</th><th className="py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-gray-50">
                    <td className="py-2.5 pr-2">{p.name}</td>
                    <td className="py-2.5 text-right tabular-nums">{p.unitsSold}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Low Stock (≤ {report.lowStockThreshold})
            </h3>
            {report.lowStockProducts.length > 0 && (
              <button onClick={() => onNavigate('products', { lowStock: true })} className="text-xs underline underline-offset-4">Manage stock</button>
            )}
          </div>
          {report.lowStockProducts.length === 0 ? (
            <p className="text-sm text-gray-500">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {report.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <img src={imageUrl(p.image)} alt="" className="w-10 h-12 object-cover bg-gray-100" />
                  <span className="flex-grow text-sm">{p.name}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${p.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

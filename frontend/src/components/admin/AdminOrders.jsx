import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, Loader2, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import { StatusBadge, PaymentBadge, OrderTracker, OrderItemsList, OrderTotals, AddressBlock } from '../orders/OrderStatus';
import { formatDate, formatPrice } from '../../utils/format';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../constants/shop';

const OrderDrawer = ({ orderId, onClose, onUpdated }) => {
  const [order, setOrder] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    axiosInstance.get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => {
        toast.error('Could not load order');
        onClose();
      });
  }, [orderId, onClose]);

  const changeStatus = async (status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel order #${order.id}? Items will be returned to stock.`)) return;
    setUpdating(true);
    try {
      const res = await axiosInstance.put(`/orders/${order.id}/status`, { status });
      setOrder((prev) => ({ ...prev, ...res.data }));
      onUpdated();
      toast.success(`Order #${order.id} marked as ${ORDER_STATUS[status].label}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update status');
    } finally {
      setUpdating(false);
    }
  };

  const changePayment = async (paymentStatus) => {
    setUpdating(true);
    try {
      const res = await axiosInstance.put(`/orders/${order.id}/payment`, { paymentStatus });
      setOrder((prev) => ({ ...prev, ...res.data }));
      onUpdated();
      toast.success('Payment status updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update payment');
    } finally {
      setUpdating(false);
    }
  };

  const nextStatuses = order ? ORDER_STATUS_TRANSITIONS[order.status] : [];

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold">Order #{orderId}</h3>
          <button onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {!order ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Placed {formatDate(order.createdAt, true)}</p>
                <p className="text-xs text-gray-500">Account: {order.user?.name} ({order.user?.email})</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <OrderTracker status={order.status} />

            <section className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-3">Update Status</h4>
              {nextStatuses.length === 0 ? (
                <p className="text-sm text-gray-500">This order is {ORDER_STATUS[order.status].label.toLowerCase()} – no further changes.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((s) => (
                    <button
                      key={s}
                      disabled={updating}
                      onClick={() => changeStatus(s)}
                      className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest disabled:opacity-50 ${
                        s === 'CANCELLED' ? 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {s === 'CANCELLED' ? 'Cancel Order' : `Mark as ${ORDER_STATUS[s].label}`}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-1">Items</h4>
              <OrderItemsList items={order.items} />
              <div className="border-t border-gray-100 pt-3"><OrderTotals order={order} /></div>
            </section>

            <div className="grid sm:grid-cols-2 gap-6">
              <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">Deliver To</h4>
                <AddressBlock order={order} />
              </section>
              <section>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">Payment</h4>
                <p className="text-sm">{PAYMENT_METHODS[order.paymentMethod]?.label || order.paymentMethod}</p>
                <p className="text-sm mt-1">Status: <PaymentBadge status={order.paymentStatus} /></p>
                {order.status !== 'CANCELLED' && order.paymentMethod !== 'CARD' && (
                  <label className="block mt-3 text-xs text-gray-500">
                    Change payment status
                    <select
                      value={order.paymentStatus}
                      disabled={updating}
                      onChange={(e) => changePayment(e.target.value)}
                      className="block mt-1 w-full border border-gray-300 px-2 py-1.5 text-sm text-black"
                    >
                      {['PENDING', 'PAID'].map((s) => <option key={s} value={s}>{PAYMENT_STATUS[s].label}</option>)}
                    </select>
                  </label>
                )}
              </section>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

const AdminOrders = ({ initialStatus = '' }) => {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusCounts, setStatusCounts] = useState({});
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const latestRequest = useRef(0);

  const load = useCallback(() => {
    // Ignore responses that arrive after a newer request (slow network/database).
    const requestId = ++latestRequest.current;
    setLoading(true);
    axiosInstance.get('/orders', { params: { status, search: query, page, limit: 15 } })
      .then((res) => {
        if (requestId !== latestRequest.current) return;
        setOrders(res.data.data);
        setMeta(res.data.meta);
        setStatusCounts(res.data.statusCounts);
      })
      .catch(() => {
        if (requestId === latestRequest.current) toast.error('Could not load orders');
      })
      .finally(() => {
        if (requestId === latestRequest.current) setLoading(false);
      });
  }, [status, query, page]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const closeDrawer = useCallback(() => setSelectedId(null), []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-8">
      <h2 className="text-xl font-light tracking-wide mb-6 flex items-center gap-3"><ShoppingBag className="w-5 h-5" /> Orders Management</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {[['', 'All', totalAll], ...Object.entries(ORDER_STATUS).map(([k, m]) => [k, m.label, statusCounts[k] || 0])].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => { setStatus(key); setPage(1); }}
            className={`px-3 py-1.5 text-xs whitespace-nowrap border rounded-full ${status === key ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
          >
            {label} <span className="opacity-60">{count}</span>
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setQuery(search); setPage(1); }}
        className="relative mb-6"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); if (!e.target.value) { setQuery(''); setPage(1); } }}
          placeholder="Search by order #, customer name, email or phone… (press Enter)"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none text-sm rounded"
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No orders found.</p>
      ) : (
        <>
          {/* Table (desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-gray-500 border-b border-gray-200">
                  <th className="py-3 pr-4">Order</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4 text-right">Items</th>
                  <th className="py-3 pr-4 text-right">Total</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedId(o.id)}>
                    <td className="py-3 pr-4 font-semibold">#{o.id}</td>
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <div>{o.customerName || o.user?.name}</div>
                      <div className="text-xs text-gray-500">{o.phone}</div>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums whitespace-nowrap">{formatPrice(o.totalAmount)}</td>
                    <td className="py-3 pr-4">
                      <div className="text-xs">{PAYMENT_METHODS[o.paymentMethod]?.label || o.paymentMethod}</div>
                      <PaymentBadge status={o.paymentStatus} />
                    </td>
                    <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                    <td className="py-3 text-right">
                      <button className="text-xs underline underline-offset-4" onClick={(e) => { e.stopPropagation(); setSelectedId(o.id); }}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <ul className="md:hidden space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <button onClick={() => setSelectedId(o.id)} className="w-full text-left border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">#{o.id}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-sm">{o.customerName || o.user?.name}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatDate(o.createdAt)}</span>
                    <span className="font-semibold text-black">{formatPrice(o.totalAmount)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-6 text-sm">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-2 border border-gray-300 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
              <span>Page {meta.page} of {meta.totalPages}</span>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)} className="p-2 border border-gray-300 disabled:opacity-40" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}

      {selectedId && <OrderDrawer orderId={selectedId} onClose={closeDrawer} onUpdated={load} />}
    </div>
  );
};

export default AdminOrders;

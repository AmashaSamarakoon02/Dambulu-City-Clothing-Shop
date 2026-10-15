import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Loader2, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import { StatusBadge } from '../components/orders/OrderStatus';
import { imageUrl, formatPrice, formatDate } from '../utils/format';
import { ORDER_STATUS } from '../constants/shop';

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' }
];

const MyOrders = () => {
  usePageTitle('My Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    axiosInstance.get('/orders/my')
      .then((res) => setOrders(res.data))
      .catch(() => setError('We couldn’t load your orders. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const visible = orders.filter((o) => {
    if (!filter) return true;
    if (filter === 'active') return !['DELIVERED', 'CANCELLED'].includes(o.status);
    return o.status === filter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-page font-sans text-luxe-dark">
      <Navbar />
      <main className="flex-grow pt-32 md:pt-44 pb-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <nav className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
          <Link to="/profile" className="hover:text-black">My Account</Link>
          <span className="mx-2">/</span><span className="text-black">Orders</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-8">My Orders</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-xs uppercase tracking-widest border whitespace-nowrap ${
                filter === f.key ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
        ) : error ? (
          <p className="text-center text-gray-600 py-20">{error}</p>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-gray-100 text-center py-16 px-4">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
            <p className="text-gray-600 mb-6">{orders.length ? 'No orders match this filter.' : 'You haven’t placed any orders yet.'}</p>
            <Link to="/shop" className="inline-block bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800">
              Start Shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((order) => (
              <li key={order.id}>
                <Link to={`/orders/${order.id}`} className="block bg-white border border-gray-100 hover:border-gray-300 transition-colors p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold">Order #{order.id}</p>
                      <p className="text-xs text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 4).map((item) => (
                        <img key={item.id} src={imageUrl(item.productImage)} alt="" className="w-12 h-14 object-cover border-2 border-white bg-gray-100" />
                      ))}
                    </div>
                    <div className="flex-grow min-w-0 text-sm text-gray-600 truncate">
                      {order.items.map((i) => i.productName).join(', ')}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatPrice(order.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{order.items.reduce((s, i) => s + i.quantity, 0)} item(s)</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  </div>
                  {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                    <p className="text-xs text-gray-500 mt-3">{ORDER_STATUS[order.status]?.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;

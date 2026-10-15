import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import { StatusBadge, PaymentBadge, OrderTracker, OrderItemsList, OrderTotals, AddressBlock } from '../components/orders/OrderStatus';
import { formatDate, formatPrice } from '../utils/format';
import { PAYMENT_METHODS, CUSTOMER_CANCELLABLE, BANK_DETAILS } from '../constants/shop';

const OrderDetails = () => {
  const { id } = useParams();
  usePageTitle(`Order #${id}`);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    axiosInstance.get(`/orders/my/${id}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.status === 404 ? 'Order not found.' : 'We couldn’t load this order.'));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order #${order.id}? This can't be undone.`)) return;
    setCancelling(true);
    try {
      const res = await axiosInstance.post(`/orders/my/${order.id}/cancel`);
      setOrder(res.data);
      toast.success('Your order has been cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not cancel the order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-page font-sans text-luxe-dark">
      <Navbar />
      <main className="flex-grow pt-32 md:pt-44 pb-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <nav className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
          <Link to="/profile" className="hover:text-black">My Account</Link>
          <span className="mx-2">/</span>
          <Link to="/orders" className="hover:text-black">Orders</Link>
          <span className="mx-2">/</span><span className="text-black">#{id}</span>
        </nav>

        {error ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/orders" className="underline text-sm">Back to My Orders</Link>
          </div>
        ) : !order ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest">Order #{order.id}</h1>
                <p className="text-sm text-gray-500 mt-1">Placed on {formatDate(order.createdAt, true)}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <section className="bg-white border border-gray-100 p-6 sm:p-8 mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-6">Order Status</h2>
              <OrderTracker status={order.status} />
              <p className="text-xs text-gray-500 mt-6">Last updated {formatDate(order.updatedAt, true)}</p>
            </section>

            {order.paymentMethod === 'CARD' && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
              <div className="bg-amber-50 border border-amber-200 p-5 mb-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p>Payment for this order is still pending.</p>
                <Link to={`/payment/${order.id}`} className="shrink-0 bg-black text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-center">Pay Now</Link>
              </div>
            )}
            {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
              <div className="bg-amber-50 border border-amber-200 p-5 mb-6 text-sm">
                Please transfer {formatPrice(order.totalAmount)} to {BANK_DETAILS.accountName}, {BANK_DETAILS.bank} – A/C {BANK_DETAILS.accountNumber}, using <strong>Order #{order.id}</strong> as the reference.
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <section className="md:col-span-2 bg-white border border-gray-100 p-6 sm:p-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-2">Items</h2>
                <OrderItemsList items={order.items} />
                <div className="border-t border-gray-100 pt-4"><OrderTotals order={order} /></div>
              </section>

              <div className="space-y-6">
                <section className="bg-white border border-gray-100 p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Delivery Address</h2>
                  <AddressBlock order={order} />
                </section>
                <section className="bg-white border border-gray-100 p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Payment</h2>
                  <p className="text-sm">{PAYMENT_METHODS[order.paymentMethod]?.label || order.paymentMethod}</p>
                  <p className="text-sm mt-1">Status: <PaymentBadge status={order.paymentStatus} /></p>
                </section>
                {CUSTOMER_CANCELLABLE.includes(order.status) && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full border border-red-600 text-red-600 py-3 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                )}
                <Link to="/pages/contact" className="block text-center text-xs text-gray-500 underline underline-offset-4 hover:text-black">
                  Need help with this order?
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderDetails;

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import { OrderItemsList, OrderTotals, AddressBlock, PaymentBadge } from '../components/orders/OrderStatus';
import { PAYMENT_METHODS, BANK_DETAILS } from '../constants/shop';
import { formatPrice } from '../utils/format';

const OrderConfirmation = () => {
  usePageTitle('Order Confirmed');
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    axiosInstance.get(`/orders/my/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.response?.data?.error || 'We couldn’t load your order.'));
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col bg-page font-sans text-luxe-dark">
      <Navbar />
      <main className="flex-grow pt-32 md:pt-44 pb-20 px-4 max-w-3xl mx-auto w-full">
        {error ? (
          <div className="text-center py-20">
            <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/orders" className="underline text-sm">Go to My Orders</Link>
          </div>
        ) : !order ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
        ) : (
          <>
            <div className="text-center mb-10">
              <CheckCircle2 className="w-14 h-14 mx-auto text-green-600 mb-4" strokeWidth={1.25} />
              <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-3">Thank you for your order!</h1>
              <p className="text-gray-600">
                Order <span className="font-semibold text-black">#{order.id}</span> has been placed.
                A confirmation has been sent to <span className="font-semibold text-black">{order.email}</span>.
              </p>
            </div>

            {order.paymentMethod === 'CARD' && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
              <div className="bg-amber-50 border border-amber-200 p-5 mb-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p>Your card payment hasn't been completed yet. We'll process the order once it's paid.</p>
                <Link to={`/payment/${order.id}`} className="shrink-0 bg-black text-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-center">Pay Now</Link>
              </div>
            )}

            {order.paymentMethod === 'BANK_TRANSFER' && order.paymentStatus !== 'PAID' && (
              <div className="bg-amber-50 border border-amber-200 p-5 mb-6 text-sm">
                <p className="font-semibold mb-2">Please complete your bank transfer of {formatPrice(order.totalAmount)}</p>
                <p>{BANK_DETAILS.bank} · {BANK_DETAILS.branch}</p>
                <p>Account name: {BANK_DETAILS.accountName}</p>
                <p>Account number: <span className="font-mono">{BANK_DETAILS.accountNumber}</span></p>
                <p className="mt-2 text-gray-600">Use <strong>Order #{order.id}</strong> as the reference. We'll ship once the payment is received.</p>
              </div>
            )}

            <div className="bg-white border border-gray-100 p-6 sm:p-8 space-y-8">
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-2">Items</h2>
                <OrderItemsList items={order.items} />
                <div className="border-t border-gray-100 pt-4"><OrderTotals order={order} /></div>
              </section>
              <div className="grid sm:grid-cols-2 gap-8">
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Delivery To</h2>
                  <AddressBlock order={order} />
                </section>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Payment</h2>
                  <p className="text-sm">{PAYMENT_METHODS[order.paymentMethod]?.label || order.paymentMethod}</p>
                  <p className="mt-1">Status: <PaymentBadge status={order.paymentStatus} /></p>
                </section>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link to={`/orders/${order.id}`} className="flex-1 text-center bg-black text-white py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gray-800">
                Track My Order
              </Link>
              <Link to="/shop" className="flex-1 text-center border border-black py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black hover:text-white">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;

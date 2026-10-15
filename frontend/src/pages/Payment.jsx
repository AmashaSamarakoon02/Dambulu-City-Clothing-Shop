import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, CreditCard, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import { formatPrice } from '../utils/format';

// Demo card payment step. No real card is charged; the order is marked as paid.
const luhnValid = (number) => {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = Number(number[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
};

const formatCardNumber = (value) => value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const Payment = () => {
  usePageTitle('Secure Payment');
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    axiosInstance.get(`/orders/my/${orderId}`)
      .then((res) => {
        const o = res.data;
        if (o.paymentStatus === 'PAID' || o.status === 'CANCELLED' || o.paymentMethod !== 'CARD') {
          navigate(`/orders/${o.id}`, { replace: true });
          return;
        }
        setOrder(o);
      })
      .catch((err) => setLoadError(err.response?.data?.error || 'We couldn’t load this order.'));
  }, [orderId, navigate]);

  const validate = () => {
    const next = {};
    const digits = card.number.replace(/\s/g, '');
    if (!/^\d{13,16}$/.test(digits) || !luhnValid(digits)) next.number = 'Please enter a valid card number';
    const [mm, yy] = card.expiry.split('/');
    const month = Number(mm);
    const expiryDate = new Date(2000 + Number(yy), month); // first day of the month after expiry
    if (!/^\d{2}\/\d{2}$/.test(card.expiry) || month < 1 || month > 12 || expiryDate <= new Date()) {
      next.expiry = 'Please enter a valid future expiry date';
    }
    if (!/^\d{3,4}$/.test(card.cvv)) next.cvv = 'Invalid CVV';
    if (!card.name.trim()) next.name = 'Cardholder name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200)); // simulate the gateway round-trip
      await axiosInstance.post(`/orders/${order.id}/pay`);
      toast.success('Payment successful!');
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border outline-none text-sm ${errors[field] ? 'border-red-500' : 'border-gray-300 focus:border-black'}`;

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-gray-600">{loadError}</p>
        <Link to="/orders" className="underline text-sm">Go to My Orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white shadow-xl w-full max-w-md">
        <div className="bg-black text-white p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-1">Luxe Attire · Secure Payment</p>
          <h1 className="text-lg">Order #{order.id}</h1>
          <p className="text-2xl font-semibold mt-2">{formatPrice(order.totalAmount)}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">Card Details</h2>
            <div className="flex gap-1.5 text-[10px] font-bold">
              <span className="bg-blue-50 text-blue-800 px-2 py-1">VISA</span>
              <span className="bg-red-50 text-red-700 px-2 py-1">MASTERCARD</span>
              <span className="bg-sky-50 text-sky-700 px-2 py-1">AMEX</span>
            </div>
          </div>

          <div>
            <label htmlFor="cc-number" className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Card Number</label>
            <div className="relative">
              <input
                id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                className={`${inputClass('number')} pl-11`}
              />
              <CreditCard className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cc-exp" className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Expiry</label>
              <input
                id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                className={inputClass('expiry')}
              />
              {errors.expiry && <p className="text-xs text-red-600 mt-1">{errors.expiry}</p>}
            </div>
            <div>
              <label htmlFor="cc-cvv" className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">CVV</label>
              <input
                id="cc-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '') })}
                className={inputClass('cvv')}
              />
              {errors.cvv && <p className="text-xs text-red-600 mt-1">{errors.cvv}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="cc-name" className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Cardholder Name</label>
            <input
              id="cc-name" autoComplete="cc-name" placeholder="Name on card"
              value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })}
              className={inputClass('name')}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full bg-black text-white py-4 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {processing ? <><Loader2 className="animate-spin h-4 w-4" /> Processing…</> : <><Lock className="w-4 h-4" /> Pay {formatPrice(order.totalAmount)}</>}
          </button>

          <Link to={`/orders/${order.id}`} className="block text-center text-xs text-gray-500 hover:text-black underline underline-offset-4">
            Pay later / view order
          </Link>

          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            Demo payment gateway – no real card is charged. Test card: 4242 4242 4242 4242
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payment;

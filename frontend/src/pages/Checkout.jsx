import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, ShoppingBag, Banknote, CreditCard, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import { imageUrl, formatPrice } from '../utils/format';
import { deliveryFeeFor, PAYMENT_METHODS, FREE_DELIVERY_THRESHOLD } from '../constants/shop';
import { EMAIL_REGEX } from '../utils/authValidation';

const PAYMENT_ICONS = { COD: Banknote, CARD: CreditCard, BANK_TRANSFER: Landmark };
const PHONE_REGEX = /^\+?[0-9\s-]{9,15}$/;

// Profile addresses are saved as "line1, city, postalCode".
const splitSavedAddress = (saved) => {
  const parts = (saved || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return { line1: parts[0] || '', city: '', postalCode: '' };
  const postalCode = /^\d{3,6}$/.test(parts[parts.length - 1]) ? parts.pop() : '';
  const city = parts.pop();
  return { line1: parts.join(', '), city, postalCode };
};

const Field = ({ label, error, required, className = '', ...props }) => (
  <div className={className}>
    <label htmlFor={props.id} className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {props.rows ? (
      <textarea
        {...props}
        className={`w-full border px-4 py-3 text-sm outline-none resize-none ${error ? 'border-red-500' : 'border-gray-300 focus:border-black'}`}
      />
    ) : (
      <input
        {...props}
        aria-invalid={Boolean(error)}
        className={`w-full border px-4 py-3 text-sm outline-none ${error ? 'border-red-500' : 'border-gray-300 focus:border-black'}`}
      />
    )}
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

const Checkout = () => {
  usePageTitle('Checkout');
  const navigate = useNavigate();
  const { cartItems, subtotal, clearCart, syncCart } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    customerName: user?.name || '',
    email: user?.email || '',
    phone: '',
    line1: '',
    city: '',
    postalCode: '',
    instructions: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [placing, setPlacing] = useState(false);

  const deliveryFee = deliveryFeeFor(subtotal);
  const total = subtotal + deliveryFee;

  useEffect(() => {
    window.scrollTo(0, 0);
    syncCart();
    axiosInstance.get('/auth/profile')
      .then((res) => {
        const p = res.data;
        setForm((f) => ({
          ...f,
          customerName: f.customerName || p.name || '',
          email: f.email || p.email || '',
          phone: f.phone || p.phone || '',
          ...(f.line1 ? {} : splitSavedAddress(p.address))
        }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.customerName.trim()) next.customerName = 'Full name is required';
    if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Please enter a valid email address';
    if (!PHONE_REGEX.test(form.phone.trim())) next.phone = 'Please enter a valid phone number (e.g. 0771234567)';
    if (!form.line1.trim()) next.line1 = 'Street address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (form.postalCode.trim() && !/^[0-9]{3,6}$/.test(form.postalCode.trim())) next.postalCode = 'Please enter a valid postal code';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) {
      toast.error('Please complete the highlighted fields');
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    setPlacing(true);
    try {
      const res = await axiosInstance.post('/orders', {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null
        })),
        customerName: form.customerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: {
          line1: form.line1.trim(),
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          instructions: form.instructions.trim()
        },
        paymentMethod,
        saveAddress
      });

      const order = res.data;
      clearCart();
      if (paymentMethod === 'CARD') {
        navigate(`/payment/${order.id}`, { replace: true });
      } else {
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order.id}`, { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.error || 'We couldn’t place your order. Please try again.';
      setServerError(message);
      toast.error(message);
      // Stock may have changed – refresh the cart so quantities are accurate.
      syncCart();
    } finally {
      setPlacing(false);
    }
  };

  if (cartItems.length === 0 && !placing) {
    return (
      <div className="min-h-screen flex flex-col bg-white font-sans">
        <Navbar />
        <div className="flex-grow pt-48 pb-24 flex flex-col items-center justify-center text-center px-4">
          <ShoppingBag className="w-12 h-12 text-gray-300 mb-4" strokeWidth={1.25} />
          <h1 className="text-2xl font-light uppercase tracking-widest mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Add some items to your cart before checking out.</p>
          <Link to="/shop" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-luxe-dark flex flex-col">
      <Navbar />

      <form
        onSubmit={handlePlaceOrder}
        noValidate
        className="flex-grow pt-32 md:pt-44 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-grow w-full space-y-6">
            <section className="bg-white p-6 sm:p-8 border border-gray-100">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] mb-6">1. Contact Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field id="customerName" name="customerName" label="Full Name" required autoComplete="name"
                  value={form.customerName} onChange={handleChange} error={errors.customerName} className="sm:col-span-2" />
                <Field id="email" name="email" type="email" label="Email" required autoComplete="email"
                  value={form.email} onChange={handleChange} error={errors.email} />
                <Field id="phone" name="phone" type="tel" label="Phone Number" required autoComplete="tel" placeholder="077 123 4567"
                  value={form.phone} onChange={handleChange} error={errors.phone} />
              </div>
            </section>

            <section className="bg-white p-6 sm:p-8 border border-gray-100">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] mb-6">2. Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field id="line1" name="line1" label="Street Address" required autoComplete="street-address" placeholder="House no., street, area"
                  value={form.line1} onChange={handleChange} error={errors.line1} className="sm:col-span-2" />
                <Field id="city" name="city" label="City" required autoComplete="address-level2"
                  value={form.city} onChange={handleChange} error={errors.city} />
                <Field id="postalCode" name="postalCode" label="Postal Code" autoComplete="postal-code" inputMode="numeric"
                  value={form.postalCode} onChange={handleChange} error={errors.postalCode} />
                <Field id="instructions" name="instructions" label="Delivery Instructions (optional)" rows={2} maxLength={300}
                  placeholder="e.g. Call before delivery, landmark…" value={form.instructions} onChange={handleChange} className="sm:col-span-2" />
              </div>
              <label className="flex items-center gap-3 mt-5 text-sm cursor-pointer">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 accent-black" />
                Save this address and phone number to my profile
              </label>
            </section>

            <section className="bg-white p-6 sm:p-8 border border-gray-100">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] mb-6">3. Payment Method</h2>
              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => {
                  const Icon = PAYMENT_ICONS[key];
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-4 p-4 border cursor-pointer transition-colors ${
                        paymentMethod === key ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={key}
                        checked={paymentMethod === key}
                        onChange={() => setPaymentMethod(key)}
                        className="mt-1 w-4 h-4 accent-black"
                      />
                      <Icon className="w-5 h-5 mt-0.5 shrink-0 text-gray-700" />
                      <span>
                        <span className="block text-sm font-semibold">{method.label}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{method.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="w-full lg:w-[380px] shrink-0 bg-white border border-gray-100 p-6 sm:p-8 lg:sticky lg:top-40">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] mb-6">Order Summary</h2>
            <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto -mx-1 px-1">
              {cartItems.map((item) => (
                <li key={item.key} className="flex gap-3 py-3">
                  <div className="relative shrink-0">
                    <img src={imageUrl(item.image)} alt={item.name} className="w-14 h-16 object-cover bg-gray-100" />
                    <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-500">{[item.size, item.color].filter(Boolean).join(' / ')}</p>
                  </div>
                  <span className="text-sm whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="space-y-3 text-sm border-t border-gray-100 pt-4 mt-2">
              <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Delivery</dt>
                <dd>{deliveryFee ? formatPrice(deliveryFee) : <span className="text-green-700">Free</span>}</dd>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-gray-400">Free delivery on orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}.</p>
              )}
              <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-4">
                <dt>Total</dt><dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            {serverError && (
              <div className="mt-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3" role="alert">{serverError}</div>
            )}

            <button
              type="submit"
              disabled={placing}
              className="w-full mt-6 bg-black text-white py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {placing ? 'Placing Order…' : paymentMethod === 'CARD' ? 'Continue to Payment' : 'Place Order'}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-4">
              By placing your order you agree to our <Link to="/pages/terms" className="underline">Terms &amp; Conditions</Link>.
            </p>
          </aside>
        </div>
      </form>

      <Footer />
    </div>
  );
};

export default Checkout;

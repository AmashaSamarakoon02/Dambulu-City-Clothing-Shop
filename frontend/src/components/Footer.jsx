import React, { useState } from 'react';
import { Mail, MapPin, Phone, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import useCategories from '../hooks/useCategories';

const linkClass = 'text-sm text-gray-500 hover:text-black tracking-wide transition-colors';

const SOCIALS = [
  { label: 'FB', name: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'IG', name: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'TT', name: 'TikTok', href: 'https://www.tiktok.com/' },
  { label: 'YT', name: 'YouTube', href: 'https://www.youtube.com/' }
];

const Footer = () => {
  const { isAuthenticated } = useAuth();
  const { categories } = useCategories();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribing(true);
    try {
      const res = await axiosInstance.post('/newsletter', { email });
      toast.success(res.data.message);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const accountLink = (path) => (isAuthenticated ? path : '/login');

  return (
    <footer className="bg-luxe-light text-luxe-dark font-sans border-t border-gray-200">
      <div className="bg-gray-50 py-14 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-light tracking-widest uppercase mb-2">Subscribe to our newsletter</h3>
            <p className="text-gray-500 font-light tracking-wide text-sm">
              Be the first to know about new arrivals, sales & exclusive offers.
            </p>
          </div>
          <div className="md:w-1/2 w-full max-w-md">
            <form onSubmit={handleSubscribe} className="relative flex items-center">
              <Mail className="absolute left-4 h-5 w-5 text-gray-400" />
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-28 py-4 bg-white border border-gray-200 focus:outline-none focus:border-black text-sm tracking-wide"
                required
              />
              <button
                type="submit"
                disabled={subscribing}
                className="absolute right-0 top-0 bottom-0 px-6 bg-black text-white hover:bg-gray-800 transition-colors uppercase tracking-widest text-xs font-semibold disabled:opacity-60"
              >
                {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-5">Shop</h4>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.slug}><Link to={`/category/${c.slug}`} className={linkClass}>{c.name}</Link></li>
              ))}
              <li><Link to="/shop?new=true" className={linkClass}>New Arrivals</Link></li>
              <li><Link to="/shop?sale=true" className={`${linkClass} text-red-600`}>Sale</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-5">Customer Care</h4>
            <ul className="space-y-3">
              <li><Link to="/pages/contact" className={linkClass}>Contact Us</Link></li>
              <li><Link to="/pages/delivery" className={linkClass}>Delivery Information</Link></li>
              <li><Link to="/pages/returns" className={linkClass}>Returns & Exchanges</Link></li>
              <li><Link to="/pages/faq" className={linkClass}>FAQ</Link></li>
              <li><Link to="/pages/size-guide" className={linkClass}>Size Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-5">My Account</h4>
            <ul className="space-y-3">
              <li><Link to={accountLink('/profile')} className={linkClass}>{isAuthenticated ? 'My Account' : 'Login / Register'}</Link></li>
              <li><Link to={accountLink('/orders')} className={linkClass}>Order Tracking</Link></li>
              <li><Link to={accountLink('/wishlist')} className={linkClass}>Wishlist</Link></li>
              <li><Link to="/pages/about" className={linkClass}>About Us</Link></li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-sm font-semibold tracking-widest uppercase mb-5">Connect With Us</h4>
            <div className="flex space-x-3 mb-8">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  className="h-10 w-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all text-xs font-bold"
                >
                  {s.label}
                </a>
              ))}
            </div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-500 leading-relaxed tracking-wide">123 Fashion Avenue, Colombo 07, Sri Lanka</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3 shrink-0" />
                <a href="tel:+94112345678" className="text-sm text-gray-500 tracking-wide hover:text-black">+94 11 234 5678</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 tracking-wider">
            &copy; {new Date().getFullYear()} LUXE ATTIRE. ALL RIGHTS RESERVED.
          </p>
          <div className="flex space-x-4 text-xs font-medium text-gray-400 tracking-wider">
            <Link to="/pages/privacy" className="hover:text-black transition-colors">PRIVACY POLICY</Link>
            <span>|</span>
            <Link to="/pages/terms" className="hover:text-black transition-colors">TERMS OF SERVICE</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

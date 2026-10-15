import React, { useState } from 'react';
import { Mail, MapPin, Phone, Clock, Loader2, ArrowRight, Truck, Banknote, ShieldCheck, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import useCategories from '../hooks/useCategories';
import BrandLogo from './BrandLogo';
import SocialIcon from './SocialIcons';
import { CONTACT, SOCIAL_LINKS } from '../constants/contact';

const linkClass = 'inline-block text-sm text-gray-600 hover:text-black hover:translate-x-0.5 tracking-wide transition-all';
const headingClass = 'text-xs font-semibold tracking-[0.2em] uppercase text-black mb-5';

const TRUST_POINTS = [
  { icon: Truck, label: 'Islandwide Delivery' },
  { icon: Banknote, label: 'Cash on Delivery' },
  { icon: ShieldCheck, label: 'Secure Payments' },
  { icon: RefreshCw, label: '7-Day Exchanges' }
];

const PAYMENT_BADGES = ['VISA', 'MASTERCARD', 'AMEX', 'COD'];

const WhatsAppIcon = ({ className }) => <SocialIcon name="WhatsApp" className={className} />;

// One contact row: round icon badge + content.
const ContactRow = ({ icon: Icon, children }) => (
  <li className="flex items-start gap-3">
    <span className="h-9 w-9 shrink-0 rounded-full bg-white border border-line flex items-center justify-center text-gray-700">
      <Icon className="h-4 w-4" />
    </span>
    <div className="text-sm text-gray-600 leading-relaxed pt-1.5 min-w-0">{children}</div>
  </li>
);

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
    <footer className="bg-page-alt text-luxe-dark font-sans border-t border-line">
      <div className="bg-surface border-b border-line py-14 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-light tracking-widest uppercase mb-2">Subscribe to our newsletter</h3>
            <p className="text-gray-600 font-light tracking-wide text-sm">
              Be the first to know about new arrivals, sales & exclusive offers.
            </p>
          </div>
          <div className="md:w-1/2 w-full max-w-md">
            <form onSubmit={handleSubscribe} className="relative flex items-center">
              <Mail className="absolute left-4 h-5 w-5 text-gray-600" />
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
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12">
          {/* Brand + social */}
          <div className="col-span-2 lg:col-span-3">
            <BrandLogo size="page" align="start" />
            <p className="text-sm text-gray-600 leading-relaxed mt-5 max-w-xs">
              Quality clothing at affordable prices, in the heart of Dambulla.
            </p>
            <h4 className={`${headingClass} mt-8 mb-4`}>Follow Us</h4>
            <div className="flex flex-wrap gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="h-10 w-10 rounded-full border border-line bg-white flex items-center justify-center text-gray-700 hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5 transition-all"
                >
                  <SocialIcon name={s.name} />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className={headingClass}>Shop</h4>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.slug}><Link to={`/category/${c.slug}`} className={linkClass}>{c.name}</Link></li>
              ))}
              <li><Link to="/shop?new=true" className={linkClass}>New Arrivals</Link></li>
              <li><Link to="/shop?sale=true" className={`${linkClass} text-red-700`}>Sale</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className={headingClass}>Customer Care</h4>
            <ul className="space-y-3">
              <li><Link to="/pages/contact" className={linkClass}>Contact Us</Link></li>
              <li><Link to="/pages/delivery" className={linkClass}>Delivery Information</Link></li>
              <li><Link to="/pages/returns" className={linkClass}>Returns & Exchanges</Link></li>
              <li><Link to="/pages/faq" className={linkClass}>FAQ</Link></li>
              <li><Link to="/pages/size-guide" className={linkClass}>Size Guide</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h4 className={headingClass}>My Account</h4>
            <ul className="space-y-3">
              <li><Link to={accountLink('/profile')} className={linkClass}>{isAuthenticated ? 'My Account' : 'Login / Register'}</Link></li>
              <li><Link to={accountLink('/orders')} className={linkClass}>Order Tracking</Link></li>
              <li><Link to={accountLink('/wishlist')} className={linkClass}>Wishlist</Link></li>
              <li><Link to="/pages/about" className={linkClass}>About Us</Link></li>
            </ul>
          </div>

          {/* Visit / contact */}
          <div className="col-span-2 lg:col-span-3">
            <h4 className={headingClass}>Visit Our Store</h4>
            <ul className="space-y-4">
              <ContactRow icon={MapPin}>
                <span className="block text-black">{CONTACT.address}</span>
                <span className="block text-gray-600">{CONTACT.country}</span>
                <a
                  href={CONTACT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs font-semibold uppercase tracking-widest text-black hover:underline underline-offset-4"
                >
                  Get directions <ArrowRight className="h-3 w-3" />
                </a>
              </ContactRow>
              <ContactRow icon={Phone}>
                <a href={CONTACT.phoneHref} className="text-black font-medium hover:underline underline-offset-4">{CONTACT.phoneDisplay}</a>
              </ContactRow>
              <ContactRow icon={WhatsAppIcon}>
                <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-black hover:underline underline-offset-4">
                  Chat on WhatsApp
                </a>
              </ContactRow>
              <ContactRow icon={Mail}>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-black hover:underline underline-offset-4 break-all">{CONTACT.email}</a>
              </ContactRow>
              <ContactRow icon={Clock}>{CONTACT.hours}</ContactRow>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center md:justify-start gap-3 text-xs uppercase tracking-widest text-gray-600">
              <Icon className="h-5 w-5 shrink-0 text-black" strokeWidth={1.5} /> {label}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line bg-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 tracking-wider text-center">
            &copy; {new Date().getFullYear()} DAMBULLA CITY CLOTHING SHOP. ALL RIGHTS RESERVED.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Payment methods we accept">
            <span className="text-[10px] uppercase tracking-widest text-gray-600 mr-1">We accept</span>
            {PAYMENT_BADGES.map((b) => (
              <span key={b} className="border border-line bg-white rounded px-2 py-1 text-[10px] font-bold tracking-wider text-gray-600">{b}</span>
            ))}
          </div>
          <div className="flex space-x-4 text-xs font-medium text-gray-600 tracking-wider">
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

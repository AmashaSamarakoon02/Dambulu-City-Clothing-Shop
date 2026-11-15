import React, { useState } from 'react';
import { Mail, MapPin, Phone, Clock, Loader2, ArrowRight, Truck, Banknote, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import useCategories from '../hooks/useCategories';
import BrandLogo from './BrandLogo';
import SocialIcon from './SocialIcons';
import { CONTACT, SOCIAL_LINKS } from '../constants/contact';

// Dark footer with large, high-contrast text (easy to read for every age).
const linkClass = 'inline-block text-[15px] text-white/75 hover:text-white hover:translate-x-0.5 transition-all';
const headingClass = 'text-sm font-semibold tracking-[0.15em] uppercase text-[#e8c48a] mb-5';

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
    <span className="h-10 w-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[#e8c48a]">
      <Icon className="h-[18px] w-[18px]" />
    </span>
    <div className="text-[15px] text-white/75 leading-relaxed pt-2 min-w-0">{children}</div>
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
    <footer className="bg-[#1c1c1c] text-white font-sans">
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-accent-dark via-accent to-[#a8743f]">
        <div className="shell py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-light mb-2">Get offers before anyone else</h2>
            <p className="text-white/90 text-[15px]">New arrivals, flash sales and exclusive deals – straight to your inbox.</p>
          </div>
          <form onSubmit={handleSubscribe} className="w-full md:max-w-md flex items-center bg-white rounded-full p-1.5 shadow-lg shadow-black/20">
            <Mail className="ml-3 h-5 w-5 text-gray-500 shrink-0" aria-hidden="true" />
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 min-w-0 px-3 py-2.5 bg-transparent text-[15px] text-luxe-dark outline-none"
              required
            />
            <button
              type="submit"
              disabled={subscribing}
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#1c1c1c] text-white px-5 py-3 text-sm font-semibold hover:bg-black transition-colors disabled:opacity-60"
            >
              {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Subscribe</>}
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="shell py-14">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12">
          {/* Brand + social */}
          <div className="col-span-2 lg:col-span-3">
            <BrandLogo size="page" align="start" tone="light" />
            <p className="text-[15px] text-white/75 leading-relaxed mt-5 max-w-xs">
              Quality clothing for the whole family at affordable prices, in the heart of Dambulla.
            </p>
            <h3 className={`${headingClass} mt-8 mb-4`}>Follow Us</h3>
            <div className="flex flex-wrap gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-[#e8c48a] hover:text-black hover:-translate-y-0.5 transition-all"
                >
                  <SocialIcon name={s.name} className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className={headingClass}>Shop</h3>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.slug}><Link to={`/category/${c.slug}`} className={linkClass}>{c.name}</Link></li>
              ))}
              <li><Link to="/shop?new=true" className={linkClass}>New Arrivals</Link></li>
              <li><Link to="/shop?sale=true" className={`${linkClass} !text-[#ff9a8f] hover:!text-[#ffb8b0]`}>Sale</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className={headingClass}>Customer Care</h3>
            <ul className="space-y-3">
              <li><Link to="/pages/contact" className={linkClass}>Contact Us</Link></li>
              <li><Link to="/pages/delivery" className={linkClass}>Delivery Information</Link></li>
              <li><Link to="/pages/returns" className={linkClass}>Returns & Exchanges</Link></li>
              <li><Link to="/pages/faq" className={linkClass}>FAQ</Link></li>
              <li><Link to="/pages/size-guide" className={linkClass}>Size Guide</Link></li>
              <li><Link to="/pages/about" className={linkClass}>About Us</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className={headingClass}>My Account</h3>
            <ul className="space-y-3">
              <li><Link to={accountLink('/profile')} className={linkClass}>My Account</Link></li>
              <li><Link to={accountLink('/orders')} className={linkClass}>Order Tracking</Link></li>
              <li><Link to={accountLink('/wishlist')} className={linkClass}>Wishlist</Link></li>
            </ul>
          </div>

          {/* Visit / contact */}
          <div className="col-span-2 lg:col-span-3">
            <h3 className={headingClass}>Visit Our Store</h3>
            <ul className="space-y-4">
              <ContactRow icon={MapPin}>
                <span className="block text-white">{CONTACT.address}</span>
                <span className="block">{CONTACT.country}</span>
                <a
                  href={CONTACT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-sm font-semibold text-[#e8c48a] hover:underline underline-offset-4"
                >
                  Get directions <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </ContactRow>
              <ContactRow icon={Phone}>
                <a href={CONTACT.phoneHref} className="text-white text-base font-semibold hover:underline underline-offset-4">{CONTACT.phoneDisplay}</a>
              </ContactRow>
              <ContactRow icon={WhatsAppIcon}>
                <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline underline-offset-4">
                  Chat on WhatsApp
                </a>
              </ContactRow>
              <ContactRow icon={Mail}>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-white hover:underline underline-offset-4 break-all">{CONTACT.email}</a>
              </ContactRow>
              <ContactRow icon={Clock}>{CONTACT.hours}</ContactRow>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-t border-white/10">
        <div className="shell py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center md:justify-start gap-3 text-sm text-white/85">
              <Icon className="h-6 w-6 shrink-0 text-[#e8c48a]" strokeWidth={1.5} /> {label}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#141414]">
        <div className="shell py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/70 text-center">
            &copy; {new Date().getFullYear()} Dambulla City Clothing Shop. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Payment methods we accept">
            <span className="text-xs text-white/70 mr-1">We accept</span>
            {PAYMENT_BADGES.map((b) => (
              <span key={b} className="bg-white rounded px-2 py-1 text-[11px] font-bold tracking-wider text-[#1c1c1c]">{b}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <Link to="/pages/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link to="/pages/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

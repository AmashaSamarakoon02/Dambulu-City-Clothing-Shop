import React, { useEffect, useRef, useState } from 'react';
import { Search, ShoppingCart, Menu, X, User, Heart, LogIn, LogOut, UserPlus, Package, ChevronDown, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import useCategories from '../hooks/useCategories';
import BrandLogo from './BrandLogo';

// Short menu labels ("Men's Wear" → "Men") so the menu can use a large, easy-to-read font.
const shortLabel = (name) => name.replace(/\s*(['’]s|['’])?\s+Wear$/i, '');

const Badge = ({ count, className = 'bg-[#e8c48a] text-black' }) => (
  count > 0 ? (
    <span className={`absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${className}`}>
      {count}
    </span>
  ) : null
);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const mobileSearchRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsCartOpen, cartCount: cartItemCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { categories: shopCategories } = useCategories();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return undefined;
    const onDown = (e) => { if (!accountRef.current?.contains(e.target)) setAccountOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  // Close menus when the page changes.
  useEffect(() => {
    setIsOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  // Skip link: move keyboard focus straight to the page content.
  const skipToContent = (e) => {
    e.preventDefault();
    const target = document.getElementById('main') || document.querySelector('main') || document.querySelector('header + *');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView();
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been logged out');
      setIsOpen(false);
      setAccountOpen(false);
      navigate('/home');
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
    setIsOpen(false);
  };

  const openMobileSearch = () => {
    setIsOpen(true);
    setTimeout(() => mobileSearchRef.current?.focus(), 0);
  };

  const links = [
    { name: 'Shop All', short: 'Shop All', link: '/shop' },
    ...shopCategories.map((c) => ({ name: c.name, short: shortLabel(c.name), link: `/category/${c.slug}` })),
    { name: 'New Arrivals', short: 'New In', link: '/shop?new=true' },
    { name: 'Sale', short: 'Sale', link: '/shop?sale=true' }
  ];
  const current = location.pathname + location.search;
  const isActive = (link) => (link === '/shop' ? location.pathname === '/shop' && !location.search : current === link);

  const searchForm = (inputRef, id) => (
    <form onSubmit={submitSearch} role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">Search products</label>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-white/60 pointer-events-none" />
      <input
        ref={inputRef}
        id={id}
        type="search"
        placeholder="Search products"
        className="w-full bg-white/10 border border-white/15 rounded-full pl-11 pr-12 py-2.5 text-[15px] text-white placeholder-white/60 outline-none focus:bg-white/15 focus:border-white/40 transition-colors"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button type="submit" aria-label="Search" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white">
        <ArrowRight className="h-[18px] w-[18px]" />
      </button>
    </form>
  );

  const iconBtn = 'relative flex flex-col items-center gap-1 text-white/85 hover:text-white transition-colors';
  const iconLabel = 'text-[12px] font-medium hidden lg:block';

  return (
    <header className={`fixed w-full z-50 top-0 transition-shadow duration-300 ${scrolled ? 'shadow-xl shadow-black/20' : ''}`}>
      <a
        href="#main"
        onClick={skipToContent}
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Main bar: logo · search · icons (z-20 keeps the account menu above the category bar) */}
      <div className={`relative z-20 transition-colors duration-300 ${scrolled ? 'bg-[#1c1c1c]/95 backdrop-blur-md' : 'bg-[#1c1c1c]'}`}>
        <div className="shell">
          <div className="flex items-center gap-4 lg:gap-8 h-16 md:h-20">
            {/* Mobile: menu + search */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 -ml-2 flex items-center justify-center text-white"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <button onClick={openMobileSearch} className="w-10 h-10 flex items-center justify-center text-white" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 md:flex-none flex justify-center md:justify-start">
              <BrandLogo size="header" tone="light" />
            </div>

            <div className="hidden md:block flex-1 max-w-xl mx-auto">{searchForm(null, 'header-search')}</div>

            {/* Icons */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative hidden sm:block" ref={accountRef}>
                {isAuthenticated ? (
                  <button
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    className={iconBtn}
                  >
                    <User className="h-6 w-6" />
                    <span className={`${iconLabel} lg:flex items-center gap-0.5`}>
                      Hi, {user?.name?.split(' ')[0] || 'there'} <ChevronDown className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ) : (
                  <Link to="/login" className={iconBtn} aria-label="Account – log in or sign up">
                    <User className="h-6 w-6" />
                    <span className={iconLabel}>Account</span>
                  </Link>
                )}
                {accountOpen && (
                  <div role="menu" className="absolute right-0 top-full mt-3 w-56 bg-white text-luxe-dark rounded-xl shadow-2xl ring-1 ring-black/5 py-2 text-[15px]">
                    <Link role="menuitem" to="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-page-alt"><User className="w-4 h-4" /> My Account</Link>
                    <Link role="menuitem" to="/orders" className="flex items-center gap-3 px-4 py-2.5 hover:bg-page-alt"><Package className="w-4 h-4" /> My Orders</Link>
                    <Link role="menuitem" to="/wishlist" className="flex items-center gap-3 px-4 py-2.5 hover:bg-page-alt"><Heart className="w-4 h-4" /> Wishlist</Link>
                    <div className="my-1 border-t border-line" />
                    <button role="menuitem" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-page-alt text-red-700">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
              <Link to="/wishlist" className={`${iconBtn} hidden sm:flex`} aria-label={`Wishlist (${wishlistCount} items)`}>
                <span className="relative">
                  <Heart className="h-6 w-6" />
                  <Badge count={wishlistCount} />
                </span>
                <span className={iconLabel}>Wishlist</span>
              </Link>
              <button onClick={() => setIsCartOpen(true)} aria-label={`Open cart (${cartItemCount} items)`} className={iconBtn}>
                <span className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  <Badge count={cartItemCount} className="bg-red-500 text-white" />
                </span>
                <span className={iconLabel}>Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category menu (desktop) */}
      <nav aria-label="Shop categories" className={`hidden md:block border-t border-white/10 transition-colors duration-300 ${scrolled ? 'bg-[#262626]/95 backdrop-blur-md' : 'bg-[#262626]'}`}>
        <div className="shell">
          <ul className="flex justify-center flex-wrap gap-x-5 lg:gap-x-7 xl:gap-x-9">
            {links.map((l) => {
              const active = isActive(l.link);
              const sale = l.name === 'Sale';
              return (
                <li key={l.name}>
                  <Link
                    to={l.link}
                    title={l.name !== l.short ? l.name : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`relative block py-3.5 text-[15px] font-medium transition-colors after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:rounded-full after:transition-transform ${
                      sale ? 'text-[#ff9a8f] hover:text-[#ffb8b0] after:bg-[#ff9a8f]' : 'text-white/85 hover:text-white after:bg-[#e8c48a]'
                    } ${active ? 'text-white after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`}
                  >
                    {l.short}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-2xl absolute w-full max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="px-4 py-4 bg-[#1c1c1c]">{searchForm(mobileSearchRef, 'mobile-search')}</div>
          <nav aria-label="Shop categories" className="px-4 pt-2 pb-6">
            {links.map((l) => (
              <Link
                key={l.name}
                to={l.link}
                onClick={() => setIsOpen(false)}
                aria-current={isActive(l.link) ? 'page' : undefined}
                className={`flex items-center justify-between px-2 py-4 text-base font-medium border-b border-gray-100 ${l.name === 'Sale' ? 'text-red-700' : 'text-gray-900'}`}
              >
                {l.name}
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
            <div className="pt-6 grid grid-cols-2 gap-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center text-[15px] font-medium text-gray-700">
                    <User className="h-5 w-5 mr-3" /> My Account
                  </Link>
                  <Link to="/orders" onClick={() => setIsOpen(false)} className="flex items-center text-[15px] font-medium text-gray-700">
                    <Package className="h-5 w-5 mr-3" /> My Orders
                  </Link>
                  <button onClick={handleLogout} className="flex items-center text-[15px] font-medium text-red-700">
                    <LogOut className="h-5 w-5 mr-3" /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center text-[15px] font-medium text-gray-700">
                    <LogIn className="h-5 w-5 mr-3" /> Log in
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center text-[15px] font-medium text-gray-700">
                    <UserPlus className="h-5 w-5 mr-3" /> Sign up
                  </Link>
                </>
              )}
              <Link to="/wishlist" onClick={() => setIsOpen(false)} className="flex items-center text-[15px] font-medium text-gray-700">
                <Heart className="h-5 w-5 mr-3" /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;

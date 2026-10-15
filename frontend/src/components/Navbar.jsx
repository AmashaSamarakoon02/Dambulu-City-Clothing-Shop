import React, { useRef, useState } from 'react';
import { Search, ShoppingCart, Menu, X, User, Heart, LogIn, LogOut, UserPlus, Package } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import useCategories from '../hooks/useCategories';
import { FREE_DELIVERY_THRESHOLD } from '../constants/shop';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();
  const { setIsCartOpen, cartCount: cartItemCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const { categories: shopCategories } = useCategories();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been logged out');
      setIsOpen(false);
      navigate('/home');
    } catch {
      toast.error('Logout failed. Please try again.');
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const openMobileSearch = () => {
    setIsOpen(true);
    setTimeout(() => mobileSearchRef.current?.focus(), 0);
  };

  const categories = [
    ...shopCategories.map((c) => ({ name: c.name, link: `/category/${c.slug}` })),
    { name: 'New Arrivals', link: '/shop?new=true' },
    { name: 'Sale', link: '/shop?sale=true' },
  ];

  return (
    <header className="fixed w-full z-50 top-0">
      {/* Top Banner */}
      <div className="bg-black text-white text-[10px] md:text-xs tracking-widest py-2 px-4 font-light">
        <div className="max-w-7xl mx-auto flex items-center justify-center md:justify-between">
          <span className="hidden md:block w-56" />
          <span className="text-center">FREE ISLANDWIDE DELIVERY ON ALL ORDERS OVER LKR {FREE_DELIVERY_THRESHOLD.toLocaleString()} | SECURE PAYMENTS</span>
          <div className="hidden md:flex w-56 justify-end items-center gap-3 uppercase">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hover:underline underline-offset-4 truncate max-w-30">
                  Hi, {user?.name?.split(' ')[0]}
                </Link>
                <span className="text-gray-500">|</span>
                <button onClick={handleLogout} className="uppercase tracking-widest hover:underline underline-offset-4">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline underline-offset-4">Login</Link>
                <span className="text-gray-500">|</span>
                <Link to="/register" className="hover:underline underline-offset-4">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Middle Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Mobile Menu & Search (Left) */}
            <div className="flex-1 flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-luxe-dark hover:text-black focus:outline-none md:hidden mr-4"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="hidden md:flex items-center text-gray-500 bg-gray-50 px-4 py-2 rounded-full w-64 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
                <Search className="h-4 w-4 mr-2" />
                <input
                  type="search"
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="bg-transparent text-sm focus:outline-none w-full text-black placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
              <button onClick={openMobileSearch} className="md:hidden text-luxe-dark hover:text-black" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Logo (Center) */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <Link to="/home" className="text-lg sm:text-2xl lg:text-3xl font-light tracking-[0.2em] uppercase text-black hover:opacity-80 transition-opacity whitespace-nowrap">
                Luxe Attire
              </Link>
            </div>

            {/* Right Icons */}
            <div className="flex-1 flex items-center justify-end space-x-4 sm:space-x-6">
              <Link to={isAuthenticated ? "/profile" : "/login"} className="text-luxe-dark hover:text-black transition-colors hidden sm:flex flex-col items-center group">
                <User className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] uppercase tracking-wider font-medium">Account</span>
              </Link>
              <Link to="/wishlist" className="text-luxe-dark hover:text-black transition-colors hidden sm:flex flex-col items-center group">
                <span className="relative mb-1">
                  <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-medium">Wishlist</span>
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={`Open cart (${cartItemCount} items)`}
                className="text-luxe-dark hover:text-black transition-colors relative flex flex-col items-center group"
              >
                <span className="relative mb-1">
                  <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-medium hidden sm:block">Cart</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation (Desktop) */}
      <div className="hidden md:block bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center flex-wrap gap-x-6 lg:gap-x-10 gap-y-2 py-4">
            <NavLink to="/shop" end className={({ isActive }) => `text-xs tracking-[0.15em] hover:text-black uppercase font-medium transition-colors ${isActive ? 'text-black' : 'text-gray-600'}`}>
              Shop All
            </NavLink>
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className={`text-xs tracking-[0.15em] hover:text-black uppercase font-medium transition-colors ${category.name === 'Sale' ? 'text-red-600' : 'text-gray-600'}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center text-gray-500 bg-gray-50 px-4 py-2 rounded-full w-full border border-gray-200">
              <Search className="h-4 w-4 mr-2" />
              <input
                ref={mobileSearchRef}
                type="search"
                placeholder="Search products..."
                aria-label="Search products"
                className="bg-transparent text-sm focus:outline-none w-full text-black"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link to="/shop" onClick={() => setIsOpen(false)} className="block px-2 py-4 text-sm font-medium tracking-widest hover:bg-gray-50 uppercase border-b border-gray-100 text-gray-800">
              Shop All
            </Link>
            {categories.map((category) => (
              <Link 
                key={category.name} 
                to={category.link} 
                onClick={() => setIsOpen(false)}
                className={`block px-2 py-4 text-sm font-medium tracking-widest hover:bg-gray-50 uppercase border-b border-gray-100 ${category.name === 'Sale' ? 'text-red-600' : 'text-gray-800'}`}
              >
                {category.name}
              </Link>
            ))}
            <div className="pt-6 grid grid-cols-2 gap-4 border-t border-gray-200 mt-4">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center text-sm font-medium tracking-widest uppercase text-gray-600">
                    <User className="h-5 w-5 mr-3" /> Account
                  </Link>
                  <Link to="/orders" onClick={() => setIsOpen(false)} className="flex items-center text-sm font-medium tracking-widest uppercase text-gray-600">
                    <Package className="h-5 w-5 mr-3" /> My Orders
                  </Link>
                  <button onClick={handleLogout} className="flex items-center text-sm font-medium tracking-widest uppercase text-gray-600">
                    <LogOut className="h-5 w-5 mr-3" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center text-sm font-medium tracking-widest uppercase text-gray-600">
                    <LogIn className="h-5 w-5 mr-3" /> Login
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center text-sm font-medium tracking-widest uppercase text-gray-600">
                    <UserPlus className="h-5 w-5 mr-3" /> Sign Up
                  </Link>
                </>
              )}
              <Link to="/wishlist" onClick={() => setIsOpen(false)} className="flex items-center text-sm font-medium tracking-widest uppercase text-gray-600">
                <Heart className="h-5 w-5 mr-3" /> Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

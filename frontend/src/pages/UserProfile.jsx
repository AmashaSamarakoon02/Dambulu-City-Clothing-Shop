import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, LogOut, Save, Mail, Phone, MapPin, ShieldCheck, Package, Heart, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import usePageTitle from '../hooks/usePageTitle';
import { StatusBadge } from '../components/orders/OrderStatus';
import { formatDate, formatPrice } from '../utils/format';

// Profile management page for the USER (customer) role.
const UserProfile = () => {
  usePageTitle('My Account');
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', phone: '', address: '' });
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    fetchProfile();
    axiosInstance.get('/orders/my').then((res) => setOrders(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate('/login');
      } else {
        setError('Could not load your profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name?.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (profile.phone && !/^\+?[0-9\s-]{9,15}$/.test(profile.phone.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await axiosInstance.put('/auth/profile', {
        name: profile.name,
        bio: profile.bio,
        phone: profile.phone,
        address: profile.address
      });
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.error || 'Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-luxe-light">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-pulse text-gray-500 tracking-widest uppercase">Loading Profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-luxe-light font-sans text-luxe-dark">
      <Navbar />

      <div className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header Profile Cover */}
          <div className="bg-luxe-dark h-32 md:h-48 relative">
            <div className="absolute -bottom-16 left-8 md:left-12">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <div className="bg-gray-100 h-24 w-24 md:h-32 md:w-32 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all"
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </button>
          </div>

          {/* Profile Content */}
          <div className="pt-24 pb-12 px-8 md:px-12">
            <div className="flex justify-between items-start mb-10 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-light tracking-wide text-gray-900">{profile.name}</h1>
                <p className="text-gray-500 flex items-center mt-2">
                  <Mail className="h-4 w-4 mr-2" /> {profile.email}
                </p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black text-white tracking-widest uppercase">
                  <ShieldCheck className="h-3 w-3 mr-1.5" /> Customer
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-black text-white px-6 py-2.5 text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors rounded"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2.5 text-sm uppercase tracking-widest hover:bg-green-700 transition-colors rounded flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-8 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <Link to="/orders" className="flex items-center gap-4 border border-gray-200 rounded-lg p-5 hover:border-black transition-colors">
                <Package className="h-6 w-6" strokeWidth={1.5} />
                <span className="flex-grow">
                  <span className="block text-sm font-semibold uppercase tracking-widest">My Orders</span>
                  <span className="text-xs text-gray-500">{orders.length} order{orders.length === 1 ? '' : 's'} · track & manage</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link to="/wishlist" className="flex items-center gap-4 border border-gray-200 rounded-lg p-5 hover:border-black transition-colors">
                <Heart className="h-6 w-6" strokeWidth={1.5} />
                <span className="flex-grow">
                  <span className="block text-sm font-semibold uppercase tracking-widest">Wishlist</span>
                  <span className="text-xs text-gray-500">{wishlistCount} saved item{wishlistCount === 1 ? '' : 's'}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>

            {orders.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold uppercase tracking-widest">Recent Orders</h2>
                  <Link to="/orders" className="text-xs underline underline-offset-4">View all</Link>
                </div>
                <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {orders.slice(0, 3).map((order) => (
                    <li key={order.id}>
                      <Link to={`/orders/${order.id}`} className="flex flex-wrap items-center gap-3 justify-between px-5 py-4 hover:bg-gray-50">
                        <span>
                          <span className="block text-sm font-semibold">Order #{order.id}</span>
                          <span className="text-xs text-gray-500">{formatDate(order.createdAt)} · {formatPrice(order.totalAmount)}</span>
                        </span>
                        <StatusBadge status={order.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="w-full h-px bg-gray-200 mb-10"></div>

            {/* Editable Fields */}
            <div className="space-y-8 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg transition-colors"
                  />
                ) : (
                  <p className="text-lg text-gray-900 border-b-2 border-transparent py-2">{profile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-widest mb-2 flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-2" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="e.g. +94 71 234 5678"
                    className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg transition-colors"
                  />
                ) : (
                  <p className="text-lg text-gray-900 border-b-2 border-transparent py-2">
                    {profile.phone || <span className="text-gray-400 italic text-base">Not added yet</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-widest mb-2 flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-2" /> Delivery Address
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Street, city, postal code..."
                    rows="3"
                    className="w-full border-2 border-gray-200 focus:border-black rounded-lg p-4 outline-none text-gray-800 transition-colors resize-none"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-600 min-h-[60px] border border-gray-100">
                    {profile.address ? profile.address : <span className="text-gray-400 italic">No delivery address added yet.</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-widest mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about your style..."
                    rows="4"
                    className="w-full border-2 border-gray-200 focus:border-black rounded-lg p-4 outline-none text-gray-800 transition-colors resize-none"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-600 min-h-[100px] border border-gray-100">
                    {profile.bio ? profile.bio : <span className="text-gray-400 italic">No bio added yet.</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldAlert, LogOut, Save, Mail, Phone, LayoutDashboard, ShoppingBag, Package, Tags, Users, MessageSquare, UserCog, Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReviews from '../components/admin/AdminReviews';
import axiosInstance from '../api/axiosInstance';
import { useAdminAuth } from '../context/AdminAuthContext';
import usePageTitle from '../hooks/usePageTitle';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare },
  { key: 'profile', label: 'My Profile', icon: UserCog }
];

const MyProfile = () => {
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get('/admin/auth/profile')
      .then((res) => setProfile(res.data))
      .catch(() => setError('Could not load your profile.'));
  }, []);

  const handleSave = async () => {
    if (!profile.name?.trim()) return setError('Name cannot be empty.');
    setSaving(true);
    setError('');
    try {
      const res = await axiosInstance.put('/admin/auth/profile', { name: profile.name, bio: profile.bio, phone: profile.phone });
      setProfile(res.data);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-10 max-w-3xl">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide">{profile.name}</h2>
          <p className="text-gray-500 flex items-center mt-2 text-sm"><Mail className="h-4 w-4 mr-2" /> {profile.email}</p>
          <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-700 text-white tracking-widest uppercase">
            <ShieldAlert className="h-3 w-3 mr-1.5" /> Administrator
          </span>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="bg-black text-white px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 rounded">
            Edit Profile
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} className="bg-green-600 text-white px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-green-700 rounded flex items-center disabled:opacity-50">
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded">{error}</div>}

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-widest mb-2">Full Name</label>
          {isEditing ? (
            <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg" />
          ) : <p className="text-lg py-2">{profile.name}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 uppercase tracking-widest mb-2 flex items-center"><Phone className="h-3.5 w-3.5 mr-2" /> Phone Number</label>
          {isEditing ? (
            <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="e.g. +94 71 234 5678"
              className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg" />
          ) : <p className="text-lg py-2">{profile.phone || <span className="text-gray-400 italic text-base">Not added yet</span>}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 uppercase tracking-widest mb-2">Bio</label>
          {isEditing ? (
            <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows="3"
              className="w-full border-2 border-gray-200 focus:border-black rounded-lg p-4 outline-none resize-none" />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-gray-600 min-h-20 border border-gray-100">
              {profile.bio || <span className="text-gray-400 italic">No bio added yet.</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Admin dashboard: sales reports, order management, products, categories, accounts and reviews.
const AdminProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const tabMeta = TABS.find((t) => t.key === activeTab);
  usePageTitle(`Admin · ${tabMeta.label}`);

  const navigate = useNavigate();
  const { logout, admin: user } = useAdminAuth();

  const goTo = (tab, options = {}) => {
    const next = new URLSearchParams({ tab });
    if (options.status) next.set('status', options.status);
    if (options.lowStock) next.set('lowStock', '1');
    setSearchParams(next);
    window.scrollTo({ top: 0 });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-8 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ShieldAlert className="h-6 w-6 text-purple-700 shrink-0" />
            <h1 className="text-base sm:text-lg font-bold tracking-widest uppercase truncate">Luxe Attire Admin</h1>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden md:inline text-xs text-gray-500">Signed in as <strong className="text-gray-800">{user?.name}</strong></span>
            <Link to="/home" className="flex items-center gap-2 text-xs text-gray-500 hover:text-black uppercase tracking-widest font-bold">
              <Store className="h-4 w-4" /> <span className="hidden sm:inline">View Store</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 uppercase tracking-widest font-bold">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <nav className="px-2 sm:px-6 flex gap-1 overflow-x-auto" aria-label="Admin sections">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => goTo(key)}
              aria-current={activeTab === key ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-3 text-xs uppercase tracking-widest font-bold whitespace-nowrap border-b-2 ${
                activeTab === key ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
        {activeTab === 'dashboard' && <AdminDashboard onNavigate={goTo} />}
        {activeTab === 'orders' && <AdminOrders initialStatus={searchParams.get('status') || ''} />}
        {activeTab === 'products' && <AdminProducts initialLowStock={searchParams.get('lowStock') === '1'} />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'customers' && <AdminUsers />}
        {activeTab === 'reviews' && <AdminReviews />}
        {activeTab === 'profile' && <MyProfile />}
      </main>
    </div>
  );
};

export default AdminProfile;

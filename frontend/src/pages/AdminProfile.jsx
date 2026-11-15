import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, LogOut, Save, Mail, Phone, LayoutDashboard, ShoppingBag, Package, Tags, Users, MessageSquare, UserCog, Store,
  Menu, X, Plus, CalendarDays, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminOrders from '../components/admin/AdminOrders';
import AdminProducts from '../components/admin/AdminProducts';
import AdminCategories from '../components/admin/AdminCategories';
import AdminUsers from '../components/admin/AdminUsers';
import AdminReviews from '../components/admin/AdminReviews';
import BrandLogo from '../components/BrandLogo';
import axiosInstance from '../api/axiosInstance';
import { useAdminAuth } from '../context/AdminAuthContext';
import usePageTitle from '../hooks/usePageTitle';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, subtitle: 'Sales, orders and stock at a glance' },
  { key: 'orders', label: 'Orders', icon: ShoppingBag, subtitle: 'Track and update customer orders' },
  { key: 'products', label: 'Products', icon: Package, subtitle: 'Add, edit and restock your products' },
  { key: 'categories', label: 'Categories', icon: Tags, subtitle: 'Organise how products are grouped in the store' },
  { key: 'customers', label: 'Customers', icon: Users, subtitle: 'Customer accounts and access' },
  { key: 'reviews', label: 'Reviews', icon: MessageSquare, subtitle: 'What customers say about your products' },
  { key: 'profile', label: 'My Profile', icon: UserCog, subtitle: 'Your administrator account' }
];

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'A';

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

  const fieldClass = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

  return (
    <div className="bg-white border border-line rounded-2xl shadow-sm shadow-black/5 max-w-3xl overflow-hidden">
      <div className="bg-gradient-to-r from-[#1c1c1c] to-[#3a2b1e] px-6 md:px-10 py-8 flex items-center gap-5 flex-wrap">
        <span className="w-20 h-20 rounded-full bg-[#e8c48a] text-[#1c1c1c] text-2xl font-semibold flex items-center justify-center ring-4 ring-white/15">
          {initials(profile.name)}
        </span>
        <div className="min-w-0 flex-1 text-white">
          <h2 className="text-2xl font-light">{profile.name || '…'}</h2>
          <p className="text-white/75 flex items-center mt-1 text-sm break-all"><Mail className="h-4 w-4 mr-2 shrink-0" /> {profile.email}</p>
          <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-[#e8c48a]">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Administrator
          </span>
        </div>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-accent-soft">
            <Pencil className="h-4 w-4" /> Edit profile
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>

      <div className="p-6 md:p-10">
        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl" role="alert">{error}</div>}

        <div className="space-y-6">
          <div>
            <label htmlFor="ap-name" className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
            {isEditing ? (
              <input id="ap-name" type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={fieldClass} />
            ) : <p className="text-lg">{profile.name}</p>}
          </div>
          <div>
            <label htmlFor="ap-phone" className="text-sm font-semibold text-gray-700 mb-2 flex items-center"><Phone className="h-4 w-4 mr-2 text-accent" /> Phone number</label>
            {isEditing ? (
              <input id="ap-phone" type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="e.g. +94 71 234 5678" className={fieldClass} />
            ) : <p className="text-lg">{profile.phone || <span className="text-gray-500 italic text-base">Not added yet</span>}</p>}
          </div>
          <div>
            <label htmlFor="ap-bio" className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
            {isEditing ? (
              <textarea id="ap-bio" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows="3" className={`${fieldClass} resize-none`} />
            ) : (
              <div className="bg-page rounded-xl p-4 text-gray-700 min-h-20 border border-line">
                {profile.bio || <span className="text-gray-500 italic">No bio added yet.</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin portal: dark sidebar navigation + section content.
const AdminProfile = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const tabMeta = TABS.find((t) => t.key === activeTab);
  usePageTitle(`Admin · ${tabMeta.label}`);

  const navigate = useNavigate();
  const { logout, admin: user } = useAdminAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pending, setPending] = useState(null);

  // Pending-order badge for the sidebar, refreshed whenever the section changes.
  const loadPending = useCallback(() => {
    axiosInstance.get('/admin/reports')
      .then((res) => setPending(res.data.pendingOrders))
      .catch(() => {});
  }, []);
  useEffect(() => { loadPending(); }, [activeTab, loadPending]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const goTo = (tab, options = {}) => {
    const next = new URLSearchParams({ tab });
    if (options.status) next.set('status', options.status);
    if (options.lowStock) next.set('lowStock', '1');
    if (options.add) next.set('new', '1');
    setSearchParams(next);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const sidebar = (
    <div className="h-full flex flex-col bg-[#1c1c1c] text-white">
      <div className="px-6 pt-7 pb-6 border-b border-white/10">
        <BrandLogo size="sidebar" align="start" tone="light" />
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#e8c48a]">
          <ShieldCheck className="w-3.5 h-3.5" /> Admin panel
        </span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3 py-5">
        <ul className="space-y-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <li key={key}>
                <button
                  onClick={() => goTo(key)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative w-full flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                    active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#e8c48a]" aria-hidden="true" />}
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-[#e8c48a]' : ''}`} />
                  <span className="flex-1 text-left">{label}</span>
                  {key === 'orders' && pending > 0 && (
                    <span className="min-w-6 h-6 px-1.5 rounded-full bg-[#e8c48a] text-[#1c1c1c] text-xs font-bold flex items-center justify-center" aria-label={`${pending} orders awaiting fulfilment`} title="Orders awaiting fulfilment">
                      {pending}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <span className="w-10 h-10 rounded-full bg-[#e8c48a] text-[#1c1c1c] font-semibold flex items-center justify-center shrink-0">{initials(user?.name)}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-white/60 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/home" className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-sm text-white/85">
            <Store className="h-4 w-4" /> Store
          </Link>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-red-500/20 py-2.5 text-sm text-white/85 hover:text-white">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>
    </div>
  );

  const TabIcon = tabMeta.icon;

  return (
    <div className="min-h-screen bg-page font-sans text-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[260px] z-40">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85%] shadow-2xl">
            <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="absolute top-4 right-3 z-10 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-[260px] flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#1c1c1c] text-white h-16 px-4 flex items-center gap-3">
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" aria-expanded={drawerOpen} className="w-10 h-10 -ml-2 flex items-center justify-center">
            <Menu className="w-6 h-6" />
          </button>
          <BrandLogo size="header" align="start" tone="light" />
          {pending > 0 && (
            <button onClick={() => goTo('orders')} className="ml-auto relative w-10 h-10 flex items-center justify-center" aria-label={`${pending} orders awaiting fulfilment`}>
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute top-0.5 right-0 min-w-5 h-5 px-1 rounded-full bg-[#e8c48a] text-[#1c1c1c] text-[11px] font-bold flex items-center justify-center">{pending}</span>
            </button>
          )}
        </div>

        {/* Section header */}
        <header className="bg-white border-b border-line lg:sticky lg:top-0 z-20">
          <div className="px-4 sm:px-8 py-5 flex flex-wrap items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
              <TabIcon className="w-6 h-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-luxe-dark">{tabMeta.label}</h1>
              <p className="text-sm text-gray-600">{tabMeta.subtitle}</p>
            </div>
            <span className="hidden md:flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="w-4 h-4 text-accent" /> {today}
            </span>
            {activeTab !== 'products' && (
              <button
                onClick={() => goTo('products', { add: true })}
                className="inline-flex items-center gap-2 rounded-full bg-[#1c1c1c] text-white px-5 py-2.5 text-sm font-semibold hover:bg-accent-dark transition-colors"
              >
                <Plus className="w-4 h-4" /> Add product
              </button>
            )}
          </div>
        </header>

        <main id="main" className="flex-grow py-6 sm:py-8 px-4 sm:px-8 w-full max-w-[1500px]">
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={goTo} adminName={user?.name} />}
          {activeTab === 'orders' && <AdminOrders initialStatus={searchParams.get('status') || ''} />}
          {activeTab === 'products' && <AdminProducts initialLowStock={searchParams.get('lowStock') === '1'} initialAdd={searchParams.get('new') === '1'} />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'customers' && <AdminUsers />}
          {activeTab === 'reviews' && <AdminReviews />}
          {activeTab === 'profile' && <MyProfile />}
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;

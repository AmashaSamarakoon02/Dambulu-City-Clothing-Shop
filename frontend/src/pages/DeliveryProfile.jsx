import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Truck, LogOut, Save, Mail, Phone, Package, MapPin, CreditCard, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import usePageTitle from '../hooks/usePageTitle';
import { StatusBadge } from '../components/orders/OrderStatus';
import { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, PAYMENT_METHODS } from '../constants/shop';
import { formatPrice, imageUrl } from '../utils/format';

const DeliveryProfile = () => {
  usePageTitle('Deliveries');
  const [profile, setProfile] = useState({ name: '', email: '', bio: '', phone: '', vehicleType: '', deliveryZone: '' });
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchProfile();
    fetchOrders();
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

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await axiosInstance.get('/orders/delivery');
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axiosInstance.put(`/orders/${orderId}/status`, { status: newStatus });
      // Delivered orders leave the delivery queue.
      setOrders(prev => newStatus === 'DELIVERED'
        ? prev.filter(o => o.id !== orderId)
        : prev.map(o => o.id === orderId ? { ...o, status: response.data.status, paymentStatus: response.data.paymentStatus } : o));
      toast.success(`Order #${orderId} marked as ${ORDER_STATUS[newStatus].label}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error(err.response?.data?.error || 'Failed to update status.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await axiosInstance.put('/auth/profile', {
        name: profile.name, 
        bio: profile.bio, 
        phone: profile.phone,
        vehicleType: profile.vehicleType,
        deliveryZone: profile.deliveryZone
      });
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profile saved successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Network error while saving.');
      toast.error('Failed to save profile');
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
          <div className="bg-luxe-dark h-32 md:h-40 relative">
            <div className="absolute -bottom-14 left-8 md:left-12">
              <div className="bg-white p-2 rounded-full shadow-lg">
                <div className="bg-blue-50 h-20 w-20 md:h-28 md:w-28 rounded-full flex items-center justify-center">
                  <Truck className="h-10 w-10 md:h-14 md:w-14 text-blue-600" />
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

          <div className="pt-20 pb-10 px-8 md:px-12">
            <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-light tracking-wide text-gray-900">{profile.name}</h1>
                <p className="text-gray-500 flex items-center mt-2">
                  <Mail className="h-4 w-4 mr-2" /> {profile.email}
                </p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white tracking-widest uppercase">
                  <Truck className="h-3 w-3 mr-1.5" /> Delivery Partner
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
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-600 text-white px-6 py-2.5 text-sm uppercase tracking-widest hover:bg-green-700 transition-colors rounded flex items-center disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="w-full h-px bg-gray-200 mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
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
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 uppercase tracking-widest mb-2">
                    Vehicle Type
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.vehicleType || ''}
                      onChange={(e) => setProfile({ ...profile, vehicleType: e.target.value })}
                      placeholder="e.g. Motorbike, Van"
                      className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg transition-colors"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 border-b-2 border-transparent py-2">
                      {profile.vehicleType || <span className="text-gray-400 italic text-base">Not specified</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 uppercase tracking-widest mb-2">
                    Delivery Zone
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.deliveryZone || ''}
                      onChange={(e) => setProfile({ ...profile, deliveryZone: e.target.value })}
                      placeholder="e.g. Colombo 1-15"
                      className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg transition-colors"
                    />
                  ) : (
                    <p className="text-lg text-gray-900 border-b-2 border-transparent py-2">
                      {profile.deliveryZone || <span className="text-gray-400 italic text-base">Not specified</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-200 my-10"></div>

            {/* Delivery Orders Section */}
            <div>
              <h2 className="text-xl font-bold tracking-widest uppercase mb-6 flex items-center">
                <Package className="h-5 w-5 mr-3" /> Delivery Tasks
              </h2>

              {ordersLoading ? (
                <div className="animate-pulse text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500 italic">
                  No pending deliveries at the moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const isExpanded = expandedOrder === order.id;
                    const address = order.deliveryAddress || {};
                    const nextStatuses = (ORDER_STATUS_TRANSITIONS[order.status] || []).filter((s) => s !== 'CANCELLED');
                    
                    return (
                      <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        {/* Order Header */}
                        <div 
                          className="p-4 md:p-6 flex flex-wrap items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-gray-500 uppercase tracking-wider">Order #{order.id}</span>
                            <span className="font-medium text-gray-900">{order.customerName || order.user?.name || 'Customer'}</span>
                            {address.city && <span className="text-xs text-gray-500">{address.city}</span>}
                          </div>

                          <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <StatusBadge status={order.status} />
                            <span className="font-bold">{formatPrice(order.totalAmount)}</span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>

                        {/* Order Details (Cart items, address, actions) */}
                        {isExpanded && (
                          <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-8">
                            
                            {/* Left Side: Delivery Details & Actions */}
                            <div className="flex-1 space-y-6">
                              <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                                  <MapPin className="w-4 h-4 mr-2" /> Delivery Details
                                </h3>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm space-y-2">
                                  <p><span className="font-medium">Customer:</span> {order.customerName || order.user?.name}</p>
                                  <p><span className="font-medium">Phone:</span> {order.phone || order.user?.phone ? <a href={`tel:${order.phone || order.user?.phone}`} className="underline">{order.phone || order.user?.phone}</a> : 'No phone'}</p>
                                  <p><span className="font-medium">Address:</span> {[address.line1, address.city, address.postalCode].filter(Boolean).join(', ') || 'N/A'}</p>
                                  {address.instructions && (
                                    <p className="text-gray-500 italic"><span className="font-medium not-italic text-gray-900">Instructions:</span> {address.instructions}</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                                  <CreditCard className="w-4 h-4 mr-2" /> Payment Info
                                </h3>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm space-y-2">
                                  <p><span className="font-medium">Method:</span> {PAYMENT_METHODS[order.paymentMethod]?.label || order.paymentMethod}</p>
                                  <p><span className="font-medium">Status:</span> {order.paymentStatus === 'PAID' ? 'Paid' : order.paymentMethod === 'COD' ? `Collect ${formatPrice(order.totalAmount)} on delivery` : 'Unpaid'}</p>
                                </div>
                              </div>

                              {/* Update Status Actions */}
                              <div className="pt-2">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-medium">Update Status</p>
                                <div className="flex flex-wrap gap-2">
                                  {nextStatuses.map((s) => {
                                    const Icon = { PROCESSING: Clock, SHIPPED: Truck, DELIVERED: CheckCircle }[s] || CheckCircle;
                                    return (
                                      <button
                                        key={s}
                                        onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, s); }}
                                        className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest rounded flex items-center"
                                      >
                                        <Icon className="w-3 h-3 mr-1.5" /> Mark as {ORDER_STATUS[s].label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Cart Items */}
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center mb-3">
                                <Package className="w-4 h-4 mr-2" /> Cart Items ({order.items.length})
                              </h3>
                              <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 flex gap-3">
                                    <img
                                      src={imageUrl(item.productImage)}
                                      alt={item.productName}
                                      className="w-16 h-20 object-cover rounded bg-gray-100"
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                      <div>
                                        <p className="text-sm font-medium line-clamp-2">{item.productName || 'Product'}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                          {item.color && <span className="capitalize border-r pr-2">{item.color}</span>}
                                          {item.size && <span>{item.size}</span>}
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs font-bold text-gray-900">Qty: {item.quantity}</span>
                                        <span className="text-xs font-bold text-gray-900">{formatPrice(item.price)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeliveryProfile;

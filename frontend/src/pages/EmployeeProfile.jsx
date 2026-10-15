import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, LogOut, Save, Mail, Phone, Briefcase, IdCard, Calendar } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Sales Floor', 'Inventory', 'Customer Service', 'Warehouse', 'Marketing', 'Other'];

// Profile management page for the EMPLOYEE (staff) role.
const EmployeeProfile = () => {
  const [profile, setProfile] = useState({
    name: '', email: '', bio: '', phone: '', department: '', employeeId: '', createdAt: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchProfile();
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
    setSaving(true);
    setError('');
    try {
      const response = await axiosInstance.put('/auth/profile', {
        name: profile.name,
        bio: profile.bio,
        phone: profile.phone,
        department: profile.department
      });
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Network error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

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
                  <Briefcase className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
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
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-600 text-white tracking-widest uppercase">
                    <Briefcase className="h-3 w-3 mr-1.5" /> Staff Member
                  </span>
                  {profile.employeeId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 tracking-widest">
                      <IdCard className="h-3 w-3 mr-1.5" /> {profile.employeeId}
                    </span>
                  )}
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

            <div className="w-full h-px bg-gray-200 mb-10"></div>

            {/* Read-only staff info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 max-w-2xl">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center">
                  <IdCard className="h-3.5 w-3.5 mr-1.5" /> Employee ID
                </p>
                <p className="text-gray-900 font-medium">{profile.employeeId || '—'}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" /> Employee Since
                </p>
                <p className="text-gray-900 font-medium">{joinedDate || '—'}</p>
              </div>
            </div>

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
                  <Briefcase className="h-3.5 w-3.5 mr-2" /> Department
                </label>
                {isEditing ? (
                  <select
                    value={profile.department || ''}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="w-full border-b-2 border-gray-300 focus:border-black bg-transparent py-2 outline-none text-lg transition-colors"
                  >
                    <option value="">Select a department</option>
                    {DEPARTMENTS.map((dep) => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg text-gray-900 border-b-2 border-transparent py-2">
                    {profile.department || <span className="text-gray-400 italic text-base">Not assigned yet</span>}
                  </p>
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
                    placeholder="A short note about your role..."
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

export default EmployeeProfile;

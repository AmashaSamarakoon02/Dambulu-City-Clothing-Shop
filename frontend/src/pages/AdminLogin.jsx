import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminAuth } from '../context/AdminAuthContext';
import usePageTitle from '../hooks/usePageTitle';
import { AuthInput, AuthButton, AuthAlert } from '../components/AuthLayout';
import { EMAIL_REGEX } from '../utils/authValidation';

// Separate sign-in for the admin portal. Customer accounts can't sign in here,
// and admin accounts can't sign in on the customer login.
const AdminLogin = () => {
  usePageTitle('Admin Sign In');
  const { login, isAdmin, loading: checking } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const target = location.state?.from?.pathname?.startsWith('/admin')
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/admin';

  useEffect(() => {
    if (!checking && isAdmin) navigate(target, { replace: true });
  }, [checking, isAdmin, navigate, target]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const next = {};
    if (!EMAIL_REGEX.test(email.trim())) next.email = 'Please enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Signed in');
      navigate(target, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.error || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <ShieldCheck className="w-10 h-10 mx-auto text-purple-700 mb-3" strokeWidth={1.5} />
          <h1 className="text-lg font-bold tracking-widest uppercase">Admin Sign In</h1>
          <p className="text-xs text-gray-500 mt-1">Dambulla City Clothing Shop management portal</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError && <AuthAlert>{serverError}</AuthAlert>}
          <AuthInput
            id="admin-email" label="Email" type="email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email}
          />
          <AuthInput
            id="admin-password" label="Password" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password}
          />
          <AuthButton type="submit" loading={loading}>Sign In</AuthButton>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

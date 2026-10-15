import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { AuthInput, AuthButton, AuthAlert, DevLinkNotice } from '../components/AuthLayout';
import usePageTitle from '../hooks/usePageTitle';
import { EMAIL_REGEX } from '../utils/authValidation';

const Login = () => {
  usePageTitle('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [devLink, setDevLink] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendVerification } = useAuth();

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Please enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError('');
    setNeedsVerification(false);
    setDevLink('');
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      const from = location.state?.from;
      navigate(from ? `${from.pathname}${from.search || ''}` : '/home', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const errorMsg = data?.error || 'Login failed. Please try again.';
      setServerError(errorMsg);
      setNeedsVerification(data?.code === 'EMAIL_NOT_VERIFIED');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const data = await resendVerification(email.trim());
      toast.success(data.message);
      setDevLink(data.devLink || '');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resend the email');
    } finally {
      setResending(false);
    }
  };

  const inputClass = 'px-4 py-3.5 border rounded-lg bg-gray-50 focus:bg-white placeholder:text-gray-400';

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-luxe-dark flex flex-col items-center justify-center px-4 py-10">
      <Link to="/home" className="text-xl sm:text-2xl font-light tracking-[0.25em] uppercase text-black hover:opacity-80 mb-8">
        Luxe Attire
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[0.12em] uppercase">Login</h1>
        <p className="text-sm text-gray-500 mt-3 mb-8">Welcome back! Sign in to continue shopping.</p>

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          {serverError && (
            <AuthAlert>
              {serverError}
              {needsVerification && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="block mt-2 font-semibold underline hover:no-underline disabled:opacity-60"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </AuthAlert>
          )}
          <DevLinkNotice link={devLink} label="Verify My Email" />

          <AuthInput
            id="email"
            label="Email"
            hideLabel
            inputClassName={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="Email"
          />

          <div>
            <AuthInput
              id="password"
              label="Password"
              hideLabel
              inputClassName={inputClass}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="Password"
            />
            <div className="text-right mt-3">
              <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-black hover:underline underline-offset-4">
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <AuthButton type="submit" loading={loading} className="rounded-lg py-4 text-sm">
              {loading ? 'Signing In' : 'Sign In'}
            </AuthButton>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-7">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-black hover:underline underline-offset-4">
            Sign Up
          </Link>
        </p>
      </div>

      <Link to="/home" className="mt-8 inline-flex items-center text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-black">
        <ArrowLeft className="w-4 h-4 mr-2" /> Return to store
      </Link>
    </div>
  );
};

export default Login;

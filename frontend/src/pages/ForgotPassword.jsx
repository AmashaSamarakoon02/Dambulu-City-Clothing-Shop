import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout, { AuthInput, AuthButton, AuthAlert, DevLinkNotice } from '../components/AuthLayout';
import { EMAIL_REGEX } from '../utils/authValidation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    if (!EMAIL_REGEX.test(email.trim())) return setError('Please enter a valid email address');
    setError('');

    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setSentMessage(data.message);
      setDevLink(data.devLink || '');
      toast.success('Check your email');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Your Password" subtitle="We will send you an email to reset your password.">
      {sentMessage ? (
        <div className="space-y-6">
          <AuthAlert type="success">{sentMessage}</AuthAlert>
          <DevLinkNotice link={devLink} label="Reset My Password" />
          <Link to="/login" className="block text-center text-xs font-semibold uppercase tracking-[0.2em] underline underline-offset-4 hover:no-underline">
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <AuthInput
            id="email" label="Email" type="email" autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} error={error} placeholder="name@example.com"
          />
          <AuthButton type="submit" loading={loading}>Submit</AuthButton>
          <Link to="/login" className="block text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 hover:text-black">
            Cancel
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;

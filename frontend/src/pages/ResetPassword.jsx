import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout, { AuthInput, AuthButton, AuthAlert } from '../components/AuthLayout';
import { validatePassword } from '../utils/authValidation';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const next = {};
    const passwordError = validatePassword(password);
    if (passwordError) next.password = passwordError;
    if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(token, password);
      toast.success(data.message);
      navigate('/login', { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Could not reset your password. Please try again.';
      setServerError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="New Password" subtitle="Choose a new password for your account.">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {serverError && (
          <AuthAlert>
            {serverError}{' '}
            <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>
          </AuthAlert>
        )}
        <AuthInput
          id="password" label="New Password" type="password" autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="••••••••"
        />
        <AuthInput
          id="confirmPassword" label="Confirm New Password" type="password" autoComplete="new-password"
          value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} placeholder="••••••••"
        />
        <AuthButton type="submit" loading={loading}>Reset Password</AuthButton>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

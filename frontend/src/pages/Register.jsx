import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout, { AuthInput, AuthButton, AuthAlert, DevLinkNotice } from '../components/AuthLayout';
import { EMAIL_REGEX, validatePassword } from '../utils/authValidation';

const initialForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };

const Register = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [devLink, setDevLink] = useState('');
  const { register, resendVerification } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Please enter a valid email address';
    const passwordError = validatePassword(form.password);
    if (passwordError) next.password = passwordError;
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError('');
    setUnverifiedEmail('');
    setDevLink('');
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim();
      const data = await register(form.firstName.trim(), form.lastName.trim(), email, form.password);
      toast.success(data.message);
      setRegisteredEmail(email);
      setDevLink(data.devLink || '');
      setForm(initialForm);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      setServerError(errorMsg);
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') setUnverifiedEmail(form.email.trim());
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const data = await resendVerification(registeredEmail || unverifiedEmail);
      toast.success(data.message);
      setDevLink(data.devLink || '');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not resend the email');
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    return (
      <AuthLayout title="Check Your Inbox">
        <div className="text-center space-y-6">
          <MailCheck className="h-12 w-12 mx-auto text-black" strokeWidth={1.25} />
          <p className="text-sm text-gray-600 leading-relaxed">
            We've sent a verification link to <span className="font-semibold text-black">{registeredEmail}</span>.
            Click the link in the email to activate your account, then log in.
          </p>
          <DevLinkNotice link={devLink} label="Verify My Email" />
          <p className="text-xs text-gray-500">Didn't get it? Check your spam folder or resend it below.</p>
          <AuthButton type="button" variant="secondary" loading={resending} onClick={handleResend}>
            Resend Verification Email
          </AuthButton>
          <Link to="/login" className="block text-xs font-semibold uppercase tracking-[0.2em] underline underline-offset-4 hover:no-underline">
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Sign Up" subtitle="Create your Dambulla City Clothing Shop account">
      <form onSubmit={handleRegister} noValidate className="space-y-5">
        {serverError && (
          <AuthAlert>
            {serverError}
            {unverifiedEmail && (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <AuthInput
            id="firstName" name="firstName" label="First Name" autoComplete="given-name"
            value={form.firstName} onChange={handleChange} error={errors.firstName}
          />
          <AuthInput
            id="lastName" name="lastName" label="Last Name" autoComplete="family-name"
            value={form.lastName} onChange={handleChange} error={errors.lastName}
          />
        </div>

        <AuthInput
          id="email" name="email" label="Email" type="email" autoComplete="email"
          value={form.email} onChange={handleChange} error={errors.email} placeholder="name@example.com"
        />

        <div>
          <AuthInput
            id="password" name="password" label="Password" type="password" autoComplete="new-password"
            value={form.password} onChange={handleChange} error={errors.password} placeholder="••••••••"
          />
          {!errors.password && (
            <p className="text-xs text-gray-500 mt-2">At least 8 characters, including a letter and a number.</p>
          )}
        </div>

        <AuthInput
          id="confirmPassword" name="confirmPassword" label="Confirm Password" type="password" autoComplete="new-password"
          value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="••••••••"
        />

        <div className="pt-2">
          <AuthButton type="submit" loading={loading}>
            {loading ? 'Creating Account' : 'Create Account'}
          </AuthButton>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-black underline underline-offset-4 hover:no-underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;

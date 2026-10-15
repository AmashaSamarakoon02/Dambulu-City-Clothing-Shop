import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AuthLayout, { AuthInput, AuthButton, DevLinkNotice } from '../components/AuthLayout';
import { EMAIL_REGEX } from '../utils/authValidation';

const VerifyEmail = () => {
  const { token } = useParams();
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [resending, setResending] = useState(false);
  const [devLink, setDevLink] = useState('');
  const requested = useRef(false);

  useEffect(() => {
    // Tokens are single-use, so guard against StrictMode's double effect run.
    if (requested.current) return;
    requested.current = true;

    verifyEmail(token)
      .then((data) => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'This verification link is invalid or has expired.');
      });
  }, [token, verifyEmail]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email.trim())) return setEmailError('Please enter a valid email address');
    setEmailError('');
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

  return (
    <AuthLayout title="Email Verification">
      <div className="text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Verifying your email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" strokeWidth={1.25} />
            <p className="text-sm text-gray-600">{message}</p>
            <Link
              to="/login"
              className="inline-block w-full py-3.5 bg-black text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors"
            >
              Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-600" strokeWidth={1.25} />
            <p className="text-sm text-gray-600">{message}</p>
            <form onSubmit={handleResend} noValidate className="space-y-4 text-left pt-4 border-t border-gray-200">
              <AuthInput
                id="email" label="Email" type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} placeholder="name@example.com"
              />
              <AuthButton type="submit" loading={resending}>Send New Link</AuthButton>
              <DevLinkNotice link={devLink} label="Verify My Email" />
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;

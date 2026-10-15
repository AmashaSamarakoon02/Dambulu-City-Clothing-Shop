import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import BrandLogo from './BrandLogo';

// Minimal, centered account-page shell (inspired by zigzag.lk's account pages).
const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-page font-sans text-luxe-dark flex flex-col">
    <header className="border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link
          to="/home"
          aria-label="Return to store"
          className="w-10 sm:w-40 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4 sm:mr-2 shrink-0" /> <span className="hidden sm:inline">Return to Store</span>
        </Link>
        <BrandLogo size="header" />
        <span className="w-10 sm:w-40" />
      </div>
    </header>

    <main className="flex-1 flex items-start justify-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-light uppercase tracking-[0.25em] mb-3">{title}</h1>
          <div className="w-12 h-px bg-black mx-auto mb-4" />
          {subtitle && <p className="text-sm text-gray-500 tracking-wide">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  </div>
);

// `hideLabel` keeps the label for screen readers only; `inputClassName` replaces the default box style.
export const AuthInput = ({ label, error, type = 'text', hideLabel = false, inputClassName, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const boxClass = inputClassName ?? 'px-4 py-3 border bg-white';

  return (
    <div className={hideLabel ? 'space-y-1.5' : 'space-y-2'}>
      <label
        htmlFor={props.id}
        className={hideLabel ? 'sr-only' : 'block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-700'}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          aria-invalid={Boolean(error)}
          className={`block w-full text-sm outline-none transition-colors ${boxClass} ${
            error ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-black'
          } ${isPassword ? 'pr-11' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-black"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const AuthButton = ({ loading, children, variant = 'primary', className = '', ...props }) => (
  <button
    disabled={loading}
    className={`w-full flex justify-center items-center py-3.5 px-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors disabled:opacity-60 ${
      variant === 'primary'
        ? 'bg-black text-white hover:bg-gray-800'
        : 'bg-white text-black border border-black hover:bg-black hover:text-white'
    } ${className}`}
    {...props}
  >
    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
    {children}
  </button>
);

export const AuthAlert = ({ type = 'error', children }) => (
  <div
    role="alert"
    className={`text-sm px-4 py-3 border ${
      type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'
    }`}
  >
    {children}
  </div>
);

// Shown only in local development when the backend has no email (SMTP) configured:
// the API then returns the link it would have emailed.
export const DevLinkNotice = ({ link, label }) => {
  if (!link) return null;
  let path = link;
  try {
    path = new URL(link).pathname;
  } catch {
    // keep as-is
  }
  return (
    <div className="bg-amber-50 border border-amber-300 text-amber-900 text-sm px-4 py-3 text-left">
      <p className="font-semibold mb-1">Email sending isn't set up yet (development mode)</p>
      <p className="mb-3 text-xs">No email was sent. Use this link instead – it's the one the email would contain.</p>
      <Link to={path} className="inline-block bg-black text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-gray-800">
        {label}
      </Link>
    </div>
  );
};

export default AuthLayout;

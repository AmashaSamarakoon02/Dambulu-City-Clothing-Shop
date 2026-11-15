import React from 'react';
import { Link } from 'react-router-dom';

export const SHOP_NAME = 'Dambulla City Clothing Shop';

const SIZES = {
  // Storefront header: must fit beside the icons on phones
  header: { main: 'text-base sm:text-xl lg:text-2xl tracking-[0.16em] sm:tracking-[0.2em]', sub: 'text-[9px] sm:text-[10px] tracking-[0.35em] sm:tracking-[0.45em]' },
  // Admin sidebar (260px wide)
  sidebar: { main: 'text-lg tracking-[0.18em]', sub: 'text-[9px] tracking-[0.4em]' },
  // Account pages (login, sign up, …)
  page: { main: 'text-xl sm:text-2xl tracking-[0.2em]', sub: 'text-[10px] tracking-[0.45em]' }
};

// Two-line wordmark: "DAMBULLA CITY" with "CLOTHING SHOP" underneath.
// tone='light' is the white version for dark backgrounds (header, footer).
const BrandLogo = ({ size = 'header', align = 'center', tone = 'dark', className = '' }) => {
  const s = SIZES[size] || SIZES.header;
  return (
    <Link
      to="/home"
      aria-label={`${SHOP_NAME} – home`}
      className={`inline-flex flex-col ${align === 'start' ? 'items-start' : 'items-center'} leading-none ${tone === 'light' ? 'text-white' : 'text-black'} uppercase hover:opacity-80 transition-opacity whitespace-nowrap ${className}`}
    >
      <span className={`font-light ${s.main}`}>Dambulla City</span>
      <span className={`mt-1.5 font-medium ${tone === 'light' ? 'text-[#e8c48a]' : 'text-gray-600'} ${s.sub}`}>Clothing Shop</span>
    </Link>
  );
};

export default BrandLogo;

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import SocialIcon from './SocialIcons';
import { useCart } from '../context/CartContext';
import { CONTACT } from '../constants/contact';

// Bottom-right helpers on every store page: WhatsApp chat and back-to-top (after scrolling).
// Hidden while the cart drawer is open so they never cover its buttons.
const FloatingActions = () => {
  const { isCartOpen } = useCart();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isCartOpen) return null;

  const toTop = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <div className="fixed bottom-5 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      {showTop && (
        <button
          onClick={toTop}
          aria-label="Back to top"
          className="w-11 h-11 rounded-full bg-white text-luxe-dark border border-line shadow-lg flex items-center justify-center hover:bg-black hover:text-white transition-colors"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
      <a
        href={CONTACT.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="group flex items-center gap-2 h-12 pl-3 pr-3 sm:pr-4 rounded-full bg-[#146c39] text-white shadow-lg shadow-black/20 hover:bg-[#0f5a2f] transition-colors"
      >
        <SocialIcon name="WhatsApp" className="w-6 h-6" />
        <span className="hidden sm:inline text-xs font-semibold tracking-wide">Chat with us</span>
      </a>
    </div>
  );
};

export default FloatingActions;

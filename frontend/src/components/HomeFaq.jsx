import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, MessageCircle, Phone } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { CONTACT } from '../constants/contact';
import { formatPrice } from '../utils/format';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '../constants/shop';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: `We deliver islandwide. Colombo & suburbs take 1–3 working days and other areas 3–5 working days. Orders over ${formatPrice(FREE_DELIVERY_THRESHOLD)} ship free; below that a flat ${formatPrice(DELIVERY_FEE)} applies.`
  },
  {
    q: 'Can I pay cash on delivery?',
    a: 'Yes. We accept cash on delivery, Visa / Mastercard / Amex cards and bank transfer.'
  },
  {
    q: "What if the size doesn't fit?",
    a: 'You can exchange or return unworn items with tags within 7 days of delivery. Use the size chart on each product page to find your best fit.'
  },
  {
    q: 'Can I visit the shop in Dambulla?',
    a: `Of course! Visit us at ${CONTACT.address} (${CONTACT.hours}).`
  },
  {
    q: 'How do I track my order?',
    a: 'Log in and open My Orders. Each order shows its current status, and we email you whenever it changes.'
  }
];

// Home FAQ: accordion with round +/− icons and a help card with an image beside it.
const HomeFaq = ({ image }) => (
  <section className="shell py-16 md:py-24" aria-labelledby="faq-title">
    <SectionHeader center id="faq-title" eyebrow="Frequently asked questions" title="Your Guide to Easy Shopping" />
    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-start">
      <div className="divide-y divide-line border-y border-line">
        {FAQS.map((f, i) => (
          <details key={f.q} className="group py-1" open={i === 0}>
            <summary className="flex items-center gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="shrink-0 w-8 h-8 rounded-full border border-accent/40 text-accent flex items-center justify-center group-open:bg-accent group-open:text-white group-open:border-accent transition-colors">
                <Plus className="w-4 h-4 group-open:hidden" aria-hidden="true" />
                <Minus className="w-4 h-4 hidden group-open:block" aria-hidden="true" />
              </span>
              <span className="text-sm sm:text-base font-medium text-luxe-dark">{f.q}</span>
            </summary>
            <p className="pl-12 pb-5 pr-2 text-sm text-gray-600 leading-relaxed">{f.a}</p>
          </details>
        ))}
        <p className="pt-5 text-sm text-gray-600">
          More answers on our <Link to="/pages/faq" className="underline underline-offset-4 hover:text-black">FAQ page</Link>.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl min-h-[380px] shadow-xl shadow-black/10">
        <img src={image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative h-full min-h-[380px] flex flex-col justify-end p-6 sm:p-8 text-white">
          <span className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6" />
          </span>
          <h3 className="text-2xl font-light mb-2">Still have questions?</h3>
          <p className="text-sm text-white/85 mb-6">Our team is happy to help with sizes, stock and orders.</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-accent-soft transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
            </a>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-colors"
            >
              <Phone className="w-4 h-4" /> {CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HomeFaq;

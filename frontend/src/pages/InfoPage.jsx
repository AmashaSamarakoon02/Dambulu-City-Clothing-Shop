import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';
import { formatPrice } from '../utils/format';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '../constants/shop';
import { CONTACT } from '../constants/contact';
import { SizeChartTables } from '../components/SizeChart';

const PAGES = {
  about: {
    title: 'About Us',
    body: (
      <>
        <p>Welcome to <strong>Dambulla City Clothing Shop</strong> – a modern clothing store in the heart of Dambulla, Sri Lanka. We bring you the latest styles in men&apos;s, women&apos;s and kids&apos; clothing, along with shoes and accessories, all in one place.</p>
        <p>We are committed to quality. Every item is carefully chosen for good fabric, a comfortable fit and lasting wear – and we keep our prices affordable, so the whole family can dress well without spending too much.</p>
        <p>Our customers come first. Whether you visit us in Dambulla or shop online with islandwide delivery, we want every visit to be a pleasant and easy shopping experience, with friendly service and simple exchanges. Thank you for shopping with us!</p>
      </>
    )
  },
  contact: {
    title: 'Contact Us',
    body: (
      <>
        <p>We're happy to help with orders, sizing and returns.</p>
        <ul className="list-none space-y-2 pl-0">
          <li><strong>Phone:</strong> <a href={CONTACT.phoneHref} className="underline">{CONTACT.phoneDisplay}</a> ({CONTACT.hours})</li>
          <li><strong>WhatsApp:</strong> <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="underline">Chat with us on WhatsApp</a></li>
          <li><strong>Email:</strong> <a href={`mailto:${CONTACT.email}`} className="underline">{CONTACT.email}</a></li>
          <li>
            <strong>Store:</strong> {CONTACT.address}, {CONTACT.country}{' '}
            (<a href={CONTACT.mapsUrl} target="_blank" rel="noopener noreferrer" className="underline">Get directions</a>)
          </li>
        </ul>
        <p>Please include your order number (e.g. #1024) when contacting us about an order.</p>
      </>
    )
  },
  delivery: {
    title: 'Delivery Information',
    body: (
      <>
        <p>We deliver islandwide across Sri Lanka.</p>
        <ul>
          <li>Orders over <strong>{formatPrice(FREE_DELIVERY_THRESHOLD)}</strong> ship free.</li>
          <li>Orders below that have a flat delivery fee of <strong>{formatPrice(DELIVERY_FEE)}</strong>.</li>
          <li>Colombo & suburbs: 1–3 working days. Other areas: 3–5 working days.</li>
          <li>Cash on delivery, card payment and bank transfer are accepted.</li>
        </ul>
        <p>You can follow every step of your order (Confirmed → Processing → Shipped → Delivered) from <Link to="/orders" className="underline">My Orders</Link>.</p>
      </>
    )
  },
  returns: {
    title: 'Returns & Exchanges',
    body: (
      <>
        <p>Not the right fit? You can exchange or return unworn items with tags attached within <strong>7 days</strong> of delivery.</p>
        <ul>
          <li>Contact us with your order number to start an exchange or return.</li>
          <li>Sale items can be exchanged for size only.</li>
          <li>Refunds for card payments are made to the original card within 7–10 working days.</li>
          <li>Undergarments, swimwear and accessories such as earrings cannot be returned for hygiene reasons.</li>
        </ul>
        <p>You can cancel an order yourself from <Link to="/orders" className="underline">My Orders</Link> until it starts processing.</p>
      </>
    )
  },
  faq: {
    title: 'Frequently Asked Questions',
    body: (
      <>
        <h3>How do I track my order?</h3>
        <p>Log in and open <Link to="/orders" className="underline">My Orders</Link>. Each order shows its current status, and we email you whenever it changes.</p>
        <h3>Can I cancel my order?</h3>
        <p>Yes – while an order is Pending or Confirmed you can cancel it from the order page. Once it is being processed, please contact us.</p>
        <h3>Which payment methods do you accept?</h3>
        <p>Cash on delivery, Visa / Mastercard / Amex, and bank transfer.</p>
        <h3>Do I need an account to shop?</h3>
        <p>You can browse and add items to your cart as a guest. To check out, track orders and save a wishlist, please create a free account.</p>
        <h3>How do I find my size?</h3>
        <p>See our <Link to="/pages/size-guide" className="underline">Size Guide</Link>.</p>
      </>
    )
  },
  'size-guide': {
    title: 'Size Guide',
    body: <SizeChartTables />
  },
  privacy: {
    title: 'Privacy Policy',
    body: (
      <>
        <p>We collect only the information needed to process your orders and run your account: your name, email, phone number, delivery address and order history.</p>
        <ul>
          <li>Passwords are stored securely as hashes and are never visible to our staff.</li>
          <li>Your details are shared only with our delivery partners to deliver your order.</li>
          <li>Newsletter emails are sent only if you subscribe, and you can unsubscribe at any time.</li>
        </ul>
        <p>To update or delete your data, edit your profile or <Link to="/pages/contact" className="underline">contact us</Link>.</p>
      </>
    )
  },
  terms: {
    title: 'Terms of Service',
    body: (
      <>
        <p>By placing an order on Dambulla City Clothing Shop you agree to the following:</p>
        <ul>
          <li>All prices are in Sri Lankan Rupees (LKR) and include applicable taxes.</li>
          <li>Orders are subject to stock availability. If an item becomes unavailable we will contact you and refund any payment.</li>
          <li>Card orders are processed once payment is completed; bank transfer orders ship once payment is received.</li>
          <li>Returns and exchanges follow our <Link to="/pages/returns" className="underline">Returns policy</Link>.</li>
        </ul>
      </>
    )
  }
};

const InfoPage = () => {
  const { slug } = useParams();
  const page = PAGES[slug];
  usePageTitle(page?.title || 'Page not found');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-page font-sans text-luxe-dark">
      <Navbar />
      <main id="main" className="flex-grow pt-24 md:pt-40 pb-20 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        {page ? (
          <>
            <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-8">{page.title}</h1>
            <div className="text-sm text-gray-700 leading-relaxed space-y-4 [&_h3]:font-semibold [&_h3]:text-black [&_h3]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
              {page.body}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <h1 className="text-2xl font-light uppercase tracking-widest mb-4">Page not found</h1>
            <Link to="/home" className="underline text-sm">Back to Home</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default InfoPage;

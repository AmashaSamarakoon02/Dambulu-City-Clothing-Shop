import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RefreshCw, ShieldCheck, Banknote, Store, MessageCircle, ArrowRight, Wallet } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';
import HeroSearch from '../components/HeroSearch';
import FlashSale from '../components/FlashSale';
import Lookbook from '../components/Lookbook';
import HomeFaq from '../components/HomeFaq';
import SectionHeader from '../components/SectionHeader';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import useCategories from '../hooks/useCategories';
import { formatPrice, imageUrl } from '../utils/format';
import { FREE_DELIVERY_THRESHOLD } from '../constants/shop';
import { CONTACT } from '../constants/contact';
import heroImg from '../assets/hero_banner.png';
import womenImg from '../assets/women_category.png';
import menImg from '../assets/men_category.png';
import kidsImg from '../assets/kids_category.png';

const SLIDES = [
  {
    eyebrow: 'Dambulla City Clothing Shop',
    title: 'New Season',
    highlight: 'Fresh Styles',
    text: 'Discover the latest clothing, shoes, bags and accessories for the whole family – at affordable prices.',
    image: heroImg,
    cta: { label: 'Shop New Arrivals', to: '/shop?new=true' },
    secondary: { label: 'Shop All', to: '/shop' }
  },
  {
    eyebrow: "Women's Collection",
    title: 'Silk Sarees',
    highlight: 'For Every Occasion',
    text: "Silk sarees and cotton kurtis for weddings, Avurudu and festive days – now in Women's Wear.",
    image: imageUrl('/uploads/ethnic/purple-gold-border-saree.jpg'),
    position: 'object-[center_25%]',
    cta: { label: 'Shop Sarees', to: '/shop?search=saree' },
    secondary: { label: "All Women's Wear", to: '/category/womens-wear' }
  },
  {
    eyebrow: 'This Week Only',
    title: 'Flash Sale',
    highlight: 'Up to 30% Off',
    text: 'Save on selected shirts, shoes, bags and accessories while stocks last.',
    image: menImg,
    position: 'object-top',
    cta: { label: 'Shop the Sale', to: '/shop?sale=true&sort=deals' }
  }
];

// Category tile images: bundled photos for clothing, product photos for the rest.
const CATEGORY_IMAGES = {
  'womens-wear': womenImg,
  'mens-wear': menImg,
  'kids-wear': kidsImg,
  sportswear: imageUrl('/uploads/sportswear/rose-sports-bra-leggings-set.jpg'),
  shoes: imageUrl('/uploads/shoes/suede-sneakers.jpg'),
  bags: imageUrl('/uploads/bags/burgundy-leather-backpack.jpg'),
  accessories: imageUrl('/uploads/accessories/leather-handbag.jpg')
};

const LOOKBOOK = [
  { to: '/shop?search=saree', eyebrow: 'Festive edit', title: 'Silk Sarees', image: imageUrl('/uploads/ethnic/red-pink-bridal-saree.jpg'), position: 'object-[center_20%]' },
  { to: '/category/sportswear', eyebrow: 'Move freely', title: 'Sportswear', image: imageUrl('/uploads/sportswear/white-tank-black-leggings.jpg') },
  { to: '/category/bags', eyebrow: 'Carry it all', title: 'Bags', image: imageUrl('/uploads/bags/grey-mini-satchel.jpg') },
  { to: '/category/shoes', eyebrow: 'Step out', title: 'Shoes', image: imageUrl('/uploads/shoes/white-pumps.jpg') },
  { to: '/category/accessories', eyebrow: 'Finishing touch', title: 'Accessories', image: imageUrl('/uploads/accessories/white-minimal-watch.jpg') }
];

const BENEFITS = [
  { icon: Truck, title: 'Islandwide Delivery', text: `Free on orders over ${formatPrice(FREE_DELIVERY_THRESHOLD)}` },
  { icon: Banknote, title: 'Cash on Delivery', text: 'Pay when your parcel arrives' },
  { icon: RefreshCw, title: '7-Day Exchanges', text: 'Easy size and style swaps' },
  { icon: ShieldCheck, title: 'Secure Payments', text: 'Visa, Mastercard & Amex' },
  { icon: Store, title: 'Visit Our Store', text: 'Kurunegala Junction, Dambulla' },
  { icon: MessageCircle, title: 'WhatsApp Support', text: CONTACT.phoneDisplay }
];

const PRICE_LIMITS = [3000, 5000, 10000];

const ProductRow = ({ eyebrow, title, subtitle, link, products }) => (
  products.length > 0 && (
    <section className="shell py-16 md:py-20">
      <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} link={link} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-10">
        {products.map((p, i) => (
          // 2 rows of 2 on phones, 3 / 4 / 5 in one row on larger screens.
          <div key={p.id} className={i === 4 ? 'hidden 2xl:block' : i === 3 ? 'md:hidden lg:block' : ''}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
);

const Home = () => {
  usePageTitle();
  const { categories } = useCategories();
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);

  useEffect(() => {
    axiosInstance.get('/products', { params: { new: true, limit: 5 } }).then((res) => setNewArrivals(res.data.data)).catch(() => {});
    axiosInstance.get('/products', { params: { bestSeller: true, limit: 5 } }).then((res) => setBestSellers(res.data.data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-page font-sans text-luxe-dark">
      <Navbar />

      <main id="main">
        <HeroCarousel slides={SLIDES} />
        <HeroSearch />

        {/* Benefits: icon cards */}
        <section className="shell pt-12 md:pt-16" aria-label="Why shop with us">
          <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-3 sm:p-4 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all">
                <span className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-accent-soft text-accent flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs sm:text-sm font-semibold text-luxe-dark">{title}</span>
                  <span className="block text-[11px] sm:text-xs text-gray-600">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Shop by category */}
        <section className="shell py-16 md:py-20" aria-labelledby="cat-title">
          <SectionHeader
            center
            id="cat-title"
            eyebrow="Shop by category"
            title="Something for Everyone"
            subtitle="Clothing for the whole family, plus shoes, bags and accessories – all in one place."
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
            {categories.map((c) => (
              <Link
                to={`/category/${c.slug}`}
                key={c.slug}
                className="group relative aspect-[3/4] overflow-hidden bg-page-alt rounded-2xl hover:shadow-xl hover:shadow-black/10 transition-shadow"
              >
                {CATEGORY_IMAGES[c.slug] && (
                  <img
                    src={CATEGORY_IMAGES[c.slug]}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-white flex items-end justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-xl font-light tracking-wide drop-shadow-md">{c.name}</h3>
                    <span className="text-[11px] tracking-widest text-white/85">{c.productCount} item{c.productCount === 1 ? '' : 's'}</span>
                  </div>
                  <span className="shrink-0 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Shop by budget */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gray-600 mr-1">
              <Wallet className="w-4 h-4 text-accent" /> Shop by budget
            </span>
            {PRICE_LIMITS.map((amount) => (
              <Link
                key={amount}
                to={`/shop?maxPrice=${amount}`}
                className="rounded-full border border-line bg-surface px-5 py-2.5 text-xs font-semibold tracking-wide hover:border-accent hover:text-accent-dark transition-colors"
              >
                Under {formatPrice(amount)}
              </Link>
            ))}
            <Link to="/shop?sale=true&sort=deals" className="rounded-full bg-red-600 text-white px-5 py-2.5 text-xs font-semibold tracking-wide hover:bg-red-700 transition-colors">
              On Sale
            </Link>
          </div>
        </section>

        <FlashSale />

        {/* Lookbook */}
        <section className="shell py-16 md:py-20" aria-labelledby="lookbook-title">
          <SectionHeader
            id="lookbook-title"
            eyebrow="The lookbook"
            title="Styled for Sri Lankan Days"
            subtitle="From festive silk sarees to gym-ready sets – explore our latest collections."
            link="/shop"
            linkLabel="Shop all"
          />
          <Lookbook tiles={LOOKBOOK} />
        </section>

        <div className="bg-surface border-y border-line">
          <ProductRow eyebrow="Just landed" title="New Arrivals" subtitle="Fresh styles just landed in store" link="/shop?new=true" products={newArrivals} />
        </div>
        <ProductRow eyebrow="Customer favourites" title="Best Sellers" subtitle="The pieces our customers love most" link="/shop?bestSeller=true" products={bestSellers} />

        <div className="bg-page-alt border-t border-line">
          <HomeFaq image={imageUrl('/uploads/ethnic/white-cotton-kurti.jpg')} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;

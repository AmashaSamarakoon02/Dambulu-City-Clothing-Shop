import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { ArrowRight, Truck, RefreshCw, ShieldCheck, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import usePageTitle from '../hooks/usePageTitle';
import useCategories from '../hooks/useCategories';
import { formatPrice } from '../utils/format';
import { FREE_DELIVERY_THRESHOLD } from '../constants/shop';
import heroImg from '../assets/hero_banner.png';
import womenImg from '../assets/women_category.png';
import menImg from '../assets/men_category.png';
import kidsImg from '../assets/kids_category.png';

const FEATURED = [
  { name: "Women's Wear", slug: 'womens-wear', image: womenImg },
  { name: "Men's Wear", slug: 'mens-wear', image: menImg },
  { name: "Kids' Wear", slug: 'kids-wear', image: kidsImg },
];

const ProductRow = ({ title, link, products }) => (
  products.length > 0 && (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between mb-10">
        <h2 className="text-2xl md:text-3xl font-light tracking-widest uppercase">{title}</h2>
        <Link to={link} className="text-xs uppercase tracking-[0.2em] underline underline-offset-4 hover:no-underline whitespace-nowrap">View All</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
);

const Home = () => {
  usePageTitle();
  const { categories } = useCategories();
  const [newArrivals, setNewArrivals] = useState([]);
  const [onSale, setOnSale] = useState([]);

  useEffect(() => {
    axiosInstance.get('/products', { params: { new: true, limit: 4 } }).then((res) => setNewArrivals(res.data.data)).catch(() => {});
    axiosInstance.get('/products', { params: { sale: true, limit: 4 } }).then((res) => setOnSale(res.data.data)).catch(() => {});
  }, []);

  const otherCategories = categories.filter((c) => !FEATURED.some((f) => f.slug === c.slug));

  return (
    <div className="min-h-screen bg-page font-sans text-luxe-dark">
      <Navbar />

      {/* Hero */}
      <div className="relative h-[85vh] min-h-[520px] pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-6xl font-light tracking-[0.2em] text-white uppercase mb-6">New Season</h1>
          <p className="text-base md:text-xl text-gray-200 tracking-wider mb-10 max-w-2xl font-light">
            Welcome to Dambulla City Clothing Shop. Discover the latest clothing, shoes and accessories at affordable prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/shop" className="bg-white text-black px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center group">
              Shop Now
              <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/shop?new=true" className="border border-white text-white px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-white hover:text-black transition-colors">
              New Arrivals
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs uppercase tracking-widest text-gray-600">
          <div className="flex items-center gap-3"><Truck className="w-5 h-5 shrink-0" /> Free delivery over {formatPrice(FREE_DELIVERY_THRESHOLD)}</div>
          <div className="flex items-center gap-3"><Banknote className="w-5 h-5 shrink-0" /> Cash on delivery</div>
          <div className="flex items-center gap-3"><RefreshCw className="w-5 h-5 shrink-0" /> 7-day exchanges</div>
          <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 shrink-0" /> Secure payments</div>
        </div>
      </div>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-light tracking-widest uppercase mb-4">Shop By Category</h2>
          <div className="w-16 h-px bg-black mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURED.map((category) => (
            <Link to={`/category/${category.slug}`} key={category.slug} className="group relative h-80 md:h-96 overflow-hidden bg-gray-200 flex items-center justify-center">
              <img src={category.image} alt={category.name} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 group-hover:from-black/80 transition-colors duration-500"></div>
              <div className="relative z-10 text-center">
                <h3 className="text-2xl font-light tracking-widest text-white uppercase mb-3 drop-shadow-md">{category.name}</h3>
                <span className="inline-block border-b border-white text-white tracking-widest text-xs pb-1">SHOP NOW</span>
              </div>
            </Link>
          ))}
        </div>

        {otherCategories.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {otherCategories.map((c) => (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className="bg-surface border border-line py-8 text-center hover:border-black hover:shadow-sm transition-all"
              >
                <span className="block text-sm uppercase tracking-[0.2em] font-medium">{c.name}</span>
                <span className="text-xs text-gray-500">{c.productCount} item{c.productCount === 1 ? '' : 's'}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="bg-surface border-y border-line">
        <ProductRow title="New Arrivals" link="/shop?new=true" products={newArrivals} />
      </div>
      <ProductRow title="On Sale" link="/shop?sale=true" products={onSale} />

      <Footer />
    </div>
  );
};

export default Home;

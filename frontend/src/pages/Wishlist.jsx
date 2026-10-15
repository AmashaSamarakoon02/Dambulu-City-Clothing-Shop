import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import usePageTitle from '../hooks/usePageTitle';

const Wishlist = () => {
  usePageTitle('My Wishlist');
  const { wishlist, loading } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col bg-page font-sans text-luxe-dark">
      <Navbar />
      <main className="flex-grow pt-32 md:pt-44 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-2">My Wishlist</h1>
        <p className="text-sm text-gray-500 mb-10">{wishlist.length} saved item{wishlist.length === 1 ? '' : 's'}</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
            <p className="text-gray-600 mb-2">Your wishlist is empty.</p>
            <p className="text-sm text-gray-500 mb-8">Tap the heart on any product to save it for later.</p>
            <Link to="/shop" className="inline-block bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {wishlist.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;

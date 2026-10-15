import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, RefreshCw, Truck, Banknote, Star, Loader2, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import axiosInstance from '../api/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import useCategories from '../hooks/useCategories';
import usePageTitle from '../hooks/usePageTitle';
import { imageUrl, formatPrice, formatDate, discountPercent, colorToCss } from '../utils/format';
import { FREE_DELIVERY_THRESHOLD, LOW_STOCK_THRESHOLD } from '../constants/shop';

const Stars = ({ value, size = 'w-3.5 h-3.5' }) => (
  <div className="flex text-amber-400" aria-label={`${value.toFixed(1)} out of 5 stars`}>
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`${size} ${i < Math.round(value) ? 'fill-current' : 'text-gray-300'}`} />
    ))}
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [optionError, setOptionError] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const { addToCart, cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { nameFor } = useCategories();
  usePageTitle(product?.name);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setActiveImage(0);
    setQuantity(1);
    setOptionError('');

    axiosInstance.get(`/products/${id}`)
      .then((res) => {
        const data = res.data;
        setProduct(data);
        // Preselect only when there's a single choice; otherwise make the customer choose.
        setSelectedColor(data.colors?.length === 1 ? data.colors[0] : '');
        setSelectedSize(data.sizes?.length === 1 ? data.sizes[0] : '');
        return axiosInstance.get('/products', { params: { category: data.category, limit: 5 } });
      })
      .then((res) => setRelated(res.data.data.filter((p) => String(p.id) !== String(id)).slice(0, 4)))
      .catch((err) => {
        if (err.response?.status !== 404) console.error(err);
        setProduct((p) => (p && String(p.id) === String(id) ? p : null));
      })
      .finally(() => setLoading(false));

    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get(`/reviews/product/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.comment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    setSubmittingReview(true);
    try {
      await axiosInstance.post('/reviews', { ...newReview, productId: id });
      setNewReview({ rating: 5, comment: '' });
      toast.success('Thanks for your review!');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (product.colors?.length && !selectedColor) return setOptionError('Please select a colour');
    if (product.sizes?.length && !selectedSize) return setOptionError('Please select a size');
    setOptionError('');
    if (addToCart(product, { size: selectedSize, color: selectedColor, quantity })) setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <div className="flex-grow pt-48 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white font-sans text-luxe-dark">
        <Navbar />
        <div className="flex-grow pt-48 pb-24 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-2xl font-light uppercase tracking-widest mb-3">Product not found</h1>
          <p className="text-gray-500 mb-8">This item may have been removed or is no longer available.</p>
          <Link to="/shop" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800">
            Continue Shopping
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.image];
  const discount = discountPercent(product);
  const wishlisted = isWishlisted(product.id);
  const inCart = cartItems
    .filter((item) => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  const available = Math.max(product.stock - inCart, 0);
  const averageRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-luxe-dark">
      <Navbar />

      <main className="flex-grow pt-32 md:pt-44 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <nav className="text-[11px] text-gray-500 uppercase tracking-widest mb-8 truncate">
          <Link to="/home" className="hover:text-black">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/category/${product.category}`} className="hover:text-black">{nameFor(product.category)}</Link>
          <span className="mx-2">/</span>
          <span className="text-black">{product.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-14">
          {/* Gallery */}
          <div className="w-full md:w-1/2 flex flex-col-reverse sm:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-3 sm:w-20 overflow-x-auto sm:overflow-visible">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-16 sm:w-full border-2 ${activeImage === i ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                    aria-label={`Show image ${i + 1}`}
                  >
                    <img src={imageUrl(img)} alt="" className="w-full aspect-[3/4] object-cover bg-gray-100" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex-grow bg-gray-100 relative">
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {product.isNewArrival && <span className="bg-black text-white text-[11px] font-semibold tracking-widest px-2.5 py-1">NEW</span>}
                {discount > 0 && <span className="bg-red-600 text-white text-[11px] font-semibold tracking-widest px-2.5 py-1">-{discount}%</span>}
              </div>
              <img src={imageUrl(images[activeImage])} alt={product.name} className="w-full object-cover aspect-[3/4]" />
            </div>
          </div>

          {/* Info */}
          <div className="w-full md:w-1/2 flex flex-col">
            {product.brand && <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 mb-2">{product.brand}</p>}
            <h1 className="text-2xl md:text-3xl font-light text-gray-900 mb-3">{product.name}</h1>

            <div className="flex items-center gap-3 mb-5 text-xs text-gray-500">
              {reviews.length > 0 ? (
                <button onClick={() => setActiveTab('reviews')} className="flex items-center gap-2 hover:text-black">
                  <Stars value={averageRating} /> {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                </button>
              ) : <span>No reviews yet</span>}
              <span className="text-gray-300">|</span>
              <span>SKU: LA-{String(product.id).padStart(5, '0')}</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className={`text-2xl font-semibold ${discount ? 'text-red-600' : ''}`}>{formatPrice(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-base text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
                  <span className="text-xs font-semibold text-red-600">SAVE {discount}%</span>
                </>
              )}
            </div>

            {/* Colour */}
            {product.colors?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-600 mb-3">
                  Colour: <span className="text-black font-semibold normal-case tracking-normal">{selectedColor || 'Select'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => { setSelectedColor(color); setOptionError(''); }}
                      title={color}
                      aria-label={`Colour ${color}`}
                      aria-pressed={selectedColor === color}
                      className={`w-9 h-9 rounded-full border-2 p-0.5 ${selectedColor === color ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      <span className="block w-full h-full rounded-full border border-gray-200" style={{ background: colorToCss(color) }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600">
                    Size: <span className="text-black font-semibold normal-case tracking-normal">{selectedSize || 'Select'}</span>
                  </p>
                  <Link to="/pages/size-guide" className="text-xs underline underline-offset-4 text-gray-500 hover:text-black">Size Guide</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setOptionError(''); }}
                      aria-pressed={selectedSize === size}
                      className={`min-w-12 px-4 py-2.5 text-sm border transition-colors ${
                        selectedSize === size ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-700 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <p className={`text-sm mb-4 ${product.stock <= 0 ? 'text-red-600' : product.stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-green-700'}`}>
              {product.stock <= 0 ? 'Out of stock' : product.stock <= LOW_STOCK_THRESHOLD ? `Hurry! Only ${product.stock} left in stock` : 'In stock'}
            </p>

            {optionError && <p className="text-sm text-red-600 mb-3" role="alert">{optionError}</p>}

            {/* Actions */}
            <div className="flex flex-wrap items-stretch gap-3 mb-8">
              {product.stock > 0 && (
                <div className="flex items-center border border-gray-300">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-full flex items-center justify-center hover:bg-gray-100"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm" aria-live="polite">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(available || 1, q + 1))}
                    disabled={quantity >= available}
                    className="w-11 h-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || available <= 0}
                className="flex-1 min-w-[180px] py-3.5 text-xs font-semibold tracking-[0.2em] uppercase transition-colors bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {product.stock <= 0 ? 'Out of Stock' : available <= 0 ? 'All Stock in Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-12 border flex items-center justify-center transition-colors ${wishlisted ? 'border-red-500 text-red-500' : 'border-gray-300 text-gray-600 hover:border-black'}`}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 border-y border-gray-100 py-5 mb-6">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 shrink-0" /> Free delivery over {formatPrice(FREE_DELIVERY_THRESHOLD)}</div>
              <div className="flex items-center gap-2"><Banknote className="w-4 h-4 shrink-0" /> Cash on delivery available</div>
              <Link to="/pages/returns" className="flex items-center gap-2 hover:text-black"><RefreshCw className="w-4 h-4 shrink-0" /> 7-day easy exchange</Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-gray-200">
              {[['description', 'Description'], ['reviews', `Reviews (${reviews.length})`]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`pb-3 text-xs uppercase tracking-[0.2em] ${activeTab === key ? 'border-b-2 border-black text-black font-semibold' : 'text-gray-500 hover:text-black'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 text-sm text-gray-600 leading-relaxed pb-8">
              {activeTab === 'description' && (
                <div className="space-y-4">
                  <p className="whitespace-pre-line">{product.description || 'Crafted from premium fabrics for a luxurious feel and a flattering fit.'}</p>
                  <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-xs">
                    <dt className="uppercase tracking-widest text-gray-400">Category</dt><dd>{nameFor(product.category)}</dd>
                    {product.sizes?.length > 0 && <><dt className="uppercase tracking-widest text-gray-400">Sizes</dt><dd>{product.sizes.join(', ')}</dd></>}
                    {product.colors?.length > 0 && <><dt className="uppercase tracking-widest text-gray-400">Colours</dt><dd>{product.colors.join(', ')}</dd></>}
                  </dl>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {reviews.length > 0 ? reviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-100 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{r.user?.name || 'Customer'}</span>
                        <Stars value={r.rating} />
                      </div>
                      <p className="text-gray-600">{r.comment}</p>
                      <span className="text-xs text-gray-400 block mt-2">{formatDate(r.createdAt)}</span>
                    </div>
                  )) : (
                    <p>No reviews yet. Be the first to review this product!</p>
                  )}

                  {isAuthenticated ? (
                    <form onSubmit={handleReviewSubmit} className="mt-8 bg-gray-50 p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 uppercase text-xs tracking-[0.2em]">Write a Review</h4>
                      <div className="mb-4">
                        <span className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Rating</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: n })}
                              aria-label={`${n} star${n > 1 ? 's' : ''}`}
                            >
                              <Star className={`w-6 h-6 ${n <= newReview.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="review-comment" className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Comment</label>
                        <textarea
                          id="review-comment"
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-black h-24 bg-white"
                          placeholder="How was the fit, fabric and quality?"
                          maxLength={1000}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-black text-white px-6 py-2.5 text-xs tracking-[0.2em] uppercase hover:bg-gray-800 disabled:opacity-50"
                      >
                        {submittingReview ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  ) : (
                    <div className="mt-8 bg-gray-50 p-6 text-center">
                      <p className="text-gray-500 mb-2">Please log in to write a review.</p>
                      <Link to="/login" state={{ from: { pathname: `/product/${id}` } }} className="text-black font-semibold uppercase text-xs tracking-widest underline underline-offset-4">
                        Login
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-xl font-light uppercase tracking-widest text-center mb-10">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;

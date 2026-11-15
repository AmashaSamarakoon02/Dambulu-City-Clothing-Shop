import React, { useState } from 'react';
import { Heart, Plus, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { imageUrl, formatPrice, discountPercent, colorToCss } from '../utils/format';

const ProductCard = ({ product }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quickOpen, setQuickOpen] = useState(false);
  const wishlisted = isWishlisted(product.id);
  const discount = discountPercent(product);
  const outOfStock = product.stock <= 0;
  const hoverImage = product.images?.[1];
  const href = `/product/${product.id}`;
  // Quick add only when the colour is not a choice (one colour or none); otherwise go to the product page.
  const canQuickAdd = !outOfStock && (product.colors?.length || 0) <= 1;
  const sizes = product.sizes?.length ? product.sizes : [''];

  const quickAdd = (size) => {
    if (addToCart(product, { size, color: product.colors?.[0] || '', quantity: 1 })) setQuickOpen(false);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-page-alt mb-4 rounded-xl">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="block w-full h-full">
          <img
            src={imageUrl(product.image)}
            alt=""
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-105 ${hoverImage ? 'group-hover:opacity-0' : ''} ${outOfStock ? 'opacity-60' : ''}`}
          />
          {hoverImage && (
            <img
              src={imageUrl(hoverImage)}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
          )}
        </Link>

        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          {product.isNewArrival && (
            <span className="bg-black text-white text-[10px] font-semibold tracking-widest px-2 py-1">NEW</span>
          )}
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-semibold tracking-widest px-2 py-1">-{discount}%</span>
          )}
        </div>

        <button
          onClick={() => toggleWishlist(product)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
        </button>

        {outOfStock ? (
          <span className="absolute bottom-0 inset-x-0 bg-white/90 text-center text-[11px] font-semibold uppercase tracking-widest py-2">
            Sold Out
          </span>
        ) : (
          <>
            {/* Touch devices: round "+" opens the size panel */}
            <button
              onClick={() => (canQuickAdd ? setQuickOpen((v) => !v) : navigate(href))}
              className={`md:hidden absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow ${quickOpen ? 'hidden' : ''}`}
              aria-label={canQuickAdd ? `Quick add ${product.name}` : `Choose options for ${product.name}`}
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Quick-add panel: slides up on hover (desktop) or when opened (touch) */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm px-3 py-3 transition-transform duration-300 ${
                quickOpen ? 'translate-y-0' : 'translate-y-full md:group-hover:translate-y-0 md:group-focus-within:translate-y-0'
              }`}
            >
              {canQuickAdd ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-700">
                      {sizes[0] ? 'Quick add · select size' : 'Quick add'}
                    </span>
                    {quickOpen && (
                      <button onClick={() => setQuickOpen(false)} aria-label="Close quick add" className="text-gray-500 hover:text-black">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((size) => (
                      <button
                        key={size || 'add'}
                        onClick={() => quickAdd(size)}
                        className="min-w-9 px-2 py-1.5 text-[11px] font-medium border border-gray-300 bg-white hover:bg-black hover:text-white hover:border-black transition-colors"
                        aria-label={size ? `Add ${product.name}, size ${size}, to cart` : `Add ${product.name} to cart`}
                      >
                        {size || '+ Add to cart'}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={href}
                  tabIndex={-1}
                  className="block text-center text-[11px] uppercase tracking-[0.2em] font-semibold py-1.5 bg-black text-white hover:bg-gray-800"
                >
                  Choose options
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col space-y-1.5">
        {product.brand && <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{product.brand}</span>}
        <Link to={href} className="text-sm text-gray-800 tracking-wide leading-snug line-clamp-2 hover:underline underline-offset-4">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-sm font-semibold tracking-wide ${discount ? 'text-red-600' : 'text-gray-900'}`}>
            {formatPrice(product.price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
        {product.colors?.length > 0 && (
          <div className="flex gap-1.5 pt-1" aria-label={`Colours: ${product.colors.join(', ')}`}>
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                title={color}
                className="w-3.5 h-3.5 rounded-full border border-gray-300"
                style={{ background: colorToCss(color) }}
              />
            ))}
            {product.colors.length > 5 && <span className="text-[10px] text-gray-500">+{product.colors.length - 5}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

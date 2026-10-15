import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { imageUrl, formatPrice, discountPercent, colorToCss } from '../utils/format';

const ProductCard = ({ product }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const discount = discountPercent(product);
  const outOfStock = product.stock <= 0;
  const hoverImage = product.images?.[1];

  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 mb-4">
        <img
          src={imageUrl(product.image)}
          alt={product.name}
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

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="bg-black text-white text-[10px] font-semibold tracking-widest px-2 py-1">NEW</span>
          )}
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-semibold tracking-widest px-2 py-1">-{discount}%</span>
          )}
        </div>

        {outOfStock && (
          <span className="absolute bottom-0 inset-x-0 bg-white/90 text-center text-[11px] font-semibold uppercase tracking-widest py-2">
            Sold Out
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
        </button>
      </div>

      <div className="flex flex-col space-y-1.5">
        {product.brand && <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{product.brand}</span>}
        <h3 className="text-sm text-gray-800 tracking-wide leading-snug line-clamp-2 group-hover:underline underline-offset-4">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`text-sm font-semibold tracking-wide ${discount ? 'text-red-600' : 'text-gray-900'}`}>
            {formatPrice(product.price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
          )}
        </div>
        {product.colors?.length > 0 && (
          <div className="flex gap-1.5 pt-1">
            {product.colors.slice(0, 5).map((color) => (
              <span
                key={color}
                title={color}
                className="w-3.5 h-3.5 rounded-full border border-gray-300"
                style={{ background: colorToCss(color) }}
              />
            ))}
            {product.colors.length > 5 && <span className="text-[10px] text-gray-400">+{product.colors.length - 5}</span>}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;

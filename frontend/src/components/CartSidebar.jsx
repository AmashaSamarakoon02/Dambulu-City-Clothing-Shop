import React, { useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { imageUrl, formatPrice } from '../utils/format';
import { FREE_DELIVERY_THRESHOLD } from '../constants/shop';

const CartSidebar = () => {
  const { isCartOpen, setIsCartOpen, cartItems, cartCount, subtotal, updateQuantity, removeFromCart, syncCart } = useCart();
  const navigate = useNavigate();

  // Refresh prices/stock whenever the cart is opened.
  useEffect(() => {
    if (isCartOpen) syncCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCartOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setIsCartOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setIsCartOpen]);

  const remainingForFreeDelivery = FREE_DELIVERY_THRESHOLD - subtotal;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsCartOpen(false)} />
      )}

      <aside
        aria-label="Shopping cart"
        aria-hidden={!isCartOpen}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[70] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Shopping Cart ({cartCount})</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full" aria-label="Close cart">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cartItems.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 text-xs text-gray-600 flex items-center gap-2">
            <Truck className="w-4 h-4 shrink-0" />
            {remainingForFreeDelivery > 0
              ? <span>Add <strong>{formatPrice(remainingForFreeDelivery)}</strong> more for free delivery.</span>
              : <span className="text-green-700 font-medium">You've unlocked free islandwide delivery!</span>}
          </div>
        )}

        <div className="flex-grow overflow-y-auto px-6">
          {cartItems.length === 0 ? (
            <div className="text-center mt-20">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
              <p className="text-gray-500 mb-6">Your cart is empty.</p>
              <Link
                to="/shop"
                onClick={() => setIsCartOpen(false)}
                className="inline-block bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.key} className="flex gap-4 py-5 border-b border-gray-100">
                <Link to={`/product/${item.productId}`} onClick={() => setIsCartOpen(false)} className="shrink-0">
                  <img src={imageUrl(item.image)} alt={item.name} className="w-20 h-24 object-cover bg-gray-100" />
                </Link>
                <div className="flex-grow min-w-0 flex flex-col">
                  <div className="flex justify-between gap-2">
                    <Link
                      to={`/product/${item.productId}`}
                      onClick={() => setIsCartOpen(false)}
                      className="text-sm text-gray-800 hover:underline line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-gray-400 hover:text-red-600 shrink-0"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {[item.size && `Size: ${item.size}`, item.color && `Colour: ${item.color}`].filter(Boolean).join(' · ')}
                  </p>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div className="flex items-center border border-gray-300">
                      <button
                        onClick={() => (item.quantity > 1 ? updateQuantity(item.key, item.quantity - 1) : removeFromCart(item.key))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</div>
                      {item.quantity >= item.stock && <div className="text-[11px] text-amber-600">Max available</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-white space-y-4">
            <div className="flex justify-between text-sm">
              <span className="uppercase tracking-widest text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-400">Delivery fee is calculated at checkout.</p>
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-gray-800 transition-colors"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-full text-xs uppercase tracking-[0.2em] text-gray-500 hover:text-black"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;

import React from 'react';
import { Check, XCircle } from 'lucide-react';
import { ORDER_STATUS, ORDER_STEPS, PAYMENT_STATUS } from '../../constants/shop';
import { imageUrl, formatPrice } from '../../utils/format';

export const StatusBadge = ({ status }) => {
  const meta = ORDER_STATUS[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-block border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap ${meta.className}`}>
      {meta.label}
    </span>
  );
};

export const PaymentBadge = ({ status }) => {
  const meta = PAYMENT_STATUS[status] || { label: status, className: '' };
  return <span className={`text-xs font-semibold ${meta.className}`}>{meta.label}</span>;
};

// Horizontal (vertical on mobile) progress tracker.
export const OrderTracker = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
        <XCircle className="w-5 h-5 shrink-0" /> This order was cancelled.
      </div>
    );
  }

  const current = ORDER_STEPS.indexOf(status);
  return (
    <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-2 relative">
            {i > 0 && (
              <span className={`hidden sm:block absolute top-4 right-1/2 w-full h-0.5 -z-0 ${i <= current ? 'bg-black' : 'bg-gray-200'}`} />
            )}
            <span
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                done ? 'bg-black border-black text-white' : 'bg-white border-gray-300 text-gray-500'
              } ${i === current ? 'ring-4 ring-gray-200' : ''}`}
            >
              {done ? <Check className="w-4 h-4" /> : i + 1}
            </span>
            <span className={`text-xs uppercase tracking-widest sm:text-center ${done ? 'text-black font-semibold' : 'text-gray-500'}`}>
              {ORDER_STATUS[step].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

export const OrderItemsList = ({ items }) => (
  <ul className="divide-y divide-gray-100">
    {items.map((item) => (
      <li key={item.id} className="flex gap-4 py-4">
        <img
          src={imageUrl(item.productImage)}
          alt={item.productName}
          className="w-16 h-20 object-cover bg-gray-100 shrink-0"
        />
        <div className="flex-grow min-w-0">
          <p className="text-sm">{item.productName}</p>
          <p className="text-xs text-gray-500 mt-1">
            {[item.size && `Size: ${item.size}`, item.color && `Colour: ${item.color}`, `Qty: ${item.quantity}`].filter(Boolean).join(' · ')}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatPrice(item.price)} each</p>
        </div>
        <span className="text-sm font-medium whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
      </li>
    ))}
  </ul>
);

export const OrderTotals = ({ order }) => (
  <dl className="space-y-2 text-sm">
    <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatPrice(order.subtotal || order.totalAmount - (order.deliveryFee || 0))}</dd></div>
    <div className="flex justify-between">
      <dt className="text-gray-600">Delivery</dt>
      <dd>{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Free'}</dd>
    </div>
    <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-3">
      <dt>Total</dt><dd>{formatPrice(order.totalAmount)}</dd>
    </div>
  </dl>
);

export const AddressBlock = ({ order }) => {
  const a = order.deliveryAddress || {};
  return (
    <address className="not-italic text-sm text-gray-700 leading-relaxed">
      <span className="font-semibold text-black">{order.customerName}</span><br />
      {a.line1}{a.city && <>, {a.city}</>}{a.postalCode && <> {a.postalCode}</>}<br />
      {order.phone && <>{order.phone}<br /></>}
      {order.email}
      {a.instructions && <span className="block text-xs text-gray-500 mt-2">Note: {a.instructions}</span>}
    </address>
  );
};

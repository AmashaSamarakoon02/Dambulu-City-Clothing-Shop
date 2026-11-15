import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import ProductCard from './ProductCard';
import axiosInstance from '../api/axiosInstance';

// The weekly flash sale ends every Sunday at 23:59:59 (local time) and rolls over automatically.
const nextSaleEnd = (now = new Date()) => {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
  return end;
};

const pad = (n) => String(n).padStart(2, '0');

const useCountdown = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(nextSaleEnd(new Date(now)) - now, 0);
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60
  };
};

const TimeBox = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="min-w-11 bg-white text-accent-dark font-semibold tabular-nums text-lg sm:text-xl px-2 py-1 rounded">{pad(value)}</span>
    <span className="text-[10px] uppercase tracking-widest text-white/85 mt-1">{label}</span>
  </div>
);

const FlashSale = () => {
  const [products, setProducts] = useState([]);
  const { days, hours, minutes, seconds } = useCountdown();

  useEffect(() => {
    axiosInstance.get('/products', { params: { sale: true, sort: 'deals', limit: 8 } })
      .then((res) => setProducts(res.data.data))
      .catch(() => {});
  }, []);

  if (!products.length) return null;

  return (
    <section className="shell py-16" aria-labelledby="flash-sale-title">
      <div className="bg-gradient-to-r from-accent-dark via-accent to-[#a8743f] text-white rounded-t-2xl px-5 sm:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"><Zap className="w-5 h-5 fill-white" /></span>
          <div>
            <h2 id="flash-sale-title" className="text-xl sm:text-2xl font-semibold uppercase tracking-[0.15em]">Flash Sale</h2>
            <p className="text-xs sm:text-sm text-white/85">Limited-time prices – grab them before they're gone</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-white/85 hidden sm:inline">Ends in</span>
          <div className="flex items-start gap-1.5" role="timer" aria-live="off" aria-label={`Sale ends in ${days} days ${hours} hours ${minutes} minutes`}>
            <TimeBox value={days} label="Days" />
            <span className="text-xl font-semibold pt-1">:</span>
            <TimeBox value={hours} label="Hrs" />
            <span className="text-xl font-semibold pt-1">:</span>
            <TimeBox value={minutes} label="Min" />
            <span className="text-xl font-semibold pt-1">:</span>
            <TimeBox value={seconds} label="Sec" />
          </div>
        </div>
      </div>
      <div className="bg-surface border border-t-0 border-line rounded-b-2xl p-4 sm:p-6 shadow-xl shadow-black/5">
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
          {products.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`min-w-[62%] sm:min-w-0 snap-start ${i === 4 ? 'sm:hidden 2xl:block' : i === 3 ? 'md:hidden lg:block' : ''}`}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link to="/shop?sale=true&sort=deals" className="inline-block rounded-full border border-black px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">
            View All Deals
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FlashSale;

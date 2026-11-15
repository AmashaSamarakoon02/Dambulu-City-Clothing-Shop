import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutGrid, Tag, Sparkles } from 'lucide-react';
import useCategories from '../hooks/useCategories';

const PRICE_OPTIONS = [
  { value: '', label: 'Any price' },
  { value: '3000', label: 'Under LKR 3,000' },
  { value: '5000', label: 'Under LKR 5,000' },
  { value: '10000', label: 'Under LKR 10,000' }
];

const fieldClass = 'w-full bg-white border border-line rounded-xl px-3.5 py-3 text-sm text-luxe-dark outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition';
const labelClass = 'flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-600 mb-1.5';

// "Find your style" panel that overlaps the bottom of the hero (like a booking bar).
const HeroSearch = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [form, setForm] = useState({ category: '', search: '', maxPrice: '' });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.search.trim()) params.set('search', form.search.trim());
    if (form.maxPrice) params.set('maxPrice', form.maxPrice);
    const query = params.toString();
    navigate(form.category ? `/category/${form.category}${query ? `?${query}` : ''}` : `/shop${query ? `?${query}` : ''}`);
  };

  return (
    <div className="shell relative z-20 -mt-14 sm:-mt-16">
      <form
        onSubmit={submit}
        role="search"
        aria-label="Find your style"
        className="bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-xl shadow-black/10 p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_auto] gap-3 sm:gap-4 items-end"
      >
        <div>
          <label htmlFor="hs-category" className={labelClass}><LayoutGrid className="w-3.5 h-3.5 text-accent" /> Category</label>
          <select id="hs-category" value={form.category} onChange={set('category')} className={fieldClass}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 lg:col-span-1 order-first lg:order-none">
          <label htmlFor="hs-search" className={labelClass}><Sparkles className="w-3.5 h-3.5 text-accent" /> What are you looking for?</label>
          <input id="hs-search" type="search" value={form.search} onChange={set('search')} placeholder="e.g. saree, sneakers, linen shirt" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="hs-price" className={labelClass}><Tag className="w-3.5 h-3.5 text-accent" /> Budget</label>
          <select id="hs-price" value={form.maxPrice} onChange={set('maxPrice')} className={fieldClass}>
            {PRICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button
          type="submit"
          className="col-span-2 lg:col-span-1 h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-luxe-dark text-white px-7 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-accent-dark transition-colors"
        >
          <Search className="w-4 h-4" /> Find Styles
        </button>
      </form>
    </div>
  );
};

export default HeroSearch;

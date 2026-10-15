import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import axiosInstance from '../api/axiosInstance';
import useCategories from '../hooks/useCategories';
import usePageTitle from '../hooks/usePageTitle';
import { colorToCss } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A–Z' }
];

const FILTER_KEYS = ['category', 'size', 'color', 'minPrice', 'maxPrice', 'new', 'sale', 'inStock', 'search'];

const FilterSection = ({ title, children }) => (
  <div className="border-b border-gray-200 py-5">
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">{title}</h3>
    {children}
  </div>
);

const Shop = () => {
  const { slug } = useParams(); // set when rendered at /category/:slug
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, nameFor } = useCategories();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [facets, setFacets] = useState({ sizes: [], colors: [], minPrice: 0, maxPrice: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const category = slug || searchParams.get('category') || '';
  const params = Object.fromEntries(searchParams.entries());
  const page = parseInt(params.page || '1', 10);
  const sort = params.sort || 'newest';
  const [priceDraft, setPriceDraft] = useState({ min: params.minPrice || '', max: params.maxPrice || '' });

  const title = params.search
    ? `Results for "${params.search}"`
    : params.sale === 'true' ? 'Sale'
    : params.new === 'true' ? 'New Arrivals'
    : category ? nameFor(category)
    : 'Shop All';
  usePageTitle(title);

  const queryString = searchParams.toString();
  useEffect(() => {
    setLoading(true);
    setError('');
    axiosInstance.get('/products', { params: { ...Object.fromEntries(new URLSearchParams(queryString)), category, limit: 12 } })
      .then((res) => {
        setProducts(res.data.data);
        setMeta(res.data.meta);
      })
      .catch(() => setError('We couldn’t load products right now. Please try again.'))
      .finally(() => setLoading(false));
  }, [queryString, category, reloadKey]);

  useEffect(() => {
    axiosInstance.get('/products/filters', { params: { category } })
      .then((res) => setFacets(res.data))
      .catch(() => {});
  }, [category]);

  useEffect(() => {
    setPriceDraft({ min: params.minPrice || '', max: params.maxPrice || '' });
  }, [params.minPrice, params.maxPrice]);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || value === false) next.delete(key);
      else next.set(key, value);
    });
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next);
  };

  const toggleParam = (key, value) => updateParams({ [key]: params[key] === value ? '' : value });

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (params.sort) next.set('sort', params.sort);
    setSearchParams(next);
  };

  const activeFilters = FILTER_KEYS.filter((key) => params[key] && !(slug && key === 'category'));

  const goToPage = (newPage) => {
    updateParams({ page: newPage === 1 ? '' : newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyPrice = (e) => {
    e.preventDefault();
    updateParams({ minPrice: priceDraft.min, maxPrice: priceDraft.max });
  };

  const filterPanel = (
    <div>
      {!slug && (
        <FilterSection title="Category">
          <ul className="space-y-2 text-sm">
            <li>
              <button onClick={() => updateParams({ category: '' })} className={!category ? 'font-semibold' : 'text-gray-600 hover:text-black'}>
                All Products
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <button
                  onClick={() => updateParams({ category: c.slug })}
                  className={category === c.slug ? 'font-semibold' : 'text-gray-600 hover:text-black'}
                >
                  {c.name} <span className="text-gray-400">({c.productCount})</span>
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {facets.sizes.length > 0 && (
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleParam('size', size)}
                className={`min-w-10 px-3 py-2 text-xs border transition-colors ${
                  params.size === size ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {facets.colors.length > 0 && (
        <FilterSection title="Colour">
          <div className="flex flex-wrap gap-3">
            {facets.colors.map((color) => (
              <button
                key={color}
                onClick={() => toggleParam('color', color)}
                title={color}
                aria-label={`Colour ${color}`}
                aria-pressed={params.color === color}
                className={`w-8 h-8 rounded-full p-0.5 border-2 transition-colors ${params.color === color ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
              >
                <span className="block w-full h-full rounded-full border border-gray-200" style={{ background: colorToCss(color) }} />
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price (LKR)">
        <form onSubmit={applyPrice} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" inputMode="numeric" placeholder={String(facets.minPrice || 'Min')}
              value={priceDraft.min} onChange={(e) => setPriceDraft((p) => ({ ...p, min: e.target.value }))}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" aria-label="Minimum price"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number" min="0" inputMode="numeric" placeholder={String(facets.maxPrice || 'Max')}
              value={priceDraft.max} onChange={(e) => setPriceDraft((p) => ({ ...p, max: e.target.value }))}
              className="w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" aria-label="Maximum price"
            />
          </div>
          <button type="submit" className="w-full border border-black py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-colors">
            Apply
          </button>
        </form>
      </FilterSection>

      <FilterSection title="Availability">
        <div className="space-y-3 text-sm">
          {[
            ['inStock', 'In stock only'],
            ['new', 'New arrivals'],
            ['sale', 'On sale']
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={params[key] === 'true'}
                onChange={(e) => updateParams({ [key]: e.target.checked ? 'true' : '' })}
                className="w-4 h-4 accent-black"
              />
              {label}
            </label>
          ))}
        </div>
      </FilterSection>

      {activeFilters.length > 0 && (
        <button onClick={clearFilters} className="mt-5 text-xs uppercase tracking-[0.2em] underline underline-offset-4 hover:no-underline">
          Clear all filters
        </button>
      )}
    </div>
  );

  const chipLabel = (key) => ({
    category: nameFor(params.category),
    size: `Size: ${params.size}`,
    color: `Colour: ${params.color}`,
    minPrice: `Min LKR ${params.minPrice}`,
    maxPrice: `Max LKR ${params.maxPrice}`,
    new: 'New arrivals',
    sale: 'On sale',
    inStock: 'In stock',
    search: `“${params.search}”`
  }[key]);

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-luxe-dark">
      <Navbar />

      <main className="flex-grow pt-32 md:pt-44 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <nav className="text-[11px] text-gray-500 uppercase tracking-widest mb-4">
          <Link to="/home" className="hover:text-black">Home</Link>
          <span className="mx-2">/</span>
          {category && !params.search ? (
            <>
              <Link to="/shop" className="hover:text-black">Shop</Link>
              <span className="mx-2">/</span>
              <span className="text-black">{title}</span>
            </>
          ) : <span className="text-black">Shop</span>}
        </nav>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-light tracking-widest uppercase">{title}</h1>
            <p className="text-sm text-gray-500 tracking-wider mt-2">{loading ? 'Loading…' : `${meta.total} item${meta.total === 1 ? '' : 's'}`}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="lg:hidden flex items-center px-4 py-2.5 border border-gray-300 text-xs tracking-widest uppercase hover:border-black"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filter {activeFilters.length > 0 && `(${activeFilters.length})`}
            </button>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })}
              className="border border-gray-300 px-3 py-2.5 text-xs uppercase tracking-widest bg-white outline-none focus:border-black"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map((key) => (
              <button
                key={key}
                onClick={() => updateParams({ [key]: '' })}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 text-xs"
              >
                {chipLabel(key)} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-10">
          <aside className="hidden lg:block w-60 shrink-0 -mt-5">{filterPanel}</aside>

          <div className="flex-1 min-w-0">
            {error ? (
              <div className="text-center py-20">
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={() => setReloadKey((k) => k + 1)} className="underline text-sm">Retry</button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 aspect-[3/4] mb-4"></div>
                    <div className="h-4 bg-gray-200 w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <SearchX className="w-12 h-12 mx-auto text-gray-300 mb-4" strokeWidth={1.25} />
                <h2 className="text-lg font-light uppercase tracking-widest mb-2">No products found</h2>
                <p className="text-sm text-gray-500 mb-6">Try removing some filters or searching for something else.</p>
                {activeFilters.length > 0 ? (
                  <button onClick={clearFilters} className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800">
                    Clear Filters
                  </button>
                ) : (
                  <Link to="/shop" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gray-800">
                    Shop All Products
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-10">
                  {products.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>

                {meta.totalPages > 1 && (
                  <div className="mt-16 flex justify-center items-center gap-2">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 disabled:opacity-40 hover:border-black"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {[...Array(meta.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goToPage(i + 1)}
                        className={`w-10 h-10 text-sm border ${page === i + 1 ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= meta.totalPages}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 disabled:opacity-40 hover:border-black"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">{filterPanel}</div>
            <div className="p-5 border-t border-gray-200">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full bg-black text-white py-3.5 text-xs uppercase tracking-[0.2em]"
              >
                Show {meta.total} item{meta.total === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Shop;

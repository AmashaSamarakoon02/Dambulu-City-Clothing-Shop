import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Edit2, Trash2, Search, X, Upload, Loader2, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import useCategories from '../../hooks/useCategories';
import { imageUrl, formatPrice, colorToCss } from '../../utils/format';
import { SIZE_PRESETS, COLOR_PRESETS, LOW_STOCK_THRESHOLD } from '../../constants/shop';

const EMPTY_FORM = {
  name: '', description: '', price: '', originalPrice: '', images: [], category: '', brand: '',
  isNewArrival: false, isBestSeller: false, stock: '', colors: [], sizes: []
};

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-[11px] uppercase tracking-widest text-gray-500 mb-1.5">{children}</label>
);
const inputClass = 'w-full border border-gray-200 p-2.5 text-sm outline-none focus:border-black rounded';

// Chips with presets + a free-text "add" box.
const ChipPicker = ({ values, onChange, presets, placeholder, renderSwatch }) => {
  const [custom, setCustom] = useState('');
  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setCustom('');
  };
  const extra = values.filter((v) => !presets.includes(v));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {[...presets, ...extra].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggle(v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded ${values.includes(v) ? 'bg-black text-white border-black' : 'border-gray-300 hover:border-black'}`}
          >
            {renderSwatch && <span className="w-3 h-3 rounded-full border border-gray-300" style={{ background: colorToCss(v) }} />}
            {v}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder={placeholder}
          className={`${inputClass} py-1.5`}
        />
        <button type="button" onClick={addCustom} className="px-3 border border-gray-300 text-xs rounded hover:border-black">Add</button>
      </div>
    </div>
  );
};

const AdminProducts = ({ initialLowStock = false }) => {
  const { categories, nameFor } = useCategories();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStock);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sizePreset, setSizePreset] = useState('Clothing');
  const fileInput = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setLowStockOnly(initialLowStock);
  }, [initialLowStock]);

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/products', { params: { limit: 1000 } });
      setProducts(res.data.data);
    } catch {
      toast.error('Could not load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice || '',
        images: product.images?.length ? product.images : [product.image],
        category: product.category,
        brand: product.brand || '',
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        stock: product.stock,
        colors: product.colors || [],
        sizes: product.sizes || []
      });
      const slug = product.category;
      setSizePreset(slug === 'shoes' ? 'Shoes' : slug === 'kids-wear' ? 'Kids' : slug === 'accessories' ? 'Other' : 'Clothing');
    } else {
      setEditingProduct(null);
      setFormData({ ...EMPTY_FORM, category: categories[0]?.slug || '' });
      setSizePreset('Clothing');
    }
    setIsModalOpen(true);
  };

  const set = (field) => (e) => setFormData((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleCategoryChange = (e) => {
    const slug = e.target.value;
    setFormData((f) => ({ ...f, category: slug }));
    setSizePreset(slug === 'shoes' ? 'Shoes' : slug === 'kids-wear' ? 'Kids' : slug === 'accessories' ? 'Other' : 'Clothing');
  };

  const handleUpload = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    if (formData.images.length + files.length > 8) {
      toast.error('A product can have up to 8 images');
      return;
    }
    const body = new FormData();
    files.forEach((f) => body.append('images', f));
    setUploading(true);
    try {
      const res = await axiosInstance.post('/uploads', body, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData((f) => ({ ...f, images: [...f.images, ...res.data.urls] }));
      toast.success(`${res.data.urls.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index, delta) => {
    setFormData((f) => {
      const images = [...f.images];
      const target = index + delta;
      if (target < 0 || target >= images.length) return f;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...f, images };
    });
  };

  const removeImage = (index) => setFormData((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    const price = parseFloat(formData.price);
    const originalPrice = formData.originalPrice === '' ? null : parseFloat(formData.originalPrice);
    if (!formData.name.trim()) return setFormError('Product name is required');
    if (!formData.category) return setFormError('Please choose a category');
    if (!(price > 0)) return setFormError('Price must be greater than 0');
    if (originalPrice !== null && !(originalPrice > price)) return setFormError('Original price must be higher than the selling price (or leave it empty)');
    if (!formData.images.length) return setFormError('Please upload at least one image');
    if (!formData.sizes.length) return setFormError('Please select at least one size');
    if (!formData.colors.length) return setFormError('Please select at least one colour');
    if (formData.stock === '' || !(parseInt(formData.stock, 10) >= 0)) return setFormError('Stock must be 0 or more');

    const payload = {
      ...formData,
      name: formData.name.trim(),
      price,
      originalPrice,
      stock: parseInt(formData.stock, 10)
    };

    setSaving(true);
    try {
      if (editingProduct) {
        await axiosInstance.put(`/products/${editingProduct.id}`, payload);
        toast.success('Product updated');
      } else {
        await axiosInstance.post('/products', payload);
        toast.success('Product added');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Could not save the product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? Past orders keep their details.`)) return;
    try {
      await axiosInstance.delete(`/products/${product.id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete product');
    }
  };

  const quickStockUpdate = async (product, stock) => {
    if (!(stock >= 0) || stock === product.stock) return;
    try {
      await axiosInstance.put(`/products/${product.id}`, {
        ...product,
        images: product.images?.length ? product.images : [product.image],
        stock
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock } : p)));
      toast.success(`Stock for "${product.name}" set to ${stock}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update stock');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q))
      && (!categoryFilter || p.category === categoryFilter)
      && (!lowStockOnly || p.stock <= LOW_STOCK_THRESHOLD);
  });
  const lowStockCount = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-8">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="text-xl font-light tracking-wide flex items-center gap-3">
          <Package className="h-5 w-5" /> Products <span className="text-sm text-gray-400">({products.length})</span>
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-black text-white px-4 py-2.5 text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or brands..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none text-sm rounded"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-gray-200 bg-gray-50 text-sm rounded px-3 py-2.5">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <label className={`flex items-center gap-2 text-sm px-3 py-2.5 border rounded cursor-pointer ${lowStockOnly ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="accent-black" />
          Low stock ({lowStockCount})
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <th className="py-3 pr-4">Product</th>
              <th className="py-3 pr-4">Category</th>
              <th className="py-3 pr-4 text-right">Price</th>
              <th className="py-3 pr-4">Sizes / Colours</th>
              <th className="py-3 pr-4">Stock</th>
              <th className="py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan="6" className="py-10 text-center text-gray-400">No products found.</td></tr>
            ) : filteredProducts.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <img src={imageUrl(p.image)} alt="" className="w-10 h-12 object-cover bg-gray-100 rounded" />
                    <div>
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        {p.brand}
                        {p.isNewArrival && <span className="text-black font-semibold">NEW</span>}
                        {p.isBestSeller && <span className="text-amber-700 font-semibold">BEST SELLER</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600">{nameFor(p.category)}</td>
                <td className="py-3 pr-4 text-right whitespace-nowrap">
                  <div>{formatPrice(p.price)}</div>
                  {p.originalPrice && <div className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</div>}
                </td>
                <td className="py-3 pr-4 text-xs text-gray-600">
                  <div>{p.sizes.join(', ')}</div>
                  <div className="flex gap-1 mt-1">
                    {p.colors.map((c) => <span key={c} title={c} className="w-3 h-3 rounded-full border border-gray-300" style={{ background: colorToCss(c) }} />)}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <input
                    type="number"
                    min="0"
                    defaultValue={p.stock}
                    key={`${p.id}-${p.stock}`}
                    onBlur={(e) => quickStockUpdate(p, parseInt(e.target.value, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    aria-label={`Stock for ${p.name}`}
                    className={`w-20 border px-2 py-1 text-sm rounded ${p.stock === 0 ? 'border-red-400 bg-red-50' : p.stock <= LOW_STOCK_THRESHOLD ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}
                  />
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleOpenModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1" title="Edit"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-start sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-3xl sm:rounded-xl shadow-2xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black" aria-label="Close"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSave} noValidate className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Images */}
              <div>
                <Label>Product Images (first image is the main image)</Label>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, i) => (
                    <div key={img + i} className="relative w-24 group">
                      <img src={imageUrl(img)} alt="" className={`w-24 h-28 object-cover rounded bg-gray-100 ${i === 0 ? 'ring-2 ring-black' : ''}`} />
                      {i === 0 && <span className="absolute top-1 left-1 bg-black text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5"><Star className="w-2.5 h-2.5" /> Main</span>}
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-red-600" aria-label="Remove image"><X className="w-3.5 h-3.5" /></button>
                      <div className="flex justify-between mt-1">
                        <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)} className="p-1 disabled:opacity-20" aria-label="Move left"><ArrowLeft className="w-3.5 h-3.5" /></button>
                        <button type="button" disabled={i === formData.images.length - 1} onClick={() => moveImage(i, 1)} className="p-1 disabled:opacity-20" aria-label="Move right"><ArrowRight className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {formData.images.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      disabled={uploading}
                      className="w-24 h-28 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 hover:border-black hover:text-black text-xs gap-1"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      {uploading ? 'Uploading' : 'Upload'}
                    </button>
                  )}
                </div>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={handleUpload} />
                <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP or GIF · max 5 MB each · up to 8 images</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="p-name">Name *</Label>
                  <input id="p-name" value={formData.name} onChange={set('name')} className={inputClass} maxLength={120} />
                </div>
                <div>
                  <Label htmlFor="p-category">Category *</Label>
                  <select id="p-category" value={formData.category} onChange={handleCategoryChange} className={inputClass}>
                    <option value="" disabled>Select a category</option>
                    {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="p-brand">Brand</Label>
                  <input id="p-brand" value={formData.brand} onChange={set('brand')} className={inputClass} placeholder="Luxe Attire" />
                </div>
                <div>
                  <Label htmlFor="p-price">Selling Price (LKR) *</Label>
                  <input id="p-price" type="number" min="0" step="0.01" value={formData.price} onChange={set('price')} className={inputClass} />
                </div>
                <div>
                  <Label htmlFor="p-original">Original Price (LKR) – for sale items</Label>
                  <input id="p-original" type="number" min="0" step="0.01" value={formData.originalPrice} onChange={set('originalPrice')} className={inputClass} placeholder="Leave empty if not on sale" />
                </div>
                <div>
                  <Label htmlFor="p-stock">Stock Quantity *</Label>
                  <input id="p-stock" type="number" min="0" value={formData.stock} onChange={set('stock')} className={inputClass} />
                </div>
                <div className="flex items-end gap-6 pb-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isNewArrival} onChange={set('isNewArrival')} className="w-4 h-4 accent-black" /> New Arrival</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.isBestSeller} onChange={set('isBestSeller')} className="w-4 h-4 accent-black" /> Best Seller</label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Available Sizes *</Label>
                  <select value={sizePreset} onChange={(e) => setSizePreset(e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1">
                    {Object.keys(SIZE_PRESETS).map((k) => <option key={k} value={k}>{k} sizes</option>)}
                  </select>
                </div>
                <ChipPicker
                  values={formData.sizes}
                  onChange={(sizes) => setFormData((f) => ({ ...f, sizes }))}
                  presets={SIZE_PRESETS[sizePreset]}
                  placeholder="Custom size (e.g. 32W)"
                />
              </div>

              <div>
                <Label>Available Colours *</Label>
                <ChipPicker
                  values={formData.colors}
                  onChange={(colors) => setFormData((f) => ({ ...f, colors }))}
                  presets={COLOR_PRESETS}
                  placeholder="Custom colour (e.g. Mustard)"
                  renderSwatch
                />
              </div>

              <div>
                <Label htmlFor="p-desc">Description</Label>
                <textarea id="p-desc" value={formData.description} onChange={set('description')} className={`${inputClass} h-28`} placeholder="Fabric, fit, care instructions…" />
              </div>

              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded" role="alert">{formError}</div>}

              <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-300 text-xs uppercase tracking-widest hover:border-black">Cancel</button>
                <button type="submit" disabled={saving || uploading} className="px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

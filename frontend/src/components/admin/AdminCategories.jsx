import React, { useState } from 'react';
import {
  Tags, Tag, Plus, Pencil, Trash2, Check, X, Loader2, Lock, Shirt, Sparkles, Baby, Footprints, Watch, Dumbbell, ShoppingBag, Package, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import useCategories, { refreshCategories } from '../../hooks/useCategories';

// Icon + colour per known category; anything new gets the default tag style.
const CATEGORY_STYLE = {
  'mens-wear': { icon: Shirt, tone: 'bg-blue-50 text-blue-700' },
  'womens-wear': { icon: Sparkles, tone: 'bg-pink-50 text-pink-700' },
  'kids-wear': { icon: Baby, tone: 'bg-amber-50 text-amber-700' },
  shoes: { icon: Footprints, tone: 'bg-stone-100 text-stone-700' },
  accessories: { icon: Watch, tone: 'bg-purple-50 text-purple-700' },
  sportswear: { icon: Dumbbell, tone: 'bg-green-50 text-green-700' },
  bags: { icon: ShoppingBag, tone: 'bg-orange-50 text-orange-700' }
};
const DEFAULT_STYLE = { icon: Tag, tone: 'bg-accent-soft text-accent-dark' };

const AdminCategories = () => {
  const { categories } = useCategories();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [busy, setBusy] = useState(false);

  const totalProducts = categories.reduce((s, c) => s + (c.productCount || 0), 0);

  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      await refreshCategories();
      toast.success(successMessage);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Type a category name first');
      return;
    }
    if (await run(() => axiosInstance.post('/categories', { name: newName.trim() }), 'Category added')) setNewName('');
  };

  const handleRename = async () => {
    if (!editing.name.trim()) return;
    if (await run(() => axiosInstance.put(`/categories/${editing.id}`, { name: editing.name.trim() }), 'Category renamed')) setEditing(null);
  };

  const handleDelete = (category) => {
    if (!window.confirm(`Delete the "${category.name}" category?`)) return;
    run(() => axiosInstance.delete(`/categories/${category.id}`), 'Category deleted');
  };

  return (
    <div className="max-w-4xl space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-line rounded-2xl shadow-sm shadow-black/5 p-5 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-accent-soft text-accent-dark flex items-center justify-center"><Tags className="w-6 h-6" /></span>
          <div><p className="text-sm text-gray-600">Categories</p><p className="text-2xl font-semibold tabular-nums">{categories.length}</p></div>
        </div>
        <div className="bg-white border border-line rounded-2xl shadow-sm shadow-black/5 p-5 flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center"><Package className="w-6 h-6" /></span>
          <div><p className="text-sm text-gray-600">Products in categories</p><p className="text-2xl font-semibold tabular-nums">{totalProducts}</p></div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl shadow-sm shadow-black/5 p-5 md:p-7">
        {/* Add */}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
          <label htmlFor="new-category" className="sr-only">New category name</label>
          <div className="relative flex-grow">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="new-category"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name (e.g. Sarees)"
              maxLength={40}
              className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1c1c1c] text-white px-6 py-3 text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add category
          </button>
        </form>

        {/* List */}
        <ul className="space-y-2">
          {categories.map((c) => {
            const { icon: Icon, tone } = CATEGORY_STYLE[c.slug] || DEFAULT_STYLE;
            const locked = c.productCount > 0;
            return (
              <li key={c.id} className="flex items-center gap-4 rounded-xl border border-line px-4 py-3 hover:border-accent/40 hover:bg-page/60 transition-colors">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-5 h-5" /></span>
                {editing?.id === c.id ? (
                  <>
                    <label htmlFor={`rename-${c.id}`} className="sr-only">Rename {c.name}</label>
                    <input
                      id={`rename-${c.id}`}
                      autoFocus
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(null); }}
                      maxLength={40}
                      className="flex-grow min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                    <button onClick={handleRename} disabled={busy} className="w-10 h-10 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 flex items-center justify-center" aria-label={`Save new name for ${c.name}`}>
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setEditing(null)} className="w-10 h-10 rounded-lg border border-line text-gray-600 hover:bg-gray-50 flex items-center justify-center" aria-label="Cancel renaming">
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-grow min-w-0">
                      <p className="text-[15px] font-semibold text-luxe-dark">{c.name}</p>
                      <p className="text-xs text-gray-500">/{c.slug}</p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-page-alt px-3 py-1 text-xs font-medium text-gray-700 tabular-nums">
                      <Package className="w-3.5 h-3.5" /> {c.productCount} product{c.productCount === 1 ? '' : 's'}
                    </span>
                    <button
                      onClick={() => setEditing({ id: c.id, name: c.name })}
                      className="w-10 h-10 rounded-lg border border-line text-blue-700 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center"
                      aria-label={`Rename ${c.name}`}
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={locked}
                      className="w-10 h-10 rounded-lg border border-line text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center justify-center disabled:text-gray-400 disabled:hover:bg-transparent disabled:hover:border-line disabled:cursor-not-allowed"
                      aria-label={locked ? `${c.name} cannot be deleted while it has products` : `Delete ${c.name}`}
                      title={locked ? 'Move or delete its products first' : 'Delete'}
                    >
                      {locked ? <Lock className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <p className="flex items-start gap-2 text-sm text-gray-600 mt-5 bg-page rounded-xl p-3">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <span>
            Renaming keeps the category&apos;s web address, so existing links keep working. A category with products is locked{' '}
            <Lock className="inline w-3.5 h-3.5 -mt-0.5" aria-hidden="true" /> until its products are moved or deleted.
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminCategories;

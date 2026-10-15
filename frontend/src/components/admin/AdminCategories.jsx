import React, { useState } from 'react';
import { Tags, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import useCategories, { refreshCategories } from '../../hooks/useCategories';

const AdminCategories = () => {
  const { categories } = useCategories();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [busy, setBusy] = useState(false);

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
    if (!newName.trim()) return;
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
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-8 max-w-3xl">
      <h2 className="text-xl font-light tracking-wide flex items-center gap-3 mb-6"><Tags className="w-5 h-5" /> Categories</h2>

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name (e.g. Sportswear)"
          maxLength={40}
          className="flex-grow border border-gray-200 px-3 py-2.5 text-sm rounded outline-none focus:border-black"
        />
        <button disabled={busy || !newName.trim()} className="bg-black text-white px-4 text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </button>
      </form>

      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3">
            {editing?.id === c.id ? (
              <>
                <input
                  autoFocus
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditing(null); }}
                  maxLength={40}
                  className="flex-grow border border-gray-300 px-2 py-1.5 text-sm rounded outline-none focus:border-black"
                />
                <button onClick={handleRename} disabled={busy} className="p-1.5 text-green-700 hover:bg-green-50 rounded" aria-label="Save"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditing(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" aria-label="Cancel"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <div className="flex-grow">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500">/{c.slug} · {c.productCount} product{c.productCount === 1 ? '' : 's'}</p>
                </div>
                <button onClick={() => setEditing({ id: c.id, name: c.name })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Rename"><Edit2 className="w-4 h-4" /></button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={c.productCount > 0}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title={c.productCount > 0 ? 'Move or delete its products first' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">Renaming keeps the category's web address, so existing links keep working. Sizes and colours are managed per product.</p>
    </div>
  );
};

export default AdminCategories;

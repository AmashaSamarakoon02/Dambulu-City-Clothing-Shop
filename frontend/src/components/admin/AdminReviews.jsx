import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get('/reviews/admin/all');
      setReviews(res.data);
    } catch {
      setError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await axiosInstance.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete review');
    }
  };

  const filteredReviews = reviews.filter(r => 
    r.comment.toLowerCase().includes(search.toLowerCase()) || 
    (r.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.product?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center animate-pulse">Loading reviews...</div>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-8">
      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded">{error}</div>}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="text-2xl font-light tracking-wide text-gray-900 flex items-center">
          <MessageSquare className="h-6 w-6 mr-3" /> Manage Reviews
        </h2>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by review, user, or product..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 focus:bg-white focus:border-black outline-none text-sm rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <th className="py-3 pr-4">User</th>
              <th className="py-3 pr-4">Product</th>
              <th className="py-3 pr-4">Rating</th>
              <th className="py-3 pr-4 w-1/3">Comment</th>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-400 italic">No reviews found.</td>
              </tr>
            ) : filteredReviews.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-900">{r.user?.name || 'Unknown'}</td>
                <td className="py-3 pr-4 text-gray-600 line-clamp-2" title={r.product?.name}>{r.product?.name || 'Deleted Product'}</td>
                <td className="py-3 pr-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-500 italic">"{r.comment}"</td>
                <td className="py-3 pr-4 text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="py-3 pr-4">
                  <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete Review">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReviews;

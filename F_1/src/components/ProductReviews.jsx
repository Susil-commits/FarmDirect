import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, HelpCircle, ThumbsUp } from 'lucide-react';
import { reviewService } from '../services/appService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import '../styles/Reviews.css';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getReviews(productId);
      const data = response.data?.reviews || response.data || response || [];
      setReviews(Array.isArray(data) ? data : []);
      if (response.summary) {
        setSummary(response.summary);
      } else {
        try {
          const sumRes = await reviewService.getCropReviewSummary(productId);
          if (sumRes?.data) setSummary(sumRes.data);
        } catch {
          // Summary not yet generated or available
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.content || newReview.content.length < 10) {
      addToast('Review must be at least 10 characters long', 'warning');
      return;
    }

    if (!user) {
      addToast('Please log in to submit a review', 'warning');
      return;
    }

    try {
      const response = await reviewService.addReview(productId, {
        rating: newReview.rating,
        comment: newReview.content,
      });
      const createdReview = response.data?.review || response.data || response;
      setReviews((prev) => [createdReview, ...prev]);
      setNewReview({ rating: 5, title: '', content: '' });
      setShowForm(false);
      addToast(response.message || 'Review submitted successfully!', 'success');
      // Refetch after a moment to pick up regenerated summary
      setTimeout(() => fetchReviews(), 1500);
    } catch (error) {
      console.error('Failed to submit review:', error);
      addToast(error.response?.data?.message || 'Failed to submit review', 'error');
    }
  };

  return (
    <div className="reviews-section">
      {/* AI Review Summary Card */}
      {summary && summary.summary && (
        <div className="p-5 mb-6 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border border-emerald-200/80 rounded-2xl shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600" />
              <h4 className="font-bold text-stone-900 text-sm tracking-wide">AI Review Summary</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Suggested by AI
              </span>
            </div>
            {summary.lastGeneratedAt && (
              <span className="text-xs text-stone-500">
                Generated {new Date(summary.lastGeneratedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-sm text-stone-700 leading-relaxed mb-4 font-normal">
            {summary.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {summary.pros && summary.pros.length > 0 && (
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Key Highlights
                </p>
                <ul className="text-xs text-stone-700 space-y-1.5 list-disc pl-4">
                  {summary.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.cons && summary.cons.length > 0 && (
              <div className="bg-white/80 p-3 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <HelpCircle size={14} className="text-amber-600" /> Points to Consider
                </p>
                <ul className="text-xs text-stone-700 space-y-1.5 list-disc pl-4">
                  {summary.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sentiment Breakdown */}
          {summary.sentimentBreakdown && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/50 text-xs">
              <span className="text-stone-500 font-medium">Customer Sentiment:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                Positive ({summary.sentimentBreakdown.positive})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                Neutral ({summary.sentimentBreakdown.neutral})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">
                Negative ({summary.sentimentBreakdown.negative})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Aggregate Rating Header */}
      <div className="reviews-summary card-glass">
        <div className="summary-stats">
          <div className="rating-display">
            <div className="rating-value">{averageRating}</div>
            <div className="rating-stars">
              {'⭐'.repeat(Math.round(averageRating))}
            </div>
            <div className="rating-count">
              Based on {reviews.length} reviews
            </div>
          </div>

          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = reviews.filter((r) => r.rating === stars).length;
              const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={stars} className="breakdown-item">
                  <span className="stars-label">{stars} ⭐</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, var(--primary-main) 0%, var(--primary-light) 100%)`,
                      }}
                    />
                  </div>
                  <span className="count">({count})</span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary cursor-pointer"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <div className="review-form-container card-glass animate-scale-in">
          <h3>Share your experience</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Rating *</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn cursor-pointer ${
                      newReview.rating === star ? 'active' : ''
                    }`}
                    onClick={() =>
                      setNewReview({ ...newReview, rating: star })
                    }
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Your Review (min. 10 chars) *</label>
              <textarea
                placeholder="Share details about produce freshness, packaging, and delivery..."
                rows="4"
                value={newReview.content}
                onChange={(e) =>
                  setNewReview({ ...newReview, content: e.target.value })
                }
                required
              />
            </div>

            <button type="submit" className="btn btn-primary cursor-pointer">
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* Customer Reviews List */}
      <div className="reviews-list">
        <h3 className="reviews-title">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No customer reviews yet. Verified purchasers can share feedback!</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <div
              key={review._id || review.id || idx}
              className="review-card card-glass stagger-item"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {(review.userId?.firstName || review.user?.firstName || review.author || 'B')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4>
                      {review.userId?.firstName
                        ? `${review.userId.firstName} ${review.userId.lastName || ''}`.trim()
                        : review.user?.name || review.author || 'Verified Buyer'}
                    </h4>
                    <div className="review-meta">
                      {'⭐'.repeat(review.rating || 5)}
                      <span className="verified-badge">✓ Verified Purchase</span>
                      {review.sentimentLabel && (
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ml-2 ${
                            review.sentimentLabel === 'positive'
                              ? 'bg-emerald-50 text-emerald-700'
                              : review.sentimentLabel === 'negative'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {review.sentimentLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="review-date">
                  {new Date(review.createdAt || review.date || Date.now()).toLocaleDateString()}
                </span>
              </div>

              <p className="review-content">{review.comment || review.content}</p>

              <div className="review-footer">
                <button className="helpful-btn cursor-pointer">
                  <ThumbsUp size={14} className="inline mr-1" /> Helpful ({review.helpful || 0})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

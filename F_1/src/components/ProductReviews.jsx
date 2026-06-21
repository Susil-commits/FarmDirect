import React, { useState, useEffect } from 'react';
import { reviewService } from '../services/appService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/Reviews.css';

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewService.getReviews(productId);
      const data = response.data?.reviews || response.data || response || [];
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReview.title || !newReview.content) {
      addToast('Please fill all required fields', 'warning');
      return;
    }

    if (!user) {
      addToast('Please log in to submit a review', 'warning');
      return;
    }

    try {
      const response = await reviewService.addReview(productId, {
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
      });
      const createdReview = response.data?.review || response.data || response;
      setReviews(prev => [createdReview, ...prev]);
      setNewReview({ rating: 5, title: '', content: '' });
      setShowForm(false);
      addToast('Review submitted successfully!', 'success');
    } catch (error) {
      console.error('Failed to submit review:', error);
      addToast(error.response?.data?.message || 'Failed to submit review', 'error');
    }
  };

  return (
    <div className="reviews-section">
      {/* Reviews Summary */}
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
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(r => r.rating === stars).length;
              const percent = (count / reviews.length) * 100;
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

      {/* Review Form */}
      {showForm && (
        <div className="review-form-container card-glass animate-scale-in">
          <h3>Share your experience</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Rating *</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map(star => (
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
              <label>Review Title *</label>
              <input
                type="text"
                placeholder="Summarize your experience"
                value={newReview.title}
                onChange={(e) =>
                  setNewReview({ ...newReview, title: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Your Review *</label>
              <textarea
                placeholder="Share your experience with this product"
                rows="5"
                value={newReview.content}
                onChange={(e) =>
                  setNewReview({ ...newReview, content: e.target.value })
                }
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Submit Review
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        <h3 className="reviews-title">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review, idx) => (
            <div
              key={review.id}
              className="review-card card-glass stagger-item"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {(review.user?.firstName || review.user?.name || review.author || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{review.user?.firstName || review.user?.name || review.author || 'Anonymous'}</h4>
                    <div className="review-meta">
                      {'⭐'.repeat(review.rating || 0)}
                      {review.verified && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="review-date">{new Date(review.createdAt || review.date).toLocaleDateString()}</span>
              </div>

              <h5 className="review-title">{review.title}</h5>
              <p className="review-content">{review.content}</p>

              <div className="review-footer">
                <button className="helpful-btn cursor-pointer">
                  👍 Helpful ({review.helpful})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


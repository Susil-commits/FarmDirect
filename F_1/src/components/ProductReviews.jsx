import React, { useState, useEffect } from 'react';
import '../styles/Reviews.css';

export default function ProductReviews({ productId, productName }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await reviewService.getReviews(productId);
      // setReviews(response.data || []);
      setReviews([]);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    author: '',
    rating: 5,
    title: '',
    content: '',
  });

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newReview.author || !newReview.title || !newReview.content) {
      alert('Please fill all fields');
      return;
    }

    const review = {
      id: reviews.length + 1,
      ...newReview,
      date: new Date().toISOString().split('T')[0],
      helpful: 0,
      verified: false,
    };

    setReviews([review, ...reviews]);
    setNewReview({ author: '', rating: 5, title: '', content: '' });
    setShowForm(false);
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
              <label>Your Name *</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={newReview.author}
                onChange={(e) =>
                  setNewReview({ ...newReview, author: e.target.value })
                }
                required
              />
            </div>

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
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4>{review.author}</h4>
                    <div className="review-meta">
                      {'⭐'.repeat(review.rating)}
                      {review.verified && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="review-date">{review.date}</span>
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

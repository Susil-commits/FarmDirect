import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, ShoppingCart, Eye, Check, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import '../styles/Wishlist.css';

export default function Wishlist() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    addToast(`${product.name} added to cart`, 'success');
  };

  const handleRemove = (productId, productName) => {
    removeFromWishlist(productId);
    addToast(`${productName || 'Item'} removed from wishlist`, 'info');
  };

  const handleViewCrop = (productId) => {
    navigate(`/crop/${productId}`);
  };

  return (
    <PageTransition>
      <div className="wishlist-page">
        <div className="wishlist-bg-gradient"></div>
        <div className="wishlist-container">
          {/* Header */}
          <div className="wishlist-header-section">
            <div className="wishlist-header-content">
              <div className="wishlist-title-row">
                <span className="wishlist-header-icon">❤️</span>
                <h1>Your Wishlist</h1>
              </div>
              <p className="wishlist-subtitle">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
            {wishlist.length > 0 && (
              <button
                onClick={() => navigate('/marketplace')}
                className="wishlist-browse-btn"
              >
                <ShoppingCart size={18} />
                Browse Marketplace
              </button>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="wishlist-loading">
              <div className="wishlist-loading-spinner"></div>
              <p>Loading your wishlist...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && wishlist.length === 0 && (
            <div className="wishlist-empty">
              <div className="wishlist-empty-icon">
                <Heart size={64} strokeWidth={1.5} />
              </div>
              <h2>Your wishlist is empty</h2>
              <p>Start adding items to your wishlist and they will appear here</p>
              <Button
                onClick={() => navigate('/marketplace')}
                className="btn btn-primary btn-lg"
              >
                Explore Products
              </Button>
            </div>
          )}

          {/* Wishlist Grid */}
          {!loading && wishlist.length > 0 && (
            <div className="wishlist-grid">
              {wishlist.map((product, idx) => (
                <WishlistCard
                  key={product.id || product._id}
                  product={product}
                  index={idx}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  onViewCrop={handleViewCrop}
                />
              ))}
            </div>
          )}

          {/* Footer Navigation */}
          {wishlist.length > 0 && (
            <div className="wishlist-footer">
              <div className="wishlist-footer-inner">
                <button
                  onClick={() => navigate('/')}
                  className="wishlist-footer-back"
                >
                  ← Back to Home
                </button>
                <div className="wishlist-footer-links">
                  <button onClick={() => navigate('/marketplace')}>Marketplace</button>
                  <button onClick={() => navigate('/cart')}>Cart</button>
                  <button onClick={() => navigate('/contact')}>Contact</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

// Individual Wishlist Card - Matching Marketplace CropCard Design
function WishlistCard({ product, index, onRemove, onAddToCart, onViewCrop }) {
  const staggerDelay = index * 0.08;
  const productImage = product.image || product.images?.[0];
  const [imgError, setImgError] = useState(false);
  const showFallback = !productImage || imgError || !(productImage.startsWith?.('http') || productImage.startsWith?.('/'));

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating || 0) - fullStars >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={14} fill="#f59e0b" className="star-filled" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <span key={i} className="star-half-container">
            <Star size={14} className="star-empty" />
            <span className="star-half-fill"><Star size={14} fill="#f59e0b" /></span>
          </span>
        );
      } else {
        stars.push(<Star key={i} size={14} className="star-empty" />);
      }
    }
    return stars;
  };

  return (
    <div
      className={`wishlist-card ${staggerDelay > 0 ? 'stagger-item' : ''}`}
      style={{ animationDelay: `${staggerDelay}s`, '--card-delay': staggerDelay }}
    >
      {/* Image Section */}
      <div
        className="wishlist-card-image"
        onClick={() => onViewCrop(product.id || product._id)}
      >
        {!showFallback && productImage ? (
          <img
            src={productImage}
            alt={product.name}
            className="wishlist-card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="wishlist-card-img-fallback">
            <span className="wishlist-card-emoji">
              {product.cropType === 'vegetables' ? '🥬' :
               product.cropType === 'fruits' ? '🍎' :
               product.cropType === 'grains' ? '🌾' :
               product.cropType === 'herbs' ? '🌿' : '🌾'}
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="wishlist-card-badges">
          {product.farmer_verified && (
            <span className="wishlist-badge-verified">
              <Check size={10} /> Verified
            </span>
          )}
          {(product.cropType || product.category) && (
            <span className="wishlist-badge-type">
              {product.cropType || product.category}
            </span>
          )}
        </div>

        {/* Remove Button */}
        <button
          className="wishlist-card-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(product.id || product._id, product.name);
          }}
          title="Remove from wishlist"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Content Section */}
      <div className="wishlist-card-body">
        {/* Product Name */}
        <h3 className="wishlist-card-name">{product.name}</h3>

        {/* Farmer Info */}
        <div className="wishlist-card-farmer">
          <div className="wishlist-farmer-avatar">
            {product.farmerName?.[0]?.toUpperCase() || 'F'}
          </div>
          <div className="wishlist-farmer-info">
            <p className="wishlist-farmer-name">{product.farmerName || 'Farmer'}</p>
            <p className="wishlist-farmer-location">
              <MapPin size={10} />
              {product.pickupLocation || product.location || 'Location N/A'}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="wishlist-card-rating">
          <div className="wishlist-card-stars">
            {renderStars(product.rating)}
          </div>
          <span className="wishlist-card-review-count">
            ({product.totalReviews || product.reviews || 0})
          </span>
        </div>

        {/* Price Box */}
        <div className="wishlist-card-price-box">
          <span className="wishlist-price-label">Price per {product.unit || 'kg'}</span>
          <span className="wishlist-price-value">₹{Math.floor(product.price || 0)}</span>
        </div>

        {/* Action Buttons */}
        <div className="wishlist-card-actions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="wishlist-btn-add-cart"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewCrop(product.id || product._id);
            }}
            className="wishlist-btn-view"
          >
            <Eye size={16} />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

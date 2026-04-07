import React, { useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button';
import '../styles/Wishlist.css';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const { addToast } = useToast();

  // Reset scroll position to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    addToast(`${product.name} added to cart`, 'success');
  };

  const handleRemove = (productId, productName) => {
    removeFromWishlist(productId);
    addToast(`${productName} removed from wishlist`, 'info');
  };

  return (
    <PageTransition>
      <div className="wishlist-page">
        <div className="container p-xl">
          <div className="wishlist-header animate-slide-in-down">
            <h1>Your Wishlist</h1>
            <p className="text-gray-500">
              {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved for later
            </p>
          </div>

          {wishlist.length === 0 ? (
            <div className="empty-wishlist">
              <div className="empty-icon animate-float">❤️</div>
              <h2>Your wishlist is empty</h2>
              <p>
                Start adding items to your wishlist and they will appear here
              </p>
              <Button
                onClick={() => navigate('/marketplace')}
                className="btn btn-primary"
              >
                Explore Products
              </Button>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((product, idx) => (
                <div
                  key={product.id}
                  className="wishlist-card card-glass stagger-item"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="card-image">
                    <div className="image-placeholder">
                      {product.icon || '🌾'}
                    </div>
                    <button
                      className="remove-btn cursor-pointer"
                      onClick={() =>
                        handleRemove(product.id, product.name)
                      }
                      title="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="card-body p-lg">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">
                      {product.description}
                    </p>

                    <div className="product-badges mt-md">
                      <span className="badge badge-success">Fresh</span>
                      <span className="badge badge-info">Organic</span>
                    </div>

                    <div className="product-rating mt-lg">
                      <span className="stars">⭐⭐⭐⭐⭐</span>
                      <span className="rating-text">(128 reviews)</span>
                    </div>

                    <div className="product-footer mt-lg">
                      <div className="price-section">
                        <span className="price">₹{product.price}</span>
                        <span className="original-price">₹{Math.round(product.price * 1.2)}</span>
                      </div>
                    </div>

                    <div className="card-actions mt-lg">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="btn btn-primary w-full"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => navigate(`/crop/${product.id}`)}
                        className="btn btn-ghost w-full"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

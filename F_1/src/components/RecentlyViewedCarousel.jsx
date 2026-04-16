import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import './RecentlyViewedCarousel.css';

export default function RecentlyViewedCarousel() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { navigate } = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { recentlyViewed, removeFromRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScroll);
      return () => element.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
  };

  const handleToggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (recentlyViewed.length === 0) {
    return null;
  }

  return (
    <div className="recently-viewed-container">
      <div className="recently-viewed-header">
        <h3 className="recently-viewed-title">
          👀 Recently Viewed ({recentlyViewed.length})
        </h3>
        <button
          onClick={clearRecentlyViewed}
          className="clear-history-btn"
          title="Clear history"
        >
          Clear History
        </button>
      </div>

      <div className="carousel-wrapper">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="scroll-btn scroll-btn-left"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Carousel */}
        <div className="carousel-container" ref={scrollRef}>
          {recentlyViewed.map((product) => (
            <div key={product.id} className="carousel-item">
              <div className="item-image-wrapper">
                {product.image && product.image.startsWith('http') ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="item-image"
                    onClick={() => navigate(`/crop/${product.id}`)}
                  />
                ) : (
                  <div className="item-image-emoji" onClick={() => navigate(`/crop/${product.id}`)}>
                    {product.image || '🥬'}
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={() => handleToggleWishlist(product)}
                  className={`item-wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
                  title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={16} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromRecentlyViewed(product.id)}
                  className="item-remove-btn"
                  title="Remove from recently viewed"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="item-content">
                <h4
                  className="item-title"
                  onClick={() => navigate(`/crop/${product.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  {product.name}
                </h4>

                <p className="item-price">₹{product.price}/kg</p>

                <p className="item-farmer">
                  {product.farmer ? `By ${product.farmer}` : 'Fresh Farm'}
                </p>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="item-add-btn"
                >
                  <ShoppingCart size={14} />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="scroll-btn scroll-btn-right"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

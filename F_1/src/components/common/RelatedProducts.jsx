import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import Button from './Button';
import { useWishlist } from '../../context/WishlistContext';

/**
 * RelatedProducts Component
 * Horizontal scrollable list of related products from same farmer or category
 */
export default function RelatedProducts({ 
  products = [],
  title = 'Related Products',
  onProductClick = null,
  onAddToCart = null,
  showFarmer = false
}) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const containerRef = React.useRef(null);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setScrollPosition(scrollLeft);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (!containerRef.current) return;
    
    const scrollAmount = 300;
    containerRef.current.smoothScroll({
      left: containerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Check initial state
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {products.map((product, idx) => (
          <RelatedProductCard
            key={product.id || idx}
            product={product}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            showFarmer={showFarmer}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Related Product Card
 */
function RelatedProductCard({ 
  product, 
  onProductClick, 
  onAddToCart,
  showFarmer = false 
}) {
  const { isInWishlist: isFavorite, addToWishlist, removeFromWishlist } = useWishlist();
  const [favorited, setFavorited] = React.useState(isFavorite(product.id));

  const toggleFavorite = () => {
    if (favorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
    setFavorited(!favorited);
  };

  return (
    <div
      className="shrink-0 w-48 bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => onProductClick?.(product.id)}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {product.image && product.image.startsWith('http') ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {product.image || '🌾'}
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
            favorited
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-400 hover:text-red-600'
          }`}
        >
          <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
        </button>

        {/* Verified Badge */}
        {product.farmer_verified && (
          <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded-full text-xs font-semibold text-green-600 shadow-sm">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate">
          {product.name}
        </h3>
        
        {showFarmer && product.farmer && (
          <p className="text-xs text-gray-600 mb-2 truncate">
            👨‍🌾 {typeof product.farmer === 'string' ? product.farmer : product.farmer.name}
          </p>
        )}

        <div className="flex items-baseline gap-1 mb-2">
          <span className="font-bold text-green-600 text-lg">₹{product.price}</span>
          <span className="text-gray-600 text-xs">/kg</span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <span className="text-sm text-yellow-500">⭐</span>
            <span className="text-sm font-semibold text-gray-900">{product.rating || 4.5}</span>
            <span className="text-xs text-gray-500">({product.reviews || 0})</span>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="w-full flex items-center justify-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
        >
          <ShoppingCart size={14} /> Add
        </Button>
      </div>
    </div>
  );
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/appService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load wishlist: from API if authenticated, from localStorage if guest
  useEffect(() => {
    const loadWishlist = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          const response = await wishlistService.getWishlist();
          const items = response.wishlist || response.data?.wishlist || response.data || [];
          // Normalize to array of crop objects
          const normalized = Array.isArray(items) ? items.map(item => {
            const crop = item.cropId || item;
            return {
              _id: crop._id || item._id,
              id: crop._id || crop.id || item._id,
              name: crop.cropName || crop.name || 'Unknown Crop',
              description: crop.description || '',
              price: crop.price || 0,
              image: crop.images?.[0] || crop.image || null,
              images: crop.images || [],
              rating: crop.rating || 0,
              reviews: crop.totalReviews || crop.reviews || 0,
              totalReviews: crop.totalReviews || crop.reviews || 0,
              farmerId: crop.farmerId || item.farmerId,
              farmerName: crop.farmerName || '',
              quantity: crop.quantity || 0,
              unit: crop.unit || 'kg',
              cropType: crop.cropType || crop.category || '',
              category: crop.category || crop.cropType || '',
              location: crop.pickupLocation || crop.location || '',
              pickupLocation: crop.pickupLocation || crop.location || '',
              farmer_verified: crop.farmer_verified || false,
            };
          }) : [];
          setWishlist(normalized);
          // Also sync to localStorage as cache
          localStorage.setItem('farm-wishlist', JSON.stringify(normalized));
        } catch (err) {
          console.error('Failed to load wishlist from API, falling back to localStorage:', err);
          loadFromLocalStorage();
        } finally {
          setLoading(false);
        }
      } else {
        loadFromLocalStorage();
      }
    };

    loadWishlist();
  }, [isAuthenticated, user]);

  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('farm-wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load wishlist from localStorage:', e);
        setWishlist([]);
      }
    }
  };

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    if (wishlist.length > 0 || localStorage.getItem('farm-wishlist')) {
      localStorage.setItem('farm-wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  const addToWishlist = useCallback(async (product) => {
    const productId = product._id || product.id;
    const normalizedProduct = {
      _id: productId,
      id: productId,
      name: product.name || product.cropName || 'Unknown Crop',
      description: product.description || '',
      price: product.price || 0,
      image: product.images?.[0] || product.image || null,
      images: product.images || [],
      rating: product.rating || 0,
      reviews: product.totalReviews || product.reviews || 0,
      totalReviews: product.totalReviews || product.reviews || 0,
      farmerId: product.farmerId,
      farmerName: product.farmerName || '',
      quantity: product.quantity || 0,
      unit: product.unit || 'kg',
      cropType: product.cropType || product.category || '',
      category: product.category || product.cropType || '',
      location: product.pickupLocation || product.location || '',
      pickupLocation: product.pickupLocation || product.location || '',
      farmer_verified: product.farmer_verified || false,
    };

    // Optimistic UI update
    setWishlist(prev => {
      const exists = prev.some(item => (item._id || item.id) === productId);
      if (exists) return prev;
      return [...prev, normalizedProduct];
    });

    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        await wishlistService.addToWishlist(productId);
      } catch (err) {
        console.error('Failed to sync wishlist add to backend:', err);
        // Revert on failure
        setWishlist(prev => prev.filter(item => (item._id || item.id) !== productId));
      }
    }
  }, [isAuthenticated]);

  const removeFromWishlist = useCallback(async (productId) => {
    // Optimistic UI update
    setWishlist(prev => prev.filter(item => (item._id || item.id) !== productId));

    // Sync to backend if authenticated
    if (isAuthenticated) {
      try {
        await wishlistService.removeFromWishlist(productId);
      } catch (err) {
        console.error('Failed to sync wishlist remove to backend:', err);
        // Reload from API to get correct state
        try {
          const response = await wishlistService.getWishlist();
          const items = response.wishlist || response.data?.wishlist || response.data || [];
          setWishlist(items.map(item => {
            const crop = item.cropId || item;
            return { ...crop, _id: crop._id, id: crop._id || crop.id };
          }));
        } catch (_e) {
          // Keep optimistic state
        }
      }
    }
  }, [isAuthenticated]);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => (item._id || item.id) === productId);
  }, [wishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    localStorage.removeItem('farm-wishlist');
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}

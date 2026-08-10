/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { wishlistService } from '../services/appService';
import { useAuth } from './AuthContext';

export const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [error, setError] = useState(null);
  const loadFromLocalStorageRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const loadFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem('farm-wishlist');
    if (saved) {
      try {
        setWishlist(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load wishlist from localStorage:', e);
        setWishlist([]);
      }
    }
  }, []);

  useEffect(() => {
    loadFromLocalStorageRef.current = loadFromLocalStorage;
  }, [loadFromLocalStorage]);

  useEffect(() => {
    const loadWishlist = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          const response = await wishlistService.getWishlist();
          const items = response.wishlist || response.data?.wishlist || response.data || [];
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
          localStorage.setItem('farm-wishlist', JSON.stringify(normalized));
        } catch (err) {
          console.error('Failed to load wishlist from API, falling back to localStorage:', err);
          loadFromLocalStorageRef.current();
        } finally {
          setLoading(false);
        }
      } else {
        loadFromLocalStorageRef.current();
      }
    };

    loadWishlist();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (wishlist.length > 0 || localStorage.getItem('farm-wishlist')) {
      localStorage.setItem('farm-wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist]);

  useEffect(() => {
    const handleCropDeleted = (e) => {
      const deletedId = e.detail?.cropId;
      if (!deletedId) return;
      setWishlist(prev => {
        const filtered = prev.filter(item => (item._id || item.id) !== deletedId);
        localStorage.setItem('farm-wishlist', JSON.stringify(filtered));
        return filtered;
      });
    };

    const handleCropUpdated = (e) => {
      const updated = e.detail?.crop;
      if (!updated?._id) return;
      setWishlist(prev => {
        const refreshed = prev.map(item => {
          if ((item._id || item.id) === updated._id) {
            return {
              ...item,
              name: updated.cropName || updated.name || item.name,
              price: updated.price ?? item.price,
              images: updated.images || item.images,
              image: updated.images?.[0] || item.image,
              quantity: updated.quantity ?? item.quantity,
              unit: updated.unit || item.unit,
              pickupLocation: updated.pickupLocation || item.pickupLocation,
              location: updated.pickupLocation || item.location,
              description: updated.description || item.description,
              cropType: updated.cropType || item.cropType,
              category: updated.category || item.category,
            };
          }
          return item;
        });
        localStorage.setItem('farm-wishlist', JSON.stringify(refreshed));
        return refreshed;
      });
    };

    window.addEventListener('crop-deleted', handleCropDeleted);
    window.addEventListener('crop-updated', handleCropUpdated);
    return () => {
      window.removeEventListener('crop-deleted', handleCropDeleted);
      window.removeEventListener('crop-updated', handleCropUpdated);
    };
  }, []);

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

    setWishlist(prev => {
      const exists = prev.some(item => (item._id || item.id) === productId);
      if (exists) return prev;
      return [...prev, normalizedProduct];
    });

    if (isAuthenticated) {
      try {
        await wishlistService.addToWishlist(productId);
      } catch (err) {
        console.error('Failed to sync wishlist add to backend:', err);
        const msg = err?.message || 'Failed to add to wishlist';
        setError(msg);
        setWishlist(prev => prev.filter(item => (item._id || item.id) !== productId));
      }
    }
  }, [isAuthenticated]);

  const removeFromWishlist = useCallback(async (productId) => {
    setWishlist(prev => prev.filter(item => (item._id || item.id) !== productId));

    if (isAuthenticated) {
      try {
        await wishlistService.removeFromWishlist(productId);
      } catch (err) {
        console.error('Failed to sync wishlist remove to backend:', err);
        setError(err?.message || 'Failed to remove from wishlist');
        try {
          const response = await wishlistService.getWishlist();
          const items = response.wishlist || response.data?.wishlist || response.data || [];
          setWishlist(items.map(item => {
            const crop = item.cropId || item;
            return { ...crop, _id: crop._id, id: crop._id || crop.id };
          }));
        } catch (resyncErr) {
          console.error('Failed to re-sync wishlist:', resyncErr);
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
        error,
        clearError: () => setError(null),
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

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within WishlistProvider');
  }
  return context;
}

export const useWishlist = useWishlistContext;

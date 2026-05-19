import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('farm-cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Normalize: ensure items have _id
        const normalized = parsed.map(item => ({
          ...item,
          _id: item._id || item.id,
          id: item._id || item.id,
        }));
        setCart(normalized);
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    if (cart.length > 0 || localStorage.getItem('farm-cart')) {
      localStorage.setItem('farm-cart', JSON.stringify(cart));
    }
  }, [cart]);

  // ─── Global event listeners for crop deletion / update ────────────────
  // When a crop is deleted by the farmer, remove it from all carts
  useEffect(() => {
    const handleCropDeleted = (e) => {
      const deletedId = e.detail?.cropId;
      if (!deletedId) return;
      setCart(prev => prev.filter(item => (item._id || item.id) !== deletedId));
    };

    // When a crop is updated by the farmer, refresh cached data in cart items
    const handleCropUpdated = (e) => {
      const updated = e.detail?.crop;
      if (!updated?._id) return;
      setCart(prev => prev.map(item => {
        if ((item._id || item.id) === updated._id) {
          return {
            ...item,
            name: updated.cropName || updated.name || item.name,
            cropName: updated.cropName || updated.cropName || item.cropName,
            price: updated.price ?? item.price,
            images: updated.images || item.images,
            image: updated.images?.[0] || item.image,
            quantity: item.quantity, // keep user's cart quantity, not the stock quantity
            unit: updated.unit || item.unit,
            pickupLocation: updated.pickupLocation || item.pickupLocation,
            description: updated.description || item.description,
          };
        }
        return item;
      }));
    };

    window.addEventListener('crop-deleted', handleCropDeleted);
    window.addEventListener('crop-updated', handleCropUpdated);
    return () => {
      window.removeEventListener('crop-deleted', handleCropDeleted);
      window.removeEventListener('crop-updated', handleCropUpdated);
    };
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prev => {
      const productId = product._id || product.id;
      const existing = prev.find(item => (item._id || item.id) === productId);
      if (existing) {
        return prev.map(item =>
          (item._id || item.id) === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        ...product,
        _id: productId,
        id: productId,
        quantity,
      }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => (item._id || item.id) !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => (item._id || item.id) !== productId));
    } else {
      setCart(prev =>
        prev.map(item =>
          (item._id || item.id) === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem('farm-cart');
  }, []);

  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
  }, [cart]);

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + (item.quantity || 0), 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

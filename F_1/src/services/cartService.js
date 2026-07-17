import api from './api';

const cartService = {
  getCart: () => api.get('/cart'),
  
  updateCart: (items) => api.put('/cart', { items }),
  
  clearCart: () => api.delete('/cart'),
};

export default cartService;

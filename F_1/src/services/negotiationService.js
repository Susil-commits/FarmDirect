import api from './api';

export const negotiationService = {
  makeOffer: async (data) => {
    const response = await api.post('/negotiations/offer', data);
    return response.data;
  },

  respondToOffer: async (id, data) => {
    const response = await api.post(`/negotiations/${id}/respond`, data);
    return response.data;
  },

  getNegotiations: async () => {
    const response = await api.get('/negotiations');
    return response.data;
  }
};

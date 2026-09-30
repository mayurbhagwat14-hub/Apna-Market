import api from '../../../services/api';

export const vendorMarketingService = {
  getOverview: async () => {
    const response = await api.get('/vendors/marketing');
    return response.data;
  },

  createOffer: async (data) => {
    const response = await api.post('/vendors/marketing/offers', data);
    return response.data;
  },

  updateOffer: async (id, data) => {
    const response = await api.put(`/vendors/marketing/offers/${id}`, data);
    return response.data;
  },

  deleteOffer: async (id) => {
    const response = await api.delete(`/vendors/marketing/offers/${id}`);
    return response.data;
  },

  uploadPhoto: async (data) => {
    const response = await api.post('/vendors/marketing/photos', data);
    return response.data;
  },

  deletePhoto: async (id) => {
    const response = await api.delete(`/vendors/marketing/photos/${id}`);
    return response.data;
  },

  toggleVisibility: async (isStoreLive) => {
    const response = await api.patch('/vendors/marketing/visibility', { isStoreLive });
    return response.data;
  }
};

export default vendorMarketingService;

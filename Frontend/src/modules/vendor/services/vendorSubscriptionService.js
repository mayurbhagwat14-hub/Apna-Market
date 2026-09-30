import api from '../../../services/api';

export const vendorSubscriptionService = {
  // Get all available plans
  getPlans: async () => {
    const response = await api.get('/vendors/subscription/plans');
    return response.data;
  },

  // Get vendor's current subscription status & history
  getMySubscription: async () => {
    const response = await api.get('/vendors/subscription/my');
    return response.data;
  },

  // Create Razorpay order for plan purchase
  createOrder: async (planId) => {
    const response = await api.post('/vendors/subscription/create-order', { planId });
    return response.data;
  },

  // Verify payment and activate subscription
  verifyPayment: async (paymentData) => {
    const response = await api.post('/vendors/subscription/verify-payment', paymentData);
    return response.data;
  }
};

export default vendorSubscriptionService;

import api from '../../../services/api';

// ─── VENDOR AD PLANS ───

export const getVendorAdPlans = async () => {
  const response = await api.get('/admin/vendor-plans');
  return response.data;
};

export const getVendorAdPlanById = async (id) => {
  const response = await api.get(`/admin/vendor-plans/${id}`);
  return response.data;
};

export const createVendorAdPlan = async (planData) => {
  const response = await api.post('/admin/vendor-plans', planData);
  return response.data;
};

export const updateVendorAdPlan = async (id, planData) => {
  const response = await api.put(`/admin/vendor-plans/${id}`, planData);
  return response.data;
};

export const deleteVendorAdPlan = async (id) => {
  const response = await api.delete(`/admin/vendor-plans/${id}`);
  return response.data;
};

export const toggleVendorAdPlan = async (id) => {
  const response = await api.patch(`/admin/vendor-plans/${id}/toggle`);
  return response.data;
};

// ─── VENDOR SUBSCRIPTIONS ───

export const getVendorSubscriptions = async (params = {}) => {
  const response = await api.get('/admin/vendor-subscriptions', { params });
  return response.data;
};

export const grantVendorSubscription = async (data) => {
  const response = await api.post('/admin/vendor-subscriptions/grant', data);
  return response.data;
};

export default {
  getVendorAdPlans,
  getVendorAdPlanById,
  createVendorAdPlan,
  updateVendorAdPlan,
  deleteVendorAdPlan,
  toggleVendorAdPlan,
  getVendorSubscriptions,
  grantVendorSubscription
};

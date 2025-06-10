import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL+`/api-v1`;

const api = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// Budget Service API calls
const BUDGET_SERVICE_URL = import.meta.env.VITE_BUDGET_SERVICE_URL || 'http://localhost:3002/api';

export const budgetAPI = {
  // Budget operations
  createBudget: (budgetData) => api.post(`${BUDGET_SERVICE_URL}/budgets`, budgetData),
  getUserBudgets: (userId) => api.get(`${BUDGET_SERVICE_URL}/budgets/${userId}`),
  getBudgetOverview: (userId) => api.get(`${BUDGET_SERVICE_URL}/budgets/${userId}/overview`),
  getBudgetById: (userId, budgetId) => api.get(`${BUDGET_SERVICE_URL}/budgets/${userId}/${budgetId}`),
  updateBudget: (userId, budgetId, budgetData) => api.put(`${BUDGET_SERVICE_URL}/budgets/${userId}/${budgetId}`, budgetData),
  deleteBudget: (userId, budgetId) => api.delete(`${BUDGET_SERVICE_URL}/budgets/${userId}/${budgetId}`),
  getBudgetSpending: (userId, budgetId) => api.get(`${BUDGET_SERVICE_URL}/budgets/${userId}/${budgetId}/spending`),
  recalculateBudgetSpending: (userId, budgetId) => api.post(`${BUDGET_SERVICE_URL}/budgets/${userId}/${budgetId}/recalculate`),

  // Category operations
  getCategories: (type) => api.get(`${BUDGET_SERVICE_URL}/categories${type ? `?type=${type}` : ''}`),
  getCategoriesByType: (type) => api.get(`${BUDGET_SERVICE_URL}/categories/type/${type}`),
  getCategoryTypes: () => api.get(`${BUDGET_SERVICE_URL}/categories/types`),

  // Budget conflict checking
  checkBudgetConflicts: (conflictData) => api.post(`${BUDGET_SERVICE_URL}/budgets/check-conflicts`, conflictData),

  // Alert operations
  getUserAlerts: (userId, page = 1, limit = 10) => api.get(`${BUDGET_SERVICE_URL}/alerts/${userId}?page=${page}&limit=${limit}`),
  getUnreadAlertCount: (userId) => api.get(`${BUDGET_SERVICE_URL}/alerts/${userId}/unread-count`),
  getAlertStats: (userId) => api.get(`${BUDGET_SERVICE_URL}/alerts/${userId}/stats`),
  markAlertAsRead: (userId, alertId) => api.put(`${BUDGET_SERVICE_URL}/alerts/${userId}/${alertId}/read`),
  markAllAlertsAsRead: (userId) => api.put(`${BUDGET_SERVICE_URL}/alerts/${userId}/mark-all-read`),
  triggerBudgetAlertCheck: (userId, budgetId) => api.post(`${BUDGET_SERVICE_URL}/alerts/${userId}/${budgetId}/check`),

  // Transaction operations for budget service
  processTransaction: (transactionData) => api.post(`${BUDGET_SERVICE_URL}/transactions`, transactionData),
  processTransactionBulk: (transactionsData) => api.post(`${BUDGET_SERVICE_URL}/transactions/bulk`, transactionsData),
  previewTransactionImpact: (transactionData) => api.post(`${BUDGET_SERVICE_URL}/transactions/preview`, transactionData),
};

export default api;
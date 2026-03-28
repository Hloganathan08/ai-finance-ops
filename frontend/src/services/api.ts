import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const register = (data: any) => api.post("/auth/register", data);
export const login = (data: any) => api.post("/auth/login", data);

// Plans
export const getPlans = () => api.get("/plans");
export const createPlan = (data: any) => api.post("/plans", data);

// Subscriptions
export const getSubscriptions = () => api.get("/subscriptions");
export const createSubscription = (plan_id: string) => api.post("/subscriptions", { plan_id });
export const cancelSubscription = (id: string) => api.delete(`/subscriptions/${id}`);

// Transactions
export const getTransactions = (limit = 50, offset = 0) =>
  api.get(`/transactions?limit=${limit}&offset=${offset}`);
export const getTransactionSummary = () => api.get("/transactions/summary");
export const refundTransaction = (transaction_id: string, reason?: string) =>
  api.post("/transactions/refund", { transaction_id, reason });

// Dashboard
export const getDashboardOverview = () => api.get("/dashboard/overview");

// AI
export const queryAI = (question: string) => api.post("/ai/query", { question });

import api from "./client";

export const fetchBalance = (userId) => api.get(`/accounts/${userId}/balance`).then((r) => r.data);
export const fetchTransactions = (userId) => api.get(`/accounts/${userId}/transactions`).then((r) => r.data);

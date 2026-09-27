import api from "./client";

export const fetchSavingsGoals = (childId) =>
  api.get("/savings-goals", { params: childId ? { childId } : {} }).then((r) => r.data);
export const createSavingsGoal = (payload) => api.post("/savings-goals", payload).then((r) => r.data);
export const updateSavingsGoal = (id, payload) => api.patch(`/savings-goals/${id}`, payload).then((r) => r.data);
export const depositToSavingsGoal = (id, amount) =>
  api.post(`/savings-goals/${id}/deposit`, { amount }).then((r) => r.data);

import api from "./client";

export const fetchMissions = (childId) =>
  api.get("/missions", { params: childId ? { childId } : {} }).then((r) => r.data);
export const createMission = (payload) => api.post("/missions", payload).then((r) => r.data);
export const updateMission = (id, payload) => api.patch(`/missions/${id}`, payload).then((r) => r.data);
export const deleteMission = (id) => api.delete(`/missions/${id}`).then((r) => r.data);
export const submitMission = (id, proofNote) => api.post(`/missions/${id}/submit`, { proofNote }).then((r) => r.data);
export const approveMission = (id, submissionId) =>
  api.post(`/missions/${id}/approve`, { submissionId }).then((r) => r.data);
export const rejectMission = (id, submissionId, reason) =>
  api.post(`/missions/${id}/reject`, { submissionId, reason }).then((r) => r.data);

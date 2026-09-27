import api from "./client";

export const fetchSchools = () => api.get("/games/schools").then((r) => r.data);
export const submitGameScore = (score, difficulty) =>
  api.post("/games/sessions", { score, difficulty }).then((r) => r.data);
export const fetchLeaderboard = (params = {}) => api.get("/games/leaderboard", { params }).then((r) => r.data);
export const fetchSchoolRanking = (params = {}) => api.get("/games/school-ranking", { params }).then((r) => r.data);

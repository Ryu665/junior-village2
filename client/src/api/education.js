import api from "./client";

export const fetchEducationSummary = () => api.get("/education/summary").then((r) => r.data);
export const fetchEducationCards = () => api.get("/education/cards").then((r) => r.data);
export const fetchTodayQuiz = () => api.get("/education/quiz/today").then((r) => r.data);
export const submitQuizAnswer = (questionId, selected) =>
  api.post("/education/quiz/answer", { questionId, selected }).then((r) => r.data);
export const fetchAttendance = (year, month) =>
  api.get("/education/attendance", { params: { year, month } }).then((r) => r.data);

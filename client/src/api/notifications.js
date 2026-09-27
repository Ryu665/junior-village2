import api from "./client";

export const fetchNotifications = () => api.get("/notifications").then((r) => r.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);

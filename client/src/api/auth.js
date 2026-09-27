import api from "./client";

export const fetchProfiles = () => api.get("/auth/profiles").then((r) => r.data);
export const pinLogin = (profileId, pin) => api.post("/auth/pin-login", { profileId, pin }).then((r) => r.data);
export const logoutApi = () => api.post("/auth/logout").then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const changePin = (currentPin, newPin) => api.patch("/auth/pin", { currentPin, newPin }).then((r) => r.data);
export const changeAvatar = (avatarEmoji) => api.patch("/auth/avatar", { avatarEmoji }).then((r) => r.data);

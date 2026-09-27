import api from "./client";

export const fetchChildren = () => api.get("/users/children").then((r) => r.data);
export const createChild = (payload) => api.post("/users/children", payload).then((r) => r.data);

/** school = { atptCode, schoolCode, name, address } — SchoolPicker에서 선택한 결과 */
export const registerMySchool = (school) => api.patch("/users/me/school", school).then((r) => r.data);
export const registerChildSchool = (childId, school) =>
  api.patch(`/users/children/${childId}/school`, school).then((r) => r.data);
export const deleteChild = (childId) => api.delete(`/users/children/${childId}`).then((r) => r.data);
export const changeChildAvatar = (childId, avatarEmoji) =>
  api.patch(`/users/children/${childId}/avatar`, { avatarEmoji }).then((r) => r.data);

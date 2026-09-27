import api from "./client";

/** 실제 존재하는 학교 검색 (나이스 교육정보 개방포털) */
export const searchSchools = (q) => api.get("/schools/search", { params: { q } }).then((r) => r.data);

/** 특정 학교(schoolId)의 날짜별(YYYYMMDD, 생략 시 오늘) 급식 정보 */
export const fetchSchoolMeal = (schoolId, date) =>
  api.get(`/schools/${schoolId}/meal`, { params: date ? { date } : {} }).then((r) => r.data);

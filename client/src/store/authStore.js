import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 인증 상태 (Zustand + localStorage persist).
 * accessToken은 만료가 짧고(15분), refreshToken은 httpOnly 쿠키에만 저장되어
 * 여기서는 다루지 않는다 (XSS로부터 조금 더 안전하게).
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null, // { id, role, name, avatarEmoji, schoolId }
      setAuth: (accessToken, user) => set({ accessToken, user }),
      updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: "junior-village-auth" }
  )
);

import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/** 로그인 필요 라우트 가드. role을 지정하면 해당 역할만 통과 (자녀는 부모 화면에, 부모는 자녀 화면에 들어갈 수 없음) */
export default function ProtectedRoute({ role, children }) {
  const { accessToken, user } = useAuthStore();
  if (!accessToken || !user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/home" replace />;
  return children;
}

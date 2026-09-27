import { useNavigate } from "react-router-dom";

/**
 * 서브 화면 공통 상단바.
 * - 왼쪽 "<-" : 바로 직전 페이지로 이동 (뒤로가기)
 * - 그 옆 "🏠 주니어빌리지" : 로그인 페이지를 제외한 가장 첫 메인 화면(Home)으로 이동
 * 설정 메뉴는 여기에 포함하지 않는다 (설정은 메인 화면에서만 진입 가능).
 */
export default function BackHeader({ title, tone = "junior" }) {
  const navigate = useNavigate();
  const toneClass =
    tone === "parent"
      ? "bg-gradient-to-r from-parent-700 via-parent-600 to-parent-500"
      : "bg-gradient-to-r from-junior-600 via-junior-500 to-junior-400";

  return (
    <header
      className={`${toneClass} text-white px-3 py-3 relative flex items-center gap-1 sticky top-0 z-10 shadow-[0_4px_16px_rgba(0,0,0,0.18)]`}
    >
      <button
        onClick={() => navigate(-1)}
        aria-label="뒤로가기"
        className="tap-target flex items-center justify-center text-2xl leading-none rounded-full hover:bg-white/15 active:bg-white/25 px-2 shrink-0"
      >
        ←
      </button>
      <button
        onClick={() => navigate("/home")}
        className="tap-target flex items-center gap-0.5 rounded-full hover:bg-white/15 active:bg-white/25 px-2 py-1 font-bold text-xs shrink-0"
      >
        <span className="text-sm">🏠</span>
        <span>주니어빌리지</span>
      </button>
      {title && (
        <h1 className="absolute left-1/2 -translate-x-1/2 max-w-[50%] font-bold text-lg text-center truncate">
          {title}
        </h1>
      )}
    </header>
  );
}

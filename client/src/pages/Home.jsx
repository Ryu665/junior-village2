import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { logoutApi } from "../api/auth";
import ParentDashboard from "./parent/ParentDashboard";
import ChildDashboard from "./child/ChildDashboard";
import mainImage from "../assets/mainimage.png";
import { IconMission, IconBell, IconFamily, IconBook, IconGame, IconPiggyBank, IconMeal, IconSettings } from "../components/common/icons";
import Avatar from "../components/common/Avatar";

// 타일 색상 그룹: 부모 전용(parent) 외에는 기능 성격별로 묶어서 한눈에 구분되게 한다.
//  - mission: 미션 + 저축목표 (돈을 모으고 쓰는 흐름)
//  - learn: 금융교육 + 게임 (배우고 노는 흐름)
//  - meal: 급식메뉴 (위 두 그룹과 무관한 정보성 메뉴라 단독 색상)
const TILE_TONES = {
  parent: { icon: "bg-gradient-to-br from-parent-400 to-parent-600", text: "text-parent-700" },
  junior: { icon: "bg-gradient-to-br from-junior-400 to-junior-600", text: "text-junior-700" },
  mission: { icon: "bg-gradient-to-br from-amber-400 to-amber-600", text: "text-amber-700" },
  learn: { icon: "bg-gradient-to-br from-violet-400 to-violet-600", text: "text-violet-700" },
  meal: { icon: "bg-gradient-to-br from-rose-400 to-rose-600", text: "text-rose-700" },
};

// 첫 화면 전용 하단 고정 메뉴 바. 항목 수(부모 4개/자녀 5개)에 맞춰 폭을 균등 분할해서
// 가로 한 줄에 전부 들어가게 한다 (항목이 적은 부모 쪽이 자연히 폭이 조금 더 넓어짐).
function BottomMenuBar({ items }) {
  const navigate = useNavigate();
  return (
    // 바깥은 뷰포트 전체 폭의 투명 레이어, 안쪽만 앱 프레임 폭(480px, .app-shell과 동일)에 맞춰
    // 중앙 정렬한다 — 데스크톱에서 앱이 가운데 카드 형태로 보일 때도 카드 폭에 맞게 보이도록.
    <nav className="fixed bottom-0 inset-x-0 z-20 pointer-events-none">
      <div className="max-w-[480px] mx-auto bg-white border-t border-gray-100 shadow-[0_-6px_20px_rgba(15,30,20,0.08)] pb-[env(safe-area-inset-bottom)] pointer-events-auto">
        <div className="flex items-stretch">
          {items.map((item) => {
            const t = TILE_TONES[item.tone] || TILE_TONES.junior;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 active:scale-95 transition-transform"
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${t.icon}`}>
                  <item.Icon width={16} height={16} />
                </span>
                <span className={`text-[11px] font-bold whitespace-nowrap ${t.text}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const PARENT_MENU = [
  { Icon: IconMission, label: "미션 관리", tone: "mission", to: "/parent/missions" },
  { Icon: IconMeal, label: "급식메뉴", tone: "meal", to: "/meal" },
  { Icon: IconBell, label: "알림함", tone: "parent", to: "/parent/notifications" },
  { Icon: IconFamily, label: "자녀 계정", tone: "parent", to: "/parent/children" },
];

const CHILD_MENU = [
  { Icon: IconMission, label: "미션", tone: "mission", to: "/child/missions" },
  { Icon: IconPiggyBank, label: "저축목표", tone: "mission", to: "/child/savings" },
  { Icon: IconMeal, label: "급식메뉴", tone: "meal", to: "/meal" },
  { Icon: IconBook, label: "금융교육", tone: "learn", to: "/child/education" },
  { Icon: IconGame, label: "게임", tone: "learn", to: "/child/game" },
];

export default function Home() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isParent = user.role === "PARENT";

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // 네트워크 오류가 있어도 클라이언트 상태는 로그아웃 처리
    }
    logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="relative">
        <img src={mainImage} alt="주니어빌리지" className="w-full h-28 object-cover" />
        <div
          className={`absolute inset-0 bg-gradient-to-r ${
            isParent ? "from-parent-900/70 via-parent-800/40 to-transparent" : "from-junior-900/60 via-junior-800/30 to-transparent"
          } flex items-center justify-between px-4`}
        >
          <div className="flex items-center gap-2 text-white">
            <Avatar value={user.avatarEmoji} className="w-9 h-9 ring-2 ring-white/50" textClassName="text-3xl" />
            <div>
              <p className="font-bold leading-tight">{user.name}님, 안녕하세요!</p>
              <p className="text-xs opacity-80">{isParent ? "부모(보호자) 계정" : "자녀(주니어) 계정"}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/settings")}
            aria-label="설정"
            className="tap-target rounded-full hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white"
          >
            <IconSettings width={22} height={22} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 pb-24">
        <h2 className="font-bold text-gray-700 mt-1">{isParent ? "우리 아이들" : "나의 현황"}</h2>
        {isParent ? <ParentDashboard /> : <ChildDashboard />}

        <button onClick={handleLogout} className="text-gray-400 text-sm font-medium py-3 mt-2 underline underline-offset-2">
          로그아웃
        </button>
      </div>

      <BottomMenuBar items={isParent ? PARENT_MENU : CHILD_MENU} />
    </div>
  );
}

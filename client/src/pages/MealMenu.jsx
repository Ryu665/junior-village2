import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackHeader from "../components/common/BackHeader";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Avatar from "../components/common/Avatar";
import { useAuthStore } from "../store/authStore";
import { fetchChildren } from "../api/users";
import { fetchSchoolMeal } from "../api/schools";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
function formatDisplay(date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
}

const MEAL_EMOJI = { 조식: "🌅", 중식: "🍚", 석식: "🌙" };

/** "630.5 Kcal" 같은 문자열에서 숫자만 뽑아낸다. 형식이 다르거나 없으면 0. */
function parseKcal(calInfo) {
  const match = String(calInfo || "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// 데스크톱 Chrome/Edge(Windows)도 navigator.share를 지원해서 OS 공유창이 뜨는데,
// 그 창에서 문자/카카오톡 등으로 못 보내면 그대로 끝나버려 "클립보드 복사"를 기대한
// 사용자 입장에선 아무 일도 안 일어난 것처럼 보인다. 터치 기기에서만 네이티브 공유를 쓰고,
// 데스크톱은 항상 클립보드 복사로 확실하게 동작하게 한다.
function isTouchDevice() {
  return navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}

/** Clipboard API가 막혀 있거나(비보안 컨텍스트 등) 없는 환경을 위한 구식 execCommand 폴백 포함 복사. */
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // 아래 폴백으로 계속
    }
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch (e) {
    return false;
  }
}

function MealBoard({ schoolId, schoolLabel, tone }) {
  const [date, setDate] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchSchoolMeal(schoolId, toYmd(date))
      .then(setData)
      .finally(() => setLoading(false));
  }, [schoolId, date]);

  const handleShare = async () => {
    const totalKcal = data.meals.reduce((sum, m) => sum + parseKcal(m.calInfo), 0);
    const lines = [
      `🍽️ ${data.schoolName || schoolLabel || "우리 학교"} 급식메뉴`,
      formatDisplay(date),
      "",
      ...data.meals.map(
        (m) => `${MEAL_EMOJI[m.mealType] || "🍽️"} ${m.mealType}${m.calInfo ? ` (${m.calInfo})` : ""}\n${m.menu.join(", ")}`
      ),
      "",
      `총 칼로리: ${totalKcal.toLocaleString("ko-KR")} Kcal`,
      "",
      `올원주니어빌리지에서 확인하기: ${window.location.origin}/`,
    ];
    const text = lines.join("\n");

    if (isTouchDevice() && navigator.share) {
      try {
        await navigator.share({ title: "급식메뉴 공유", text });
      } catch (e) {
        // 사용자가 공유를 취소한 경우 등은 무시
      }
      return;
    }

    const copied = await copyText(text);
    setShareMsg(copied ? "클립보드에 복사했어요! 문자·카카오톡에 붙여넣어 공유해보세요 📋" : "복사에 실패했어요. 화면의 메뉴를 직접 선택해 복사해주세요.");
    setTimeout(() => setShareMsg(""), 3000);
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))} className="tap-target text-xl font-bold px-2">
          ‹
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-800">{formatDisplay(date)}</p>
          {schoolLabel && <p className="text-xs text-gray-400">{schoolLabel}</p>}
        </div>
        <button onClick={() => setDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))} className="tap-target text-xl font-bold px-2">
          ›
        </button>
      </div>

      <div className="mt-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8 text-sm">불러오는 중...</p>
        ) : data?.unavailable ? (
          <p className="text-center text-gray-400 py-8 text-sm">{data.message}</p>
        ) : !data?.meals?.length ? (
          <p className="text-center text-gray-400 py-8 text-sm">{data?.message || "급식 정보가 없어요."}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {data.meals.map((m, i) => (
              <div key={i} className={`rounded-xl p-3 ${tone === "parent" ? "bg-parent-50" : "bg-junior-50"}`}>
                <p className={`font-bold text-sm mb-1.5 ${tone === "parent" ? "text-parent-700" : "text-junior-700"}`}>
                  {MEAL_EMOJI[m.mealType] || "🍽️"} {m.mealType}
                  {m.calInfo ? <span className="text-xs font-normal text-gray-400"> · {m.calInfo}</span> : null}
                </p>
                <ul className="text-sm text-gray-700 leading-relaxed list-disc list-inside">
                  {m.menu.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && data?.meals?.length > 0 && (
        <div className="mt-3">
          <Button tone={tone} className="text-sm py-2.5" onClick={handleShare}>
            📤 급식메뉴 공유하기
          </Button>
          {shareMsg && <p className="text-center text-xs text-gray-500 mt-2">{shareMsg}</p>}
        </div>
      )}
    </Card>
  );
}

export default function MealMenu() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isParent = user.role === "PARENT";
  const tone = isParent ? "parent" : "junior";

  const [children, setChildren] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    if (!isParent) return;
    fetchChildren().then((list) => {
      setChildren(list);
      const withSchool = list.filter((c) => c.schoolId);
      if (withSchool.length > 0) setSelectedChildId(withSchool[0].id);
    });
  }, [isParent]);

  return (
    <div>
      <BackHeader title="급식메뉴" tone={tone} />
      <div className="p-4 flex flex-col gap-4">
        {!isParent && !user.schoolId && (
          <Card className="text-center py-8">
            <p className="text-4xl mb-3">🏫</p>
            <p className="font-bold text-gray-700 mb-2">아직 등록된 학교가 없어요.</p>
            <p className="text-sm text-gray-400 mb-4">설정에서 내 학교를 먼저 등록하고 와주세요!</p>
            <Button tone={tone} onClick={() => navigate("/settings")}>
              학교 등록하러 가기
            </Button>
          </Card>
        )}

        {!isParent && user.schoolId && <MealBoard schoolId={user.schoolId} tone={tone} />}

        {isParent && children === null && <p className="text-center text-gray-400 py-8">불러오는 중...</p>}

        {isParent && children !== null && children.filter((c) => c.schoolId).length === 0 && (
          <Card className="text-center py-8">
            <p className="text-4xl mb-3">🏫</p>
            <p className="font-bold text-gray-700 mb-2">등록된 학교가 없어요.</p>
            <p className="text-sm text-gray-400 mb-4">자녀 계정 관리에서 자녀의 학교를 먼저 등록하고 와주세요!</p>
            <Button tone={tone} onClick={() => navigate("/parent/children")}>
              자녀 계정 관리로 가기
            </Button>
          </Card>
        )}

        {isParent && children !== null && children.filter((c) => c.schoolId).length > 0 && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {children
                .filter((c) => c.schoolId)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`tap-target flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm ${
                      selectedChildId === c.id ? "bg-parent-600 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Avatar value={c.avatarEmoji} className="w-5 h-5" textClassName="" />
                    {c.name}
                  </button>
                ))}
            </div>
            {selectedChildId && (
              <MealBoard
                schoolId={children.find((c) => c.id === selectedChildId)?.schoolId}
                schoolLabel={children.find((c) => c.id === selectedChildId)?.school}
                tone={tone}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchChildren } from "../../api/users";
import { fetchMissions } from "../../api/missions";
import Card from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [missionCounts, setMissionCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchChildren().then(async (list) => {
      setChildren(list);
      const counts = {};
      for (const c of list) {
        const missions = await fetchMissions(c.id);
        counts[c.id] = {
          active: missions.filter((m) => m.status === "ACTIVE").length,
          pending: missions.reduce((sum, m) => sum + m.submissions.filter((s) => s.status === "PENDING").length, 0),
        };
      }
      setMissionCounts(counts);
    });
  }, []);

  if (children.length === 0) {
    return (
      <Card className="text-center text-gray-400 py-8">
        아직 등록된 자녀 계정이 없어요.
        <br />
        “자녀 계정 관리”에서 자녀를 등록해보세요.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {children.map((c) => (
        <Card key={c.id} onClick={() => navigate(`/parent/missions?childId=${c.id}`)} className="border border-parent-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar value={c.avatarEmoji} className="w-11 h-11" textClassName="text-3xl" />
              <div>
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">{c.school || "소속 학교 미등록"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-parent-700">{c.balance.toLocaleString("ko-KR")}원</p>
              <p className="text-xs text-gray-400">현재 잔액</p>
            </div>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="bg-parent-50 text-parent-700 rounded-full px-3 py-1 font-semibold">
              진행중 미션 {missionCounts[c.id]?.active ?? "-"}개
            </span>
            {missionCounts[c.id]?.pending > 0 && (
              <span className="bg-amber-50 text-amber-600 rounded-full px-3 py-1 font-semibold">
                승인 대기 {missionCounts[c.id].pending}건
              </span>
            )}
            {c.currentStreak > 0 && (
              <span className="bg-junior-50 text-junior-700 rounded-full px-3 py-1 font-semibold">
                🔥 {c.currentStreak}일 연속학습
              </span>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

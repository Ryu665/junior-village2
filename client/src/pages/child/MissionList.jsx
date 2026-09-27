import { useEffect, useState } from "react";
import BackHeader from "../../components/common/BackHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import ConfettiReward from "../../components/common/ConfettiReward";
import { fetchMissions, submitMission } from "../../api/missions";
import { useAuthStore } from "../../store/authStore";

const SEEN_KEY_PREFIX = "jv_seen_approved_";

const STATUS_LABEL = {
  ACTIVE: { text: "진행 중", cls: "bg-junior-50 text-junior-700" },
  COMPLETED: { text: "완료", cls: "bg-gray-100 text-gray-500" },
};
const SUB_LABEL = {
  PENDING: { text: "승인 대기 중", cls: "bg-amber-50 text-amber-600" },
  APPROVED: { text: "승인 완료", cls: "bg-junior-50 text-junior-700" },
  REJECTED: { text: "반려됨", cls: "bg-red-50 text-red-500" },
};

export default function MissionList() {
  const user = useAuthStore((s) => s.user);
  const [missions, setMissions] = useState([]);
  const [note, setNote] = useState({});
  const [reward, setReward] = useState(null);

  const seenKey = SEEN_KEY_PREFIX + user.id;

  const load = async () => {
    const list = await fetchMissions();
    setMissions(list);

    const seen = new Set(JSON.parse(localStorage.getItem(seenKey) || "[]"));
    const newlyApproved = [];
    for (const m of list) {
      for (const s of m.submissions) {
        if (s.status === "APPROVED" && !seen.has(s.id)) {
          newlyApproved.push({ mission: m, submission: s });
          seen.add(s.id);
        }
      }
    }
    if (newlyApproved.length > 0) {
      setReward(newlyApproved[0].mission);
      localStorage.setItem(seenKey, JSON.stringify([...seen]));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (missionId) => {
    await submitMission(missionId, note[missionId] || "");
    setNote((n) => ({ ...n, [missionId]: "" }));
    load();
  };

  return (
    <div>
      <BackHeader title="나의 미션" tone="junior" />
      <div className="p-4 flex flex-col gap-3">
        {missions.length === 0 && <p className="text-center text-gray-400 py-8">아직 받은 미션이 없어요.</p>}
        {missions.map((m) => {
          const latest = m.submissions[0];
          const canSubmit = m.status === "ACTIVE" && (!latest || latest.status === "REJECTED");
          return (
            <Card key={m.id}>
              <div className="flex justify-between items-start mb-1">
                <p className="font-bold text-gray-800">{m.title}</p>
                <span className={`text-xs rounded-full px-2 py-1 font-semibold ${STATUS_LABEL[m.status]?.cls}`}>
                  {STATUS_LABEL[m.status]?.text}
                </span>
              </div>
              {m.description && <p className="text-sm text-gray-500 mb-2">{m.description}</p>}
              <p className="text-junior-700 font-extrabold mb-2">+{m.rewardAmount.toLocaleString("ko-KR")}원</p>

              {latest && (
                <span className={`inline-block text-xs rounded-full px-2 py-1 font-semibold mb-2 ${SUB_LABEL[latest.status]?.cls}`}>
                  {SUB_LABEL[latest.status]?.text}
                </span>
              )}

              {canSubmit && (
                <div className="flex flex-col gap-2 mt-1">
                  <input
                    placeholder="완료 인증 메모(선택)"
                    value={note[m.id] || ""}
                    onChange={(e) => setNote((n) => ({ ...n, [m.id]: e.target.value }))}
                    className="tap-target border-2 border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                  <Button tone="junior" onClick={() => handleSubmit(m.id)}>
                    미션 완료했어요!
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {reward && (
        <ConfettiReward
          emoji="🎉"
          title="미션 완료! 용돈이 도착했어요"
          subtitle={`"${reward.title}" +${reward.rewardAmount.toLocaleString("ko-KR")}원`}
          onClose={() => setReward(null)}
        />
      )}
    </div>
  );
}

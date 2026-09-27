import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BackHeader from "../../components/common/BackHeader";
import Card from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import ConfettiReward from "../../components/common/ConfettiReward";
import { fetchChildren } from "../../api/users";
import { fetchMissions, createMission, approveMission, rejectMission, deleteMission } from "../../api/missions";

const REPEAT_LABEL = { ONCE: "1회", DAILY: "매일", WEEKLY: "매주" };

export default function MissionManage() {
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(searchParams.get("childId") || "");
  const [missions, setMissions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", rewardAmount: 1000, dueDate: "", repeat: "ONCE" });
  const [reward, setReward] = useState(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchChildren().then((list) => {
      setChildren(list);
      if (!childId && list[0]) setChildId(list[0].id);
    });
  }, []);

  const load = () => {
    if (!childId) return;
    fetchMissions(childId).then(setMissions);
  };
  useEffect(load, [childId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMission({ ...form, childId, rewardAmount: Number(form.rewardAmount) });
    setForm({ title: "", description: "", rewardAmount: 1000, dueDate: "", repeat: "ONCE" });
    setShowForm(false);
    load();
  };

  const handleApprove = async (mission, submissionId) => {
    await approveMission(mission.id, submissionId);
    setReward({ amount: mission.rewardAmount, childName: children.find((c) => c.id === childId)?.name });
    load();
  };
  const handleReject = async (mission, submissionId) => {
    await rejectMission(mission.id, submissionId);
    load();
  };

  const handleDelete = async (missionId) => {
    setDeletingId(missionId);
    try {
      await deleteMission(missionId);
      setConfirmDeleteFor(null);
      load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <BackHeader title="미션 관리" tone="parent" />
      <div className="p-4 flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setChildId(c.id)}
              className={`tap-target flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm ${
                childId === c.id ? "bg-parent-600 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              <Avatar value={c.avatarEmoji} className="w-5 h-5" textClassName="" />
              {c.name}
            </button>
          ))}
        </div>

        <Button tone="parent" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "닫기" : "+ 새 미션 만들기"}
        </Button>

        {showForm && (
          <Card>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                required
                placeholder="미션 제목"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3"
              />
              <textarea
                placeholder="설명(선택)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border-2 border-gray-200 rounded-xl px-3 py-3"
                rows={2}
              />
              <div className="flex gap-2">
                <input
                  required
                  type="number"
                  min={100}
                  step={100}
                  placeholder="보상 금액"
                  value={form.rewardAmount}
                  onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
                  className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 flex-1"
                />
                <select
                  value={form.repeat}
                  onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                  className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3"
                >
                  <option value="ONCE">1회</option>
                  <option value="DAILY">매일</option>
                  <option value="WEEKLY">매주</option>
                </select>
              </div>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3"
              />
              <Button tone="parent" type="submit">
                미션 생성
              </Button>
            </form>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {missions.map((m) => {
            const pending = m.submissions.find((s) => s.status === "PENDING");
            return (
              <Card key={m.id}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-bold text-gray-800">{m.title}</p>
                    {m.description && <p className="text-sm text-gray-500">{m.description}</p>}
                  </div>
                  <span className="text-xs bg-parent-50 text-parent-700 rounded-full px-2 py-1 font-semibold whitespace-nowrap">
                    {REPEAT_LABEL[m.repeat]}
                  </span>
                </div>
                <p className="text-parent-700 font-extrabold mb-2">+{m.rewardAmount.toLocaleString("ko-KR")}원</p>
                {pending ? (
                  <div className="flex gap-2">
                    <Button tone="parent" onClick={() => handleApprove(m, pending.id)}>
                      승인 & 이체
                    </Button>
                    <Button tone="outline" onClick={() => handleReject(m, pending.id)}>
                      반려
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-2">
                    {m.status === "COMPLETED" ? "완료된 미션이에요." : "자녀의 완료 제출을 기다리고 있어요."}
                  </p>
                )}

                {confirmDeleteFor === m.id ? (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-red-500 font-medium mb-2">
                      "{m.title}" 미션을 삭제할까요? 제출 내역도 함께 삭제되고 되돌릴 수 없어요.
                      (이미 지급된 용돈은 그대로 유지돼요.)
                    </p>
                    <div className="flex gap-2">
                      <Button tone="outline" className="text-sm" onClick={() => setConfirmDeleteFor(null)}>
                        취소
                      </Button>
                      <Button
                        tone="danger"
                        className="text-sm"
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id)}
                      >
                        삭제하기
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteFor(m.id)}
                    className="text-xs font-bold text-red-500 bg-red-50 rounded-full px-3 py-1.5"
                  >
                    🗑️ 미션 삭제
                  </button>
                )}
              </Card>
            );
          })}
          {missions.length === 0 && <p className="text-center text-gray-400 py-8">등록된 미션이 없어요.</p>}
        </div>
      </div>

      {reward && (
        <ConfettiReward
          emoji="🎉"
          title={`${reward.childName}에게\n${reward.amount.toLocaleString("ko-KR")}원을 보냈어요!`}
          subtitle="미션 완료 리워드가 즉시 이체됐어요."
          onClose={() => setReward(null)}
        />
      )}
    </div>
  );
}

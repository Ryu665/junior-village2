import { useEffect, useState } from "react";
import BackHeader from "../../components/common/BackHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import EmojiPicker from "../../components/common/EmojiPicker";
import BalanceCard from "../../components/common/BalanceCard";
import ConfettiReward from "../../components/common/ConfettiReward";
import { fetchSavingsGoals, createSavingsGoal, depositToSavingsGoal } from "../../api/savingsGoals";
import { fetchBalance } from "../../api/accounts";
import { useAuthStore } from "../../store/authStore";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDot(dateStr) {
  return dateStr ? dateStr.replaceAll("-", ".") : "";
}

/** 숫자만 남기고 1,000단위 콤마를 넣어 보여준다 (내부 저장값은 콤마 없는 순수 숫자 문자열). */
function formatThousands(v) {
  const digits = String(v ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

export default function SavingsGoalPage() {
  const user = useAuthStore((s) => s.user);
  const [goals, setGoals] = useState([]);
  const [balance, setBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", targetAmount: 50000, emoji: "🎯", startDate: todayStr(), targetDate: "" });
  const [depositAmounts, setDepositAmounts] = useState({});
  const [depositError, setDepositError] = useState({});
  const [reward, setReward] = useState(null);

  const load = () => {
    fetchSavingsGoals().then(setGoals);
    fetchBalance(user.id).then((d) => setBalance(d.balance));
  };
  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createSavingsGoal({ ...form, targetAmount: Number(form.targetAmount), targetDate: form.targetDate || null });
    setForm({ title: "", targetAmount: 50000, emoji: "🎯", startDate: todayStr(), targetDate: "" });
    setShowForm(false);
    load();
  };

  const handleDeposit = async (goal) => {
    const amount = Number(depositAmounts[goal.id]);
    setDepositError((e) => ({ ...e, [goal.id]: "" }));
    if (!amount || amount <= 0) {
      setDepositError((e) => ({ ...e, [goal.id]: "저금할 금액을 입력해주세요." }));
      return;
    }
    if (amount > balance) {
      setDepositError((e) => ({ ...e, [goal.id]: "잔액이 부족해요." }));
      return;
    }
    try {
      const res = await depositToSavingsGoal(goal.id, amount);
      setBalance(res.balance);
      setDepositAmounts((d) => ({ ...d, [goal.id]: "" }));
      const pct = Math.min(100, Math.round((res.goal.currentAmount / res.goal.targetAmount) * 100));
      setReward({ title: goal.title, emoji: goal.emoji, amount, pct, achieved: res.goal.currentAmount >= res.goal.targetAmount });
      load();
    } catch (e2) {
      setDepositError((e) => ({ ...e, [goal.id]: e2.response?.data?.error || "저금에 실패했어요." }));
    }
  };

  return (
    <div>
      <BackHeader title="저축 목표" tone="junior" />
      <div className="p-4 flex flex-col gap-3">
        <BalanceCard balance={balance} size="sm" />

        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          return (
            <Card key={g.id}>
              <p className="font-bold text-gray-800 text-sm mb-1.5">
                {g.emoji || "🎯"} {g.title}
              </p>
              {(g.startDate || g.targetDate) && (
                <p className="text-xs text-gray-400 mb-2">
                  {g.startDate ? `🗓 ${formatDot(g.startDate)} 시작` : ""}
                  {g.targetDate ? ` · ${formatDot(g.targetDate)}까지 목표` : ""}
                </p>
              )}
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-junior-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {g.currentAmount.toLocaleString("ko-KR")}원 / {g.targetAmount.toLocaleString("ko-KR")}원 ({pct}%)
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="저금할 금액"
                  value={formatThousands(depositAmounts[g.id])}
                  onChange={(e) =>
                    setDepositAmounts((d) => ({ ...d, [g.id]: e.target.value.replace(/\D/g, "") }))
                  }
                  className="tap-target flex-[2] min-w-0 border-2 border-gray-200 rounded-xl px-3 py-2 text-base"
                />
                <Button
                  tone="outline"
                  className="flex-1 min-w-0 text-xs px-1 py-2 bg-white text-black"
                  onClick={() => handleDeposit(g)}
                >
                  + 저금
                </Button>
              </div>
              {depositError[g.id] && <p className="text-red-500 text-xs mt-1">{depositError[g.id]}</p>}
            </Card>
          );
        })}
        {goals.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">아직 저축 목표가 없어요.</p>}

        <Button tone="junior" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "닫기" : "+ 새 저축 목표 만들기"}
        </Button>

        {showForm && (
          <Card>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <p className="text-sm font-medium text-gray-600">목표 이모지</p>
              <EmojiPicker value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e })} mode="goal" />

              <input
                required
                placeholder="목표 이름 (예: 자전거 사기)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 text-sm"
              />
              <input
                required
                type="number"
                min={1000}
                step={1000}
                placeholder="목표 금액"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                className="tap-target border-2 border-gray-200 rounded-xl px-3 py-3 text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">저축 시작일</p>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="tap-target w-full border-2 border-gray-200 rounded-xl px-2 py-3 text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">목표 완료일 (선택)</p>
                  <input
                    type="date"
                    value={form.targetDate}
                    min={form.startDate}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                    className="tap-target w-full border-2 border-gray-200 rounded-xl px-2 py-3 text-sm"
                  />
                </div>
              </div>

              <Button tone="junior" type="submit">
                목표 만들기
              </Button>
            </form>
          </Card>
        )}
      </div>

      {reward && (
        <ConfettiReward
          emoji={reward.achieved ? "🏆" : reward.emoji || "🐷"}
          title={reward.achieved ? `목표 달성!\n"${reward.title}"` : `${reward.amount.toLocaleString("ko-KR")}원 저금했어요!`}
          subtitle={reward.achieved ? "축하해요! 목표 금액을 모두 모았어요 🎉" : `현재 달성률 ${reward.pct}%`}
          onClose={() => setReward(null)}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { fetchBalance, fetchTransactions } from "../../api/accounts";
import { fetchMissions } from "../../api/missions";
import { fetchSavingsGoals } from "../../api/savingsGoals";
import Card from "../../components/common/Card";
import BalanceCard from "../../components/common/BalanceCard";

export default function ChildDashboard() {
  const user = useAuthStore((s) => s.user);
  const [balance, setBalance] = useState(0);
  const [missions, setMissions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recentTx, setRecentTx] = useState([]);

  useEffect(() => {
    fetchBalance(user.id).then((d) => setBalance(d.balance));
    fetchMissions().then((list) => setMissions(list.filter((m) => m.status === "ACTIVE")));
    fetchSavingsGoals(user.id).then(setGoals);
    fetchTransactions(user.id).then((list) => setRecentTx(list.slice(0, 5)));
  }, [user.id]);

  return (
    <div className="flex flex-col gap-3">
      <BalanceCard balance={balance} />

      <Card>
        <p className="font-bold text-gray-700 mb-2">📋 오늘의 미션</p>
        {missions.length === 0 ? (
          <p className="text-gray-400 text-sm">지금은 진행 중인 미션이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {missions.slice(0, 3).map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm bg-junior-50 rounded-xl px-3 py-2">
                <span className="font-medium text-gray-700">{m.title}</span>
                <span className="font-bold text-junior-700">+{m.rewardAmount.toLocaleString("ko-KR")}원</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <p className="font-bold text-gray-700 mb-2">🎯 저축 목표</p>
        {goals.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 설정한 저축 목표가 없어요.</p>
        ) : (
          goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div key={g.id} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {g.emoji || "🎯"} {g.title}
                  </span>
                  <span className="text-gray-500">{pct}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-junior-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {g.currentAmount.toLocaleString("ko-KR")}원 / {g.targetAmount.toLocaleString("ko-KR")}원
                </p>
              </div>
            );
          })
        )}
      </Card>

      <Card>
        <p className="font-bold text-gray-700 mb-2">💌 최근 받은 용돈</p>
        {recentTx.length === 0 ? (
          <p className="text-gray-400 text-sm">아직 받은 용돈이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentTx.map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t.memo || t.type}</span>
                <span className={`font-bold ${t.toUserId === user.id ? "text-junior-600" : "text-gray-400"}`}>
                  {t.toUserId === user.id ? "+" : "-"}
                  {t.amount.toLocaleString("ko-KR")}원
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

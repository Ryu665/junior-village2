import { useEffect, useState } from "react";
import BackHeader from "../../components/common/BackHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { fetchNotifications, markNotificationRead } from "../../api/notifications";
import { approveMission, rejectMission } from "../../api/missions";

const TYPE_EMOJI = {
  MISSION_SUBMITTED: "📮",
  MISSION_APPROVED: "🎉",
  MISSION_REJECTED: "↩️",
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return `${Math.floor(hr / 24)}일 전`;
}

export default function NotificationInbox() {
  const [notifications, setNotifications] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [resultMsg, setResultMsg] = useState("");

  const load = () => fetchNotifications().then(setNotifications);
  useEffect(() => {
    load();
  }, []);

  const markRead = async (n) => {
    if (!n.isRead) await markNotificationRead(n.id);
  };

  // 미션 제출 알림은 여기서 바로 승인/반려할 수 있다 (relatedId = submissionId, missionId 함께 저장됨)
  const handleApprove = async (n) => {
    setBusyId(n.id);
    try {
      await approveMission(n.missionId, n.relatedId);
      setResultMsg("승인하고 용돈을 보냈어요! 🎉");
      await markRead(n);
      load();
    } catch (e) {
      setResultMsg(e.response?.data?.error || "승인에 실패했어요.");
    } finally {
      setBusyId(null);
      setTimeout(() => setResultMsg(""), 2500);
    }
  };

  const handleReject = async (n) => {
    setBusyId(n.id);
    try {
      await rejectMission(n.missionId, n.relatedId);
      setResultMsg("반려했어요.");
      await markRead(n);
      load();
    } catch (e) {
      setResultMsg(e.response?.data?.error || "반려에 실패했어요.");
    } finally {
      setBusyId(null);
      setTimeout(() => setResultMsg(""), 2500);
    }
  };

  return (
    <div>
      <BackHeader title="알림함" tone="parent" />
      <div className="p-4 flex flex-col gap-2">
        {resultMsg && <p className="text-center text-sm font-bold text-parent-600 mb-1">{resultMsg}</p>}
        {notifications.length === 0 && <p className="text-center text-gray-400 py-8">아직 알림이 없어요.</p>}
        {notifications.map((n) => {
          const actionable = n.type === "MISSION_SUBMITTED" && n.missionId && n.relatedId;
          return (
            <Card key={n.id} className={n.isRead ? "opacity-60" : "border border-parent-200"}>
              <div className="flex items-start gap-3" onClick={() => !actionable && markRead(n).then(load)}>
                <span className="text-2xl">{TYPE_EMOJI[n.type] || "🔔"}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-parent-500 mt-1" />}
              </div>
              {actionable && (
                <div className="flex gap-2 mt-3">
                  <Button
                    tone="parent"
                    className="text-sm py-2.5"
                    disabled={busyId === n.id}
                    onClick={() => handleApprove(n)}
                  >
                    승인 & 용돈 보내기
                  </Button>
                  <Button
                    tone="outline"
                    className="text-sm py-2.5"
                    disabled={busyId === n.id}
                    onClick={() => handleReject(n)}
                  >
                    반려
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

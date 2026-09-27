import { useEffect, useState } from "react";
import BackHeader from "../../../components/common/BackHeader";
import Card from "../../../components/common/Card";
import { fetchAttendance } from "../../../api/education";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

export default function AttendanceCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAttendance(year, month).then(setData);
  }, [year, month]);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  };

  const attendedDates = new Set((data?.attendance || []).map((a) => a.date));
  const daysInMonth = data?.daysInMonth || new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <BackHeader title="매달의 출석현황" tone="junior" />
      <div className="p-4 flex flex-col gap-4">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => changeMonth(-1)} className="tap-target text-xl font-bold px-3">
              ‹
            </button>
            <p className="font-bold text-lg text-gray-800">
              {year}년 {month}월
            </p>
            <button onClick={() => changeMonth(1)} className="tap-target text-xl font-bold px-3">
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-2">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {cells.map((d, i) => {
              if (d === null) return <span key={`empty-${i}`} />;
              const dateStr = `${year}-${pad2(month)}-${pad2(d)}`;
              const attended = attendedDates.has(dateStr);
              return (
                <div key={dateStr} className="flex flex-col items-center gap-0.5">
                  <span className="text-sm text-gray-600">{d}</span>
                  <span className="text-base">{attended ? "🔥" : ""}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <p className="text-center text-xs text-gray-400">
          🔥 표시는 그날 오늘의 퀴즈 3문제를 모두 완료했다는 뜻이에요.
        </p>
      </div>
    </div>
  );
}

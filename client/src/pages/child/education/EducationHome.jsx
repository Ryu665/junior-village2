import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackHeader from "../../../components/common/BackHeader";
import Card from "../../../components/common/Card";
import { fetchEducationSummary } from "../../../api/education";

export default function EducationHome() {
  const [summary, setSummary] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEducationSummary().then(setSummary);
  }, []);

  return (
    <div>
      <BackHeader title="금융교육" tone="junior" />
      <div className="p-4 flex flex-col gap-4">
        <Card className="bg-gradient-to-br from-junior-500 to-junior-700 text-white text-center py-6">
          {summary ? (
            <>
              <p className="text-4xl mb-1">{summary.levelEmoji || "🙂"}</p>
              <p className="font-extrabold text-xl mb-2">{summary.levelName}</p>
              <p className="text-sm opacity-90">🔥 {summary.currentStreak}일 연속학습 중</p>
              <p className="text-sm opacity-90">오늘의 퀴즈 {summary.todayQuizProgress}</p>
              <p className="text-sm opacity-90 font-bold mt-1">보유 포인트 {summary.totalPoints}P</p>
              {summary.todayQuizCompleted && (
                <p className="text-xs bg-white/20 rounded-full inline-block px-3 py-1 mt-2">
                  🎉 오늘의 퀴즈는 모두 풀었어요! (+{summary.todayRewardPoint}P)
                </p>
              )}
            </>
          ) : (
            <p>불러오는 중...</p>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <Card onClick={() => navigate("/child/education/learn")} className="flex items-center gap-3">
            <span className="text-3xl">📖</span>
            <div>
              <p className="font-bold text-gray-800">배움 콘텐츠</p>
              <p className="text-xs text-gray-400">돈과 은행에 대해 재미있게 배워요</p>
            </div>
          </Card>
          <Card onClick={() => navigate("/child/education/quiz")} className="flex items-center gap-3">
            <span className="text-3xl">❓</span>
            <div>
              <p className="font-bold text-gray-800">오늘의 퀴즈</p>
              <p className="text-xs text-gray-400">하루 3문제, 다 풀면 포인트 획득!</p>
            </div>
          </Card>
          <Card onClick={() => navigate("/child/education/attendance")} className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <p className="font-bold text-gray-800">매달의 출석현황</p>
              <p className="text-xs text-gray-400">이번 달 학습 기록을 확인해요</p>
            </div>
          </Card>
          <Card onClick={() => window.open( "https://youthedu.nonghyup.com/Intro/Location.jsp", "_blank", "noopener,noreferrer" ) } className="flex items-center gap-3" > <span className="text-3xl">🏦</span> <div> <p className="font-bold text-gray-800">NH 청소년 금융교육센터</p> <p className="text-xs text-gray-400">금융교육센터 오시는 길을 확인해요!</p> </div> </Card>
        </div>
      </div>
    </div>
  );
}

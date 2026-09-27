import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackHeader from "../../../components/common/BackHeader";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import ConfettiReward from "../../../components/common/ConfettiReward";
import { fetchTodayQuiz, submitQuizAnswer } from "../../../api/education";

function Stars({ difficulty }) {
  return (
    <span className="text-amber-400 tracking-wider">
      {"★".repeat(difficulty)}
      {"☆".repeat(3 - difficulty)}
    </span>
  );
}

export default function TodayQuiz() {
  const [quiz, setQuiz] = useState(null);
  const [feedback, setFeedback] = useState(null); // { question, justCompleted, streakResult }
  const [showHint, setShowHint] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const navigate = useNavigate();

  const load = () => fetchTodayQuiz().then(setQuiz);
  useEffect(() => {
    load();
  }, []);

  const currentQuestion = feedback ? feedback.question : quiz?.questions.find((q) => !q.answered);

  const handleSelect = async (selected) => {
    if (!currentQuestion) return;
    const res = await submitQuizAnswer(currentQuestion.id, selected);
    setQuiz(res);
    const answeredQ = res.questions.find((x) => x.id === currentQuestion.id);
    setFeedback({ question: answeredQ, justCompleted: res.justCompleted, streakResult: res.streakResult });
    setShowHint(false);
  };

  const handleContinue = () => {
    if (feedback?.justCompleted) setCelebration(feedback.streakResult);
    setFeedback(null);
  };

  if (!quiz) {
    return (
      <div>
        <BackHeader title="오늘의 퀴즈" tone="junior" />
        <p className="text-center text-gray-400 py-16">불러오는 중...</p>
      </div>
    );
  }

  const showCompletedSummary = quiz.completed && !feedback;

  return (
    <div>
      <BackHeader title="오늘의 퀴즈" tone="junior" />
      <div className="p-4 flex flex-col gap-4">
        <p className="text-center font-bold text-gray-500">진행 상황 {quiz.progress}</p>

        {showCompletedSummary ? (
          <Card className="text-center py-8">
            <p className="text-5xl mb-3">🎉</p>
            <p className="font-extrabold text-lg text-gray-800 mb-1">오늘의 퀴즈는 모두 풀었어요!</p>
            <p className="text-gray-500 mb-4">
              {quiz.totalCorrect}개 정답! +{quiz.rewardPoint}P
            </p>
            <Button tone="junior" onClick={() => navigate("/child/education")}>
              금융교육으로 돌아가기
            </Button>
          </Card>
        ) : feedback ? (
          <Card>
            <div className="flex justify-between items-center mb-2">
              <Stars difficulty={feedback.question.difficulty} />
            </div>
            <p className="font-bold text-gray-800 mb-3 whitespace-pre-line">{feedback.question.question}</p>
            <div className="flex flex-col gap-2 mb-3">
              {feedback.question.options.map((opt) => {
                const isCorrect = opt === feedback.question.answer;
                const isSelected = opt === feedback.question.selected;
                return (
                  <div
                    key={opt}
                    className={`rounded-2xl py-3 px-4 font-bold text-center border-2 ${
                      isCorrect
                        ? "bg-junior-500 border-junior-500 text-white"
                        : isSelected
                        ? "bg-red-50 border-red-300 text-red-500"
                        : "border-gray-100 text-gray-400"
                    }`}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
            <p className={`font-bold mb-1 ${feedback.question.correct ? "text-junior-600" : "text-red-500"}`}>
              {feedback.question.correct ? "정답이에요! 👏" : "아쉬워요!"}
            </p>
            <p className="text-sm text-gray-500 mb-4">{feedback.question.explanation}</p>
            <Button tone="junior" onClick={handleContinue}>
              {quiz.progress === "3/3" || feedback.justCompleted ? "결과 보기" : "다음 문제"}
            </Button>
          </Card>
        ) : currentQuestion ? (
          <Card>
            <div className="flex justify-between items-center mb-3">
              <Stars difficulty={currentQuestion.difficulty} />
              {currentQuestion.difficulty >= 2 && currentQuestion.hint && (
                <button
                  onClick={() => setShowHint((v) => !v)}
                  className="text-xs bg-amber-50 text-amber-600 font-bold rounded-full px-3 py-1"
                >
                  💡 힌트
                </button>
              )}
            </div>
            <p className="font-bold text-gray-800 mb-4 whitespace-pre-line text-lg text-center">{currentQuestion.question}</p>
            {showHint && <p className="text-sm bg-amber-50 text-amber-700 rounded-xl p-3 mb-4">💡 {currentQuestion.hint}</p>}

            {currentQuestion.type === "OX" ? (
              <div className="flex gap-3">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className="btn-big flex-1 bg-gray-50 hover:bg-junior-50 border-2 border-gray-100 hover:border-junior-300 text-3xl"
                  >
                    {opt === "O" ? "⭕" : "❌"}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className="tap-target rounded-2xl py-3 font-bold text-base border-2 border-gray-100 hover:border-junior-300 hover:bg-junior-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </Card>
        ) : null}
      </div>

      {celebration && (
        <ConfettiReward
          emoji={celebration.treasure ? "🎁" : celebration.levelEmoji || "🎉"}
          title={
            celebration.treasure
              ? `${celebration.totalCorrect}개 정답! +${celebration.rewardPoint}P\n🎁 보물상자 발견! +${celebration.treasure.point}P`
              : `${celebration.totalCorrect}개 정답! +${celebration.rewardPoint}P\n🔥 ${celebration.currentStreak}일 연속학습 달성!`
          }
          subtitle={`${celebration.levelEmoji} ${celebration.levelName} · 총 ${celebration.totalPoints}P`}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  );
}

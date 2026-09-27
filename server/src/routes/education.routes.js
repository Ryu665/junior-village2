const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const streakService = require("../services/streakService");
const educationCards = require("../data/educationCards.json");
const { daysInMonth } = require("../utils/kstDate");

const router = express.Router();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 금융교육 메인 화면 요약 (레벨/스트릭/오늘 퀴즈 진행상태/포인트)
router.get(
  "/summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const summary = await streakService.getSummary(req.user.id);
    res.json(summary);
  })
);

// 배움 콘텐츠: 5~10개 랜덤 제공 (열람만으로는 출석/연속학습에 영향 없음)
router.get(
  "/cards",
  requireAuth,
  asyncHandler(async (req, res) => {
    const count = Math.min(educationCards.length, Math.max(5, Math.min(10, educationCards.length)));
    const cards = shuffle(educationCards).slice(0, count);
    res.json(cards);
  })
);

// 오늘의 퀴즈 3문제 조회 (없으면 서버가 생성해 DB에 저장, 이후 새로고침해도 동일)
router.get(
  "/quiz/today",
  requireAuth,
  asyncHandler(async (req, res) => {
    const dailyQuiz = await streakService.getOrCreateTodayQuiz(req.user.id);
    res.json(streakService.buildQuizView(dailyQuiz));
  })
);

// 퀴즈 답안 제출 (idempotent). 3/3 완료 시점에만 출석/연속학습/레벨/포인트/보물상자가 갱신된다.
router.post(
  "/quiz/answer",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { questionId, selected } = req.body;
    if (!questionId || !selected) {
      return res.status(400).json({ error: "questionId, selected가 필요합니다." });
    }
    const result = await streakService.submitAnswer(req.user.id, questionId, selected);
    res.json({
      ...streakService.buildQuizView(result.dailyQuiz),
      justCompleted: result.justCompleted,
      streakResult: result.streakResult || null,
    });
  })
);

// 매달의 출석현황 캘린더
router.get(
  "/attendance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const attendance = await streakService.getAttendanceCalendar(req.user.id, year, month);
    res.json({ year, month, daysInMonth: daysInMonth(year, month), attendance });
  })
);

module.exports = router;

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

router.get(
  "/schools",
  requireAuth,
  asyncHandler(async (req, res) => {
    const schools = await prisma.school.findMany({ orderBy: { name: "asc" } });
    res.json(schools);
  })
);

// (학교 등록은 /api/users/me/school, /api/users/children/:id/school 로 일원화됨 — school.routes.js 검색 API와 함께 사용)

// 자녀: "심부름 지폐 계산" 챌린지(레벨 1~3) 점수 기록 -> 학교별/개인 랭킹에 반영
router.post(
  "/sessions",
  requireAuth,
  requireRole("CHILD"),
  asyncHandler(async (req, res) => {
    const { score, difficulty } = req.body;
    if (typeof score !== "number" || score < 0) {
      return res.status(400).json({ error: "score는 0 이상의 숫자여야 합니다." });
    }
    const level = [1, 2, 3].includes(Number(difficulty)) ? Number(difficulty) : 1;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const session = await prisma.gameSession.create({
      data: { userId: req.user.id, schoolId: user.schoolId, score, difficulty: level },
    });
    res.status(201).json(session);
  })
);

function bestSessionsByUser(sessions) {
  const bestByUser = new Map();
  for (const s of sessions) {
    const prev = bestByUser.get(s.userId);
    if (!prev || s.score > prev.score) bestByUser.set(s.userId, s);
  }
  return [...bestByUser.values()];
}

// 개인 랭킹: 각 사용자의 최고 점수를 기준으로 정렬 (선택적으로 학교/난이도 필터)
router.get(
  "/leaderboard",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { schoolId, difficulty } = req.query;
    const where = {
      ...(schoolId ? { schoolId } : {}),
      ...(difficulty ? { difficulty: Number(difficulty) } : {}),
    };
    const sessions = await prisma.gameSession.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarEmoji: true } }, school: true },
    });
    const ranking = bestSessionsByUser(sessions)
      .sort((a, b) => b.score - a.score)
      .map((s, idx) => ({
        rank: idx + 1,
        userId: s.userId,
        name: s.user.name,
        avatarEmoji: s.user.avatarEmoji,
        school: s.school?.name || null,
        score: s.score,
        difficulty: s.difficulty,
      }));
    res.json(ranking);
  })
);

// 학교 랭킹: 학교별로 "학생별 최고기록 중 상위 3명 평균"을 학교 점수로 집계 (선택적으로 난이도 필터)
router.get(
  "/school-ranking",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { difficulty } = req.query;
    const where = difficulty ? { difficulty: Number(difficulty) } : {};
    const sessions = await prisma.gameSession.findMany({
      where,
      include: { school: true },
    });
    const best = bestSessionsByUser(sessions).filter((s) => s.school);

    const groups = new Map();
    for (const s of best) {
      const key = s.school.name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s.score);
    }

    const ranking = [...groups.entries()]
      .map(([school, scores]) => {
        const top3 = [...scores].sort((a, b) => b - a).slice(0, 3);
        const avg = Math.round(top3.reduce((a, b) => a + b, 0) / top3.length);
        return { school, players: scores.length, score: avg };
      })
      .sort((a, b) => b.score - a.score)
      .map((row, idx) => ({ rank: idx + 1, ...row }));

    res.json(ranking);
  })
);

module.exports = router;

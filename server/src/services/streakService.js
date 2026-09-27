/**
 * streakService
 * ---------------------------------------------------------------------------
 * 금융교육 "오늘의 퀴즈 / 연속학습(streak) / 레벨 / 포인트 / 보물상자" 의
 * 모든 판정과 계산을 서버에서만 수행하는 핵심 모듈 (prompt20260913.txt 3-4 섹션 전체 구현).
 *
 * 프론트엔드는 이 모듈이 계산한 결과를 "표시"만 한다. 절대 클라이언트에서
 * streak+1 같은 계산을 하지 않는다.
 *
 * 멱등성(idempotent) 보장:
 *   - 하루(userId, date) 당 DailyQuiz row는 유일(@@unique([userId, date])).
 *   - completed=true 인 이후에는 동일 요청이 몇 번 오더라도 상태가 바뀌지 않는다.
 *   - 이미 답한 문제(questionId)에 대한 재요청도 무시된다(최초 응답 유지).
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { todayKst, diffInDays } = require("../utils/kstDate");
const quizBank = require("../data/quizBank.json");

const quizById = new Map(quizBank.map((q) => [q.id, q]));

// ---------------------------------------------------------------------------
// 레벨 시스템 (3-4-14)
// ---------------------------------------------------------------------------
const LEVELS = [
  { level: 0, min: 0, max: 0, name: "무등급", emoji: "" },
  { level: 1, min: 1, max: 9, name: "금융새싹", emoji: "🌱" },
  { level: 2, min: 10, max: 29, name: "저축초보", emoji: "💰" },
  { level: 3, min: 30, max: 49, name: "알뜰소비자", emoji: "🛒" },
  { level: 4, min: 50, max: Infinity, name: "금융박사", emoji: "🎓" },
];

function levelFromStreak(streak) {
  return LEVELS.find((l) => streak >= l.min && streak <= l.max) || LEVELS[0];
}

// ---------------------------------------------------------------------------
// 퀴즈 포인트 (3-4-7)
// ---------------------------------------------------------------------------
const QUIZ_POINTS_BY_CORRECT = { 3: 50, 2: 20, 1: 10, 0: 1 };

// ---------------------------------------------------------------------------
// 보물상자 (3-4-17 ~ 3-4-19)
// ---------------------------------------------------------------------------
const TREASURE_MIN_STREAK = 3;
const TREASURE_MIN_GAP_DAYS = 3;
const TREASURE_MAX_GAP_DAYS = 6; // "3~4일 이상" 요구를 만족하며 매번 고정 간격이 아니도록 3~6일 범위로 랜덤화
const TREASURE_TRIGGER_CHANCE = 0.6; // 조건 충족 시에도 매번 터지지 않도록 랜덤 확률 부여
const TREASURE_REWARD_POOL = [10, 20, 30, 50, 75, 100];

function randomTreasureGap() {
  return TREASURE_MIN_GAP_DAYS + Math.floor(Math.random() * (TREASURE_MAX_GAP_DAYS - TREASURE_MIN_GAP_DAYS + 1));
}
function randomTreasurePoint() {
  return TREASURE_REWARD_POOL[Math.floor(Math.random() * TREASURE_REWARD_POOL.length)];
}

// ---------------------------------------------------------------------------
// 학습 상태 / 오늘의 퀴즈 조회·생성
// ---------------------------------------------------------------------------
async function getOrCreateLearningState(userId, tx = prisma) {
  const existing = await tx.learningState.findUnique({ where: { userId } });
  if (existing) return existing;
  return tx.learningState.create({ data: { userId } });
}

function pickThreeQuestionIds() {
  const pool = [...quizBank];
  const chosen = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool.splice(idx, 1)[0].id);
  }
  return chosen;
}

/** 오늘 날짜의 DailyQuiz row를 가져오거나, 없으면 3문제를 랜덤 배정해 새로 만든다. */
async function getOrCreateTodayQuiz(userId) {
  const date = todayKst();
  const existing = await prisma.dailyQuiz.findUnique({ where: { userId_date: { userId, date } } });
  if (existing) return existing;
  try {
    return await prisma.dailyQuiz.create({
      data: {
        userId,
        date,
        questionIds: JSON.stringify(pickThreeQuestionIds()),
        answersJson: JSON.stringify({}),
      },
    });
  } catch (e) {
    // 동시 요청으로 인한 unique 충돌 시 이미 만들어진 row를 다시 읽어온다 (멱등성 보장)
    const raceRow = await prisma.dailyQuiz.findUnique({ where: { userId_date: { userId, date } } });
    if (raceRow) return raceRow;
    throw e;
  }
}

/** 클라이언트에 내려줄 오늘의 퀴즈 뷰 (정답은 이미 풀린 문제에 한해서만 노출) */
function buildQuizView(dailyQuiz) {
  const questionIds = JSON.parse(dailyQuiz.questionIds);
  const answers = JSON.parse(dailyQuiz.answersJson);
  const questions = questionIds.map((id) => {
    const q = quizById.get(id);
    if (!q) return null;
    const answered = answers[id]?.answered ?? false;
    return {
      id: q.id,
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      options: q.options,
      hint: q.difficulty >= 2 ? q.hint : "",
      answered,
      selected: answered ? answers[id].selected : null,
      correct: answered ? answers[id].correct : null,
      answer: answered ? q.answer : undefined,
      explanation: answered ? q.explanation : undefined,
    };
  });
  const answeredCount = questions.filter((q) => q.answered).length;
  return {
    date: dailyQuiz.date,
    progress: `${answeredCount}/3`,
    answeredCount,
    completed: dailyQuiz.completed,
    totalCorrect: dailyQuiz.totalCorrect,
    rewardPoint: dailyQuiz.rewardPoint,
    treasure: dailyQuiz.treasureRewardGiven ? { point: dailyQuiz.treasurePoint } : null,
    questions,
  };
}

/**
 * 금융교육 메인 화면 요약 정보 (3-4-1, 3-4-15)
 */
async function getSummary(userId) {
  const [learningState, dailyQuiz] = await Promise.all([
    getOrCreateLearningState(userId),
    getOrCreateTodayQuiz(userId),
  ]);
  const level = levelFromStreak(learningState.currentStreak);
  const answers = JSON.parse(dailyQuiz.answersJson);
  const answeredCount = Object.keys(answers).length;
  return {
    currentStreak: learningState.currentStreak,
    currentLevel: level.level,
    levelName: level.name,
    levelEmoji: level.emoji,
    totalPoints: learningState.totalPoints,
    todayQuizProgress: `${answeredCount}/3`,
    todayQuizCompleted: dailyQuiz.completed,
    todayRewardPoint: dailyQuiz.completed ? dailyQuiz.rewardPoint : null,
    todayTreasure: dailyQuiz.treasureRewardGiven ? { point: dailyQuiz.treasurePoint } : null,
  };
}

/**
 * 오늘의 퀴즈 한 문제 답안 제출. idempotent.
 * 3번째 문제 완료(3/3) 순간에만 출석/연속학습/레벨/포인트/보물상자를 한 번에 계산한다.
 */
async function submitAnswer(userId, questionId, selected) {
  const date = todayKst();

  return prisma.$transaction(async (tx) => {
    const dailyQuiz = await tx.dailyQuiz.findUnique({ where: { userId_date: { userId, date } } });
    if (!dailyQuiz) {
      const err = new Error("오늘의 퀴즈가 아직 생성되지 않았습니다. 먼저 조회해주세요.");
      err.status = 400;
      throw err;
    }

    const questionIds = JSON.parse(dailyQuiz.questionIds);
    if (!questionIds.includes(questionId)) {
      const err = new Error("오늘의 퀴즈에 포함되지 않은 문제입니다.");
      err.status = 400;
      throw err;
    }

    // Step 2: 이미 오늘 완료된 경우 -> 그 무엇도 바꾸지 않고 현재 상태 그대로 반환 (중복 방지)
    if (dailyQuiz.completed) {
      return { dailyQuiz, alreadyCompleted: true, justCompleted: false };
    }

    const answers = JSON.parse(dailyQuiz.answersJson);

    // 이미 답한 문제를 다시 제출한 경우도 무시 (idempotent)
    if (answers[questionId]?.answered) {
      return { dailyQuiz, alreadyCompleted: false, justCompleted: false };
    }

    const question = quizById.get(questionId);
    if (!question) {
      const err = new Error("존재하지 않는 문제입니다.");
      err.status = 404;
      throw err;
    }

    const correct = question.answer === selected;
    answers[questionId] = { answered: true, correct, selected };
    const answeredCount = Object.keys(answers).length;
    const totalCorrect = Object.values(answers).filter((a) => a.correct).length;

    // Step 1: 아직 3문제가 다 안 끝났으면 진행 상황만 저장
    if (answeredCount < 3) {
      const updated = await tx.dailyQuiz.update({
        where: { id: dailyQuiz.id },
        data: { answersJson: JSON.stringify(answers), totalCorrect },
      });
      return { dailyQuiz: updated, alreadyCompleted: false, justCompleted: false };
    }

    // ---- 3/3 완료: 여기서부터 출석/연속학습/레벨/포인트/보물상자를 한 번에 계산 ----
    const rewardPoint = QUIZ_POINTS_BY_CORRECT[totalCorrect] ?? 1;
    const learningState = await getOrCreateLearningState(userId, tx);

    // Step 3: 오늘을 처음 완료 - lastCompletedDate와 비교해 연속학습 계산
    let newStreak;
    if (!learningState.lastCompletedDate) {
      newStreak = 1; // 경우 A: 첫 학습
    } else {
      const diff = diffInDays(learningState.lastCompletedDate, date);
      if (diff === 1) {
        newStreak = learningState.currentStreak + 1; // 경우 B: 어제 학습 -> 연속 +1
      } else if (diff <= 0) {
        newStreak = learningState.currentStreak; // 경우 C(0) 및 방어적 처리: 변경 없음
      } else {
        newStreak = 1; // 경우 D: 하루 이상 건너뜀 -> 연속학습 리셋
      }
    }

    const newLevel = levelFromStreak(newStreak);
    const newTotalPoints = learningState.totalPoints + rewardPoint;

    // 보물상자 판정
    let treasureRewardGiven = false;
    let treasurePoint = null;
    let lastTreasureDate = learningState.lastTreasureDate;
    let nextTreasureGapDays = learningState.nextTreasureGapDays;

    const gapSatisfied =
      !lastTreasureDate || diffInDays(lastTreasureDate, date) >= (nextTreasureGapDays || TREASURE_MIN_GAP_DAYS);

    if (newStreak >= TREASURE_MIN_STREAK && gapSatisfied) {
      if (Math.random() < TREASURE_TRIGGER_CHANCE) {
        treasureRewardGiven = true;
        treasurePoint = randomTreasurePoint();
        lastTreasureDate = date;
        nextTreasureGapDays = randomTreasureGap();
      }
    }

    await tx.learningState.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        lastCompletedDate: date,
        currentLevel: newLevel.level,
        totalPoints: treasureRewardGiven ? newTotalPoints + treasurePoint : newTotalPoints,
        lastTreasureDate,
        nextTreasureGapDays,
      },
    });

    const updatedDailyQuiz = await tx.dailyQuiz.update({
      where: { id: dailyQuiz.id },
      data: {
        answersJson: JSON.stringify(answers),
        totalCorrect,
        completed: true,
        attendance: true,
        rewardPoint,
        treasureRewardGiven,
        treasurePoint,
      },
    });

    return {
      dailyQuiz: updatedDailyQuiz,
      alreadyCompleted: false,
      justCompleted: true,
      streakResult: {
        currentStreak: newStreak,
        currentLevel: newLevel.level,
        levelName: newLevel.name,
        levelEmoji: newLevel.emoji,
        totalPoints: treasureRewardGiven ? newTotalPoints + treasurePoint : newTotalPoints,
        rewardPoint,
        totalCorrect,
        treasure: treasureRewardGiven ? { point: treasurePoint } : null,
      },
    };
  });
}

/** 매달의 출석현황 캘린더 (3-4-20, 3-4-21): 3/3 완료(attendance=true)인 날짜만 표시 */
async function getAttendanceCalendar(userId, year, month) {
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`;
  const rows = await prisma.dailyQuiz.findMany({
    where: { userId, attendance: true, date: { startsWith: prefix } },
    select: { date: true, totalCorrect: true },
    orderBy: { date: "asc" },
  });
  return rows.map((r) => ({ date: r.date, totalCorrect: r.totalCorrect }));
}

module.exports = {
  LEVELS,
  levelFromStreak,
  getOrCreateLearningState,
  getOrCreateTodayQuiz,
  buildQuizView,
  getSummary,
  submitAnswer,
  getAttendanceCalendar,
  quizBank,
};

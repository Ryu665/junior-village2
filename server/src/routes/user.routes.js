const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertParentOwnsChild } = require("../utils/access");
const bankingService = require("../services/bankingService");
const { upsertSchool } = require("../services/schoolService");

const prisma = new PrismaClient();
const router = express.Router();

function toPublicUser(user) {
  return { id: user.id, role: user.role, name: user.name, avatarEmoji: user.avatarEmoji, schoolId: user.schoolId };
}

// 부모: 내 자녀 목록 (잔액/레벨 요약 포함)
router.get(
  "/children",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const links = await prisma.parentChildLink.findMany({
      where: { parentId: req.user.id },
      include: {
        child: { include: { account: true, learningState: true, school: true } },
      },
    });
    const children = await Promise.all(
      links.map(async (link) => {
        const child = link.child;
        const account = child.account || (await bankingService.ensureAccount(child.id));
        return {
          id: child.id,
          name: child.name,
          avatarEmoji: child.avatarEmoji,
          balance: account.balance,
          schoolId: child.schoolId,
          school: child.school?.name || null,
          currentStreak: child.learningState?.currentStreak || 0,
          currentLevel: child.learningState?.currentLevel || 0,
        };
      })
    );
    res.json(children);
  })
);

// 부모: 자녀 계정 신규 생성 + 자동 연동 (초대 코드는 데모 표시용으로 함께 발급)
// body.school = { atptCode, schoolCode, name, address } (선택, 학교 검색에서 고른 결과)
router.post(
  "/children",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const { name, pin, avatarEmoji, school } = req.body;
    if (!name || !pin) return res.status(400).json({ error: "name, pin이 필요합니다." });

    const pinHash = await bcrypt.hash(pin, 10);
    let schoolId = null;
    if (school?.name) {
      const row = await upsertSchool(school);
      schoolId = row.id;
    }

    const child = await prisma.user.create({
      data: { role: "CHILD", name, pinHash, avatarEmoji: avatarEmoji || "oli-1", schoolId },
    });
    await bankingService.ensureAccount(child.id);
    await prisma.parentChildLink.create({ data: { parentId: req.user.id, childId: child.id } });

    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    res.status(201).json({ ...toPublicUser(child), inviteCode });
  })
);

// 부모: 이미 만들어진 자녀 계정의 소속 학교 등록/변경
// body = { atptCode, schoolCode, name, address }
router.patch(
  "/children/:childId/school",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const { childId } = req.params;
    await assertParentOwnsChild(req.user.id, childId);
    const { name, address, atptCode, schoolCode } = req.body;
    if (!name) return res.status(400).json({ error: "학교를 선택해주세요." });

    const school = await upsertSchool({ name, address, atptCode, schoolCode });
    const user = await prisma.user.update({ where: { id: childId }, data: { schoolId: school.id } });
    res.json({ ...toPublicUser(user), school: school.name, schoolId: school.id });
  })
);

// 부모: 자녀 계정 삭제 (연관 데이터 전부 함께 정리)
router.delete(
  "/children/:childId",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const { childId } = req.params;
    await assertParentOwnsChild(req.user.id, childId);

    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { OR: [{ userId: childId }, { childId }] } }),
      prisma.missionSubmission.deleteMany({ where: { childId } }),
      prisma.mission.deleteMany({ where: { childId } }),
      prisma.gameSession.deleteMany({ where: { userId: childId } }),
      prisma.savingsGoal.deleteMany({ where: { childId } }),
      prisma.dailyQuiz.deleteMany({ where: { userId: childId } }),
      prisma.learningState.deleteMany({ where: { userId: childId } }),
      prisma.account.deleteMany({ where: { userId: childId } }),
      prisma.parentChildLink.deleteMany({ where: { childId } }),
      prisma.user.delete({ where: { id: childId } }),
    ]);

    res.json({ ok: true });
  })
);

// 부모: 이미 만들어진 자녀 계정의 대표 이미지(아바타) 변경
router.patch(
  "/children/:childId/avatar",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const { childId } = req.params;
    await assertParentOwnsChild(req.user.id, childId);
    const { avatarEmoji } = req.body;
    if (!avatarEmoji) return res.status(400).json({ error: "avatarEmoji가 필요합니다." });

    const user = await prisma.user.update({ where: { id: childId }, data: { avatarEmoji } });
    res.json(toPublicUser(user));
  })
);

// 자녀: 소속 초등학교 등록/변경 (게임 랭킹·급식 조회에 사용)
// body = { atptCode, schoolCode, name, address }
router.patch(
  "/me/school",
  requireAuth,
  requireRole("CHILD"),
  asyncHandler(async (req, res) => {
    const { name, address, atptCode, schoolCode } = req.body;
    if (!name) return res.status(400).json({ error: "학교를 선택해주세요." });

    const school = await upsertSchool({ name, address, atptCode, schoolCode });
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { schoolId: school.id } });
    res.json({ ...toPublicUser(user), school: school.name });
  })
);

module.exports = router;

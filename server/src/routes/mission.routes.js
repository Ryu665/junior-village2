const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertParentOwnsChild } = require("../utils/access");
const bankingService = require("../services/bankingService");

const prisma = new PrismaClient();
const router = express.Router();

// 미션 목록: 부모는 자신이 만든 것 전체(자녀 필터 가능), 자녀는 자기 것만
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const where =
      req.user.role === "PARENT"
        ? { parentId: req.user.id, ...(req.query.childId ? { childId: req.query.childId } : {}) }
        : { childId: req.user.id };
    const missions = await prisma.mission.findMany({
      where,
      include: { submissions: { orderBy: { submittedAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(missions);
  })
);

// 부모: 미션 생성 (반드시 본인 자녀에게만)
router.post(
  "/",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const { childId, title, description, rewardAmount, dueDate, repeat } = req.body;
    if (!childId || !title || !rewardAmount) {
      return res.status(400).json({ error: "childId, title, rewardAmount는 필수입니다." });
    }
    await assertParentOwnsChild(req.user.id, childId);
    const mission = await prisma.mission.create({
      data: {
        parentId: req.user.id,
        childId,
        title,
        description,
        rewardAmount: Number(rewardAmount),
        dueDate: dueDate ? new Date(dueDate) : null,
        repeat: repeat || "ONCE",
      },
    });
    res.status(201).json(mission);
  })
);

// 부모: 미션 수정/취소
router.patch(
  "/:id",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.parentId !== req.user.id) {
      return res.status(404).json({ error: "미션을 찾을 수 없습니다." });
    }
    const { title, description, rewardAmount, dueDate, repeat, status } = req.body;
    const updated = await prisma.mission.update({
      where: { id: mission.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(rewardAmount !== undefined ? { rewardAmount: Number(rewardAmount) } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        ...(repeat !== undefined ? { repeat } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    res.json(updated);
  })
);

// 부모: 미션 삭제 (제출 내역·관련 알림도 함께 정리. 이미 지급된 용돈 거래 내역은 별개로 그대로 남음)
router.delete(
  "/:id",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.parentId !== req.user.id) {
      return res.status(404).json({ error: "미션을 찾을 수 없습니다." });
    }
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { missionId: mission.id } }),
      prisma.missionSubmission.deleteMany({ where: { missionId: mission.id } }),
      prisma.mission.delete({ where: { id: mission.id } }),
    ]);
    res.json({ ok: true });
  })
);

// 자녀: 미션 완료 제출 -> 부모에게 알림
router.post(
  "/:id/submit",
  requireAuth,
  requireRole("CHILD"),
  asyncHandler(async (req, res) => {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.childId !== req.user.id) {
      return res.status(404).json({ error: "미션을 찾을 수 없습니다." });
    }
    const submission = await prisma.missionSubmission.create({
      data: { missionId: mission.id, childId: req.user.id, proofNote: req.body.proofNote || null },
    });
    const child = await prisma.user.findUnique({ where: { id: req.user.id } });
    await prisma.notification.create({
      data: {
        userId: mission.parentId,
        type: "MISSION_SUBMITTED",
        message: `${child.name}이(가) "${mission.title}" 미션을 완료했어요. 확인해주세요!`,
        relatedId: submission.id,
        missionId: mission.id,
        childId: mission.childId,
      },
    });
    res.status(201).json(submission);
  })
);

// 부모: 미션 완료 승인 -> 즉시 이체 실행 + 자녀에게 리워드 알림
router.post(
  "/:id/approve",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.parentId !== req.user.id) {
      return res.status(404).json({ error: "미션을 찾을 수 없습니다." });
    }
    const { submissionId } = req.body;
    const submission = await prisma.missionSubmission.findUnique({ where: { id: submissionId } });
    if (!submission || submission.missionId !== mission.id) {
      return res.status(404).json({ error: "제출 내역을 찾을 수 없습니다." });
    }
    if (submission.status !== "PENDING") {
      // 이미 처리된 제출 - 중복 승인/이체 방지 (idempotent)
      return res.json({ submission, alreadyProcessed: true });
    }

    await bankingService.transfer({
      fromUserId: mission.parentId,
      toUserId: mission.childId,
      amount: mission.rewardAmount,
      type: "MISSION_REWARD",
      memo: mission.title,
      missionId: mission.id,
    });

    const updatedSubmission = await prisma.missionSubmission.update({
      where: { id: submission.id },
      data: { status: "APPROVED", reviewedAt: new Date(), reviewerId: req.user.id },
    });

    if (mission.repeat === "ONCE") {
      await prisma.mission.update({ where: { id: mission.id }, data: { status: "COMPLETED" } });
    }

    await prisma.notification.create({
      data: {
        userId: mission.childId,
        type: "MISSION_APPROVED",
        message: `미션 완료! 용돈 ${mission.rewardAmount.toLocaleString("ko-KR")}원이 도착했어요 🎉`,
        relatedId: mission.id,
      },
    });

    res.json({ submission: updatedSubmission, alreadyProcessed: false });
  })
);

// 부모: 미션 완료 반려
router.post(
  "/:id/reject",
  requireAuth,
  requireRole("PARENT"),
  asyncHandler(async (req, res) => {
    const mission = await prisma.mission.findUnique({ where: { id: req.params.id } });
    if (!mission || mission.parentId !== req.user.id) {
      return res.status(404).json({ error: "미션을 찾을 수 없습니다." });
    }
    const { submissionId, reason } = req.body;
    const submission = await prisma.missionSubmission.findUnique({ where: { id: submissionId } });
    if (!submission || submission.missionId !== mission.id) {
      return res.status(404).json({ error: "제출 내역을 찾을 수 없습니다." });
    }
    if (submission.status !== "PENDING") {
      return res.json({ submission, alreadyProcessed: true });
    }
    const updated = await prisma.missionSubmission.update({
      where: { id: submission.id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewerId: req.user.id },
    });
    await prisma.notification.create({
      data: {
        userId: mission.childId,
        type: "MISSION_REJECTED",
        message: `"${mission.title}" 미션이 반려되었어요.${reason ? ` (사유: ${reason})` : ""}`,
        relatedId: mission.id,
      },
    });
    res.json({ submission: updated, alreadyProcessed: false });
  })
);

module.exports = router;

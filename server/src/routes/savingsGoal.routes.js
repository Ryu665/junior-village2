const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth");
const { assertCanAccessUser } = require("../utils/access");
const bankingService = require("../services/bankingService");
const { todayKst } = require("../utils/kstDate");

const prisma = new PrismaClient();
const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const childId = req.query.childId || req.user.id;
    await assertCanAccessUser(req.user, childId);
    const goals = await prisma.savingsGoal.findMany({ where: { childId }, orderBy: { createdAt: "desc" } });
    res.json(goals);
  })
);

// 저축 목표 생성 (부모가 자녀를 도와 설정하거나, 자녀가 직접 설정 가능)
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { childId, title, targetAmount, emoji, startDate, targetDate } = req.body;
    const targetChildId = childId || req.user.id;
    await assertCanAccessUser(req.user, targetChildId);
    if (!title || !targetAmount) return res.status(400).json({ error: "title, targetAmount는 필수입니다." });
    const goal = await prisma.savingsGoal.create({
      data: {
        childId: targetChildId,
        title,
        targetAmount: Number(targetAmount),
        emoji: emoji || "🎯",
        startDate: startDate || todayKst(),
        targetDate: targetDate || null,
      },
    });
    res.status(201).json(goal);
  })
);

router.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const goal = await prisma.savingsGoal.findUnique({ where: { id: req.params.id } });
    if (!goal) return res.status(404).json({ error: "저축 목표를 찾을 수 없습니다." });
    await assertCanAccessUser(req.user, goal.childId);
    const { title, targetAmount, currentAmount, emoji, startDate, targetDate } = req.body;
    const updated = await prisma.savingsGoal.update({
      where: { id: goal.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(targetAmount !== undefined ? { targetAmount: Number(targetAmount) } : {}),
        ...(currentAmount !== undefined ? { currentAmount: Number(currentAmount) } : {}),
        ...(emoji !== undefined ? { emoji } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(targetDate !== undefined ? { targetDate } : {}),
      },
    });
    res.json(updated);
  })
);

// 자녀: 내 계좌 잔액에서 저축 목표로 돈 옮기기 (모의 이체, 잔액 부족 시 거절)
router.post(
  "/:id/deposit",
  requireAuth,
  requireRole("CHILD"),
  asyncHandler(async (req, res) => {
    const goal = await prisma.savingsGoal.findUnique({ where: { id: req.params.id } });
    if (!goal || goal.childId !== req.user.id) {
      return res.status(404).json({ error: "저축 목표를 찾을 수 없습니다." });
    }
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: "저금할 금액을 입력해주세요." });

    const balance = await bankingService.getBalance(req.user.id);
    if (balance < amount) {
      return res.status(400).json({ error: "잔액이 부족해요." });
    }

    // 계좌 -> "저축" 이라는 개념상 목적지로 이체 기록만 남기고, 실제 잔액은 차감만 한다
    // (저축 목표는 계좌와 별개의 진행률 트래커이므로 toUserId는 두지 않는다).
    await bankingService.transfer({ fromUserId: req.user.id, toUserId: null, amount, type: "MANUAL", memo: `저축: ${goal.title}` });
    const updated = await prisma.savingsGoal.update({
      where: { id: goal.id },
      data: { currentAmount: { increment: amount } },
    });
    const newBalance = await bankingService.getBalance(req.user.id);
    res.json({ goal: updated, balance: newBalance });
  })
);

module.exports = router;

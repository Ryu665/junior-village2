const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  })
);

router.patch(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ error: "알림을 찾을 수 없습니다." });
    }
    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } });
    res.json(updated);
  })
);

module.exports = router;

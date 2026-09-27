const express = require("express");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { assertCanAccessUser } = require("../utils/access");
const bankingService = require("../services/bankingService");

const router = express.Router();

router.get(
  "/:userId/balance",
  requireAuth,
  asyncHandler(async (req, res) => {
    await assertCanAccessUser(req.user, req.params.userId);
    const balance = await bankingService.getBalance(req.params.userId);
    res.json({ userId: req.params.userId, balance });
  })
);

router.get(
  "/:userId/transactions",
  requireAuth,
  asyncHandler(async (req, res) => {
    await assertCanAccessUser(req.user, req.params.userId);
    const transactions = await bankingService.getTransactions(req.params.userId);
    res.json(transactions);
  })
);

module.exports = router;

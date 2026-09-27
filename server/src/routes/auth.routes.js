const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const prisma = new PrismaClient();
const router = express.Router();

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
}
function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "30d",
  });
}
function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "lax",
    // 로컬(http://localhost) 개발에서는 false, 배포(HTTPS) 환경에서는 true.
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function toPublicUser(user) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    avatarEmoji: user.avatarEmoji,
    schoolId: user.schoolId,
  };
}

// 최초 화면: 아이디/비번 입력 없이 "부모1 / 자녀1 / 자녀2" 중에서 선택하기 위한 프로필 목록
// (프로토타입 전용. 실서비스에서는 절대로 비밀번호 입력 없이 프로필 목록을 공개하면 안 됨)
router.get(
  "/profiles",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
    res.json(users.map(toPublicUser));
  })
);

router.post(
  "/pin-login",
  asyncHandler(async (req, res) => {
    const { profileId, pin } = req.body;
    if (!profileId || !pin) {
      return res.status(400).json({ error: "profileId와 pin이 필요합니다." });
    }
    const user = await prisma.user.findUnique({ where: { id: profileId } });
    if (!user) return res.status(404).json({ error: "존재하지 않는 계정입니다." });

    const ok = await bcrypt.compare(pin, user.pinHash);
    if (!ok) return res.status(401).json({ error: "PIN이 올바르지 않습니다." });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user: toPublicUser(user) });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "refresh token이 없습니다." });
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ error: "refresh token이 유효하지 않습니다." });
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "존재하지 않는 계정입니다." });
    const accessToken = signAccessToken(user);
    res.json({ accessToken, user: toPublicUser(user) });
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ ok: true });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "존재하지 않는 계정입니다." });
    res.json(toPublicUser(user));
  })
);

// 설정 메뉴: PIN(비밀번호) 변경
router.patch(
  "/pin",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPin, newPin } = req.body;
    if (!currentPin || !newPin) {
      return res.status(400).json({ error: "currentPin, newPin이 필요합니다." });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(currentPin, user.pinHash);
    if (!ok) return res.status(401).json({ error: "현재 PIN이 올바르지 않습니다." });
    const pinHash = await bcrypt.hash(newPin, 10);
    await prisma.user.update({ where: { id: user.id }, data: { pinHash } });
    res.json({ ok: true });
  })
);

// 설정 메뉴: 대표 이모지(캐릭터) 변경
router.patch(
  "/avatar",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { avatarEmoji } = req.body;
    if (!avatarEmoji) return res.status(400).json({ error: "avatarEmoji가 필요합니다." });
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { avatarEmoji } });
    res.json(toPublicUser(user));
  })
);

module.exports = router;

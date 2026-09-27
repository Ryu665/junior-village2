const jwt = require("jsonwebtoken");

/** Authorization: Bearer <accessToken> 검증, req.user = {id, role} 세팅 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "로그인이 필요합니다." });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: "로그인이 만료되었습니다. 다시 로그인해주세요." });
  }
}

/** 특정 role만 접근 가능하도록 제한 (예: requireRole("PARENT")) */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "권한이 없습니다." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

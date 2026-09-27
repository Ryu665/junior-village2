const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 부모가 자녀 계정에 접근 권한이 있는지 확인한다.
 * 부모는 자기 자녀의 정보를 볼 수 있지만, 자녀는 부모(또는 다른 자녀)의 정보를 볼 수 없다.
 */
async function assertParentOwnsChild(parentId, childId) {
  const link = await prisma.parentChildLink.findUnique({
    where: { parentId_childId: { parentId, childId } },
  });
  if (!link) {
    const err = new Error("해당 자녀 계정에 접근할 권한이 없습니다.");
    err.status = 403;
    throw err;
  }
}

/**
 * req.user 가 targetUserId 의 정보/계좌에 접근할 수 있는지 검사.
 * - 본인 계정: 항상 허용
 * - 부모: 자신과 연동된 자녀 계정만 허용
 * - 자녀: 본인 계정 외에는 절대 허용하지 않음 (부모 계정 접근 차단)
 */
async function assertCanAccessUser(reqUser, targetUserId) {
  if (reqUser.id === targetUserId) return;
  if (reqUser.role === "PARENT") {
    await assertParentOwnsChild(reqUser.id, targetUserId);
    return;
  }
  const err = new Error("접근 권한이 없습니다.");
  err.status = 403;
  throw err;
}

module.exports = { assertParentOwnsChild, assertCanAccessUser };

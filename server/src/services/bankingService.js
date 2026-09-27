/**
 * bankingService
 * ---------------------------------------------------------------------------
 * 이체/계좌 관련 로직을 하나의 인터페이스로 분리한 모듈.
 * 지금은 앱 자체 SQLite DB 안에서 동작하는 모의(mock) 로직이지만,
 * 나중에 실제 코어뱅킹/오픈뱅킹 API로 교체할 때는 이 파일(및 아래 함수 시그니처)만
 * 실제 API 호출로 바꾸면 되도록 설계했다.
 *
 * TODO(실서비스 전환 시): 실명확인, 법정대리인 동의, 전자금융거래법 등 준수 필요.
 * TODO(실서비스 전환 시): 실제 계좌 잔액 조회/이체는 은행 코어뱅킹 또는 오픈뱅킹 API로 대체.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** 사용자 계좌가 없으면 0원 잔액으로 생성 */
async function ensureAccount(userId, tx = prisma) {
  const existing = await tx.account.findUnique({ where: { userId } });
  if (existing) return existing;
  return tx.account.create({ data: { userId, balance: 0 } });
}

/** 잔액 조회 (mock) */
async function getBalance(userId) {
  const account = await ensureAccount(userId);
  return account.balance;
}

/**
 * 계좌 간 이체 (mock, 원자적 트랜잭션).
 * 부모 계좌 -> 자녀 계좌 등 내부 이체에 사용. 반드시 서버(부모 승인) 로직에서만 호출되어야 한다.
 * 자녀 계정이 단독으로 이 함수를 직접 호출할 수 있는 API 경로는 존재하지 않는다.
 */
async function transfer({ fromUserId, toUserId, amount, type = "MISSION_REWARD", memo, missionId }) {
  if (amount <= 0) {
    throw new Error("이체 금액은 0보다 커야 합니다.");
  }
  return prisma.$transaction(async (tx) => {
    if (fromUserId) {
      const fromAccount = await ensureAccount(fromUserId, tx);
      if (fromAccount.balance < amount) {
        const err = new Error("잔액이 부족합니다.");
        err.code = "INSUFFICIENT_BALANCE";
        throw err;
      }
      await tx.account.update({
        where: { userId: fromUserId },
        data: { balance: { decrement: amount } },
      });
    }
    if (toUserId) {
      await ensureAccount(toUserId, tx);
      await tx.account.update({
        where: { userId: toUserId },
        data: { balance: { increment: amount } },
      });
    }
    return tx.transaction.create({
      data: { fromUserId, toUserId, amount, type, memo, missionId },
    });
  });
}

/** 특정 사용자와 관련된 거래내역 조회 (보낸 것 + 받은 것) */
async function getTransactions(userId) {
  return prisma.transaction.findMany({
    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    orderBy: { createdAt: "desc" },
  });
}

/** 계좌 직접 입금 (초기 시드 등 관리용) */
async function deposit(userId, amount, memo = "초기 지급") {
  return transfer({ fromUserId: null, toUserId: userId, amount, type: "DEPOSIT", memo });
}

module.exports = {
  ensureAccount,
  getBalance,
  transfer,
  getTransactions,
  deposit,
};

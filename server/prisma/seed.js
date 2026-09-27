/**
 * 시드 스크립트: 부모 1명 + 자녀 2명 + 샘플 미션/거래내역/저축목표/학교/교육콘텐츠를 채운다.
 * 실행: npm run seed --workspace server  (루트에서) 또는 server 폴더에서 node prisma/seed.js
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");
const educationCards = require(path.join(__dirname, "..", "src", "data", "educationCards.json"));
const { todayKst, addDays } = require(path.join(__dirname, "..", "src", "utils", "kstDate"));

const prisma = new PrismaClient();

async function hash(pin) {
  return bcrypt.hash(pin, 10);
}

async function main() {
  console.log("🌱 시드 데이터 생성 시작...");

  // 기존 데이터 초기화 (프로토타입: 시드 재실행 시 항상 깨끗한 상태로)
  await prisma.$transaction([
    prisma.dailyQuiz.deleteMany(),
    prisma.learningState.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.gameSession.deleteMany(),
    prisma.missionSubmission.deleteMany(),
    prisma.mission.deleteMany(),
    prisma.savingsGoal.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.account.deleteMany(),
    prisma.parentChildLink.deleteMany(),
    prisma.educationCard.deleteMany(),
    prisma.user.deleteMany(),
    prisma.school.deleteMany(),
  ]);

  // 실제 존재하는 학교(나이스 교육정보 개방포털 확인 완료)로 시드해서 급식메뉴 기능도 데모에서 바로 동작한다.
  const schoolA = await prisma.school.create({
    data: {
      name: "서울대학교사범대학부설초등학교",
      address: "서울특별시 종로구 대학로 64",
      neisAtptCode: "B10",
      neisSchoolCode: "7061128",
    },
  });
  const schoolB = await prisma.school.create({
    data: {
      name: "한빛초등학교",
      address: "경기도 파주시 미래로408번길 77",
      neisAtptCode: "J10",
      neisSchoolCode: "7681149",
    },
  });

  const parent = await prisma.user.create({
    data: {
      role: "PARENT",
      name: "김민정",
      avatarEmoji: "👩",
      pinHash: await hash("1234"),
    },
  });

  const child1 = await prisma.user.create({
    data: {
      role: "CHILD",
      name: "이준",
      avatarEmoji: "oli-1",
      pinHash: await hash("1111"),
      schoolId: schoolA.id,
    },
  });

  const child2 = await prisma.user.create({
    data: {
      role: "CHILD",
      name: "이서",
      avatarEmoji: "woni-1",
      pinHash: await hash("2222"),
      schoolId: schoolB.id,
    },
  });

  await prisma.parentChildLink.createMany({
    data: [
      { parentId: parent.id, childId: child1.id },
      { parentId: parent.id, childId: child2.id },
    ],
  });

  await prisma.account.create({ data: { userId: parent.id, balance: 500000 } });
  await prisma.account.create({ data: { userId: child1.id, balance: 3000 } });
  await prisma.account.create({ data: { userId: child2.id, balance: 5000 } });

  await prisma.transaction.createMany({
    data: [
      { toUserId: parent.id, amount: 500000, type: "DEPOSIT", memo: "초기 지급(데모)" },
      { toUserId: child1.id, amount: 3000, type: "DEPOSIT", memo: "초기 용돈(데모)" },
      { toUserId: child2.id, amount: 5000, type: "DEPOSIT", memo: "초기 용돈(데모)" },
    ],
  });

  // 미션 샘플
  const missionRoomClean = await prisma.mission.create({
    data: {
      parentId: parent.id,
      childId: child1.id,
      title: "방 청소하기",
      description: "장난감을 정리하고 침대를 정돈해요.",
      rewardAmount: 1000,
      repeat: "ONCE",
      status: "ACTIVE",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.mission.create({
    data: {
      parentId: parent.id,
      childId: child1.id,
      title: "일기 쓰기",
      description: "오늘 있었던 일을 세 문장 이상 적어요.",
      rewardAmount: 500,
      repeat: "DAILY",
      status: "ACTIVE",
    },
  });

  const missionDishes = await prisma.mission.create({
    data: {
      parentId: parent.id,
      childId: child2.id,
      title: "설거지 도와드리기",
      description: "저녁 식사 후 그릇 정리를 도와줘요.",
      rewardAmount: 2000,
      repeat: "WEEKLY",
      status: "ACTIVE",
    },
  });

  // 자녀2가 이미 제출해서 부모 승인을 기다리는 상태(데모용 알림함 채우기)
  const pendingSubmission = await prisma.missionSubmission.create({
    data: { missionId: missionDishes.id, childId: child2.id, proofNote: "다 씻어서 정리했어요!" },
  });
  await prisma.notification.create({
    data: {
      userId: parent.id,
      type: "MISSION_SUBMITTED",
      message: `이서이(가) "설거지 도와드리기" 미션을 완료했어요. 확인해주세요!`,
      relatedId: pendingSubmission.id,
      missionId: missionDishes.id,
      childId: child2.id,
    },
  });

  // 저축 목표 샘플
  await prisma.savingsGoal.create({
    data: { childId: child1.id, title: "닌텐도 스위치 사기", targetAmount: 300000, currentAmount: 45000 },
  });
  await prisma.savingsGoal.create({
    data: { childId: child2.id, title: "자전거 사기", targetAmount: 150000, currentAmount: 30000 },
  });

  // 금융교육: 배움 콘텐츠 DB 반영 (조회 API는 JSON을 직접 쓰지만, 데이터 모델 완결성을 위해 시드)
  await prisma.educationCard.createMany({
    data: educationCards.map((c, i) => ({ id: c.id, title: c.title, body: c.body, emoji: c.emoji, order: i })),
  });

  // 자녀1은 어제까지 3일 연속학습 중이었던 것으로 시드 -> 오늘 퀴즈를 풀면 바로 4일차 연출을 볼 수 있음
  const yesterday = addDays(todayKst(), -1);
  await prisma.learningState.create({
    data: {
      userId: child1.id,
      currentStreak: 3,
      lastCompletedDate: yesterday,
      currentLevel: 1,
      totalPoints: 90,
    },
  });
  // 자녀2는 아직 학습 기록이 없는 상태로 시작
  await prisma.learningState.create({ data: { userId: child2.id } });

  console.log("✅ 시드 완료!");
  console.log("   부모  :", parent.name, "(PIN: 1234)");
  console.log("   자녀1 :", child1.name, "(PIN: 1111) -", missionRoomClean.title, "미션 보유");
  console.log("   자녀2 :", child2.name, "(PIN: 2222) - 승인 대기 중인 제출 1건 존재");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * schoolService
 * ---------------------------------------------------------------------------
 * NEIS 검색 결과(또는 이름만 있는 레거시 값)로부터 School row를 찾거나 만든다.
 * neisAtptCode+neisSchoolCode 조합이 있으면 그 조합을 기준으로, 없으면 이름 기준으로 처리한다.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function upsertSchool({ name, address, atptCode, schoolCode }) {
  if (!name) {
    const err = new Error("학교 이름이 필요합니다.");
    err.status = 400;
    throw err;
  }

  if (atptCode && schoolCode) {
    return prisma.school.upsert({
      where: { neisAtptCode_neisSchoolCode: { neisAtptCode: atptCode, neisSchoolCode: schoolCode } },
      update: { name, address },
      create: { name, address, neisAtptCode: atptCode, neisSchoolCode: schoolCode },
    });
  }

  // NEIS 코드 없이 이름만 들어온 경우(레거시): 같은 이름의 코드 없는 학교가 있으면 재사용, 없으면 생성.
  const existing = await prisma.school.findFirst({ where: { name, neisAtptCode: null, neisSchoolCode: null } });
  if (existing) return existing;
  return prisma.school.create({ data: { name, address } });
}

module.exports = { upsertSchool };

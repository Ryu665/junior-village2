/**
 * 배포 환경 시작 스크립트: 마이그레이션 적용 -> DB가 비어 있을 때만 시드 -> 서버 시작.
 * (시드 스크립트는 기존 데이터를 전부 지우므로, 이미 사용자가 있으면 절대 실행하지 않는다.)
 */
const { execSync } = require("child_process");
const path = require("path");

const serverDir = path.join(__dirname, "..");

function run(cmd) {
  execSync(cmd, { cwd: serverDir, stdio: "inherit", env: process.env });
}

async function main() {
  run("npx prisma migrate deploy");

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count();
  await prisma.$disconnect();

  if (userCount === 0) {
    console.log("DB가 비어 있어 데모 시드 데이터를 채웁니다.");
    run("node prisma/seed.js");
  }

  require("../src/index.js");
}

main().catch((err) => {
  console.error("서버 시작 실패:", err);
  process.exit(1);
});

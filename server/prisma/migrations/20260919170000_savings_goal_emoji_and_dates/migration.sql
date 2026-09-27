-- SavingsGoal: 목표 이모지, 시작일/목표완료일 추가
ALTER TABLE "SavingsGoal" ADD COLUMN "emoji" TEXT NOT NULL DEFAULT '🎯';
ALTER TABLE "SavingsGoal" ADD COLUMN "startDate" TEXT;
ALTER TABLE "SavingsGoal" ADD COLUMN "targetDate" TEXT;

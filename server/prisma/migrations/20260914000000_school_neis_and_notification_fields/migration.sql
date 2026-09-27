-- AlterTable: Notification (add missionId, childId)
ALTER TABLE "Notification" ADD COLUMN "missionId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "childId" TEXT;

-- RedefineTable: School (drop unique on name, add address/neis columns, add composite unique)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "neisAtptCode" TEXT,
    "neisSchoolCode" TEXT
);
INSERT INTO "new_School" ("id", "name") SELECT "id", "name" FROM "School";
DROP TABLE "School";
ALTER TABLE "new_School" RENAME TO "School";
CREATE UNIQUE INDEX "School_neisAtptCode_neisSchoolCode_key" ON "School"("neisAtptCode", "neisSchoolCode");

PRAGMA foreign_keys=ON;

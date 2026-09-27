const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const neisService = require("../services/neisService");
const { todayKst } = require("../utils/kstDate");

const prisma = new PrismaClient();
const router = express.Router();

// 실제 존재하는 학교 검색 (나이스 교육정보 개방포털)
router.get(
  "/search",
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(400).json({ error: "학교 이름을 2글자 이상 입력해주세요." });
    }
    const results = await neisService.searchSchools(q);
    res.json(results.slice(0, 30));
  })
);

// 특정 학교(schoolId)의 날짜별 급식 정보
router.get(
  "/:schoolId/meal",
  requireAuth,
  asyncHandler(async (req, res) => {
    const school = await prisma.school.findUnique({ where: { id: req.params.schoolId } });
    if (!school) return res.status(404).json({ error: "학교를 찾을 수 없습니다." });

    const date = (req.query.date || todayKst().replace(/-/g, "")).replace(/-/g, "");

    if (!school.neisAtptCode || !school.neisSchoolCode) {
      return res.json({
        date,
        schoolName: school.name,
        meals: [],
        unavailable: true,
        message: "이 학교는 급식 정보를 연동할 수 없어요. 학교 검색에서 다시 등록해주세요.",
      });
    }

    const meals = await neisService.getMeal(school.neisAtptCode, school.neisSchoolCode, date);
    res.json({
      date,
      schoolName: school.name,
      meals,
      unavailable: false,
      message: meals.length === 0 ? "이 날짜에는 급식 정보가 없어요. (주말/방학/휴일일 수 있어요)" : null,
    });
  })
);

module.exports = router;

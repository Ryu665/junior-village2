/**
 * neisService
 * ---------------------------------------------------------------------------
 * 나이스(NEIS) 교육정보 개방포털 Open API 연동.
 *   - 학교 검색: https://open.neis.go.kr/hub/schoolInfo
 *   - 급식식단정보: https://open.neis.go.kr/hub/mealServiceDietInfo
 * API 키는 서버에서만 사용하고 클라이언트에는 절대 노출하지 않는다.
 */
const NEIS_BASE = "https://open.neis.go.kr/hub";

function getApiKey() {
  const key = process.env.NEIS_API_KEY;
  if (!key) {
    const err = new Error("NEIS_API_KEY가 설정되어 있지 않습니다.");
    err.status = 500;
    throw err;
  }
  return key;
}

/**
 * NEIS 응답 공통 파싱.
 * 정상: { <serviceName>: [ {head: [...]}, {row: [...]} ] }
 * 결과 없음/오류: { RESULT: { CODE, MESSAGE } }
 */
function extractRows(json, serviceName) {
  if (json?.RESULT) {
    // INFO-200: 데이터 없음. 그 외 코드는 실제 오류.
    if (json.RESULT.CODE && json.RESULT.CODE !== "INFO-200") {
      const err = new Error(`NEIS API 오류: ${json.RESULT.MESSAGE || json.RESULT.CODE}`);
      err.status = 502;
      throw err;
    }
    return [];
  }
  const body = json?.[serviceName];
  if (!Array.isArray(body)) return [];
  const rowBlock = body.find((b) => Array.isArray(b?.row));
  return rowBlock?.row || [];
}

async function neisGet(path, params) {
  const url = new URL(`${NEIS_BASE}/${path}`);
  url.searchParams.set("KEY", getApiKey());
  url.searchParams.set("Type", "json");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`NEIS API 요청 실패 (${res.status})`);
    err.status = 502;
    throw err;
  }
  return res.json();
}

/** 학교 이름으로 실제 존재하는 학교를 검색한다. */
async function searchSchools(keyword) {
  const json = await neisGet("schoolInfo", { SCHUL_NM: keyword, pIndex: 1, pSize: 30 });
  const rows = extractRows(json, "schoolInfo");
  return rows.map((r) => ({
    atptCode: r.ATPT_OFCDC_SC_CODE,
    schoolCode: r.SD_SCHUL_CODE,
    name: r.SCHUL_NM,
    kind: r.SCHUL_KND_SC_NM,
    region: r.LCTN_SC_NM,
    address: r.ORG_RDNMA || null,
  }));
}

/** 특정 학교의 특정 날짜(YYYYMMDD) 급식 정보를 조회한다. */
async function getMeal(atptCode, schoolCode, date) {
  const json = await neisGet("mealServiceDietInfo", {
    ATPT_OFCDC_SC_CODE: atptCode,
    SD_SCHUL_CODE: schoolCode,
    MLSV_YMD: date,
  });
  const rows = extractRows(json, "mealServiceDietInfo");
  return rows.map((r) => ({
    date: r.MLSV_YMD,
    mealType: r.MMEAL_SC_NM, // 조식/중식/석식
    menu: (r.DDISH_NM || "")
      .split("<br/>")
      .map((s) => s.replace(/\([0-9.]+\)/g, "").trim())
      .filter(Boolean),
    calInfo: r.CAL_INFO || null,
  }));
}

module.exports = { searchSchools, getMeal };

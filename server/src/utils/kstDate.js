// 한국 표준시(KST, UTC+9) 기준 날짜 계산 유틸.
// 연속학습/출석 계산은 반드시 이 유틸을 통해서만 "오늘 날짜"를 판단해야 한다.
// (서버가 어느 타임존에서 돌아가든 항상 KST 기준 YYYY-MM-DD 를 반환)

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 주어진 시각(기본: 현재)을 KST 기준 "YYYY-MM-DD" 문자열로 반환한다.
 * @param {Date} [date]
 * @returns {string}
 */
function toKstDateString(date = new Date()) {
  const kstTime = new Date(date.getTime() + KST_OFFSET_MS);
  const y = kstTime.getUTCFullYear();
  const m = String(kstTime.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kstTime.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 오늘 날짜(KST)를 "YYYY-MM-DD"로 반환 */
function todayKst() {
  return toKstDateString(new Date());
}

/**
 * 두 "YYYY-MM-DD" 문자열 사이의 일수 차이 (dateStrB - dateStrA), 정수.
 * 시/분/초를 포함하지 않고 순수 날짜 단위(UTC 정오 고정)로 비교하여
 * DST 등의 이슈 없이 정확한 일수 차이를 계산한다.
 */
function diffInDays(dateStrA, dateStrB) {
  const a = Date.UTC(
    ...dateStrA.split("-").map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))
  );
  const b = Date.UTC(
    ...dateStrB.split("-").map((v, i) => (i === 1 ? Number(v) - 1 : Number(v)))
  );
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}

/** dateStr 기준 다음 날 문자열 반환 */
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const ny = base.getUTCFullYear();
  const nm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const nd = String(base.getUTCDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

/** "YYYY-MM" 형태의 월 문자열에서 해당 월의 일수 반환 */
function daysInMonth(year, month /* 1-12 */) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

module.exports = {
  toKstDateString,
  todayKst,
  diffInDays,
  addDays,
  daysInMonth,
};

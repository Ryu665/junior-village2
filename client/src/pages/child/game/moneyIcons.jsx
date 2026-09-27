/**
 * 게임 화면에서 쓰는 지폐/동전 아이콘.
 * 실제 한국은행권/주화 도안을 그대로 스캔/복제하면 저작권·도안 이용 규정 문제가 될 수 있어서,
 * 실물을 연상시키는 색상·모양(지폐=가로 사각형, 동전=원형)의 자체 제작 SVG로 표현한다.
 */
const BILL_THEME = {
  1000: { from: "#5b8def", to: "#2f5fc7", ring: "#dce8ff" },
  5000: { from: "#f0834f", to: "#c85a2a", ring: "#ffe6d6" },
  10000: { from: "#3fae6a", to: "#217a45", ring: "#d9f2e2" },
  50000: { from: "#e0b23c", to: "#b8891c", ring: "#fbedc7" },
};

const COIN_THEME = {
  10: { from: "#d99a6c", to: "#a8703f" }, // 구리색
  50: { from: "#e8e8ea", to: "#b9bcc2" }, // 백동색
  100: { from: "#dcdde1", to: "#a9adb6" }, // 백동색(조금 더 큼)
  500: { from: "#e4e0c8", to: "#b7ad84" }, // 황동색
};

function BillIcon({ value, size = 30 }) {
  const theme = BILL_THEME[value] || BILL_THEME[1000];
  const label = value >= 10000 ? `${value / 10000}만` : `${value / 1000}천`;
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 44 27" role="img" aria-label={`${value.toLocaleString("ko-KR")}원 지폐`}>
      <rect x="0.75" y="0.75" width="42.5" height="25.5" rx="4" fill={`url(#bill-${value})`} stroke={theme.to} strokeWidth="1" />
      <defs>
        <linearGradient id={`bill-${value}`} x1="0" y1="0" x2="44" y2="27" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={theme.from} />
          <stop offset="1" stopColor={theme.to} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="9" height="19" rx="4.5" fill={theme.ring} opacity="0.85" />
      <circle cx="8.5" cy="13.5" r="2.4" fill={theme.to} opacity="0.6" />
      <text x="27" y="17.5" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="#fff">
        {label}
      </text>
      <rect x="35.5" y="3.5" width="6" height="4.5" rx="1" fill="#fff" opacity="0.55" />
    </svg>
  );
}

function CoinIcon({ value, size = 26 }) {
  const theme = COIN_THEME[value] || COIN_THEME[100];
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" role="img" aria-label={`${value.toLocaleString("ko-KR")}원 동전`}>
      <defs>
        <radialGradient id={`coin-${value}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor={theme.from} />
          <stop offset="1" stopColor={theme.to} />
        </radialGradient>
      </defs>
      <circle cx="13" cy="13" r="11.5" fill={`url(#coin-${value})`} stroke={theme.to} strokeWidth="1.2" />
      <circle cx="13" cy="13" r="8.6" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
      <text x="13" y="16.5" textAnchor="middle" fontSize={value >= 100 ? "8" : "9.5"} fontWeight="800" fill="#5a4a2c">
        {value}
      </text>
    </svg>
  );
}

/** m = MONEY 배열 항목({ value, type }) */
export default function MoneyIcon({ value, type, size }) {
  return type === "coin" ? <CoinIcon value={value} size={size} /> : <BillIcon value={value} size={size} />;
}

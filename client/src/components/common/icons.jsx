/**
 * 메뉴 타일 전용 아이콘 세트.
 * 이모지 대신 굵기·크기가 통일된 라인 아이콘을 사용해 좀 더 정돈되고 고급스러운 느낌을 준다.
 * 모두 currentColor를 사용하므로 부모 요소의 text color를 그대로 물려받는다.
 */
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconMission(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" />
      <path d="M8 3.5V2.8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v.7" />
    </svg>
  );
}

export function IconBell(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5.2 1.5 5.8H4.5C4.5 15.7 6 14.5 6 10.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconFamily(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="2.6" />
      <circle cx="17" cy="9" r="2" />
      <path d="M4 19.5c0-3 2.2-5 5-5s5 2 5 5" />
      <path d="M15 15.2c2.2.3 3.7 1.9 3.7 4.3" />
    </svg>
  );
}

export function IconBook(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.2c-1.4-1.2-3.4-1.7-6.5-1.7v13.5c3.1 0 5.1.5 6.5 1.7" />
      <path d="M12 6.2c1.4-1.2 3.4-1.7 6.5-1.7v13.5c-3.1 0-5.1.5-6.5 1.7Z" />
      <path d="M12 6.2v13.5" />
    </svg>
  );
}

export function IconGame(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="8" width="18" height="9" rx="4" />
      <path d="M7.5 10.5v4M5.5 12.5h4" />
      <circle cx="15.5" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPiggyBank(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5c0-3.3 2.9-6 6.8-6 3.1 0 5.6 1.5 6.6 3.7l1.6.5v3l-1.7.6c-.5 1-1.4 1.8-2.5 2.3v1.9h-2v-1.4a8 8 0 0 1-2 .1v1.3h-2v-1.8c-2.3-.8-3.8-2.6-3.8-4.7Z" />
      <circle cx="15.5" cy="10.5" r="0.8" fill="currentColor" stroke="none" />
      <path d="M8.5 12.5H7" />
    </svg>
  );
}

export function IconMeal(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3v6a2 2 0 0 0 2 2v10" />
      <path d="M6 3v5M8.5 3v5" />
      <path d="M16.5 3c-1.2 0-2 1.6-2 4s.8 4 2 4v10" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.6-1.2-1.5-2.6-1.9.6a7.7 7.7 0 0 0-2.6-1.5l-.3-2h-3l-.3 2a7.7 7.7 0 0 0-2.6 1.5l-1.9-.6-1.5 2.6L6 10.5a7.6 7.6 0 0 0 0 3l-1.6 1.2 1.5 2.6 1.9-.6a7.7 7.7 0 0 0 2.6 1.5l.3 2h3l.3-2a7.7 7.7 0 0 0 2.6-1.5l1.9.6 1.5-2.6-1.6-1.2Z" />
    </svg>
  );
}

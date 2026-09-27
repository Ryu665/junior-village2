/**
 * "심부름 지폐 계산" 챌린지(레벨 1~3) 게임 엔진.
 * 원본: https://github.com/Parion88/allone-junior-money-challenge (src/App.jsx)
 * 문제 생성/채점/등급 계산 로직을 그대로 포팅했다 (프론트엔드 자체 채점 방식은 원본과 동일하게 유지).
 */

export const TOTAL_ROUNDS = 10;

export const MONEY = [
  { value: 50000, type: "bill", label: "50,000원" },
  { value: 10000, type: "bill", label: "10,000원" },
  { value: 5000, type: "bill", label: "5,000원" },
  { value: 1000, type: "bill", label: "1,000원" },
  { value: 500, type: "coin", label: "500원" },
  { value: 100, type: "coin", label: "100원" },
  { value: 50, type: "coin", label: "50원" },
  { value: 10, type: "coin", label: "10원" },
];

export const PRODUCTS = [
  { name: "초코우유", emoji: "🥛", prices: [1200, 1500, 1800] },
  { name: "과일주스", emoji: "🧃", prices: [1300, 1500, 1700] },
  { name: "쿠키", emoji: "🍪", prices: [800, 1200, 1500] },
  { name: "아이스크림", emoji: "🍦", prices: [1500, 2000, 2500] },
  { name: "스티커", emoji: "🌈", prices: [500, 800, 1000] },
  { name: "연필세트", emoji: "✏️", prices: [1000, 1500, 2000] },
  { name: "색칠북", emoji: "🎨", prices: [2500, 3500, 4500] },
  { name: "퍼즐북", emoji: "🧩", prices: [3000, 4000, 5000] },
  { name: "미니 자동차", emoji: "🚗", prices: [3500, 4500, 5500] },
  { name: "공룡 피규어", emoji: "🦖", prices: [4000, 5000, 6500] },
  { name: "미니 블록", emoji: "🧱", prices: [4500, 6000, 7500] },
  { name: "미니 인형", emoji: "🧸", prices: [3500, 5000, 7000] },
];

export const DIFFICULTIES = {
  1: {
    name: "돈과 친해지기",
    icon: "🌱",
    description: "쉬운 금액을 빠르게 맞춰봐!",
    detail: "1,000원·500원 중심의 쉬운 문제",
    modes: ["MAKE_AMOUNT", "MIN_MONEY"],
    moneyValues: [5000, 1000, 500, 100],
  },
  2: {
    name: "생활 계산",
    icon: "⭐",
    description: "어려운 금액과 거스름돈에 도전!",
    detail: "100원·50원·10원과 간단한 영수증",
    modes: ["MAKE_AMOUNT", "MIN_MONEY", "MAKE_CHANGE", "SIMPLE_RECEIPT"],
    moneyValues: [10000, 5000, 1000, 500, 100, 50, 10],
  },
  3: {
    name: "장보기 마스터",
    icon: "👑",
    description: "영수증의 수량까지 계산해봐!",
    detail: "여러 상품 × 여러 수량 + 거스름돈",
    modes: ["RECEIPT_PAY", "RECEIPT_PAY", "RECEIPT_PAY", "RECEIPT_CHANGE"],
    moneyValues: [50000, 10000, 5000, 1000, 500, 100, 50, 10],
  },
};

export const MODE_TEXT = {
  MAKE_AMOUNT: { icon: "🎯", title: "금액 만들기", guide: "목표 금액을 딱 맞게 만들어보세요." },
  MIN_MONEY: { icon: "⚡", title: "최소 화폐", guide: "가장 적은 수의 돈으로 만들면 높은 점수!" },
  MAKE_CHANGE: { icon: "💵", title: "거스름돈", guide: "낸 돈에서 물건값을 빼고 거스름돈을 만들어보세요." },
  SIMPLE_RECEIPT: { icon: "🧾", title: "영수증 계산", guide: "영수증을 보고 총 금액을 계산해 돈을 내세요." },
  RECEIPT_PAY: { icon: "🛒", title: "다품목 장보기", guide: "가격 × 수량을 계산한 뒤 전체 금액을 내세요." },
  RECEIPT_CHANGE: { icon: "🏆", title: "종합 장보기", guide: "영수증 총액을 계산하고 받을 거스름돈을 만드세요." },
};

export function won(v) {
  return `${Number(v).toLocaleString("ko-KR")}원`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sample(list) {
  return list[rand(0, list.length - 1)];
}
function shuffled(list) {
  return [...list].sort(() => Math.random() - 0.5);
}
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export function sumSelected(selected) {
  return selected.reduce((a, b) => a + b, 0);
}

function minCountUnbounded(target, denominations) {
  const sorted = [...denominations].sort((a, b) => b - a);
  let rest = target;
  let count = 0;
  for (const d of sorted) {
    const n = Math.floor(rest / d);
    count += n;
    rest -= n * d;
  }
  return rest === 0 ? count : null;
}

function makeInventory(difficulty, target) {
  const values = DIFFICULTIES[difficulty].moneyValues;
  let selectedTypes;

  if (difficulty === 1) {
    selectedTypes = shuffled(values).slice(0, rand(2, 4));
  } else if (difficulty === 2) {
    selectedTypes = shuffled(values).slice(0, rand(4, 6));
  } else {
    selectedTypes = shuffled(values).slice(0, rand(5, 7));
  }

  // 정답 금액을 반드시 만들 수 있도록 필요한 최소 화폐 단위를 포함한다.
  let remainder = target;

  if (remainder >= 1000 && values.includes(1000)) {
    selectedTypes.push(1000);
    remainder %= 1000;
  }
  if (remainder >= 500 && values.includes(500)) {
    selectedTypes.push(500);
    remainder %= 500;
  }
  if (remainder >= 100 && values.includes(100)) {
    selectedTypes.push(100);
    remainder %= 100;
  }
  if (remainder >= 50 && values.includes(50)) {
    selectedTypes.push(50);
    remainder %= 50;
  }
  if (remainder > 0 && values.includes(10)) {
    selectedTypes.push(10);
  }

  const uniqueTypes = [...new Set(selectedTypes)].sort((a, b) => b - a);

  // 선택된 화폐 기준 Greedy 정답을 계산하고, 그 정답을 실제로 꺼낼 수 있을 만큼
  // 각 화폐의 보유 수량을 보장한다. 추가 수량은 랜덤으로 준다.
  let rest = target;
  const required = {};

  uniqueTypes.forEach((value) => {
    const needed = Math.floor(rest / value);
    required[value] = needed;
    rest -= needed * value;
  });

  if (rest !== 0) {
    // 매우 드문 예외 상황에서는 10원을 추가해 다시 만든다.
    if (!uniqueTypes.includes(10) && values.includes(10)) {
      return makeInventory(difficulty, target);
    }
  }

  return uniqueTypes.map((value) => {
    const meta = MONEY.find((m) => m.value === value);
    const randomExtra = difficulty === 1 ? rand(1, 4) : rand(1, 6);
    return {
      ...meta,
      count: Math.max(required[value] || 0, 1) + randomExtra,
    };
  });
}

function generateEasyTarget() {
  const candidates = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000];
  return sample(candidates);
}

function generateMediumTarget() {
  // 1,200원 ~ 19,900원 사이에서 10원 단위로 생성한다.
  return rand(120, 1990) * 10;
}

function buildReceipt(itemCount, qtyMax) {
  const products = shuffled(PRODUCTS).slice(0, itemCount);
  const items = products.map((p) => {
    const unitPrice = sample(p.prices);
    const qty = rand(1, qtyMax);
    return { ...p, unitPrice, qty, lineTotal: unitPrice * qty };
  });
  const total = items.reduce((s, item) => s + item.lineTotal, 0);
  return { items, total };
}

function findPaidAmount(total) {
  const candidates = [5000, 10000, 20000, 50000].filter((v) => v > total);
  if (candidates.length) return candidates[0];
  return Math.ceil(total / 10000) * 10000 + 10000;
}

export function generateRound(difficulty, roundNo) {
  let mode;

  if (difficulty === 3 && roundNo === TOTAL_ROUNDS) {
    mode = "RECEIPT_CHANGE";
  } else {
    mode = sample(DIFFICULTIES[difficulty].modes);
  }

  if (mode === "MAKE_AMOUNT" || mode === "MIN_MONEY") {
    const target = difficulty === 1 ? generateEasyTarget() : generateMediumTarget();
    const inventory = makeInventory(difficulty, target);
    const minCount = minCountUnbounded(target, inventory.map((m) => m.value));
    if (minCount == null) return generateRound(difficulty, roundNo);

    return { id: uid(), mode, target, inventory, minCount };
  }

  if (mode === "MAKE_CHANGE") {
    const price = generateMediumTarget();
    const paidAmount = findPaidAmount(price);
    const target = paidAmount - price;
    const inventory = makeInventory(difficulty, target);
    const minCount = minCountUnbounded(target, inventory.map((m) => m.value));
    if (minCount == null) return generateRound(difficulty, roundNo);

    return { id: uid(), mode, price, paidAmount, target, inventory, minCount };
  }

  if (mode === "SIMPLE_RECEIPT") {
    const receipt = buildReceipt(2, 1);
    const target = receipt.total;
    const inventory = makeInventory(difficulty, target);
    const minCount = minCountUnbounded(target, inventory.map((m) => m.value));
    if (minCount == null) return generateRound(difficulty, roundNo);

    return { id: uid(), mode, receipt, target, inventory, minCount };
  }

  if (mode === "RECEIPT_PAY") {
    const itemCount = roundNo <= 3 ? 2 : rand(2, 4);
    const receipt = buildReceipt(itemCount, roundNo <= 4 ? 2 : 3);
    const target = receipt.total;
    const inventory = makeInventory(difficulty, target);
    const minCount = minCountUnbounded(target, inventory.map((m) => m.value));
    if (minCount == null) return generateRound(difficulty, roundNo);

    return { id: uid(), mode, receipt, target, inventory, minCount };
  }

  // RECEIPT_CHANGE
  const receipt = buildReceipt(roundNo === TOTAL_ROUNDS ? 4 : rand(2, 4), 3);
  const paidAmount = findPaidAmount(receipt.total);
  const target = paidAmount - receipt.total;
  const inventory = makeInventory(difficulty, target);
  const minCount = minCountUnbounded(target, inventory.map((m) => m.value));
  if (target <= 0 || minCount == null) return generateRound(difficulty, roundNo);

  return { id: uid(), mode, receipt, paidAmount, target, inventory, minCount };
}

export function calcScore({ difficulty, seconds, usedCount, minCount, wrongAttempts, combo, mode }) {
  const base = 5000;
  const timeBonus = Math.max(500, Math.round(3000 - seconds * (difficulty === 3 ? 45 : 80)));
  const pieceDiff = Math.max(0, usedCount - minCount);
  const efficiencyBonus = usedCount === minCount ? 2000 : Math.max(300, 1700 - pieceDiff * 300);
  const comboBonus = Math.min(1200, combo * 120);
  const receiptBonus = ["SIMPLE_RECEIPT", "RECEIPT_PAY", "RECEIPT_CHANGE"].includes(mode) ? 1000 * difficulty : 0;
  const retryMultiplier = Math.max(0.7, 1 - wrongAttempts * 0.05);
  const subtotal = base + timeBonus + efficiencyBonus + comboBonus + receiptBonus;
  const total = Math.round(subtotal * retryMultiplier);

  return { base, timeBonus, efficiencyBonus, comboBonus, receiptBonus, retryMultiplier, total };
}

export function grade(score, difficulty) {
  const normalized = score / (difficulty === 3 ? 1.2 : difficulty === 2 ? 1.1 : 1);
  if (normalized >= 85000) return { icon: "👑", name: "올원 머니왕" };
  if (normalized >= 72000) return { icon: "🏆", name: "머니 마스터" };
  if (normalized >= 60000) return { icon: "⭐", name: "돈 박사" };
  if (normalized >= 45000) return { icon: "🐥", name: "돈 계산가" };
  return { icon: "🌱", name: "돈 새싹" };
}

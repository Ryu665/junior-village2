import Card from "./Card";

/** 자녀 화면 공통 "내 잔액" 카드. 진한 초록 그라데이션 대신 연한 연두색 톤 + 진한 텍스트로 가독성을 높인다. */
export default function BalanceCard({ balance, size = "lg" }) {
  return (
    <Card className="bg-gradient-to-br from-lime-100 to-lime-200 ring-1 ring-lime-200/70">
      <p className="text-sm text-lime-800 font-medium">내 잔액</p>
      <p className={`font-extrabold text-lime-900 ${size === "lg" ? "text-3xl" : "text-2xl"}`}>
        {balance.toLocaleString("ko-KR")}원
      </p>
    </Card>
  );
}

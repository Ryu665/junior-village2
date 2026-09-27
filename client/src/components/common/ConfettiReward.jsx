const COLORS = ["#2fae55", "#ffd166", "#ef476f", "#118ab2", "#a78bfa", "#f78c6b"];

/**
 * 리워드 연출 오버레이. 미션 승인/완료, 퀴즈 완료, 보물상자 등에서 재사용.
 * emoji: 중앙 큰 이모지, title/subtitle: 문구, onClose: 닫기 콜백
 */
export default function ConfettiReward({ emoji = "🎉", title, subtitle, onClose }) {
  const confetti = Array.from({ length: 24 });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map((_, i) => (
          <span
            key={i}
            className="absolute top-0 block w-2 h-3 rounded-sm animate-confetti-fall"
            style={{
              left: `${(i * 97) % 100}%`,
              backgroundColor: COLORS[i % COLORS.length],
              animationDelay: `${(i % 8) * 0.08}s`,
            }}
          />
        ))}
      </div>
      <div
        className="relative bg-white rounded-3xl px-8 py-10 mx-6 text-center shadow-card-lg animate-pop-in max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3 animate-bounce-slow">{emoji}</div>
        <p className="text-xl font-extrabold text-gray-800 mb-1 whitespace-pre-line">{title}</p>
        {subtitle && <p className="text-gray-500 font-medium whitespace-pre-line">{subtitle}</p>}
        <button
          onClick={onClose}
          className="btn-big mt-6 bg-junior-500 text-white w-full"
        >
          확인했어요!
        </button>
      </div>
    </div>
  );
}

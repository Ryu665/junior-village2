import { AVATAR_CHARACTERS } from "../../data/avatarCharacters";

const EMOJIS = ["🦁", "🐰", "🐻", "🐼", "🐯", "🐸", "🐵", "🐶", "🐱", "🦊", "🐨", "🐷", "🐹", "🦄", "🐧", "🐢", "🦖", "🐙", "🌟", "🍀"];

const GOAL_EMOJIS = ["🎯", "🚲", "🎮", "👟", "📱", "🎧", "🛴", "⚽", "🏀", "🎨", "📚", "🧸", "🎸", "✈️", "🏕️", "🎁", "🍰", "⌚", "👜", "🎪"];

/**
 * mode="character": 자녀 계정용 캐릭터 이미지 선택지.
 * mode="goal": 저축 목표용 이모지 선택지(자전거·게임기 등).
 * 기본(mode="emoji")은 기존 동물 이모지 선택지.
 */
export default function EmojiPicker({ value, onChange, mode = "emoji" }) {
  if (mode === "character") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {AVATAR_CHARACTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            aria-label={c.name}
            className={`tap-target rounded-xl p-1 flex items-center justify-center border-2 transition-colors ${
              value === c.id ? "border-junior-500 bg-junior-50" : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <img src={c.src} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
          </button>
        ))}
      </div>
    );
  }

  const emojis = mode === "goal" ? GOAL_EMOJIS : EMOJIS;
  return (
    <div className="grid grid-cols-5 gap-2">
      {emojis.map((e) => (
        <button
          key={e}
          onClick={() => onChange(e)}
          className={`tap-target text-2xl rounded-xl py-2 flex items-center justify-center border-2 transition-colors ${
            value === e ? "border-junior-500 bg-junior-50" : "border-gray-100 hover:border-gray-200"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

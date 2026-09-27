import { AVATAR_CHARACTER_MAP } from "../../data/avatarCharacters";

/**
 * 유저의 avatarEmoji 값을 보여준다. 새 캐릭터 아이디(예: "oli-1")면 이미지로,
 * 옛날 데이터처럼 일반 이모지 문자열이면 텍스트로 그대로 보여준다(하위 호환).
 */
export default function Avatar({ value, className = "w-8 h-8", textClassName = "" }) {
  const character = AVATAR_CHARACTER_MAP.get(value);
  if (character) {
    return (
      <img
        src={character.src}
        alt={character.name}
        className={`inline-block rounded-full object-cover bg-white shrink-0 ${className}`}
      />
    );
  }
  return <span className={textClassName}>{value}</span>;
}

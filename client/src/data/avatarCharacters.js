import oli1 from "../assets/avatars/oli-1.jpg";
import oli2 from "../assets/avatars/oli-2.jpg";
import oli3 from "../assets/avatars/oli-3.jpg";
import woni1 from "../assets/avatars/woni-1.jpg";
import woni2 from "../assets/avatars/woni-2.jpg";
import woni3 from "../assets/avatars/woni-3.jpg";
import danji1 from "../assets/avatars/danji-1.jpg";
import danji2 from "../assets/avatars/danji-2.jpg";
import danji3 from "../assets/avatars/danji-3.jpg";
import dari1 from "../assets/avatars/dari-1.jpg";
import dari2 from "../assets/avatars/dari-2.jpg";
import dari3 from "../assets/avatars/dari-3.jpg";
import kori1 from "../assets/avatars/kori-1.jpg";
import kori2 from "../assets/avatars/kori-2.jpg";
import kori3 from "../assets/avatars/kori-3.jpg";

// 자녀 계정 대표 이미지로 쓰는 NH농협 "올리원이" 캐릭터 모음.
export const AVATAR_CHARACTERS = [
  { id: "oli-1", src: oli1, name: "올리" },
  { id: "oli-2", src: oli2, name: "올리" },
  { id: "oli-3", src: oli3, name: "올리" },
  { id: "woni-1", src: woni1, name: "원이" },
  { id: "woni-2", src: woni2, name: "원이" },
  { id: "woni-3", src: woni3, name: "원이" },
  { id: "danji-1", src: danji1, name: "단지" },
  { id: "danji-2", src: danji2, name: "단지" },
  { id: "danji-3", src: danji3, name: "단지" },
  { id: "dari-1", src: dari1, name: "달리" },
  { id: "dari-2", src: dari2, name: "달리" },
  { id: "dari-3", src: dari3, name: "달리" },
  { id: "kori-1", src: kori1, name: "코리" },
  { id: "kori-2", src: kori2, name: "코리" },
  { id: "kori-3", src: kori3, name: "코리" },
];

export const DEFAULT_CHILD_AVATAR = AVATAR_CHARACTERS[0].id;

export const AVATAR_CHARACTER_MAP = new Map(AVATAR_CHARACTERS.map((c) => [c.id, c]));

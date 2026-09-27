/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // 부모 화면: NH농협은행 톤의 신뢰감 있는 블루
        parent: {
          50: "#eef4fb",
          100: "#d7e6f6",
          200: "#a9c9ea",
          300: "#7aacdd",
          400: "#3d7dc4",
          500: "#0f5aac",
          600: "#0b478a",
          700: "#0a3c73",
          800: "#082f5c",
          900: "#062446",
        },
        // 자녀 화면: 올원뱅크 톤의 밝은 그린
        junior: {
          50: "#eefaf0",
          100: "#d3f3da",
          200: "#a7e7b6",
          300: "#78d891",
          400: "#4bc76e",
          500: "#2fae55",
          600: "#238c44",
          700: "#1c6f37",
          800: "#17572c",
          900: "#124524",
        },
      },
      fontFamily: {
        // '고딕체'(한글 산세리프 계열) 통일 지정. Noto Sans KR을 우선 로드하고,
        // OS별 고딕 폴백(Apple SD Gothic Neo / Malgun Gothic)을 뒤에 둔다.
        sans: ["'Noto Sans KR'", "'Apple SD Gothic Neo'", "'Malgun Gothic'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // 기존보다 레이어를 더 쌓아 평면적이지 않고 입체감 있는 톤으로.
        // (각 항목이 inset 하이라이트 + drop shadow를 한 번에 포함 — box-shadow는 유틸리티 하나만 적용되므로 합쳐서 정의)
        card: "inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(15,30,20,0.04), 0 8px 20px rgba(15,30,20,0.08)",
        "card-lg": "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px rgba(15,30,20,0.06), 0 16px 40px rgba(15,30,20,0.16)",
        raised: "inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 24px -6px rgba(15,30,20,0.35)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(240px) rotate(360deg)", opacity: "0" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.25s ease-out",
        "confetti-fall": "confetti-fall 1.4s ease-in forwards",
        "bounce-slow": "bounce-slow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

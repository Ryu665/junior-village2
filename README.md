# 🏦 주니어빌리지 (Junior Village)

어린이(7~13세)가 부모와 함께 쓰는 금융 교육·미션·용돈 플랫폼 **프로토타입**입니다.
실제 은행 코어뱅킹/결제망과는 연동하지 않으며, 이체·잔액 등은 모두 앱 자체 SQLite DB 안에서 동작하는
모의(mock) 로직으로 구현되어 있습니다. (`server/src/services/bankingService.js` 참고 — 추후 실제
뱅킹 API로 교체하기 쉽도록 이체 로직을 인터페이스 형태로 분리해두었습니다.)

> ⚠️ TODO(실서비스 전환 시): 실명확인, 법정대리인 동의, 전자금융거래법 등 관련 법규 준수가 필요합니다.
> 코드 곳곳의 `TODO` 주석을 참고하세요.

---

## 1. 기술 스택

- **프론트엔드**: React (Vite) + React Router + Zustand + TailwindCSS
- **백엔드**: Node.js + Express (REST API)
- **DB**: SQLite (파일 기반) + Prisma ORM
- **인증**: JWT(Access 15분 + Refresh 30일, httpOnly 쿠키) — 부모/자녀 role 기반
- **모노레포**: `/client`, `/server` (npm workspaces)

## 2. 폴더 구조

```
junior-village-v2/
├── client/            # React (Vite) 프론트엔드
│   └── src/
│       ├── api/           # axios 기반 API 모듈
│       ├── components/    # 공통 컴포넌트 (BackHeader, Button, ConfettiReward 등)
│       ├── pages/          # 화면 (ProfileSelect, Home, Settings, parent/*, child/*)
│       └── store/          # Zustand 인증 스토어
├── server/            # Express + Prisma 백엔드
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── routes/         # auth, users, missions, accounts, savingsGoal, notifications, games, education
│       ├── services/       # bankingService(이체 인터페이스), streakService(연속학습 핵심 로직)
│       ├── middleware/     # JWT 인증/권한, 에러 핸들러
│       └── data/           # 퀴즈 문제은행(1,000문항), 배움 콘텐츠
└── scripts/
    └── generate-quiz-bank.js   # 오늘의 퀴즈 문제은행 1,000개 생성 스크립트
```

## 3. 설치 및 실행 방법

### 3-1. 최초 설치 (루트에서 한 번만)

```bash
npm install
```

npm workspaces로 `client`, `server`의 의존성이 함께 설치됩니다.

### 3-2. DB 마이그레이션 + 시드 데이터 생성 (최초 1회, 또는 초기화하고 싶을 때)

```bash
cd server
npx prisma migrate dev --name init   # 최초 1회 (이미 저장소에 migrations가 있다면 생략 가능)
npm run seed
cd ..
```

시드 데이터: **부모 1명 + 자녀 2명** + 샘플 미션/거래내역/저축목표/학교/교육콘텐츠

| 계정 | 이름 | PIN | 비고 |
| --- | --- | --- | --- |
| 부모 | 김민정 | `1234` | 자녀 2명과 연동됨 |
| 자녀1 | 이준 | `1111` | 서울대학교사범대학부설초등학교, "방 청소하기" 등 미션 보유, 연속학습 3일째 |
| 자녀2 | 이서 | `2222` | 한빛초등학교(경기 파주), 승인 대기 중인 미션 제출 1건 존재 |

시드 학교 2곳은 나이스(NEIS) 교육정보 개방포털에 실제로 등록된 학교라서 별도 재검색 없이도
급식메뉴 기능이 바로 동작합니다.

### 3-2-1. NEIS(나이스) Open API 키 설정 (학교 검색 · 급식메뉴 기능에 필요)

https://open.neis.go.kr 에서 인증키를 발급받아 `server/.env`에 넣어주세요. 키는 저장소에 커밋하지 않습니다.

```
NEIS_API_KEY="<발급받은 NEIS 인증키>"
```

### 3-3. 개발 서버 실행

```bash
npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3001 (Vite가 `/api`를 자동으로 프록시합니다)

### 3-4. 퀴즈 문제은행 재생성 (선택)

`server/src/data/quizBank.json`은 아래 스크립트로 생성된 것이며, 필요 시 재실행하면 매번 랜덤하게
1,000개 문항이 다시 만들어집니다 (문제 유형/난이도 비율은 동일하게 유지됩니다).

```bash
node scripts/generate-quiz-bank.js
```

## 4. 로그인 방법

첫 화면에서 아이디/비밀번호를 입력하는 대신 **부모1 / 자녀1 / 자녀2 프로필 카드를 선택**하고 PIN
4자리를 입력하면 로그인됩니다. 화면 하단의 "다른 계정으로 로그인"을 누르면 계정을 직접 선택해
로그인할 수도 있습니다.

## 5. 핵심 기능 요약

- **미션 · 용돈 이체**: 부모가 미션 생성 → 자녀 완료 제출 → 부모 승인 → 즉시 모의 이체 + 리워드 연출
- **게임 "딱! 맞춰 머니챌린지"**: [Parion88/allone-junior-money-challenge](https://github.com/Parion88/allone-junior-money-challenge)의
  레벨 1~3(돈과 친해지기 / 생활 계산 / 장보기 마스터) 게임 로직과 UI를 그대로 포팅했습니다
  (`client/src/pages/child/game/`). 10라운드 동안 지폐·동전을 골라 목표 금액·거스름돈·영수증 총액을
  맞히고, 시간/화폐 효율/콤보 보너스로 점수를 계산합니다. 점수는 난이도별로 서버에 저장되어 **개인
  랭킹 / 우리 학교 랭킹 / 학교별 랭킹(상위 3명 평균)** 을 확인할 수 있습니다.
- **부모/자녀 대시보드**: 잔액, 진행 미션, 거래내역, 저축 목표를 카드 UI로 확인
- **금융교육**: 배움 콘텐츠(랜덤 카드) + 오늘의 퀴즈(1,000문항 중 매일 3문제) + 연속학습/레벨/포인트/
  보물상자 + 매달 출석 캘린더. 모든 판정(출석/연속학습/포인트/보물상자)은 **서버에서만** 계산되며
  동일 요청이 여러 번 와도 중복 지급되지 않도록 idempotent하게 구현되어 있습니다
  (`server/src/services/streakService.js`).
- **설정**: 대표 이모지(캐릭터) 변경, PIN 변경, (자녀) 내 학교 등록/변경 — Home 화면 우측 상단 설정
  아이콘에서 진입
- **학교 등록 (실제 학교 검색)**: 나이스(NEIS) 교육정보 개방포털 `schoolInfo` API로 실제 존재하는
  학교를 검색해서 등록합니다 (`client/src/components/common/SchoolPicker.jsx`). 부모는 자녀 계정
  관리 화면에서 자녀별로, 자녀는 설정 화면에서 본인 학교를 등록/변경할 수 있습니다.
- **급식메뉴**: 나이스 `mealServiceDietInfo` API 연동. 자녀는 본인 학교, 부모는 학교가 등록된 자녀
  중 선택해서 조회합니다. 등록된 학교가 없으면 등록 화면으로 안내합니다
  (`server/src/services/neisService.js`, `client/src/pages/MealMenu.jsx`).
- **알림함(부모)**: 미션 제출 알림에서 바로 승인/반려할 수 있습니다 (승인 시 즉시 이체).
- **저축 목표**: 자녀가 계좌 잔액에서 목표로 직접 "저금하기"를 할 수 있고, 목표 달성 시 리워드
  연출이 뜹니다.

## 6. 알려진 단순화 사항 (데모 프로토타입 한계)

- 자녀 계정 "초대 코드" 연동은 데모 편의를 위해 부모가 자녀 계정을 생성하는 즉시 자동으로 연동되며,
  초대 코드는 화면에 표시만 됩니다(실제 별도 기기에서 코드 입력으로 가입하는 흐름은 없음).
- "다른 계정으로 로그인"의 수동 로그인 폼은 시드된 프로필 목록 중에서 선택 + PIN 입력 방식입니다.
- 게임 점수는 프론트엔드에서 문제를 생성하고 채점하는 클라이언트 로직입니다(퀴즈처럼 서버 검증
  대상은 아님) — 난이도별 점수 저장/개인·학교 랭킹 조회 API는 서버에 구현되어 있습니다.
- 게임의 "닉네임"은 원본과 달리 별도로 입력받지 않고 로그인한 자녀 계정 이름을 그대로 사용합니다.

## 7. 디자인 / 폰트

- 전체 폰트를 고딕체 계열(Noto Sans KR, 폴백: Apple SD Gothic Neo / Malgun Gothic)로 통일했습니다.
- 카드·버튼·헤더 등 공통 컴포넌트(`client/src/components/common/`)에 그라데이션과 다층 그림자를 적용해
  기존의 평면적인 단색 UI보다 입체감 있는 톤으로 개선했습니다. 이 컴포넌트들을 앱 전역에서 재사용하므로
  미션/대시보드/설정/금융교육 등 대부분의 화면에 자동으로 반영됩니다.
- 게임 화면은 원본 UI(둥근 카드, 영수증, 지폐/동전 버튼 등)를 `client/src/pages/child/game/moneyChallenge.css`
  에 이식해 사용합니다.

## 8. 외부 배포 (Render)

저장소 루트의 `render.yaml`(Blueprint)로 Render 무료 웹서비스 1개에 배포합니다. 서버가 빌드된 프론트엔드
(`client/dist`)까지 함께 서빙하므로 URL 하나로 접속되고 CORS 설정이 필요 없습니다.

1. https://render.com 에서 GitHub 계정으로 가입/로그인
2. **New + → Blueprint** → 이 저장소 선택 → `render.yaml` 감지 후 진행
3. 환경변수 `NEIS_API_KEY`(나이스 인증키)만 대시보드에서 직접 입력 (나머지는 자동 생성/설정)
4. 배포가 끝나면 `https://junior-village-xxxx.onrender.com` 형태의 주소로 접속

주의사항
- 무료 플랜은 15분간 요청이 없으면 잠들고, 다시 접속 시 첫 로딩에 30~60초 걸립니다.
- 무료 플랜은 디스크가 임시라서 **재시작/재배포 때마다 DB가 초기화**되고 데모 시드 데이터로 다시 채워집니다
  (`server/scripts/start-prod.js`가 DB가 비어 있을 때만 시드). 데이터를 영구 보관하려면 유료 디스크 또는
  외부 DB(PostgreSQL 등)로 전환이 필요합니다.
- 시드 계정 PIN(1234/1111/2222)이 공개돼 있으므로 실제 개인정보는 넣지 마세요.

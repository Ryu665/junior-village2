# 주니어빌리지 작업 기록 (이어서 작업하기용)

> 이 파일은 Claude Code 세션이 바뀌어도 맥락을 바로 이어받을 수 있도록 작성한 진행 기록입니다.
> 새 세션에서 이어서 작업할 때: 이 파일 경로(`C:\Users\krk10\Documents\junior-village-v2\PROGRESS.md`)를
> 알려주거나 내용을 붙여넣고 "이어서 작업해줘"라고 하면 됩니다.

- **프로젝트 경로**: `C:\Users\krk10\Documents\junior-village-v2`
- **마지막 작업일**: 2026-09-19
- **원본 요구사항 파일**: `C:\Users\krk10\OneDrive\바탕 화면\주니어빌리지\prompt20260913.txt`
- **기존(구) 프로젝트**: `C:\Users\krk10\Documents\junior-village` — 이건 건드리지 않고 그대로 둠 (이 v2가 최신/작업 대상)

---

## 1. 프로젝트가 무엇인가

"주니어빌리지(Junior Village)" — 어린이(7~13세)가 부모와 함께 쓰는 은행 부가서비스(금융 교육·미션·
용돈) 웹앱 프로토타입. React(Vite)+Zustand+Tailwind 프론트엔드, Node/Express+Prisma+SQLite 백엔드,
npm workspaces 모노레포(`/client`, `/server`).

전체 기술스택/기능 요구사항 원본은 `prompt20260913.txt` 참고. 최초 구현 시 이 요구사항 전체
(미션·이체, 게임, 부모/자녀 대시보드, 금융교육 배움·퀴즈·연속학습·레벨·포인트·보물상자·출석캘린더,
설정 등)를 구현 완료했음.

## 2. 지금까지 세션별로 한 일

### 세션 1 — 최초 스캐폴딩 & 전체 MVP 구현
- 모노레포 스캐폴딩, Prisma 스키마(User/Account/Transaction/Mission/MissionSubmission/SavingsGoal/
  School/GameSession/Notification/EducationCard/LearningState/DailyQuiz), seed 스크립트(부모1+자녀2)
- 퀴즈 문제은행 1,000문항 자동 생성 스크립트(`scripts/generate-quiz-bank.js`) → `server/src/data/quizBank.json`
- 인증(PIN 로그인, JWT access+refresh), 부모/자녀 권한 분리(자녀는 부모 데이터 접근 불가)
- 미션 생성→제출→승인→모의이체(bankingService, 추후 실뱅킹API 교체 대비 인터페이스 분리) 전 과정
- 금융교육: 배움 콘텐츠, 오늘의 퀴즈(서버가 매일 3문제 배정·저장), 연속학습/레벨/포인트/보물상자
  전부 서버 검증 + idempotent (streakService.js가 핵심 — prompt의 3-4 섹션 규칙 전부 구현)
- 부모/자녀 대시보드, 저축목표, 알림함, 설정(이모지/PIN 변경)
- 게임 1차 버전(자체 제작한 간단한 거스름돈 계산 게임) — **이후 세션에서 교체됨(아래 참고)**
- README.md 작성, curl로 전체 API 플로우 검증, `npm run build` 통과 확인

### 세션 2 — `npm run dev` 안 됨 트러블슈팅
- 원인: 이전 세션들이 테스트하며 띄운 백그라운드 프로세스가 완전히 안 죽고 포트(3001/5173)를 계속
  점유 → 사용자가 `npm run dev` 실행 시 `EADDRINUSE`류 오류로 실패했을 가능성 높음
- 좀비 프로세스 정리, 실행 경로 안내(`C:\Users\krk10\Documents\junior-village-v2` 루트에서 실행)

### 세션 3 (2026-09-14) — 게임 교체 + 폰트 + 디자인 고급화 ⭐ 가장 최근
사용자 요청 4가지, 전부 완료:

1. **게임을 Parion88 소스의 레벨 1~3으로 교체**
   - 원본: https://github.com/Parion88/allone-junior-money-challenge (React/Vite, `src/App.jsx` +
     `src/styles.css`를 GitHub에서 직접 fetch해서 로직/스타일 그대로 확인 후 포팅)
   - 레벨 1(돈과 친해지기)/2(생활 계산)/3(장보기 마스터), 10라운드, 목표금액 만들기·최소화폐·
     거스름돈·영수증(다품목 장보기/거스름돈) 문제 유형, 시간·효율·콤보·영수증 보너스 점수 계산,
     등급(돈 새싹~올원 머니왕) — 원본 로직을 **순수 함수로 그대로 포팅**
   - 원본은 랭킹을 Supabase/localStorage에 저장했는데, 이 부분만 우리 자체 백엔드로 교체:
     - `server/prisma/schema.prisma`의 `GameSession`에 `difficulty Int @default(1)` 필드 추가
       (마이그레이션: `20260913144848_add_game_difficulty`)
     - `server/src/routes/game.routes.js`: `POST /sessions`에 difficulty 저장, `GET /leaderboard`에
       difficulty 필터 추가, `GET /school-ranking` 신규(학교별 "학생 최고기록 상위 3명 평균" 랭킹)
     - `client/src/api/games.js`: `submitGameScore(score, difficulty)`, `fetchSchoolRanking()` 추가
   - 새 파일: `client/src/pages/child/game/moneyChallengeEngine.js`(순수 로직),
     `client/src/pages/child/game/Game.jsx`(UI, 우리 앱 인증/BackHeader와 통합),
     `client/src/pages/child/game/moneyChallenge.css`(원본 CSS를 `mc-` 접두사로 이식)
   - 기존 `client/src/pages/child/Game.jsx`는 `export { default } from "./game/Game";` 한 줄짜리
     재수출 shim으로 바꿔서 App.jsx 라우트 수정 없이 교체되도록 함
   - 검증: 엔진 로직 9,000라운드 Node 시뮬레이션(예외 없음), 백엔드 신규 API curl 테스트, `npm run build` 통과

2. **게임 UI 디자인을 Parion88 소스 UI로 변경** — 위 `moneyChallenge.css`가 원본 UI(영수증 카드,
   지폐/동전 버튼, 난이도 카드, 콤보 헤더, 결과 모달, 랭킹 탭 등) 그대로 이식한 것

3. **전체 폰트를 고딕체로 변경**
   - `client/index.html`에 Google Fonts "Noto Sans KR"(400/500/700/800/900) 링크 추가
   - `client/tailwind.config.js`의 `fontFamily.sans`를 `['Noto Sans KR', 'Apple SD Gothic Neo',
     'Malgun Gothic', ...]`로 변경, `client/src/index.css`의 `body`에도 명시
   - (참고: 기존엔 Pretendard를 지정만 하고 실제 로드를 안 해서 OS 기본 폰트로 보이던 잠재 버그였음.
     이번에 같이 고쳐짐)

4. **앱 전체 디자인을 평면적 2D 색상 → 입체감 있는 고급스러운 톤으로 개선**
   - `client/tailwind.config.js`의 `boxShadow` 토큰을 다층 그림자(`card`, `card-lg`, `raised`)로 교체
   - 공통 컴포넌트(앱 전역에서 재사용되므로 자동으로 대부분 화면에 반영됨):
     - `client/src/components/common/Card.jsx` — 그라데이션 배경 + 인셋 하이라이트 + 그림자
     - `client/src/components/common/Button.jsx` — 톤별 그라데이션 배경
     - `client/src/components/common/BackHeader.jsx` — 그라데이션 헤더
   - `client/src/pages/Home.jsx` 메뉴 타일(아이콘 배지에 그라데이션+raised 그림자),
     `client/src/pages/ProfileSelect.jsx` 프로필 카드/PIN 키패드도 같은 톤으로 업데이트
   - `client/src/index.css`의 `body` 배경을 은은한 radial-gradient로, `.app-shell`에 레이어드 그림자 추가

- 이 과정에서 이전 세션들이 남긴 좀비 node 프로세스 14개 발견 → 일반 `Stop-Process`/`taskkill`이
  "액세스 거부"로 실패 → **WMIC(`wmic process where "ProcessId=X" call terminate`)로 강제 종료 성공**.
  (다음에 또 프로세스가 안 죽으면 이 방법을 쓰면 됨)

### 세션 4 (2026-09-14) — 부모/자녀 미완성 기능 완성 + NEIS 학교/급식 연동 ⭐ 가장 최근

사용자가 "수정해줘야 할 사항" 6가지를 요청, 전부 완료:

1. **부모 "알림함"/"자녀계정" 마저 구현** — 라우팅 자체는 정상 동작했으나(코드 검토로 확인),
   실제로는 "기능이 미완성"이었던 것: 알림함에서 미션 제출 알림을 봐도 승인/반려를 바로 할 수
   없었고(다른 화면으로 이동해야 함), 자녀 계정 관리에서는 기존 자녀의 학교를 등록/변경할 방법이
   아예 없었음(생성 시점에만 가능). → 알림함에 인라인 승인/반려 버튼 추가
   (`Notification` 모델에 `missionId`/`childId` 필드 추가), 자녀 계정 관리에 학교 등록/변경 버튼 추가
   (`PATCH /api/users/children/:childId/school` 신규).
2. **자녀 "저축목표" 마저 구현** — 목표를 만들 수는 있었지만 진행률을 올릴 방법이 없었음(정적 표시만).
   → "+ 저금하기" 기능 추가: 계좌 잔액에서 목표 금액으로 실제 이체(모의), 잔액 부족 시 거절,
   목표 달성 시 리워드 연출. (`POST /api/savings-goals/:id/deposit` 신규)
3. **게임 점수가 학교 랭킹에 반영 안 됨** — 근본 원인은 학교 등록 로직이 두 군데
   (`game.routes.js`와 `user.routes.js`)에 중복 구현되어 있었고 각각 `School.name`으로만 upsert하는
   방식이라 취약했음. → 4번 항목(NEIS 학교 검색)으로 학교 등록을 완전히 일원화하면서 근본적으로 해결.
4. **실제 학교 검색/선택 (NEIS 연동)** — `School` 모델에 `neisAtptCode`/`neisSchoolCode`/`address`
   추가(유니크 키를 이름 대신 이 코드 조합으로 변경). `server/src/services/neisService.js`가
   나이스 `schoolInfo` API를 호출해 실제 학교를 검색(`GET /api/schools/search?q=`). 새
   컴포넌트 `client/src/components/common/SchoolPicker.jsx`(디바운스 검색+선택)를 자녀 계정 관리
   (부모, 자녀별), 설정(자녀 본인), 게임 최초 학교 등록 화면 3곳에 적용.
5. **급식메뉴 (NEIS 급식 API)** — `server/src/services/neisService.js`의 `getMeal()`이
   `mealServiceDietInfo` API 호출 (`GET /api/schools/:schoolId/meal?date=YYYYMMDD`). 새 페이지
   `client/src/pages/MealMenu.jsx` (`/meal` 라우트, 부모/자녀 공용, Home의 "게임" 옆 "급식메뉴"
   타일에서 진입). 자녀는 본인 학교, 부모는 학교가 등록된 자녀 중 탭으로 선택. 학교 미등록 시
   안내 메시지 + 등록 화면으로 이동하는 버튼. NEIS 키는 `server/.env`의 `NEIS_API_KEY`
   (값은 공개 저장소라 여기 적지 않음 — 로컬 `.env` 참고).
6. **메뉴 아이콘을 이모지 → 통일된 라인 아이콘으로 교체** — `client/src/components/common/icons.jsx`에
   손으로 그린 SVG 라인 아이콘 7종(IconMission/Bell/Family/Book/Game/PiggyBank/Meal/Settings) 추가,
   Home 메뉴 타일과 설정 아이콘에 적용.

**시드 데이터 변경**: 자녀1 학교를 "새싹초등학교"(가상)에서 실제 존재하는
**서울대학교사범대학부설초등학교**(NEIS 코드 B10/7061128)로 교체 — 급식메뉴가 시드 상태에서도
바로 동작하도록 실제 NEIS API로 코드를 확인 후 반영함. 자녀2 "한빛초등학교"는 실제로 존재하는
학교(경기 파주, J10/7681149)라 이름은 유지하고 코드만 채움.

**DB 마이그레이션**: `20260914000000_school_neis_and_notification_fields` — `prisma migrate dev`가
비대화형 환경에서 경고 확인을 요구해 실패하여, 마이그레이션 SQL을 직접 작성하고
`prisma migrate deploy`로 적용함(SQLite는 unique 제약 변경 시 테이블 재생성이 필요해 School 테이블은
새로 만들어 데이터를 복사하는 방식 사용). 이후 세션에서 스키마를 또 바꿔야 한다면 같은 방식
(수동 SQL 작성 + `migrate deploy`)을 쓰면 된다.

**검증**: 실제 NEIS API로 학교 검색·급식 조회 curl 테스트(정상 응답, 알레르기 표시 파싱 확인),
알림함 인라인 승인, 저축 목표 입금(성공/잔액부족), 부모의 기존 자녀 학교 변경(권한 체크 포함),
두 자녀가 같은 학교로 등록됐을 때 학교 랭킹이 올바르게 합산되는지까지 전부 curl로 end-to-end 확인.
`npm run build` 통과(142 모듈).

**또 발생한 이슈**: 이번에도 이전 세션들의 좀비 node 프로세스(7개)가 남아있어서 Prisma 클라이언트
재생성 시 EPERM(파일 잠금) 오류 발생 → WMIC로 강제 종료 후 해결. **패턴이 반복되고 있음**: 다음
세션에서 스키마 변경(`prisma generate`/`migrate`)이 필요하면 먼저 `tasklist | grep node`로 확인하고,
일반 kill이 안 되면 `wmic process where "ProcessId=X" call terminate`를 쓸 것.

### 세션 5 (2026-09-19) — 자녀 삭제, 타일 색상 그룹화, 게임 랭킹 마스킹 ⭐ 가장 최근

사용자가 "서버가 안 켜져서 안 된다"고 해서 확인해보니 이번엔 좀비 프로세스/포트 점유가 없었고
단순히 `npm run dev`가 안 떠 있던 상태였음 (원인 특정은 못 했지만 재실행으로 바로 정상화됨).

이어서 요청 3가지, 전부 완료:

1. **부모 "알림함"/"자녀계정" 재점검** — 코드 확인 결과 두 화면 다 세션 4에서 이미 구현·라우팅
   완료된 상태였음(알림함 인라인 승인/반려, 자녀계정 학교 등록/변경). 사용자가 "아무것도 동작 안
   함"이라 한 건 위 서버 다운 상태에서 겪은 증상으로 추정. 다만 **자녀 계정 삭제 기능은 실제로
   없었어서** 이번에 추가함:
   - `DELETE /api/users/children/:childId` (`user.routes.js`) — 소유권 확인 후 `$transaction`으로
     Notification/MissionSubmission/Mission/GameSession/SavingsGoal/DailyQuiz/LearningState/Account/
     ParentChildLink를 순서대로 정리하고 마지막에 User 삭제 (FK 제약 순서 주의: 미션 삭제 전에
     그 미션의 제출 내역부터 지워야 함)
   - `client/src/api/users.js`에 `deleteChild` 추가, `ChildManage.jsx`에 카드별 "🗑️ 삭제" 버튼 +
     인라인 확인 패널(되돌릴 수 없음 경고 문구 포함) 추가
   - curl로 테스트 자녀 생성 → 미션 부여 → 삭제까지 end-to-end 검증(FK 에러 없이 정상 삭제,
     기존 시드 자녀 2명은 그대로 유지되는 것 확인)

2. **홈 화면 메뉴 타일 색상 그룹화** — `Home.jsx`의 `MenuTile`이 기존엔 role(parent/junior) 톤
   하나만 썼는데, 기능 그룹별 톤을 받도록 `TILE_TONES` 맵으로 리팩터링:
   - `mission`(미션 관리/미션/저축목표) = amber, `learn`(금융교육/게임) = violet,
     `meal`(급식메뉴, 부모/자녀 공용) = rose — 전부 Tailwind 기본 팔레트라 config 수정 없이 바로 사용
   - 부모의 "알림함"/"자녀 계정"은 기존 parent 톤 그대로 유지(그룹화 요청 대상이 아니었음)

3. **게임 랭킹 개선** — 서버의 `/api/games/school-ranking`(전체 학교별 랭킹)과 `/leaderboard`
   (개인 랭킹, 학교 필터 가능)는 세션 3에서 이미 구현되어 있었고, 클라이언트 `Game.jsx`의
   `Ranking` 컴포넌트도 "학교"/"우리 학교"/"개인" 3탭 + 본인 기록 하이라이트까지 이미 구현된
   상태였음(확인 완료). 이번에 새로 추가한 건 "개인" 탭 전용 이름 마스킹:
   - `maskName()` 추가 (`이준`→`이*`, `김민정`→`김*정` 식으로 첫/끝 글자만 남기고 중간을 `*` 처리)
   - "개인" 탭에서만 적용, "우리 학교" 탭은 기존처럼 본인 학교 학생 이름을 그대로 보여줌(하이라이트로
     구분되므로 마스킹 불필요 판단)

**검증**: `npm run build`(client, 142 모듈) 통과, HMR로 3개 파일 반영 후 에러 없음, curl로 자녀 삭제
cascade 정상 동작 확인.

**추가로 발견해서 고친 버그** — 자녀계정 화면이 흰 화면으로 크래시(`Uncaught TypeError: destroy is
not a function`, `ChildManage`에서 발생): `const load = () => fetchX().then(setY); useEffect(load, [])`
패턴이 원인. 화살표 함수 축약형(`=>` 뒤에 블록 `{}` 없이 바로 식)이라 `.then()`이 반환하는 Promise를
그대로 리턴하는데, React StrictMode(개발 모드)가 effect를 mount→cleanup→remount로 두 번 실행하면서
그 cleanup 단계에서 반환된 Promise를 정리 함수인 줄 알고 호출하려다 크래시남. 에러 바운더리가 없어서
페이지 전체가 흰 화면이 됨.
- 같은 패턴을 전체 검색해서 `ChildManage.jsx`, `NotificationInbox.jsx`,
  `education/TodayQuiz.jsx` 3곳에서 발견 → `useEffect(() => { load(); }, [...])` 형태로 감싸서 수정
  (`MissionManage.jsx`/`SavingsGoalPage.jsx`도 같은 이름의 `load`를 쓰지만 블록 바디라 `return`이
  없어 Promise를 반환하지 않으므로 이 버그 해당 없음 — 확인 후 그대로 둠)
- **패턴 주의**: 앞으로 `useEffect(load, [...])`처럼 함수를 effect에 직접 넘길 때, 그 함수가 화살표
  함수 축약형으로 `promise.then(...)`을 바로 리턴하지 않는지 항상 확인할 것. 안전하게 하려면 항상
  `useEffect(() => { load(); }, [...])`처럼 블록으로 감싸는 습관을 들이는 게 좋음.

### 세션 6 (2026-09-19) — 게임 화폐 이미지, 홈 화면 하단 고정 메뉴바

1. **게임 화면 화폐를 실제 지폐/동전 이미지로 교체** — "심부름 지폐 계산" 게임의 돈 선택 버튼이
   텍스트/기호(●, ▭)로만 표시되던 것을, 실물을 연상시키는 자체 제작 SVG 지폐/동전 아이콘으로 교체.
   실제 화폐 사진을 그대로 스캔/복제하면 한국은행권 도안 이용 규정상 문제가 될 수 있어 사진이 아닌
   색상·형태 기반의 오리지널 일러스트로 만듦(지폐=가로 카드형+금액, 동전=원형+숫자, 8종 전체 —
   요청받은 6종에 50,000원/100원도 통일감 위해 포함).
   - 새 파일 `client/src/pages/child/game/moneyIcons.jsx` (`MoneyIcon` 컴포넌트)
   - `Game.jsx`의 `MoneyPicker`(화폐 선택 그리드)와 "내가 고른 돈" 칩에 적용
   - `moneyChallenge.css`: 아이콘 들어갈 공간 확보를 위해 `.mc-money` 그리드 첫 컬럼 24px→34px로 확장

2. **홈 화면 메뉴를 하단 고정 바(bottom nav)로 이동 + 순서 변경 + 축소** — 기존엔 화면 상단에
   3열 그리드 카드로 있던 메뉴를, 화면 맨 아래 고정된 얇은 네비게이션 바 형태로 이동:
   - 순서: (자녀) 미션 → 저축목표 → 급식메뉴 → 금융교육 → 게임, (부모) 미션 관리 → 급식메뉴 →
     알림함 → 자녀 계정 — 미션 그룹과 학습 그룹 사이에 급식메뉴가 오도록 정렬(부모 쪽 순서는
     사용자가 명시하지 않아 같은 논리로 추정 배치함 — 다르게 원하면 알려달라고 할 것)
   - 항목 수에 맞춰 `flex-1`로 폭을 균등 분할해 한 줄에 꽉 차게 배치(부모 4개는 자녀 5개보다 항목당
     폭이 넓어짐 — 요청대로)
   - `.app-shell`이 데스크톱 폭(≥481px)에서 480px 폭의 둥근 카드로 바뀌는 CSS 구조 때문에 단순
     `position: sticky`는 `overflow: hidden` 조상 때문에 깨질 수 있어 피하고, 바깥은 뷰포트 전체
     폭의 투명 `fixed` 레이어 + 안쪽만 `max-w-[480px] mx-auto`로 카드 폭에 맞춰 중앙 정렬하는
     방식을 씀 (`Home.jsx`의 `BottomMenuBar` 컴포넌트)
   - 첫 화면(Home)에서만 렌더링되므로 각 메뉴 하위 페이지에서는 자동으로 안 보이고, 기존 `BackHeader`
     뒤로가기로 돌아오는 흐름은 그대로 유지됨(별도 처리 불필요)
   - 콘텐츠 영역에 `pb-24` 추가해서 하단 바에 가리지 않게 함

**검증**: `npm run build`(143 모듈) 통과, HMR 정상 반영, 에러 없음.

### 세션 7 (2026-09-19) — 자녀 계정 대표 이미지를 NH 캐릭터로 교체

기존 자녀 계정 대표 이미지가 동물 이모지(🦁/🐰 등)였는데, 사용자가 가진 실제 캐릭터 이미지
(`C:\Users\krk10\OneDrive\사진\올리원이` — NH농협 "올리원이" 캐릭터: 올리/원이/단지/달리/코리 5종 ×
포즈 3장 = 15장)로 교체.

- 이미지를 `client/src/assets/avatars/`로 복사(영문 슬러그로 리네임: `oli-1~3`, `woni-1~3`,
  `danji-1~3`, `dari-1~3`, `kori-1~3`), `client/src/data/avatarCharacters.js`에 매니페스트로 정리
  (`AVATAR_CHARACTERS`, `DEFAULT_CHILD_AVATAR="oli-1"`, `AVATAR_CHARACTER_MAP`)
- 새 `client/src/components/common/Avatar.jsx`: `avatarEmoji` 값이 캐릭터 id면 이미지로, 옛날처럼
  일반 이모지 문자열이면 텍스트로 그대로 보여주는 표시 전용 컴포넌트(하위 호환 유지) — `avatarEmoji`를
  렌더링하던 모든 곳(ProfileSelect 로그인 화면 2곳, Home 헤더, ChildManage 목록, ParentDashboard,
  MealMenu/MissionManage의 자녀 선택 탭, Game.jsx 랭킹 줄)을 이 컴포넌트로 교체
- `EmojiPicker.jsx`에 `mode="character"` 추가(기존 동물 이모지 그리드는 `mode="emoji"`로 유지) —
  자녀 계정 관련 선택에서만 캐릭터 그리드를 쓰고, 부모 자신의 아바타(Settings)는 기존 동물 이모지
  그대로 유지(`Settings.jsx`가 `user.role`로 분기)
- **부모가 이미 만든 자녀의 이미지를 나중에 바꿀 방법이 없었어서** 새로 추가:
  `PATCH /api/users/children/:childId/avatar`(server, `user.routes.js`) + `changeChildAvatar`
  (client `api/users.js`) + `ChildManage.jsx`에 "🖼️ 이미지 변경" 인라인 편집기(학교 편집기와 같은 패턴)
- 자녀 생성 시 기본값/서버 fallback을 `"oli-1"`로 변경(`ChildManage.jsx` form 초기값,
  `user.routes.js` POST `/children`의 `avatarEmoji || "oli-1"`), `seed.js`도 이준=`oli-1`/
  이서=`woni-1`로 변경
- **이미 존재하던 자녀 계정(이준/이서 + 세션 사이 사용자가 직접 만든 "란케")의 avatarEmoji도
  새 PATCH 엔드포인트로 즉시 마이그레이션**: 이준→`oli-1`, 이서→`woni-1`, 란케(🐶)→`dari-1`
  (달리가 강아지 캐릭터라 테마에 맞춰 배정) — 재접속만 하면 바로 새 이미지로 보임
- ProfileSelect.jsx의 "다른 계정으로 로그인" 드롭다운(`<select><option>`)은 이미지 렌더링이
  불가능한 자리라 아바타 표시를 빼고 이름만 남김(원래도 보조 로그인 경로)

참고로 실제 화폐 이미지 때와 달리 이 캐릭터들은 사용자가 소유/제공한 이미지 파일이라 저작권 문제
없이 그대로 사용함 — 새 캐릭터 이미지를 추가로 써야 할 일이 생기면 같은 폴더에서 더 가져오면 됨.

**검증**: `npm run build`(160 모듈) 통과, curl로 새 아바타 변경 API 호출 후 자녀 3명 모두 반영 확인.

### 세션 8 (2026-09-19) — 잔액 카드 색상, 급식 공유하기, 저축목표 이모지/기간

사용자 요청 3가지, 전부 완료:

1. **자녀 화면 "내 잔액" 카드 색상 개선** — 진한 초록 그라데이션(from-junior-500 to-junior-600) +
   흰 글씨라 잔액이 잘 안 보인다는 피드백. 새 공용 컴포넌트
   `client/src/components/common/BalanceCard.jsx`를 만들어 연한 라임(lime-100→200) 그라데이션 +
   진한 라임 텍스트(lime-900)로 교체, `ChildDashboard.jsx`(메인 홈)와 `SavingsGoalPage.jsx`(저축목표)
   둘 다 이 컴포넌트로 통일(요청한 "공통되게 수정" 반영).

2. **급식메뉴 공유하기** — `MealMenu.jsx`의 `MealBoard`에 "📤 급식메뉴 공유하기" 버튼 추가.
   공유 텍스트에 학교명(`data.schoolName`)·날짜·끼니별 메뉴·**총 칼로리**(각 끼니 `calInfo`에서
   숫자만 파싱해 합산하는 `parseKcal()`)·앱 링크(`${window.location.origin}/`)를 포함. `navigator.share`
   지원 시 네이티브 공유 시트(문자/카카오톡 등 OS가 제공하는 대상)를 띄우고, 미지원 브라우저(주로
   데스크톱)는 클립보드 복사로 폴백. 공유 URL은 실제 배포되면 그 도메인을 가리키도록
   `window.location.origin`을 그대로 사용(하드코딩 안 함).

3. **저축 목표 이모지 + 시작일/목표완료일** — 스키마 변경 필요해서 마이그레이션 진행:
   - `SavingsGoal`에 `emoji String @default("🎯")`, `startDate String?`, `targetDate String?` 추가
     (마이그레이션 `20260919170000_savings_goal_emoji_and_dates`, SQLite `ALTER TABLE ADD COLUMN`이라
     테이블 재생성 없이 간단히 적용됨). **주의**: `prisma generate` 시 서버 프로세스가 Prisma 엔진
     DLL을 잠그고 있어 `EPERM` 오류 발생 → 이번에도 좀비/실행 중 node 프로세스를 WMIC로 강제 종료 후
     재생성 성공 (반복되는 패턴, 다음에도 같은 방법 사용)
   - `EmojiPicker.jsx`에 `mode="goal"` 추가(자전거·게임기 등 목표용 이모지 20종)
   - `SavingsGoalPage.jsx`: 새 목표 만들기 폼에 이모지 선택 + 저축 시작일(기본값 오늘)/목표완료일
     (선택, 시작일 이후만 선택 가능) 입력 추가. 목표 카드에 이모지와 날짜 범위 표시, 전체적으로
     폰트 크기 한 단계씩 축소(제목 text-sm, 진행률/금액 text-xs 등). `ChildDashboard.jsx`의 저축목표
     요약 위젯에도 이모지 반영.
   - 서버 `savingsGoal.routes.js`의 생성/수정 라우트가 `emoji`/`startDate`/`targetDate`를
     받아 저장(생성 시 `startDate` 미지정이면 `todayKst()`로 기본값)

**검증**: `npm run build`(161 모듈) 통과. curl 테스트 중 Git Bash에 한글/이모지를 인라인으로 넘기면
인코딩이 깨지는 걸 발견 — 실제 버그 아니고 **내 테스트 방법(bash 셸 인용) 문제**였음, JSON 파일을
만들어 `curl --data-binary @file`로 넘기니 정상 저장됨 확인(다음에도 한글/이모지 포함 API 테스트는
이 방식 사용할 것). 테스트로 생성됐던 저축목표 2건은 정리함.

**후속 버그 수정 (같은 세션)** — "데스크톱에서 공유하기 눌렀는데 클립보드 복사가 안 됨" 제보.
원인: Windows Chrome/Edge 데스크톱도 `navigator.share`를 지원해서, 클립보드 대신 OS 공유창이
뜨도록 분기되고 있었음(그 창에서 아무 앱도 못 고르면 그대로 끝나 사용자 입장에선 "아무 일도 안
일어난 것"처럼 보임). `MealMenu.jsx`에 `isTouchDevice()` 체크를 추가해서 **터치 기기에서만
`navigator.share`를 쓰고, 데스크톱은 항상 클립보드 복사**로 동작하게 고침. 클립보드 API 자체가 막힌
환경(비보안 컨텍스트 등)을 위해 `document.execCommand("copy")` 구식 폴백을 쓰는 `copyText()` 헬퍼도
추가.

### 세션 9 (2026-09-21) — 서브 화면 상단바 레이아웃, 저축목표 입력창 UX, 미션 삭제

1. **서브 화면 공통 상단바(`BackHeader.jsx`) 레이아웃 조정** — 뒤로가기 화살표는 그대로 두고,
   🏠 주니어빌리지 버튼을 작게(아이콘 text-sm, 텍스트 text-xs, 패딩 축소) 줄여서 화살표 바로
   오른쪽에 배치. 각 화면 제목(예: "저축 목표", "미션", "급식메뉴")은 `absolute left-1/2
   -translate-x-1/2`로 헤더 정중앙에 절대 배치하고 폰트도 키움(text-base→text-lg). 공용 컴포넌트라
   미션/저축목표/급식메뉴/금융교육/게임 등 BackHeader를 쓰는 모든 화면에 한 번에 적용됨.

2. **저축목표 "저금하기" 입력 UX 개선** (여러 차례 피드백 반영) — `SavingsGoalPage.jsx`의 저금
   입력 행:
   - 금액 입력창에 1,000단위 콤마 자동 표시: `type="number"` → `type="text" inputMode="numeric"`로
     바꾸고 `formatThousands()`로 표시만 콤마 포맷, 내부 상태는 숫자만 저장
   - 입력창:버튼 폭 비율을 `flex-[2]` : `flex-1` (2:1)로 고정
   - "+ 저금" 버튼을 `tone="outline"` 기반 + `bg-white text-black`로 흰 배경/검정 글씨로 변경

3. **부모의 미션 삭제 기능** — 지금까지 미션은 생성/승인/반려만 가능하고 삭제가 없었음.
   - 서버 `DELETE /api/missions/:id` 추가(`mission.routes.js`, parent 소유 확인 후 `$transaction`으로
     연관 `Notification`(missionId 기준)·`MissionSubmission` 먼저 지우고 `Mission` 삭제 — 이미
     지급된 용돈 `Transaction` 기록은 미션과 느슨하게 연결(FK 아님)되어 있어 그대로 남아 회계 이력은
     보존됨)
   - client `api/missions.js`에 `deleteMission` 추가, `MissionManage.jsx`의 각 미션 카드에
     "🗑️ 미션 삭제" 버튼 + 인라인 확인 패널(ChildManage의 자녀 삭제와 같은 패턴) 추가
   - curl로 미션 생성→삭제→목록에서 사라짐까지 end-to-end 확인

**또 발생한 이슈 (반복 패턴)**: 세션 도중 "시스템 메모리 부족으로 dev 서버 백그라운드 프로세스가
강제 종료됨" 알림이 왔었는데, 실제로는 최상위 프로세스만 죽고 하위 `node`/`nodemon`/`vite`
프로세스들은 포트(3001/5173)를 계속 붙든 채 좀비로 남아있었음 → 이후 `npm run dev`를 다시 실행하니
`EADDRINUSE`로 서버가 죽고, vite는 자동으로 5174 포트로 올라가 버림(사용자가 5173으로 접속하면 새
코드가 하나도 안 보이는 상태가 될 뻔함). `Get-NetTCPConnection`으로 포트 점유 프로세스를 찾고
`Get-CimInstance Win32_Process`로 junior-village 관련 node 프로세스를 전부 찾아 `Stop-Process`(안
되면 WMIC)로 정리한 뒤 `npm run dev`를 깨끗하게 재시작해서 해결. **다음에도 dev 서버가 이상하게
동작하면(포트 충돌, 코드 반영 안 됨 등) 먼저 이 방법으로 관련 node 프로세스를 전부 정리하고 재시작할
것.**

### 세션 10 (2026-09-21) — GitHub 연동 + 외부 배포 준비(Render)

- **GitHub 저장소**: https://github.com/rafsrd103/junior-village-v2 (**Public**, 사용자가 공개를 선택 —
  NH 캐릭터 이미지 등이 포함돼 있다는 점은 사전에 안내함). 계정에 이미 있던 `junior-village`(공개)와
  `junior-village_vercel`(비공개)은 구 버전 작업물로 보여 **건드리지 않음**.
- `gh` CLI를 winget으로 설치(`C:\Program Files\GitHub CLI\gh.exe`, 새 터미널 전에는 PATH에 안 잡힘).
  로그인은 `gh auth login --web`을 백그라운드로 돌려 원타임 코드만 사용자에게 전달하는 방식으로 해결
  (이 세션 터미널은 TTY가 아니라 방향키 메뉴가 안 뜸).
- 커밋 작성자는 개인 이메일 노출을 피하려고 GitHub noreply 주소(`314979559+rafsrd103@users.noreply.github.com`)를
  `-c user.name/user.email`로만 지정(전역 git config는 건드리지 않음).
- **공개 전 비밀키 점검**: `README.md`/`PROGRESS.md`에 NEIS API 키가 평문으로 있어서 제거함
  (`.env`, `*.db`, `node_modules`는 기존 `.gitignore`로 제외됨). ⚠️ 이 키는 대화 기록/과거 로컬 파일에
  노출된 적이 있으니 원하면 open.neis.go.kr에서 재발급 권장.
- 첫 푸시가 `curl 55 Connection was aborted`로 여러 번 실패 → 이번 명령에만
  `-c http.version=HTTP/1.1 -c http.postBuffer=524288000` 옵션을 주니 성공.
- **배포 구성(Render 무료 웹서비스 1개, 서버가 빌드된 프론트까지 서빙)**:
  - `render.yaml`(Blueprint), `server/scripts/start-prod.js`(migrate deploy → DB가 비었을 때만 시드 → 서버 시작)
  - `server/src/index.js`: production일 때 `client/dist` 정적 서빙 + SPA 폴백, `trust proxy`, `/api` 미매칭은 JSON 404
  - `auth.routes.js`: refresh 쿠키 `secure`를 `NODE_ENV === "production"`일 때 true
  - 로컬에서 `NODE_ENV=production` + 빈 임시 DB로 검증: 마이그레이션/시드/프론트/새로고침 경로/쿠키(Secure; HttpOnly) 정상
  - 한계: 무료 플랜은 디스크가 임시라 재시작마다 DB 초기화(데모 시드로 복구), 15분 idle 후 콜드스타트 30~60초.
    영구 저장이 필요해지면 Postgres(Neon 등)로 전환 필요(Prisma provider 변경 + 마이그레이션 재생성).
- 남은 사용자 작업: Render 가입 → Blueprint로 저장소 연결 → `NEIS_API_KEY` 환경변수 입력.

## 3. 현재 상태 / 실행 방법

```bash
cd C:\Users\krk10\Documents\junior-village-v2
npm run dev
```
- 프론트: http://localhost:5173, 백엔드: http://localhost:3001 (Vite가 `/api` 프록시)
- 최초 1회: `cd server && npx prisma migrate deploy && npm run seed` (migrations 폴더에 이미 마이그레이션이
  있으므로 `migrate dev`보다 `migrate deploy`가 이 환경(비대화형)에서 더 안전함)

**테스트 계정** (전부 시드됨):

| 계정 | 이름 | PIN |
| --- | --- | --- |
| 부모 | 김민정 | `1234` |
| 자녀1 | 이준 (서울대학교사범대학부설초등학교) | `1111` |
| 자녀2 | 이서 (한빛초등학교, 경기 파주) | `2222` |

두 학교 모두 실제 NEIS 코드가 등록되어 있어 시드 상태 그대로 급식메뉴가 동작한다.

마지막으로 확인했을 때 `npm run build`(client, 142 모듈) 통과, 백엔드 API 전부 curl로 정상 동작 확인
(NEIS 실제 API 호출 포함), 좀비 프로세스/포트 점유 없이 깨끗한 상태로 세션 종료함.

## 4. 알려진 단순화 사항 (README.md 6~7절에도 정리되어 있음)

- 자녀 계정 초대 코드는 부모가 자녀 생성 즉시 자동 연동(화면 표시만 됨, 실제 코드 입력 가입 흐름 없음)
- "다른 계정으로 로그인"은 시드된 프로필 중 선택 + PIN 방식 (실제 아이디/비번 직접 입력 가입 흐름 아님)
- 게임 채점은 클라이언트 로직(원본과 동일한 방식), 점수 저장/랭킹 조회만 서버 API
- 게임 닉네임은 원본과 달리 별도 입력 없이 로그인 계정 이름을 그대로 사용
- 급식메뉴는 학교별 급식만 조회(개인 알레르기 필터링 등은 없음), 메뉴 캐싱 없이 매번 NEIS API를 직접 호출

## 5. 다음에 이어서 하면 좋을 후보 (아직 사용자가 요청하지 않은 것들 — 참고용)

- 게임/급식메뉴 화면 실제 브라우저 스크린샷/시각 확인 (지금까지 claude-in-chrome 확장이 계속
  미연결 상태라 코드/API 레벨 검증만 함 — 연결되면 시각 검증 꼭 한 번 해볼 것)
- mainimage.png가 2.4MB로 번들에 그대로 들어가 있어 로딩이 느릴 수 있음 (압축/리사이즈 고려)
- 부모용 화면도 "고급스러운 이미지"(prompt 5절 요구) 요소가 이모지 위주라 실제 일러스트/이미지
  자산은 아직 없음 — 필요하면 추가 검토
- 게임 레벨별 난이도 필터 UI(랭킹 화면의 LV.1/2/3 탭)는 구현되어 있으나 실사용 테스트는 API 레벨만 함
- 급식메뉴 응답 캐싱(같은 학교/날짜 반복 조회 시 NEIS 호출 절약) — 지금은 매번 실시간 호출

## 6. 참고 링크

- 게임 원본: https://github.com/Parion88/allone-junior-money-challenge
- 원본 데모: https://parion88.github.io/allone-junior-money-challenge/

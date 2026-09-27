import { useEffect, useRef, useState } from "react";
import BackHeader from "../../../components/common/BackHeader";
import SchoolPicker from "../../../components/common/SchoolPicker";
import { useAuthStore } from "../../../store/authStore";
import { submitGameScore, fetchLeaderboard, fetchSchoolRanking, fetchSchools } from "../../../api/games";
import { registerMySchool } from "../../../api/users";
import Avatar from "../../../components/common/Avatar";
import {
  TOTAL_ROUNDS,
  DIFFICULTIES,
  MODE_TEXT,
  MONEY,
  won,
  sumSelected,
  generateRound,
  calcScore,
  grade,
} from "./moneyChallengeEngine";
import MoneyIcon from "./moneyIcons";
import "./moneyChallenge.css";

const moneyType = (value) => MONEY.find((m) => m.value === value)?.type || "coin";

// ---------------------------------------------------------------------------
// 원본(Parion88/allone-junior-money-challenge)의 화면 구성을 그대로 포팅한 하위 컴포넌트들.
// 닉네임/학교 입력은 주니어빌리지 로그인 계정 정보를 그대로 사용하도록 바꾸고,
// 랭킹 저장은 Supabase 대신 주니어빌리지 자체 백엔드 API를 사용하도록 연결했다.
// ---------------------------------------------------------------------------

function SchoolSetup({ onDone }) {
  const { updateUser } = useAuthStore();
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!picked) return;
    try {
      const res = await registerMySchool(picked);
      updateUser({ schoolId: res.schoolId });
      onDone(res.school);
    } catch (e2) {
      setError(e2.response?.data?.error || "학교 등록에 실패했어요.");
    }
  };

  return (
    <div className="mc-screen mc-intro">
      <div className="mc-village">🏘️</div>
      <div className="mc-badge">주니어빌리지 머니챌린지</div>
      <h1>
        딱! 맞춰
        <br />
        머니챌린지
      </h1>
      <p>
        돈을 빠르게 계산하고
        <br />
        <b>가장 똑똑하게 사용하는 금융 퍼즐</b>
      </p>

      <div className="mc-form-card">
        <label>
          <span>소속 학교</span>
        </label>
        <SchoolPicker onSelect={setPicked} placeholder="예: 서울대학교초등학교" />
        {error && <p style={{ color: "#d33", fontSize: 11, marginTop: 6 }}>{error}</p>}
        <div className="mc-notice" style={{ marginTop: 10 }}>
          🏫 학교를 등록하면 게임 점수가 학교별 랭킹에 반영돼요.
        </div>
        <button className="mc-primary mc-wide" onClick={submit} disabled={!picked}>
          등록하고 시작하기
        </button>
      </div>
    </div>
  );
}

function Difficulty({ nickname, school, onStart, onRanking }) {
  return (
    <div className="mc-screen">
      <div className="mc-difficulty-head">
        <small>
          {school} · {nickname}
        </small>
        <h1>난이도를 골라봐!</h1>
        <p>어려울수록 영수증과 장보기 문제가 많아져요.</p>
      </div>

      <div className="mc-difficulty-list">
        {[1, 2, 3].map((level) => {
          const d = DIFFICULTIES[level];
          return (
            <button key={level} className={`mc-difficulty-card mc-level-${level}`} onClick={() => onStart(level)}>
              <span className="mc-diff-icon">{d.icon}</span>
              <div>
                <small>LEVEL {level}</small>
                <strong>{d.name}</strong>
                <p>{d.description}</p>
                <em>{d.detail}</em>
              </div>
              <b>→</b>
            </button>
          );
        })}
      </div>

      <button className="mc-secondary mc-wide" style={{ marginTop: 12 }} onClick={onRanking}>
        🏆 랭킹 보기
      </button>
    </div>
  );
}

function InGameHeader({ difficulty, score, combo, round, onExit }) {
  return (
    <header className="mc-header">
      <button onClick={onExit}>←</button>
      <div>
        <strong>머니챌린지</strong>
        <span>
          {DIFFICULTIES[difficulty].icon} LEVEL {difficulty}
        </span>
      </div>
      <div className="mc-score-mini">
        {score.toLocaleString()}
        <small>점</small>
      </div>
      <div className="mc-header-bottom">
        <span>
          ROUND {round}/{TOTAL_ROUNDS}
        </span>
        <span>🔥 {combo} COMBO</span>
      </div>
    </header>
  );
}

function Timer({ startAt, stoppedAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (stoppedAt) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startAt, stoppedAt]);
  const seconds = ((stoppedAt || now) - startAt) / 1000;
  return <div className="mc-timer">⏱ {Math.max(0, seconds).toFixed(1)}초</div>;
}

function Receipt({ receipt, hideTotal = true }) {
  return (
    <div className="mc-receipt">
      <div className="mc-receipt-title">🧾 JUNIOR VILLAGE STORE</div>
      {receipt.items.map((item, i) => (
        <div className="mc-receipt-row" key={`${item.name}-${i}`}>
          <div>
            <b>
              {item.emoji} {item.name}
            </b>
            <small>
              {won(item.unitPrice)} × {item.qty}
            </small>
          </div>
          <span>{hideTotal ? "?" : won(item.lineTotal)}</span>
        </div>
      ))}
      <div className="mc-receipt-total">
        <span>합계</span>
        <strong>{hideTotal ? "????원" : won(receipt.total)}</strong>
      </div>
    </div>
  );
}

function Mission({ data }) {
  const mode = MODE_TEXT[data.mode];
  return (
    <section className="mc-mission">
      <div className="mc-mode-chip">
        {mode.icon} {mode.title}
      </div>

      {data.receipt && <Receipt receipt={data.receipt} hideTotal={true} />}

      {data.mode === "MAKE_CHANGE" && (
        <div className="mc-mini-calc">
          <span>
            물건값 <b>{won(data.price)}</b>
          </span>
          <span>
            낸 돈 <b>{won(data.paidAmount)}</b>
          </span>
        </div>
      )}

      {data.mode === "RECEIPT_CHANGE" && (
        <div className="mc-paid-box">
          💵 낸 돈 <b>{won(data.paidAmount)}</b>
        </div>
      )}

      {!data.receipt && data.mode !== "MAKE_CHANGE" && (
        <>
          <small className="mc-target-label">목표 금액</small>
          <div className="mc-target">{won(data.target)}</div>
        </>
      )}

      {data.mode === "MAKE_CHANGE" && (
        <>
          <small className="mc-target-label">받을 거스름돈</small>
          <div className="mc-target">직접 계산!</div>
        </>
      )}

      {data.receipt && data.mode !== "RECEIPT_CHANGE" && (
        <div className="mc-receipt-question">
          영수증의 <b>총 금액</b>만큼 돈을 내세요.
        </div>
      )}

      {data.mode === "RECEIPT_CHANGE" && (
        <div className="mc-receipt-question">
          총액을 계산한 뒤 <b>거스름돈</b>을 만들어보세요.
        </div>
      )}

      <p>{mode.guide}</p>
    </section>
  );
}

function MoneyPicker({ inventory, selected, onAdd, onRemove }) {
  const used = selected.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="mc-wallet">
        <div className="mc-wallet-head">
          <span>내가 고른 돈</span>
          <strong>{won(sumSelected(selected))}</strong>
        </div>
        {selected.length === 0 ? (
          <div className="mc-empty">아래 지폐와 동전을 눌러보세요.</div>
        ) : (
          <div className="mc-chosen">
            {selected.map((v, i) => (
              <button key={`${v}-${i}`} onClick={() => onRemove(i)}>
                <MoneyIcon value={v} type={moneyType(v)} size={18} />
                {won(v)} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mc-section-title">이번에 사용할 수 있는 돈</div>
      <div className="mc-money-grid">
        {inventory.map((m) => {
          const left = m.count - (used[m.value] || 0);
          return (
            <button key={m.value} className={`mc-money mc-${m.type}`} disabled={left <= 0} onClick={() => onAdd(m.value)}>
              <span className="mc-money-icon">
                <MoneyIcon value={m.value} type={m.type} />
              </span>
              <strong>{m.label}</strong>
              <small>× {left} 남음</small>
            </button>
          );
        })}
      </div>
    </>
  );
}

function ScoreModal({ result, data, onNext, last }) {
  const s = result.score;
  return (
    <div className="mc-overlay">
      <div className="mc-modal">
        <div className="mc-modal-icon">{result.perfect ? "🏆" : "🎉"}</div>
        <h2>{result.perfect ? "PERFECT!" : "정답!"}</h2>
        <p>
          {result.perfect
            ? `최소 ${data.minCount}개의 화폐로 완성했어요!`
            : `정답 성공! 최소 개수는 ${data.minCount}개예요.`}
        </p>

        {data.receipt && (
          <div className="mc-answer-receipt">
            <span>영수증 총액</span>
            <b>{won(data.receipt.total)}</b>
            {data.mode === "RECEIPT_CHANGE" && (
              <>
                <span>정답 거스름돈</span>
                <b>{won(data.target)}</b>
              </>
            )}
          </div>
        )}

        <div className="mc-breakdown">
          <div>
            <span>기본 점수</span>
            <b>+{s.base.toLocaleString()}</b>
          </div>
          <div>
            <span>시간 보너스</span>
            <b>+{s.timeBonus.toLocaleString()}</b>
          </div>
          <div>
            <span>화폐 효율</span>
            <b>+{s.efficiencyBonus.toLocaleString()}</b>
          </div>
          {s.receiptBonus > 0 && (
            <div>
              <span>생활 계산 보너스</span>
              <b>+{s.receiptBonus.toLocaleString()}</b>
            </div>
          )}
          <div>
            <span>콤보</span>
            <b>+{s.comboBonus.toLocaleString()}</b>
          </div>
          {result.wrongAttempts > 0 && (
            <div>
              <span>재도전 보정</span>
              <b>×{s.retryMultiplier.toFixed(2)}</b>
            </div>
          )}
        </div>

        <div className="mc-round-score">
          <span>ROUND SCORE</span>
          <strong>+{s.total.toLocaleString()}</strong>
        </div>

        <div className="mc-result-tags">
          <span>⏱ {result.seconds.toFixed(1)}초</span>
          <span>💵 {result.usedCount}개</span>
          <span>🎯 최소 {data.minCount}개</span>
        </div>

        <button className="mc-primary mc-wide" onClick={onNext}>
          {last ? "최종 결과 보기" : "다음 문제"}
        </button>
      </div>
    </div>
  );
}

function GamePlay({ nickname, difficulty, onFinish, onExit }) {
  const [round, setRound] = useState(1);
  const [data, setData] = useState(() => generateRound(difficulty, 1));
  const [selected, setSelected] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [message, setMessage] = useState("문제를 보고 가장 좋은 방법을 찾아봐!");
  const [startAt, setStartAt] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState([]);

  const selectedTotal = sumSelected(selected);

  const submit = () => {
    if (selectedTotal !== data.target) {
      const diff = data.target - selectedTotal;
      setWrongAttempts((v) => v + 1);
      setCombo(0);
      setMessage(diff > 0 ? `💡 ${won(diff)}이 더 필요해요!` : `💡 ${won(Math.abs(diff))}을 빼볼까요?`);
      return;
    }

    const seconds = (Date.now() - startAt) / 1000;
    const nextCombo = combo + 1;
    const usedCount = selected.length;
    const scoreParts = calcScore({
      difficulty,
      seconds,
      usedCount,
      minCount: data.minCount,
      wrongAttempts,
      combo: nextCombo,
      mode: data.mode,
    });

    const stat = {
      round,
      mode: data.mode,
      seconds,
      usedCount,
      minCount: data.minCount,
      perfect: usedCount === data.minCount,
      wrongAttempts,
      score: scoreParts.total,
    };

    setScore((v) => v + scoreParts.total);
    setCombo(nextCombo);
    setStats((prev) => [...prev, stat]);
    setResult({ seconds, usedCount, wrongAttempts, perfect: usedCount === data.minCount, score: scoreParts });
  };

  const next = () => {
    if (round >= TOTAL_ROUNDS) {
      onFinish({ difficulty, score, stats });
      return;
    }
    const nextRound = round + 1;
    setRound(nextRound);
    setData(generateRound(difficulty, nextRound));
    setSelected([]);
    setWrongAttempts(0);
    setMessage("새 문제예요! 영수증이 나오면 가격 × 수량부터 계산해봐.");
    setStartAt(Date.now());
    setResult(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <InGameHeader difficulty={difficulty} score={score} combo={combo} round={round} onExit={onExit} />
      <main className="mc-game">
        <div className="mc-game-top">
          <Timer startAt={startAt} stoppedAt={result ? startAt + result.seconds * 1000 : null} />
          <div className="mc-progress">
            <div style={{ width: `${round * 10}%` }} />
          </div>
        </div>

        <Mission data={data} />
        <div className="mc-hint">{message}</div>

        <MoneyPicker
          inventory={data.inventory}
          selected={selected}
          onAdd={(v) => setSelected((prev) => [...prev, v])}
          onRemove={(i) => setSelected((prev) => prev.filter((_, idx) => idx !== i))}
        />

        <div className="mc-current">
          <span>현재 선택 금액</span>
          <strong className={selectedTotal === data.target ? "mc-match" : ""}>{won(selectedTotal)}</strong>
        </div>

        <div className="mc-actions">
          <button className="mc-secondary" disabled={!selected.length} onClick={() => setSelected([])}>
            다시 고르기
          </button>
          <button className="mc-primary" disabled={!selected.length} onClick={submit}>
            확인하기
          </button>
        </div>
      </main>

      {result && <ScoreModal result={result} data={data} onNext={next} last={round === TOTAL_ROUNDS} />}
    </div>
  );
}

function Final({ result, nickname, school, onReplay, onRanking, onHome }) {
  const g = grade(result.score, result.difficulty);
  const avg = result.stats.reduce((s, v) => s + v.seconds, 0) / Math.max(1, result.stats.length);
  const perfect = result.stats.filter((v) => v.perfect).length;
  const wrong = result.stats.reduce((s, v) => s + v.wrongAttempts, 0);
  const bestRound = Math.max(0, ...result.stats.map((v) => v.score));

  return (
    <div className="mc-screen mc-final">
      <div className="mc-final-icon">{g.icon}</div>
      <div className="mc-badge">LEVEL {result.difficulty} 결과</div>
      <h1>{g.name}</h1>
      <div className="mc-final-score">
        {result.score.toLocaleString()}
        <small>점</small>
      </div>
      <p>
        {school} · {nickname}
      </p>

      <div className="mc-stats">
        <div>
          <b>{avg.toFixed(1)}초</b>
          <span>평균 해결시간</span>
        </div>
        <div>
          <b>
            {perfect}/{TOTAL_ROUNDS}
          </b>
          <span>최소 화폐 성공</span>
        </div>
        <div>
          <b>{wrong}</b>
          <span>총 재도전</span>
        </div>
        <div>
          <b>{bestRound.toLocaleString()}</b>
          <span>최고 라운드</span>
        </div>
      </div>

      <div className="mc-school-card">
        🏫
        <div>
          <b>학교/개인 랭킹에 저장됐어요!</b>
          <span>주니어빌리지 서버에 기록되어 학교 친구들과 비교할 수 있어요.</span>
        </div>
      </div>

      <button className="mc-primary mc-wide" onClick={onRanking}>
        🏆 랭킹 보기
      </button>
      <div className="mc-actions" style={{ marginTop: 8 }}>
        <button className="mc-secondary" onClick={onHome}>
          처음으로
        </button>
        <button className="mc-primary" onClick={onReplay}>
          같은 난이도 재도전
        </button>
      </div>
    </div>
  );
}

// "개인" 탭(전체 학생 대상)에서는 개인정보 보호를 위해 이름 중간을 가려서 보여준다. (예: 홍길동 -> 홍*동)
function maskName(name) {
  if (!name || name.length < 2) return name || "";
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}*${name[name.length - 1]}`;
}

function Ranking({ mySchoolName, myUserId, onBack }) {
  const [tab, setTab] = useState("school");
  const [difficulty, setDifficulty] = useState(0);
  const [loading, setLoading] = useState(true);
  const [personal, setPersonal] = useState([]);
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const diffParam = difficulty ? { difficulty } : {};

    const load = async () => {
      if (tab === "school") {
        const rows = await fetchSchoolRanking(diffParam);
        if (alive) setSchools(rows);
      } else {
        // "my"(우리 학교)와 "personal"(전체 개인) 탭은 같은 전체 개인 랭킹을 받아와
        // "my" 탭에서만 내 학교로 클라이언트에서 필터링한다.
        const rows = await fetchLeaderboard(diffParam);
        if (alive) setPersonal(rows);
      }
      if (alive) setLoading(false);
    };
    load().catch(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, difficulty]);

  const myPersonalFiltered = tab === "my" ? personal.filter((p) => p.school === mySchoolName) : personal;
  const list = tab === "school" ? schools : myPersonalFiltered;

  return (
    <div className="mc-screen">
      <button className="mc-text-button" onClick={onBack}>
        ← 돌아가기
      </button>
      <div className="mc-rank-head">
        <span>🏆</span>
        <div>
          <small>주니어빌리지 서버 기록</small>
          <h1>랭킹</h1>
        </div>
      </div>

      <div className="mc-tabs">
        <button className={tab === "school" ? "mc-active" : ""} onClick={() => setTab("school")}>
          학교
        </button>
        <button className={tab === "my" ? "mc-active" : ""} onClick={() => setTab("my")}>
          우리 학교
        </button>
        <button className={tab === "personal" ? "mc-active" : ""} onClick={() => setTab("personal")}>
          개인
        </button>
      </div>

      <div className="mc-difficulty-filter">
        {[0, 1, 2, 3].map((d) => (
          <button key={d} className={difficulty === d ? "mc-active" : ""} onClick={() => setDifficulty(d)}>
            {d === 0 ? "전체" : `LV.${d}`}
          </button>
        ))}
      </div>

      {tab === "school" && <div className="mc-rank-rule">학교 점수 = 학생별 최고기록 중 상위 3명 평균</div>}

      <div className="mc-rank-list">
        {loading ? (
          <div className="mc-no-rank">랭킹을 불러오는 중...</div>
        ) : !list.length ? (
          <div className="mc-no-rank">아직 기록이 없어요. 먼저 게임에 도전해보세요!</div>
        ) : (
          list.slice(0, 50).map((e, i) => (
            <div
              className="mc-rank-row"
              key={tab === "school" ? e.school : `${e.userId}-${e.difficulty}`}
              style={e.userId === myUserId ? { borderColor: "#7ecb92", background: "#f3fbf4" } : undefined}
            >
              <div className="mc-place">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</div>
              <div className="mc-rank-name">
                <strong className="mc-rank-name-strong">
                  {tab === "school" ? (
                    e.school
                  ) : (
                    <>
                      <Avatar value={e.avatarEmoji} className="w-5 h-5 shrink-0" textClassName="" />
                      <span className="mc-rank-name-text">{tab === "personal" ? maskName(e.name) : e.name}</span>
                    </>
                  )}
                </strong>
                <span>{tab === "school" ? `참여 ${e.players}명` : `${e.school || "학교 미등록"} · LV.${e.difficulty}`}</span>
              </div>
              <b>{e.score.toLocaleString()}</b>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Game() {
  const { user } = useAuthStore();
  const [phase, setPhase] = useState(user.schoolId ? "loading" : "school-setup");
  const [schoolName, setSchoolName] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [finalResult, setFinalResult] = useState(null);

  useEffect(() => {
    if (!user.schoolId) return;
    fetchSchools().then((schools) => {
      const found = schools.find((s) => s.id === user.schoolId);
      setSchoolName(found?.name || "우리 학교");
      setPhase("difficulty");
    });
  }, [user.schoolId]);

  const handleSchoolDone = (name) => {
    setSchoolName(name);
    setPhase("difficulty");
  };

  const startDifficulty = (level) => {
    setDifficulty(level);
    setFinalResult(null);
    setPhase("playing");
  };

  const finish = async (result) => {
    try {
      await submitGameScore(result.score, result.difficulty);
    } catch (e) {
      // 점수 저장에 실패해도 결과 화면은 그대로 보여준다
    }
    setFinalResult(result);
    setPhase("final");
  };

  return (
    <div>
      <BackHeader title="심부름 지폐 계산" tone="junior" />
      <div className="mc-root">
        {phase === "loading" && <p className="text-center text-gray-400 py-16">불러오는 중...</p>}

        {phase === "school-setup" && <SchoolSetup onDone={handleSchoolDone} />}

        {phase === "difficulty" && (
          <Difficulty
            nickname={user.name}
            school={schoolName}
            onStart={startDifficulty}
            onRanking={() => setPhase("ranking")}
          />
        )}

        {phase === "playing" && (
          <GamePlay
            key={`game-${difficulty}-${finalResult ? "again" : "new"}`}
            nickname={user.name}
            difficulty={difficulty}
            onFinish={finish}
            onExit={() => setPhase("difficulty")}
          />
        )}

        {phase === "final" && finalResult && (
          <Final
            result={finalResult}
            nickname={user.name}
            school={schoolName}
            onReplay={() => {
              setFinalResult(null);
              setPhase("playing");
            }}
            onRanking={() => setPhase("ranking")}
            onHome={() => setPhase("difficulty")}
          />
        )}

        {phase === "ranking" && (
          <Ranking
            mySchoolName={schoolName}
            myUserId={user.id}
            onBack={() => setPhase(finalResult ? "final" : "difficulty")}
          />
        )}
      </div>
    </div>
  );
}

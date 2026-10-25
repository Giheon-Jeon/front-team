import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ContestCountdown from "../components/ContestCountdown.jsx";
import useCountdownClock from "../hooks/useCountdownClock.js";
import useStartFinale from "../hooks/useStartFinale.js";
import TimerScreen from "../../timer/components/TimerScreen.jsx";
import { adaptTimer, timerOffset, timerStage } from "../../timer/utils/timerData.js";
import { markBoardIntro } from "../../board/utils/boardIntro.js";
import styles from "./CountdownPreviewPage.module.css";

// 개발 서버 전용: 대회 시각을 기다리지 않고 대기 화면, 마지막 10초, 시작 연출과 대회 타이머를 본다
// ?at=15 지금부터 15초 뒤 시작으로 흘려 보기, ?state=waiting|final|start 한 장면 고정, &n=7 고정할 숫자
// ?timer=start|end&at=15 타이머의 시작이나 종료를 15초 앞에서 흘려 보기, ?timer=done 끝난 뒤, &bare 단추 숨김
const STATES = [
  { label: "대기 화면", query: "state=waiting" },
  { label: "15초 전부터", query: "at=15" },
  { label: "4초 전부터", query: "at=4" },
  { label: "숫자 7", query: "state=final&n=7" },
  { label: "숫자 3", query: "state=final&n=3" },
  { label: "시작 연출", query: "state=start" },
  { label: "타이머 시작 15초 전", query: "timer=start&at=15" },
  { label: "타이머 종료 15초 전", query: "timer=end&at=15" },
  { label: "타이머 끝난 뒤", query: "timer=done" },
];

// 실제 보드 화면을 뒤에 띄워 카운트다운이 끝나면 진짜 게임 화면이 열리는 모습을 본다 대회처럼 0초에 붙인다
function GameBehind() {
  return <iframe className={styles.game} src="/board" title="게임 화면" />;
}

function LiveCountdown({ seconds }) {
  const startMs = useMemo(() => Date.now() + seconds * 1000, [seconds]);
  const now = useCountdownClock(startMs, 0, true);
  const secondsLeft = Math.max(0, Math.ceil((startMs - now) / 1000));
  const blocked = secondsLeft > 0;
  const finale = useStartFinale(blocked, true);
  const startTime = useMemo(() => new Date(startMs).toISOString(), [startMs]);
  // 대기 화면처럼 마지막 10초에 표시를 남겨 뒤에 열리는 보드가 판이 생기는 연출과 주사위 안내를 보이게 한다
  useEffect(() => {
    if (blocked && secondsLeft <= 10) markBoardIntro("countdown");
  }, [blocked, secondsLeft]);
  return <>
    {!blocked && <GameBehind />}
    {(blocked || finale) && <ContestCountdown targetTime={startTime} secondsLeft={blocked ? secondsLeft : 0} overlay={!blocked} />}
  </>;
}

function StaticCountdown({ state, n }) {
  useState(() => { if (state === "start") markBoardIntro("countdown"); });
  const startTime = useMemo(() => new Date(Date.now() + (state === "waiting" ? 93784 : n) * 1000).toISOString(), [state, n]);
  if (state === "start") return <><GameBehind /><ContestCountdown targetTime={startTime} secondsLeft={0} overlay /></>;
  return <ContestCountdown targetTime={startTime} secondsLeft={state === "waiting" ? 93784 : n} />;
}

// 대회 타이머 화면을 서버 없이 띄운다 시작 전이나 진행 중 상태로 받아 둔 뒤 시각만 흘려 단계가 넘어가는 모습을 본다
function TimerPreview({ mode, seconds }) {
  const contest = useMemo(() => {
    const base = Date.now();
    const iso = (ms) => new Date(ms).toISOString();
    const target = base + seconds * 1000;
    const start = mode === "start" ? target : base - 3600e3;
    const end = mode === "start" ? target + 12 * 3600e3 : mode === "end" ? target : base - 1000;
    const status = mode === "start" ? "BEFORE" : mode === "end" ? "RUNNING" : "ENDED";
    return adaptTimer({ name: "MSG CTF 2026", status, start_time: iso(start), end_time: iso(end), server_time: iso(base) }, base);
  }, [mode, seconds]);
  const now = useCountdownClock([Date.parse(contest.startTime), Date.parse(contest.endTime)], timerOffset(contest), true);
  const { stage, secondsLeft } = timerStage(contest, now);
  return <TimerScreen status="success" contest={contest} error="" isSynced stage={stage} secondsLeft={secondsLeft} onRetry={() => {}} />;
}

export default function CountdownPreviewPage() {
  const [params] = useSearchParams();
  const [round, setRound] = useState(0);
  const at = Number(params.get("at"));
  const timer = params.get("timer");
  const state = params.get("state") || (Number.isFinite(at) && at > 0 ? "live" : "waiting");
  const n = Math.min(10, Math.max(1, Number(params.get("n")) || 7));
  const bare = params.has("bare");

  let scene = <StaticCountdown key={`${state}-${n}-${round}`} state={state} n={n} />;
  if (timer) scene = <TimerPreview key={`${timer}-${at}-${round}`} mode={timer} seconds={Number.isFinite(at) && at > 0 ? at : 15} />;
  else if (state === "live") scene = <LiveCountdown key={`${at}-${round}`} seconds={at} />;

  return (
    <div className={styles.page}>
      {scene}
      {!bare && (
        <nav className={styles.controls} aria-label="카운트다운 미리보기 장면">
          {STATES.map((item) => <Link key={item.query} to={`?${item.query}`} onClick={() => setRound((value) => value + 1)}>{item.label}</Link>)}
          <button type="button" onClick={() => setRound((value) => value + 1)}>다시</button>
        </nav>
      )}
    </div>
  );
}

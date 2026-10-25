import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import "../../intro/intro-fonts.generated.css";
import { ROUTES } from "../../../routes/routePaths.js";
import {
  ambientLeaves,
  burstLeaves,
  clockParts,
  countdownPhase,
  FINAL_SECONDS,
  momentLabels,
} from "../utils/countdown.js";
import { LOGO_LEAVES } from "../utils/logoLeaves.js";
import styles from "./ContestCountdown.module.css";

const LOGO = "/assets/intro/event-logo.webp";
const BRANCH = "/assets/countdown/logo-branch.webp";
// 홍보 페이지 로고 원본 1254px 안에서 그림이 있는 띠 위 그림 331~635, 윗줄 639~657, 글자 677~788, 아랫 장식 803~891
// 화면에는 x 242~1012, y 325~896 만 쓴다
const RULE_TOP = 637;
const WORD_TOP = 664;
const WORD_HEIGHT = 132;
const MAPLE = "M12 1.5L13.5 5.4L16.3 4.2L15.5 8.5L19.8 7.7L18.3 11L21.6 12.6L17.6 14.4L18.6 17L13.7 16.1L12.9 18.9L12.4 18.9L12.6 23L11.4 23L11.6 18.9L11.1 18.9L10.3 16.1L5.4 17L6.4 14.4L2.4 12.6L5.7 11L4.2 7.7L8.5 8.5L7.7 4.2L10.5 5.4Z";
const AMBIENT = ambientLeaves();
const BURST = burstLeaves(2026);
// 로고 잎마다 흔들리는 쪽과 도는 양을 달리해 같은 길로 떨어지지 않게 한다
const SWAY = [7, -6, 8.5, -7.5, 6, -8, 7.5, -5.5, 6.5, -8.5];
const SPIN = [160, -210, 250, -150, 300, -240, 180, -280, 220, -190];
const FALLING = LOGO_LEAVES.map((leaf, index) => ({ ...leaf, sway: SWAY[index], spin: SPIN[index] }));

const COPY = {
  start: { title: "대회 시작", caption: "STARTS IN", final: "대회 시작까지", finale: "대회를 시작합니다", suffix: "시작", unknown: "시작 시각이 정해지면 열립니다" },
  end: { title: "대회 종료", caption: "ENDS IN", final: "대회 종료까지", finale: "대회가 끝났습니다", suffix: "종료", unknown: "종료 시각이 정해지지 않았습니다" },
};
export const GATE_LINKS = [
  { to: ROUTES.rules, label: "게임 규칙" },
  { to: ROUTES.mypage, label: "마이페이지" },
  { to: "/timer", label: "대회 타이머" },
];

function Leaf({ leaf, className, style }) {
  return (
    <span className={className} style={{ color: leaf.color, "--size": `${leaf.size}px`, "--turn": `${leaf.turn}deg`, "--delay": `${leaf.delay}ms`, "--time": `${leaf.duration}ms`, ...style }}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={MAPLE} fill="currentColor" /></svg>
    </span>
  );
}

const place = (leaf) => ({ left: `${leaf.left}%`, top: `${leaf.top}%`, width: `${leaf.width}%` });

// 홍보 페이지 첫 화면의 로고를 대기 화면에 두고, 마지막 10초에는 MSG CTF 글자 자리에 숫자를 세운다
// 로고 가지의 잎 10장은 마지막 10초 동안 1초에 한 장씩 떨어지고 0초에 다시 돋는다
// goal: start 는 대회 시작까지, end 는 대회 종료까지 / targetTime: 그 시각 / secondsLeft: 남은 초, 모르면 null
// overlay: 그 시각을 넘긴 뒤 다음 화면 위에 잠깐 덮는 마무리 연출 / ended: 대회가 끝난 뒤 보이는 화면
// variant: gate 는 대기 화면, timer 는 대회 타이머 화면이라 시계를 크게 둔다
export default function ContestCountdown({
  variant = "gate",
  goal = "start",
  targetTime,
  secondsLeft,
  overlay = false,
  ended = false,
  links = GATE_LINKS,
  note = "시작 시각이 되면 이 화면이 바로 열립니다",
}) {
  const id = useId().replace(/:/g, "");
  const copy = COPY[goal] ?? COPY.start;
  const phase = ended ? "done" : overlay ? "finale" : countdownPhase(secondsLeft);
  const number = phase === "final" ? secondsLeft : null;
  const step = phase === "final" ? FINAL_SECONDS - secondsLeft : phase === "finale" ? FINAL_SECONDS : 0;
  const labels = momentLabels(targetTime, copy.suffix);

  // 숫자가 바뀌면 앞 숫자는 흩어지며 빠지고 새 숫자가 들어온다
  const [digits, setDigits] = useState(() => ({ current: number, previous: null }));
  useEffect(() => {
    setDigits((value) => (value.current === number ? value : { current: number, previous: value.current }));
  }, [number]);

  // 마지막 10초 중간에 열었으면 이미 떨어졌어야 할 잎은 한꺼번에 떨어뜨리지 않고 비워 둔다
  const [firstFinal] = useState(() => (phase === "final" ? secondsLeft : phase === "waiting" ? FINAL_SECONDS : 0));
  const attached = phase === "final" ? FALLING.filter((leaf) => leaf.second < secondsLeft) : FALLING;
  const falling = phase === "final" || phase === "finale"
    ? FALLING.filter((leaf) => leaf.second <= firstFinal && (phase === "finale" || leaf.second >= secondsLeft))
    : [];
  const title = phase === "finale" || phase === "done" ? `MSG CTF ${copy.title}` : `MSG CTF ${copy.title} 전`;

  return (
    <div className={styles.stage} data-phase={phase} data-goal={goal} data-variant={variant} data-overlay={overlay} style={{ "--step": step }}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.veil} aria-hidden="true" />
      <div className={styles.ambient} aria-hidden="true">
        {AMBIENT.map((leaf) => <Leaf key={leaf.id} leaf={leaf} className={styles.ambientLeaf} style={{ "--x": `${leaf.x}%`, "--drift": `${leaf.drift}vw` }} />)}
      </div>

      {/* 대기 화면에서는 이 화면의 본문이고, 마무리 연출에서는 다음 화면 위에 잠깐 덮이므로 main 역할을 뗀다 */}
      <section className={styles.center} role={overlay ? undefined : "main"} aria-labelledby={`${id}-title`}>
        <h1 id={`${id}-title`} className={styles.srOnly}>{title}</h1>
        {phase === "finale" && <span className={styles.flare} aria-hidden="true" />}
        <div className={styles.logo}>
          {/* 가지, 장식 줄, 글자, 잎을 따로 그려야 다음 화면이 붙으며 바빠져도 각 층의 움직임이 끊기지 않는다 */}
          <div className={styles.art} aria-hidden="true">
            <img className={styles.branch} src={BRANCH} alt="" decoding="async" />
            {attached.map((leaf) => (
              <img key={`leaf-${leaf.second}`} className={styles.leaf} src={leaf.src} alt="" decoding="async" style={{ ...place(leaf), "--order": FINAL_SECONDS - leaf.second }} />
            ))}
          </div>
          <svg className={`${styles.cream} ${styles.rules}`} viewBox={`242 ${RULE_TOP} 770 ${896 - RULE_TOP}`} aria-hidden="true" focusable="false">
            <defs>
              <clipPath id={`${id}-rules`}>
                <rect x="0" y={RULE_TOP} width="1254" height={WORD_TOP - RULE_TOP} />
                <rect x="0" y={WORD_TOP + WORD_HEIGHT} width="1254" height={1254 - WORD_TOP - WORD_HEIGHT} />
              </clipPath>
            </defs>
            <image href={LOGO} width="1254" height="1254" clipPath={`url(#${id}-rules)`} />
          </svg>
          <svg className={`${styles.cream} ${styles.wordmark}`} viewBox={`242 ${WORD_TOP} 770 ${WORD_HEIGHT}`} aria-hidden="true" focusable="false">
            <image href={LOGO} width="1254" height="1254" />
          </svg>
          {falling.map((leaf) => (
            <span key={`fall-${leaf.second}`} className={styles.fallingLeaf} style={{ ...place(leaf), "--sway": `${leaf.sway}vw`, "--spin": `${leaf.spin}deg` }} aria-hidden="true">
              <img className={styles.leafCream} src={leaf.src} alt="" decoding="async" />
            </span>
          ))}
          <div className={styles.numeral} aria-hidden="true">
            {digits.previous != null && <span key={`out-${digits.previous}`} className={styles.digit} data-leaving="true">{digits.previous}</span>}
            {digits.current != null && <span key={`in-${digits.current}`} className={styles.digit} data-urgent={digits.current <= 3}>{digits.current}</span>}
            {/* 마지막 10초에 처음 쓰는 숫자 글꼴을 기다리는 동안 미리 받아 둔다 */}
            <span className={styles.fontWarm}>0123456789</span>
          </div>
          {(phase === "final" || phase === "finale") && (
            <span key={`sparks-${step}`} className={styles.sparks} aria-hidden="true">
              <i data-rule="top" data-side="left" /><i data-rule="top" data-side="right" />
              <i data-rule="bottom" data-side="left" /><i data-rule="bottom" data-side="right" />
            </span>
          )}
        </div>
        {phase === "finale" && (
          <div className={styles.burst} aria-hidden="true">
            {BURST.map((leaf) => <Leaf key={leaf.id} leaf={leaf} className={styles.burstLeaf} style={{ "--dx": `${leaf.dx}vmax`, "--dy": `${leaf.dy}vmax` }} />)}
          </div>
        )}

        <div className={styles.info} aria-hidden={phase !== "waiting" && phase !== "done"}>
          {labels
            ? <p className={styles.date}><time dateTime={targetTime}>{labels.date}</time> <span>{labels.time}</span></p>
            : <p className={styles.date}>{copy.unknown}</p>}
          {phase === "done"
            ? <p className={styles.doneMessage}>{copy.finale}</p>
            : Number.isFinite(secondsLeft) && (
              <div className={styles.clock} role="timer" aria-live="off" aria-label={`${copy.final} 남은 시간`}>
                <p className={styles.caption} lang="en">{copy.caption}</p>
                <div className={styles.units} lang="en">
                  {clockParts(secondsLeft).map((part) => <span key={part.unit}><b>{part.value}</b><small>{part.label}</small></span>)}
                </div>
              </div>
            )}
          {note && <p className={styles.note}>{note}</p>}
          {links && links.length > 0 && (
            <nav className={styles.links} aria-label="함께 볼 수 있는 화면">
              {links.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
            </nav>
          )}
        </div>
        {phase === "final" && <p className={styles.srOnly} role="timer" aria-live="off">{`${copy.final} ${secondsLeft}초`}</p>}
      </section>
    </div>
  );
}

import { formatRemaining } from "../../../utils/time.js";
import styles from "./BoardScreen.module.css";
import PanelTexture from "../../../components/common/PanelTexture.jsx";

const MAX_DICE_ROLLS = 3;

// Keep the original frame and dice. A blank crop from the same wood replaces
// the baked sample values and gauge together, so no black cover or gauge tip
// can protrude around the live text at a different viewport size.
export default function DiceStatusPanel({
  rollsLeft,
  canRoll,
  blockedMessage,
  resetInSeconds,
  challengeRemainingSeconds,
}) {
  const rechargeVisible = rollsLeft < MAX_DICE_ROLLS && resetInSeconds != null;
  const statusLabel =
    blockedMessage || (canRoll ? "주사위를 굴릴 수 있습니다." : "상태 확인 중");

  return (
    <div
      className={`${styles.diceStatus} absolute left-[1.35%] top-0 w-[19.69%] h-[20.65%]`}
      role="status"
      data-roll-ready={canRoll && !blockedMessage}
      aria-label={`주사위 보유 ${rollsLeft}/${MAX_DICE_ROLLS}. ${statusLabel}${rechargeVisible ? `, 충전까지 ${formatRemaining(resetInSeconds)}` : ""}${challengeRemainingSeconds == null ? "" : `, 문제 제한 ${formatRemaining(challengeRemainingSeconds)}`}`}
    >
      <PanelTexture />
      <img src="/assets/board/dice.png" className={styles.mobileDiceIcon} alt="" aria-hidden="true" />
      <svg viewBox="0 0 378 223" className={styles.dicePanelArtwork} aria-hidden="true" focusable="false">
        <image href="/assets/board/panel-dice-status.png" width="378" height="223" />
        <svg x="46" y="103" width="295" height="38" viewBox="145 60 170 25" preserveAspectRatio="xMidYMid slice">
          <image href="/assets/board/panel-dice-status.png" width="378" height="223" />
        </svg>
      </svg>

      <div className={`${styles.diceReadout} absolute left-[12.5%] top-[45%] z-10 w-[77%] font-inria-serif text-[#f8ead0]`}>
        {/* 기능 명세(2026-09-28): 보유 횟수/3 표시. 3/3이면 서버가 next_dice_reset_at을 비워 충전 타이머가 멈춘다. */}
        <div className={styles.diceCountRow}>
          <span>주사위 {rollsLeft}/{MAX_DICE_ROLLS}</span>
          {rechargeVisible && <span>충전까지 <strong>{formatRemaining(resetInSeconds)}</strong></span>}
        </div>
      </div>
      {challengeRemainingSeconds != null && <div className={`${styles.diceChallengeRow} absolute right-[10%] top-[25%] z-10 font-inria-serif`}>문제 제한 <strong>{formatRemaining(challengeRemainingSeconds)}</strong></div>}
      <p className={`${styles.diceStatusMessage} absolute left-[5.6%] top-[70%] z-10 m-0 w-[87.8%] text-left font-inria-serif text-[#e7d2ad]`}>
        {statusLabel}
      </p>
    </div>
  );
}

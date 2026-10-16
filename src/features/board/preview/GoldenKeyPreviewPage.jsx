import { useEffect, useRef, useState } from "react";
import usePageResources from "../../../routes/usePageResources.js";
import { GOLDEN_KEY_NAMES } from "../components/GoldenKeyCard.jsx";
import BoardScreen from "../components/BoardScreen.jsx";
import { adaptChanceDraw } from "../utils/boardData.js";
import { PREVIEW_BOARD_CELLS } from "./lineRailPreviewData.js";
import styles from "./GoldenKeyPreviewPage.module.css";

// 디자인 확인 전용 예시. API/실제 카드 데이터/팀 상태와 완전히 분리한다.
const SAMPLE_DESCRIPTIONS = [
  "주사위를 다시 굴립니다. 사용 시점과 조건은 실제 보유 카드 안내를 확인해 주세요.",
  "주사위를 두 번 굴리고, 나온 두 결과 중 하나를 선택합니다.",
  "주사위 결과 확정 시 주변 칸으로 이동합니다. 이동 가능 범위는 실제 카드 사용 화면을 따릅니다.",
  "원하는 칸으로 여행합니다. 이동 가능 여부와 사용 조건은 서버의 카드 안내를 따릅니다.",
  "추가 주사위 기회를 얻습니다. 지급 수량과 사용 조건은 실제 카드 안내를 확인해 주세요.",
];
export default function GoldenKeyPreviewPage() {
  usePageResources();
  const [selected, setSelected] = useState(0);
  const [cellEvent, setCellEvent] = useState(null);
  const [controls, setControls] = useState(!new URLSearchParams(window.location.search).has("capture"));
  const timer = useRef(null);
  const cards = Object.entries(GOLDEN_KEY_NAMES);
  const draw = (index) => {
    clearTimeout(timer.current);
    setSelected(index);
    setCellEvent({ type: "CHANCE", token: "preview-draw", status: "loading" });
    timer.current = setTimeout(() => {
      // 실제 추첨 응답 data와 동일한 구조를 서비스 어댑터로 변환한다. 서버 요청은 없다.
      const result = adaptChanceDraw({ card_id: cards[index][0], name: cards[index][1],
        description: SAMPLE_DESCRIPTIONS[index], used: false, dice_rolls_left: 3, awaiting_discard: false });
      setCellEvent({ type: "CHANCE", token: "preview-draw", status: "success", result });
    }, 650);
  };
  useEffect(() => {
    draw(0);
    const toggle = (event) => { if (event.key === "F2") { event.preventDefault(); setControls(value => !value); } };
    window.addEventListener("keydown", toggle);
    return () => { clearTimeout(timer.current); window.removeEventListener("keydown", toggle); };
  }, []);
  const noop = () => {};
  return <main className={styles.page}>
    <div onClickCapture={event => {
      const target = event.target.closest("a,button");
      // 실서비스 화면 이동/로그아웃 요청을 미리보기에서 실행하지 않는다.
      if (target && (target.tagName === "A" || /로그아웃/.test(target.textContent + target.getAttribute("aria-label")))) {
        event.preventDefault(); event.stopPropagation();
      }
    }}>
      <BoardScreen boardDefinition={{ cells: PREVIEW_BOARD_CELLS }}
        myBoard={{ position: 7, consumedCellIndexes: [], activeChallenge: null }}
        diceStatus={{ canRoll: false, diceRollsLeft: 3 }}
        currentCell={PREVIEW_BOARD_CELLS[6]} displayPosition={7} pieceTransitionMs={0}
        cellEvent={cellEvent} ownedChanceCards={[]} cellStatesByIndex={new Map()}
        awaitingDiscard={false} isLoading={false} isMutating={cellEvent?.status === "loading"}
        onCloseCellEvent={() => setCellEvent(null)} onRetryChanceDraw={() => draw(selected)}
        onSelectCell={index => { if (index === 7 || index === 30) draw(selected); }}
        onRollDice={noop} onReload={noop} onUseChanceCard={noop} onConfirmDice={noop}
        onOpenChallenge={noop} onConfirmChance={noop} onDiscardChance={noop}
        onSpinRoulette={noop} onOpenChallengeDetail={noop} onMoveAirport={noop} />
    </div>
    {controls && <aside className={styles.controls} aria-label="개발용 황금열쇠 미리보기">
      <strong>개발용 · 서버 요청 없음 · F2로 숨김/표시</strong>
      {cards.map(([id, name], index) => <button key={id} type="button" onClick={() => draw(index)}>{name}</button>)}
      <button type="button" onClick={() => setControls(false)}>촬영 모드 · 컨트롤 숨김</button>
    </aside>}
  </main>;
}

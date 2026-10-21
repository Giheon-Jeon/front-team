import { useState } from "react";
import BoardSurface from "../components/BoardSurface.jsx";
import BoardLineOverlay from "../components/BoardLineOverlay.jsx";
import { BOARD_GEM_RAIL_PALETTES } from "../utils/boardGemRail.js";
import { createRailPreview, PREVIEW_BOARD_CELLS } from "./lineRailPreviewData.js";
import styles from "./LineRailPreviewPage.module.css";

export default function LineRailPreviewPage() {
  const [states, setStates] = useState(Array(6).fill("complete"));
  const { lines, cleared } = createRailPreview(states);
  return <main className={styles.page}>
    <header><h1>보석 레일 · 디자인 미리보기</h1>
      <p>개발 전용 시뮬레이션입니다. 실제 팀·독점 지급 기록·보너스 점수와 무관합니다.</p></header>
    <div className={styles.stage} data-preview-stage="true">
      <img className={styles.background} src="/assets/board/bg-1920x1080-display.webp" alt="" />
      <div className={styles.track} data-preview-track="true">
        <BoardSurface cells={PREVIEW_BOARD_CELLS} visitedCellIndexes={cleared} />
        <BoardLineOverlay lines={lines} boardCells={PREVIEW_BOARD_CELLS} solvedCellIndexes={cleared} isInteractive={false} />
      </div>
    </div>
    <section className={styles.controls} aria-label="레일 시뮬레이션 상태">
      <div className={styles.presets}>
        <button type="button" onClick={() => setStates(Array(6).fill("complete"))}>전체 라인 표시 / 완료</button>
        <button type="button" onClick={() => setStates(Array(6).fill("incomplete"))}>전체 미완료</button>
        <button type="button" onClick={() => setStates(Array(6).fill("partial"))}>일부 문제 해결</button>
      </div>
      <div className={styles.lines}>{states.map((state, index) => <label key={index} style={{ "--accent": BOARD_GEM_RAIL_PALETTES[index].mid }}>
        {index + 1}번 · {BOARD_GEM_RAIL_PALETTES[index].key}
        <select aria-label={`${index + 1}번 라인 상태`} value={state} onChange={event => setStates(previous => previous.map((value, i) => i === index ? event.target.value : value))}>
          <option value="complete">완료 시뮬레이션 · 5/5</option>
          <option value="partial">진행 중 · 2/5</option>
          <option value="incomplete">미완료 · 0/5</option>
        </select>
      </label>)}</div>
    </section>
  </main>;
}

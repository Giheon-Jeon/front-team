import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GameSceneContext } from "./GameSceneContext.js";
import { getAnchoredBackdrop, getGameSceneGeometry } from "./gameSceneGeometry.js";
import styles from "./GameSceneViewport.module.css";

function readViewport() {
  return typeof window === "undefined" ? { width: 1920, height: 1080 } : { width: window.innerWidth, height: window.innerHeight };
}

export default function GameSceneViewport({ children, label, backdrop, portraitBackdrop, color, anchor }) {
  const [viewport, setViewport] = useState(readViewport);
  const [expanded, setExpanded] = useState(false);
  const scroller = useRef(null);
  const pendingFocus = useRef(null);
  const geometry = getGameSceneGeometry(viewport.width, viewport.height, expanded);
  const { compact, scale, layoutWidth, layoutHeight, worldWidth, worldHeight, left, top } = geometry;

  useEffect(() => {
    const update = () => setViewport(readViewport());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => { if (!compact) setExpanded(false); }, [compact]);

  const centerOn = useCallback((element, fractionX = 0.5, fractionY = 0.5) => {
    const container = scroller.current;
    if (!container || !element) return;
    const rect = element.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    container.scrollTo({
      left: container.scrollLeft + rect.left - bounds.left + rect.width * fractionX - container.clientWidth / 2,
      top: container.scrollTop + rect.top - bounds.top + rect.height * fractionY - container.clientHeight / 2,
      behavior: "instant",
    });
  }, []);

  const reveal = useCallback((element) => {
    const container = scroller.current;
    if (!container || !element) return;
    const rect = element.getBoundingClientRect();
    const bounds = container.getBoundingClientRect();
    container.scrollTo({
      left: container.scrollLeft + rect.left - bounds.left - (rect.width > container.clientWidth - 32 ? 16 : (container.clientWidth - rect.width) / 2),
      top: container.scrollTop + rect.top - bounds.top - (rect.height > container.clientHeight - 120 ? 16 : (container.clientHeight - rect.height) / 2),
      behavior: "instant",
    });
  }, []);

  useLayoutEffect(() => {
    const container = scroller.current;
    if (!container) return;
    if (pendingFocus.current && expanded) {
      reveal(pendingFocus.current);
      pendingFocus.current = null;
    } else {
      container.scrollTo({ left: compact && expanded ? (worldWidth - viewport.width) / 2 : 0, top: 0, behavior: "instant" });
    }
  }, [compact, expanded, worldWidth, viewport.width, reveal]);

  const value = useMemo(() => ({ compact, expanded: compact && expanded, setExpanded, centerOn, reveal }), [compact, expanded, centerOn, reveal]);
  const backdropStyle = anchor ? getAnchoredBackdrop(geometry, anchor) : undefined;
  return (
    <GameSceneContext.Provider value={value}>
      <div
        ref={scroller}
        className={styles.viewport}
        data-game-viewport={label}
        data-compact={compact}
        data-expanded={compact && expanded}
        style={{ "--scene-color": color }}
      >
        <div className={styles.world} style={{ width: worldWidth, height: worldHeight }}>
          {compact && backdrop && <picture style={{ display: "contents" }}>
            {portraitBackdrop && <source media="(max-width: 1100px) and (max-aspect-ratio: 9/10)" srcSet={portraitBackdrop} />}
            <img className={anchor ? styles.anchoredBackdrop : styles.backdrop} src={backdrop} style={backdropStyle} alt="" aria-hidden="true" data-game-backdrop="" />
          </picture>}
          <div
            className={styles.canvas}
            data-game-canvas=""
            style={{ width: layoutWidth, height: layoutHeight, left, top, transform: compact ? `scale(${scale})` : undefined, "--scene-vw": `${layoutWidth / 100}px`, "--scene-vh": `${layoutHeight / 100}px` }}
            onFocusCapture={event => {
              if (compact && event.currentTarget.contains(event.target) && event.target.matches('input, textarea, select, [contenteditable="true"]')) {
                if (expanded) reveal(event.target);
                else {
                  pendingFocus.current = event.target;
                  setExpanded(true);
                }
              }
            }}
          >
            {children}
          </div>
        </div>
      </div>
      {compact && <div className={styles.controls}>
        <span aria-hidden="true">{expanded ? "화면을 밀어서 이동" : "원본 디자인 · 전체 보기"}</span>
        <button type="button" aria-label={`${label} ${expanded ? "화면 맞춤" : "확대 보기"}`} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "화면 맞춤" : "확대 보기"}</button>
      </div>}
    </GameSceneContext.Provider>
  );
}

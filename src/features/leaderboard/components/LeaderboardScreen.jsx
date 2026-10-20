import { useEffect, useRef, useState } from "react";
import LeaderboardChart from "./LeaderboardChart.jsx";
import LeaderboardArtwork from "./LeaderboardArtwork.jsx";
import LeaderboardScoreGraph from "./LeaderboardScoreGraph.jsx";
import RankingTable from "./RankingTable.jsx";
import RankingToolbar from "./RankingToolbar.jsx";
import ScoreBoard from "./ScoreBoard.jsx";
import styles from "./LeaderboardScreen.module.css";

const BASE_URL = import.meta.env.BASE_URL;
const ASSET_BASE = `${BASE_URL}assets/leaderboard/`;

export default function LeaderboardScreen({
  teams,
  rankings,
  leaderboardStatus,
  rankingStatus,
  onBack,
  page = 1, pageCount = 1, onPageChange, refreshing, updatedAt, refreshError, onRefresh,
}) {
  const dataStatus = `leaderboard:${leaderboardStatus}; ranking:${rankingStatus}`;
  const viewport = useRef(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1100px)");
    const reset = () => { if (!mobile.matches) setExpanded(false); };
    mobile.addEventListener("change", reset);
    return () => mobile.removeEventListener("change", reset);
  }, []);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    requestAnimationFrame(() => {
      const page = viewport.current;
      if (page) page.scrollTo({ left: next ? (page.scrollWidth - page.clientWidth) / 2 : 0, top: 0 });
    });
  };

  return (
    <>
      <main ref={viewport} id="leaderboard-viewport" className={`${styles.page} ${expanded ? styles.expandedPage : ""}`}
        data-leaderboard-source={dataStatus} data-view={expanded ? "expanded" : "fit"} tabIndex={expanded ? 0 : undefined}>
        {/* 풍경은 페이지 전체에 이어지고 전경과 UI는 원본 비율로 함께 축소한다. */}
        <div className={styles.stage}>
          <div className={styles.designCanvas}>
            <LeaderboardArtwork />

            <button type="button" className={styles.backButton} onClick={onBack} aria-label="이전 페이지">
              <span className={styles.backIcon}>
                <img src={`${ASSET_BASE}icon-back.svg`} alt="" aria-hidden="true" />
              </span>
            </button>

            <h1 className={styles.srOnly}>SCOREBOARD</h1>

            <ScoreBoard
              staticAssetSrc={`${ASSET_BASE}score.png`}
              dynamicGraph={
                <LeaderboardScoreGraph teams={teams} status={leaderboardStatus} />
              }
            />
            <LeaderboardChart teams={teams} status={leaderboardStatus} />
            <section className={styles.rankingPanel} aria-label="팀 순위">
              <RankingToolbar page={page} pageCount={pageCount} onPageChange={onPageChange}
                refreshing={refreshing} updatedAt={updatedAt} onRefresh={onRefresh} />
              <RankingTable rankings={rankings} status={rankingStatus} />
            </section>
            {refreshError && <p className={styles.refreshNote} role="alert">
              일부 정보를 갱신하지 못했습니다 새로고침으로 다시 시도해주세요
            </p>}
            <p className={styles.srOnly} aria-live="polite">
              {dataStatus}
            </p>
          </div>
        </div>
      </main>
      <button type="button" className={styles.screenZoom} onClick={toggleExpanded}
        aria-controls="leaderboard-viewport" aria-pressed={expanded}
        aria-label={expanded ? "스코어보드 전체 화면에 맞추기" : "스코어보드 읽기 크기로 확대"}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 5 5M7 10h6" />
          {!expanded && <path d="M10 7v6" />}
        </svg>
        {expanded ? "화면 맞춤" : "확대 보기"}
      </button>
    </>
  );
}

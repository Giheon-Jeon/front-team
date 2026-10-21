import { useId } from "react";
import styles from "./LeaderboardScreen.module.css";
import PanelTexture from "../../../components/common/PanelTexture.jsx";

const ASSET = `${import.meta.env.BASE_URL}assets/leaderboard/leaderboard-layout.webp`;
const SOURCE_COORDINATES = `scale(${1 / 1672} ${1 / 941})`;
const PANEL_OUTLINE = "M169 148H1511Q1514 170 1538 172V829Q1514 833 1511 851H169Q165 833 143 831V174Q166 171 169 148Z";
const FOOTER_OUTLINE = "M725 841H949L958 850L980 855L986 872L999 885L986 898L980 918L952 928H721L704 920L697 900L686 885L698 870L703 852Z";

export function LeaderboardMobilePaper() {
  const id = useId();
  const slices = [
    [1, 1, "143 148 40 40"], [1, 2, "1000 148 120 40"], [1, 3, "1498 148 40 40"],
    [2, 1, "143 600 40 120"], [2, 3, "1498 600 40 120"],
    [3, 1, "143 811 40 40"], [3, 2, "300 811 120 40"], [3, 3, "143 811 40 40", true],
  ];
  return <div className={styles.mobilePaperArtwork} aria-hidden="true">
    <svg width="0" height="0" className={styles.artworkDefinitions}><defs><clipPath id={id}><path d={PANEL_OUTLINE} /></clipPath></defs></svg>
    <PanelTexture material="scoreboard" responsive="width" />
    {slices.map(([row, column, crop, mirror]) => <svg key={`${row}-${column}`} viewBox={crop} preserveAspectRatio="none" style={{ gridRow: row, gridColumn: column, transform: mirror ? "scaleX(-1)" : undefined }}>
      <image href={ASSET} width="1672" height="941" clipPath={`url(#${id})`} />
    </svg>)}
  </div>;
}

export function LeaderboardFooter() {
  const id = useId();
  return <svg className={styles.mobileFooterArtwork} viewBox="686 840 314 90" aria-hidden="true" focusable="false">
    <defs><clipPath id={id}><path d={FOOTER_OUTLINE} /></clipPath></defs>
    <image href={ASSET} width="1672" height="941" clipPath={`url(#${id})`} />
  </svg>;
}

export function LeaderboardTitle() {
  const id = useId();
  return <svg className={styles.mobileTitleArtwork} viewBox="540 58 610 73" aria-hidden="true" focusable="false">
    <defs><filter id={`${id}-title-ink`} colorInterpolationFilters="sRGB">
      <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.2126 -0.7152 -0.0722 0 1" />
      <feComponentTransfer><feFuncA type="linear" slope="10" intercept="-3.5" /></feComponentTransfer>
    </filter></defs>
    <image href={ASSET} width="1672" height="941" filter={`url(#${id}-title-ink)`} />
  </svg>;
}

export default function LeaderboardArtwork() {
  const id = useId();
  const layers = [
    { name: "panel" },
    { name: "corner", className: styles.paperCorner },
    { name: "footer" },
    { name: "title", filter: `url(#${id}-ink)` },
  ];

  return <>
    <svg className={styles.artworkDefinitions} width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-panel`} clipPathUnits="objectBoundingBox">
          <path transform={SOURCE_COORDINATES} d="M169 148H1511Q1514 170 1538 172V829Q1514 833 1511 851H169Q165 833 143 831V174Q166 171 169 148Z" />
        </clipPath>
        {/* 원본의 책에 가려진 모서리는 반대쪽 원본 모서리를 대칭으로 표시한다. */}
        <clipPath id={`${id}-corner`} clipPathUnits="objectBoundingBox">
          <path transform={SOURCE_COORDINATES} d="M143 780H240V851H169Q165 833 143 831Z" />
        </clipPath>
        <clipPath id={`${id}-footer`} clipPathUnits="objectBoundingBox">
          <path transform={SOURCE_COORDINATES} d="M725 841H949L958 850L980 855L986 872L999 885L986 898L980 918L952 928H721L704 920L697 900L686 885L698 870L703 852Z" />
        </clipPath>
        <clipPath id={`${id}-title`} clipPathUnits="objectBoundingBox">
          <rect transform={SOURCE_COORDINATES} x="540" y="58" width="610" height="73" />
        </clipPath>
        <filter id={`${id}-ink`} colorInterpolationFilters="sRGB">
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.2126 -0.7152 -0.0722 0 1" />
          <feComponentTransfer><feFuncA type="linear" slope="10" intercept="-3.5" /></feComponentTransfer>
        </filter>
      </defs>
    </svg>
    {layers.map(layer => <img key={layer.name} src={ASSET} alt="" aria-hidden="true" width="1672" height="941"
        className={`${styles.leaderboardArtwork} ${layer.className || ""}`}
        style={{ clipPath: `url(#${id}-${layer.name})`, filter: layer.filter }} />)}
  </>;
}

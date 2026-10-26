import { useId } from "react";
import styles from "./KothScreen.module.css";

const SOURCE = "/assets/koth/koth-trail-background.webp";

// Recompose original map artwork at readable sizes. Only the paper is removed
// from ink decorations; their lettering, colors, and illustration stay intact.
function MapCrop({ viewBox, className, ink = false }) {
  const id = useId();
  return <svg viewBox={viewBox} className={className} aria-hidden="true" focusable="false">
    {ink && <defs><filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -0.2126 -0.7152 -0.0722 0 1" />
      <feComponentTransfer><feFuncA type="linear" slope="6" intercept="-1.4" /></feComponentTransfer>
    </filter></defs>}
    <image href={SOURCE} width="1672" height="941" filter={ink ? `url(#${id})` : undefined} />
  </svg>;
}

export function KothMobileHeading() {
  return <header className={styles.mobileMapHeading}>
    <h1 className={styles.mobileTitle}>King of the Hill</h1>
    <MapCrop viewBox="100 60 375 350" className={styles.mobileTitleArtwork} ink />
    <MapCrop viewBox="465 35 920 395" className={styles.mobileTrailArtwork} />
    <MapCrop viewBox="1380 70 240 240" className={styles.mobileMapSeal} ink />
  </header>;
}

const ROUND_CROPS = ["55 418 560 154", "613.5 418 486 154", "1103.5 418 498 154"];
export function KothRoundArtwork({ round }) {
  return <MapCrop viewBox={ROUND_CROPS[round - 1]} className={styles.mobileRoundArtwork} ink />;
}

export function KothMapFooter() {
  return <MapCrop viewBox="465 860 735 51" className={styles.mobileMapFooter} ink />;
}

export function KothMapFrame() {
  const slices = [
    [1, 1, "0 0 96 96"], [1, 2, "460 0 100 96"], [1, 3, "1576 0 96 96"],
    [2, 1, "0 600 96 100"], [2, 3, "1576 600 96 100"],
    [3, 1, "0 845 96 96"], [3, 2, "250 845 100 96"], [3, 3, "1576 845 96 96"],
  ];
  return <div className={styles.mobileMapFrame} aria-hidden="true">
    {slices.map(([row, column, crop]) => <svg key={`${row}-${column}`} viewBox={crop} preserveAspectRatio="none" style={{ gridRow: row, gridColumn: column }}>
      <image href={SOURCE} width="1672" height="941" />
    </svg>)}
  </div>;
}

// 문제 시트에 지도의 라운드 리본과 왕관을 그대로 옮겨 쓴다 종이는 지우고 잉크만 남긴다
const RIBBON_CROPS = ["236 514 194 34", "769 514 166 34", "1267 514 167 34"];
export function KothRoundRibbon({ round, className }) {
  return <MapCrop viewBox={RIBBON_CROPS[round - 1] ?? RIBBON_CROPS[0]} className={className} ink />;
}

export function KothCrown({ className }) {
  return <MapCrop viewBox="256 62 60 44" className={className} ink />;
}

import { useId } from "react";

// 원본 월계관과 낙엽을 그대로 사용한다 픽셀을 다시 그리지 않고 배경의 종이색만 투명하게 표시한다
export const RANK_ARTWORK = {
  1: [216, 568, 55, 43],
  2: [216, 611, 55, 43],
  3: [216, 655, 55, 43],
};
export const LEAF_ARTWORK = [
  [1331, 195, 32, 32], [1331, 235, 32, 32], [1331, 276, 32, 32],
  [1331, 317, 32, 32], [1331, 359, 32, 32], [1331, 399, 32, 32],
];

// Keep neighboring source pixels for identical interpolation at the crop edge.
export const ARTWORK_PADDING = 2;
const symbolAssets = new Map([...Object.values(RANK_ARTWORK), ...LEAF_ARTWORK]
  .map(region => [region.join("-"), `${import.meta.env.BASE_URL}assets/leaderboard/symbols/${region.join("-")}.webp`]));

export default function LeaderboardArtworkSymbol({ region, className, style }) {
  const ink = useId();
  const cropped = symbolAssets.get(region.join("-"));
  return <svg viewBox={region.join(" ")} className={className} style={style} aria-hidden="true" focusable="false">
    <defs><filter id={ink} colorInterpolationFilters="sRGB">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -2 -2 -2 0 4" />
    </filter></defs>
    <image href={cropped || `${import.meta.env.BASE_URL}assets/leaderboard/leaderboard.png`}
      x={cropped ? region[0] - ARTWORK_PADDING : 0} y={cropped ? region[1] - ARTWORK_PADDING : 0}
      width={cropped ? region[2] + ARTWORK_PADDING * 2 : 1672} height={cropped ? region[3] + ARTWORK_PADDING * 2 : 941}
      filter={`url(#${ink})`} />
  </svg>;
}

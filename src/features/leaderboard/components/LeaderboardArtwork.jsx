import { useId } from "react";
import styles from "./LeaderboardScreen.module.css";

const ASSET = `${import.meta.env.BASE_URL}assets/leaderboard/leaderboard-layout.webp`;
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const SOURCE_COORDINATES = `scale(${1 / 1672} ${1 / 941})`;

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
    {layers.map(layer => <picture key={layer.name} style={{ display: "contents" }}>
      {/* display: contents 안의 source가 모바일 flex 항목으로 계산되어 간격을 만들지 않게 한다. */}
      <source style={{ display: "none" }} media="(max-width: 1100px)" srcSet={EMPTY_IMAGE} />
      <img src={ASSET} alt="" aria-hidden="true" width="1672" height="941"
        className={`${styles.leaderboardArtwork} ${layer.className || ""}`}
        style={{ clipPath: `url(#${id}-${layer.name})`, filter: layer.filter }} />
    </picture>)}
  </>;
}

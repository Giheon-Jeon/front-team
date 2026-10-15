import styles from "./LoginScreen.module.css";

const PLATE_SRC = `${import.meta.env.BASE_URL}assets/login/login-card-plate.webp`;

// 원본의 모서리와 장식은 그대로 두고, 빈 양피지만 입력 영역에 맞춰 늘린다
const FRAME_SLICES = [
  [780, 24, 220, 300], [1000, 24, 1840, 300], [2840, 24, 220, 300],
  [780, 324, 220, 1356], null, [2840, 324, 220, 1356],
  [780, 1680, 220, 416], [1000, 1680, 1840, 416], [2840, 1680, 220, 416],
];

function ArtworkSlice({ rect, className }) {
  return (
    <svg className={className} viewBox={rect.join(" ")} preserveAspectRatio="none" focusable="false">
      <image href={PLATE_SRC} width="3840" height="2160" />
    </svg>
  );
}

export function LoginFrameArtwork() {
  return (
    <div className={styles.frameArtwork} aria-hidden="true" data-login-artwork="frame">
      <div className={styles.framePaper}>
        <ArtworkSlice rect={[1000, 350, 1800, 520]} />
      </div>
      {FRAME_SLICES.map((rect, index) => rect ? (
        <ArtworkSlice key={index} rect={rect} className={styles[`frameSlice${index}`]} />
      ) : <span key={index} />)}
    </div>
  );
}

export function LoginFieldArtwork({ password = false }) {
  const y = password ? 1132 : 898;
  return (
    <div className={styles.fieldArtwork} aria-hidden="true" data-login-artwork="field">
      {[[1060, y, 190, 180], [1250, y, 1430, 180], [2680, y, 100, 180]].map((rect, index) => (
        <ArtworkSlice key={index} rect={rect} />
      ))}
    </div>
  );
}

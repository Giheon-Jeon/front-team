import { kothRound } from "../utils/kothChallengeState.js";
import KothCompletionStamp from "./KothCompletionStamp.jsx";
import styles from "./KothScreen.module.css";

// 이름 줄에 들어갈 글자 폭을 어림한다 대문자 1, 띄어쓰기 0.45, 한글 1.45
function nameUnits(name) {
  return [...name].reduce((sum, char) => sum + (char === " " ? 0.45 : /[가-힣]/.test(char) ? 1.45 : 1), 0);
}

// 우표 카드: 그림의 이름 줄은 비워 두고 출제 동아리 이름을 같은 자리에 라운드 색 글자로 얹는다 길면 한 줄에 맞게 줄인다
export default function KothCardArt({ challenge, className }) {
  const name = (challenge.clubName || "").trim();
  const scale = Math.min(1, 11 / Math.max(nameUnits(name), 1));
  return <span className={className} aria-hidden="true">
    <img src={challenge.imageSrc} alt="" className={styles.layerImage} />
    {name && <span className={styles.cardName} data-round={kothRound(challenge)}
      style={{ "--name-scale": Number(scale.toFixed(3)) }}>{name}</span>}
    <KothCompletionStamp imageSrc={challenge.completionStampImageSrc} visible={challenge.solved} />
  </span>;
}

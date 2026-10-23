import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ROUTES } from "../../../routes/routePaths.js";
import { toKst } from "../../../utils/time.js";
import FlagSubmitPanel from "../../challenges/components/FlagSubmitPanel.jsx";
import FlagResultModal from "../../challenges/components/FlagResultModal.jsx";
import PanelTexture from "../../../components/common/PanelTexture.jsx";
import { useSignatureDetail } from "../hooks/useSignatures.js";
import { getFestivalBrand } from "../utils/festivalBrand.js";
import BoothAchievement from "../components/BoothAchievement.jsx";
import scene from "../../challenges/components/ChallengeDetailScene.module.css";
import styles from "../components/SignatureScreen.module.css";
import festival from "../components/SignatureFestival.module.css";

// Figma 95:360 문제 상세 장면(보드판 · 헤더 · 설명 · 플래그 패널 이미지)을 그대로 입힌 부스 문제 상세.
// 로고, 시그니처 제목, 배점·해결한 팀, 보상 안내는 기존 내용을 모두 유지한다.
function SignatureDetail({ signatureId }) {
  const state = useSignatureDetail(signatureId);
  // 정답·오답 결과는 문제 상세처럼 화면 가운데 모달로 알린다
  const [dismissedFeedback, setDismissedFeedback] = useState(null);
  const challenge = state.data;
  const brand = getFestivalBrand(challenge?.club_name);
  // 제목에 부스 이름이 이미 들어 있으면(예: MJSEC 시그니처) 이름을 한 번만 보여준다
  const showClubName =
    challenge &&
    !challenge.title.toLowerCase().includes(challenge.club_name.toLowerCase());
  const backTo = challenge
    ? ROUTES.signatureClub(challenge.club_id)
    : ROUTES.signatures;
  const backLabel = challenge
    ? `${challenge.club_name} 부스`
    : "축제장으로 돌아가기";
  const showDock =
    challenge &&
    (state.retrySeconds > 0 || state.status === "loading");
  return (
    <div className={`${scene.page} ${styles.signaturePage}`}>
      <div className={scene.stage}>
        <div className={scene.boardFrame} aria-hidden="true" />
        <Link
          to={backTo}
          className={scene.backButton}
          aria-label={`${backLabel}로 돌아가기`}
          title={backLabel}
        >
          <img
            src="/assets/challenge-detail/icon-back.svg"
            alt=""
            aria-hidden="true"
          />
          <span className={scene.srOnly}>{backLabel}</span>
        </Link>
        <span className={styles.pageLocation}>SIGNATURE</span>
        <main className={scene.board} aria-label="부스 문제 상세">
          <PanelTexture material="paper" />
          {state.status === "loading" && !challenge && (
            <div className={scene.stateBox} role="status" aria-busy="true">
              <div className={scene.skeletonTitle} aria-hidden="true" />
              <div className={scene.skeletonBody} aria-hidden="true" />
              <p>문제 정보를 불러오는 중</p>
            </div>
          )}
          {state.status === "error" && (
            <section className={scene.stateBox} role="alert">
              <p className={scene.eyebrow}>SIGNATURE</p>
              <h1>문제를 확인하지 못했습니다</h1>
              <p>{state.error}</p>
              <button
                type="button"
                className={scene.primaryButton}
                onClick={state.retry}
              >
                다시 확인
              </button>
            </section>
          )}
          {challenge && (
            <>
              <header className={scene.header}>
                <div className={styles.titleRow}>
                  <div className={styles.detailClub}>
                    {brand && (
                      <span className={styles.clubMark} data-kind={brand.kind}>
                        <img src={brand.src} alt="" />
                      </span>
                    )}
                  </div>
                  <span className={styles.titleDivider} aria-hidden="true" />
                  <h1 className={scene.title} title={challenge.title}>
                    {showClubName && (
                      <span className={styles.clubName}>
                        {challenge.club_name}{" "}
                      </span>
                    )}
                    {challenge.title}
                  </h1>
                  {state.solved && brand && (
                    <span
                      className={`${festival.detailAchievement} ${styles.signatureStamp}`}
                      aria-hidden="true"
                    >
                      <BoothAchievement name={challenge.club_name} />
                    </span>
                  )}
                </div>
                <dl className={scene.metrics}>
                  <div className={scene.metric}>
                    <dt className={scene.bakedLabel}>배점</dt>
                    <dd className={scene.points}>
                      {challenge.score.toLocaleString("ko-KR")}
                      <small className={styles.metricUnit}> pts</small>
                    </dd>
                  </div>
                  <div className={scene.metric}>
                    <dt className={scene.bakedLabel}>해결한 팀</dt>
                    <dd>
                      {challenge.solved_team_count}
                      <small className={styles.metricUnit}> 팀</small>
                    </dd>
                  </div>
                </dl>
              </header>
              <div className={scene.contentGrid}>
                <section
                  className={`${scene.descriptionPanel} ${styles.signatureDescription}`}
                  aria-labelledby="signature-description"
                >
                  <h2 id="signature-description" className={scene.bakedLabel}>
                    문제 설명
                  </h2>
                  <div
                    className={`${scene.descriptionBody} ${styles.signatureBody}`}
                    aria-label="문제 설명 본문"
                    tabIndex={0}
                  >
                    {challenge.description ||
                      "현장 부스에서 문제 설명을 확인해주세요"}
                  </div>
                  {challenge.solved_at && (
                    <p className={styles.solvedAt}>
                      풀이 완료 {toKst(challenge.solved_at)} KST
                    </p>
                  )}
                </section>
                <div className={scene.actionColumn}>
                  <FlagSubmitPanel
                    value={state.flag}
                    onChange={state.setFlag}
                    onSubmit={state.submit}
                    disabled={state.disabled}
                    inputDisabled={
                      state.busy || state.solved || state.status !== "success"
                    }
                    busy={state.busy}
                    retrySeconds={state.retrySeconds}
                    solved={state.solved}
                    feedback={state.feedback}
                    maxLength={512}
                  />
                  <p className={styles.rewardNote}>
                    팀 점수에만 반영됩니다
                    <br />
                    마일리지와 추가 주사위는 지급되지 않습니다
                  </p>
                </div>
              </div>
              {showDock && (
                <div className={scene.dock}>
                  {state.status === "loading" && (
                    <p role="status" className={scene.notice}>
                      풀이 기록을 확인하는 중
                    </p>
                  )}
                  {state.retrySeconds > 0 && (
                    <p id="flag-retry" className={scene.retryNotice}>
                      <strong>{state.retrySeconds}초</strong> 후 다시 제출할 수
                      있습니다
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {state.feedback && state.feedback !== dismissedFeedback && (
        <FlagResultModal
          feedback={state.feedback}
          onClose={() => setDismissedFeedback(state.feedback)}
        />
      )}
    </div>
  );
}

export default function SignatureDetailPage() {
  const { signatureId } = useParams();
  // 다른 문제로 이동하면 입력한 플래그와 이전 요청 상태를 함께 버린다
  return <SignatureDetail key={signatureId} signatureId={signatureId} />;
}

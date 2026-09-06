import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../routes/routePaths.js";
import OpenChallengesScreen from "../components/OpenChallengesScreen.jsx";
import useOpenChallenges from "../hooks/useOpenChallenges.js";

// 열린 문제 목록 페이지 - README.md "10. 열린 문제 목록 페이지".
// GET /board/opened_challenges + GET /teams/me/instances 조합으로 구현
// (전용 API 그룹 없음, README 10절에서 이 방식으로 확정).
export default function OpenChallengesPage() {
  const navigate = useNavigate();
  const openChallenges = useOpenChallenges();

  return (
    <OpenChallengesScreen
      status={openChallenges.status}
      error={openChallenges.error}
      challenges={openChallenges.challenges}
      totalCount={openChallenges.totalCount}
      solvedCount={openChallenges.solvedCount}
      totalScore={openChallenges.totalScore}
      instance={openChallenges.instance}
      onRetry={openChallenges.retry}
      onSelectChallenge={(challengeId) => navigate(ROUTES.challengeDetail(challengeId))}
    />
  );
}

import { useState } from "react";
import { SignatureFestivalScreen } from "../pages/SignaturesPage.jsx";
import ChallengeMenuModal from "../components/ChallengeMenuModal.jsx";

// 디자인 검토 전용 샘플이다. 실제 API fallback이나 문제 ID로 사용하지 않는다.
const SAMPLE_MENU = [
  { id: "preview-message", title: "Hidden Message", category: "FORENSIC", score: 300, description: "낡은 파일 속에 남겨진 작은 단서. 숨겨진 메시지를 찾아보세요.", state: "available", previewIllustration: "/assets/koth/challenge-river-crossing.png" },
  { id: "preview-login", title: "Autumn Login", category: "WEB", score: 500, description: "가을 시장의 문을 여는 로그인 페이지에는 어떤 비밀이 있을까요?", state: "solved", previewIllustration: "/assets/koth/challenge-lantern-camp.png" },
  { id: "preview-letter", title: "The Last Letter", category: "CRYPTO", score: 400, description: "축제 마지막 날 도착한 암호 편지. 다음 공개를 기다려주세요.", state: "locked", previewIllustration: "/assets/koth/challenge-crown-summit.png" },
];
const CLUB = { name: "MJSEC", university: "명지대학교" };
const BOOTH_SAMPLES = SAMPLE_MENU.map((item) => ({
  signature_id: item.id, club_id: "preview-mjsec", club_name: "MJSEC",
  title: item.title, score: item.score, is_solved: item.state === "solved",
}));

export default function ChallengeMenuPreview() {
  const params = new URLSearchParams(window.location.search);
  const [open, setOpen] = useState(params.get("open") === "1");
  const status = ["loading", "error", "empty"].includes(params.get("state")) ? params.get("state") : "success";
  return <>
    <SignatureFestivalScreen state={{ status: "success", data: BOOTH_SAMPLES, retry() {} }} onPreviewMjsec={() => setOpen(true)} />
    <aside style={{ position: "fixed", bottom: 12, left: 12, color: "#f2dab1", background: "#302116eb", padding: "10px 16px", fontSize: 12, zIndex: 3 }}>디자인 미리보기 / MJSEC 부스를 클릭하세요 / 실제 API 호출 없음</aside>
    {open && <ChallengeMenuModal club={CLUB} items={status === "empty" ? [] : SAMPLE_MENU} status={status === "empty" ? "success" : status} error="문제 메뉴를 불러오지 못했습니다. 잠시 후 다시 방문해주세요." onClose={() => setOpen(false)} onRetry={() => window.location.reload()} preview />}
  </>;
}

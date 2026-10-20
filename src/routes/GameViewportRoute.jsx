import { Outlet, useLocation } from "react-router-dom";
import GameSceneViewport from "../components/common/GameSceneViewport.jsx";

const scenes = {
  board: { label: "보드", backdrop: "/assets/board/bg-1920x1080-display.webp", color: "#21150d", anchor: { x: 917, y: 630 } },
  koth: { label: "KoTH", color: "#efd5a7" },
  rules: { label: "규칙", backdrop: "/assets/login/background-plaza.webp", portraitBackdrop: "/assets/login/background-plaza-portrait.webp", color: "#674326" },
  mypage: { label: "마이페이지", backdrop: "/assets/challenge-detail/bg-forest.webp", color: "#1c130c" },
  challenges: { label: "문제 상세", backdrop: "/assets/challenge-detail/bg-forest.webp", color: "#1c130c" },
  signatures: { label: "동아리 축제장", color: "#23170f" },
};

export default function GameViewportRoute() {
  const { pathname } = useLocation();
  return <GameSceneViewport key={pathname} {...(scenes[pathname.split("/")[1]] ?? scenes.board)}><Outlet /></GameSceneViewport>;
}

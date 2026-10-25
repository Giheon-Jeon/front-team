// 대기 화면을 보는 동안 시작 뒤에 열릴 화면 코드를 미리 받아 둔다
// 시작하는 순간 모두가 한꺼번에 받으면 시작 연출이 끝나도 화면이 늦게 뜬다 AppRoutes 의 lazy 선언과 같은 파일을 가리켜 같은 조각을 쓴다
export const GATED_PAGE_IMPORTS = [
  [/^\/board\/?$/, () => [import("../features/board/pages/BoardPage.jsx"), import("../features/board/components/Dice3D.jsx")]],
  [/^\/challenges\/?$/, () => [import("../features/challenges/pages/OpenChallengesPage.jsx")]],
  [/^\/challenges\/[^/]+/, () => [import("../features/challenges/pages/ChallengeDetailPage.jsx")]],
  [/^\/signatures\/?$/, () => [import("../features/signatures/pages/SignaturesPage.jsx")]],
  [/^\/signatures\/clubs\//, () => [import("../features/signatures/pages/SignatureClubPage.jsx")]],
  [/^\/koth\/?$/, () => [import("../features/koth/pages/KothPage.jsx")]],
  [/^\/leaderboard\/?$/, () => [import("../features/leaderboard/pages/LeaderboardPage.jsx")]],
];

export function preloadGatedPage(pathname) {
  const match = GATED_PAGE_IMPORTS.find(([pattern]) => pattern.test(String(pathname ?? "")));
  // 못 받아도 시작 시각에 원래대로 다시 받으므로 실패는 조용히 넘긴다
  return match ? Promise.allSettled(match[1]()) : Promise.resolve([]);
}

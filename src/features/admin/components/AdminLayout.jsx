import { NavLink } from "react-router-dom";
import { ROUTES } from "../../../routes/routePaths.js";

// TODO(admin): 다른 페이지와 달리 관리자 페이지는 참고할 Figma 시안이 없어
// (README 8절도 API 명세만 있고 화면 시안은 없음) 기능 우선의 범용 대시보드
// UI로 구현했다. 시안이 나오면 이 레이아웃만 교체하면 되도록 각 페이지의
// 데이터 훅(useAdminXxx)과 화면을 분리해뒀다.
const NAV_ITEMS = [
  { to: ROUTES.adminDashboard, label: "대시보드", end: true },
  { to: ROUTES.adminTeams, label: "팀 관리" },
  { to: ROUTES.adminChallenges, label: "문제 관리" },
  { to: ROUTES.adminLogs, label: "로그/리소스" },
  { to: ROUTES.adminSettings, label: "설정" },
];

export default function AdminLayout({ title, actions, children }) {
  return (
    <div className="min-h-screen bg-[#14100c] text-[#f1ece2]">
      <header className="flex items-center justify-between border-b border-[#332a20] px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold tracking-wide text-[#e8b957]">MSG CTF 관리자</span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded px-3 py-1.5 text-sm ${
                    isActive
                      ? "bg-[#332a20] text-[#f1ece2]"
                      : "text-[#a89b87] hover:bg-[#221b14] hover:text-[#f1ece2]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <a href={ROUTES.board} className="text-xs text-[#a89b87] hover:text-[#f1ece2]">
          참가자 화면으로
        </a>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

export function AdminStatusMessage({ status, error, onRetry }) {
  if (status === "loading") {
    return <p className="text-sm text-[#a89b87]">불러오는 중입니다...</p>;
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-3 rounded border border-[#5c2d22] bg-[#2a1712] px-4 py-3 text-sm">
        <span role="alert" className="flex-1">{error}</span>
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-[#c89252] bg-[#6d391c] px-3 py-1"
        >
          다시 시도
        </button>
      </div>
    );
  }
  return null;
}

export function AdminBadge({ tone = "neutral", children }) {
  const toneClass = {
    neutral: "border-[#4a4030] text-[#c9bda6]",
    good: "border-[#4a7a3a] text-[#9fd17a]",
    bad: "border-[#7a3a2f] text-[#e59a86]",
  }[tone];
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${toneClass}`}>
      {children}
    </span>
  );
}

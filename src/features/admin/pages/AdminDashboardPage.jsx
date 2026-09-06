import { getAdminDashboard } from "../../../api/admin.js";
import AdminLayout, { AdminStatusMessage } from "../components/AdminLayout.jsx";
import useAdminResource from "../hooks/useAdminResource.js";
import { toKst } from "../../../utils/time.js";

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-[#332a20] bg-[#1a1510] p-4">
      <p className="m-0 text-xs text-[#a89b87]">{label}</p>
      <p className="m-0 mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="m-0 mt-1 text-xs text-[#a89b87]">{sub}</p>}
    </div>
  );
}

// 운영 대시보드 - README.md "8. 관리자 페이지 > 대시보드"(백엔드 상태: 논의).
// 아직 백엔드가 이 엔드포인트를 안 내려줄 수 있어(404/501) 실패해도 화면
// 전체가 죽지 않고 안내만 뜨도록 useAdminResource가 error 상태로 감싼다.
export default function AdminDashboardPage() {
  const dashboard = useAdminResource(getAdminDashboard, [], "대시보드 정보를 불러오지 못했습니다.");
  const data = dashboard.data;

  return (
    <AdminLayout title="운영 대시보드">
      <AdminStatusMessage status={dashboard.status} error={dashboard.error} onRetry={dashboard.retry} />

      {dashboard.status === "success" && data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="전체 팀"
            value={data.teams?.total_count ?? "-"}
            sub={`밴 ${data.teams?.banned_count ?? 0}팀 / 총 마일리지 ${data.teams?.total_mileage ?? 0}`}
          />
          <StatCard
            label="대회 상태"
            value={data.contest?.status ?? "없음"}
            sub={
              data.contest
                ? `${toKst(data.contest.start_time)} ~ ${toKst(data.contest.end_time)}`
                : "활성 대회 없음"
            }
          />
          <StatCard
            label="인스턴스"
            value={`${data.instances?.running ?? 0} 실행 중`}
            sub={`실패 ${data.instances?.failed ?? 0} / 전체 ${data.instances?.total ?? 0}`}
          />
          <StatCard
            label="문제"
            value={`${data.challenges?.published ?? 0}/${data.challenges?.total ?? 0} 공개`}
            sub={`누적 해결 ${data.challenges?.solved_total ?? 0}`}
          />
          <StatCard
            label="결제"
            value={`구매 ${data.payment?.purchase_count ?? 0}건`}
            sub={`환불 ${data.payment?.refund_count ?? 0}건 / 순사용 마일리지 ${data.payment?.net_spent ?? 0}`}
          />
          <StatCard
            label="집계 시각"
            value={data.collected_at ? toKst(data.collected_at) : "-"}
          />
        </div>
      )}

      {dashboard.status === "success" && !data && (
        <p className="text-sm text-[#a89b87]">표시할 집계 데이터가 없습니다.</p>
      )}
    </AdminLayout>
  );
}

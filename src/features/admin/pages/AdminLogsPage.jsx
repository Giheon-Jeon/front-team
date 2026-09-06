import { getAdminEvents, getAdminResources } from "../../../api/admin.js";
import { toKst } from "../../../utils/time.js";
import AdminLayout, { AdminStatusMessage } from "../components/AdminLayout.jsx";
import useAdminResource from "../hooks/useAdminResource.js";

// 로그/리소스 - README.md "8. 관리자 페이지 > 리소스/로그"(백엔드: 진행 중).
// type/severity enum 전체 목록이 아직 미공개(Appendix B)라 관측된 값을
// 그대로 텍스트로 보여준다(별도 배지 매핑 안 함).
export default function AdminLogsPage() {
  const events = useAdminResource(
    () => getAdminEvents({ size: 50 }),
    [],
    "이벤트 로그를 불러오지 못했습니다.",
  );
  const resources = useAdminResource(getAdminResources, [], "리소스 상태를 불러오지 못했습니다.");

  return (
    <AdminLayout title="로그 / 리소스">
      <section className="mb-8">
        <h2 className="mb-2 text-sm font-bold text-admin-muted">계정/노드별 리소스 상태</h2>
        <AdminStatusMessage status={resources.status} error={resources.error} onRetry={resources.retry} />
        {resources.status === "success" && !resources.data && (
          <p className="text-sm text-admin-muted">수집된 리소스 정보가 없습니다.</p>
        )}
        {resources.status === "success" && resources.data && (
          <div className="flex flex-col gap-3">
            {resources.data.accounts.map((account) => (
              <div key={account.account_id} className="rounded-lg border border-admin-divider bg-white/30 p-3 text-sm">
                <p className="m-0 font-bold">
                  {account.account_name} - {account.status} ({account.running_instances}/{account.instance_quota})
                </p>
                <ul className="m-0 mt-2 flex flex-col gap-1 p-0 pl-4 text-xs text-admin-muted">
                  {account.nodes.map((node) => (
                    <li key={node.node_id}>
                      {node.node_name}: {node.status}, CPU {node.cpu_usage_percent}%, 메모리{" "}
                      {node.memory_usage_percent}%, 인스턴스 {node.running_instances}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-admin-muted">최근 이벤트</h2>
        <AdminStatusMessage status={events.status} error={events.error} onRetry={events.retry} />
        {events.status === "success" && (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-divider text-left text-admin-muted">
                <th className="px-2 py-1 font-normal">유형</th>
                <th className="px-2 py-1 font-normal">심각도</th>
                <th className="px-2 py-1 font-normal">메시지</th>
                <th className="px-2 py-1 font-normal">팀/문제</th>
                <th className="px-2 py-1 font-normal">시각</th>
              </tr>
            </thead>
            <tbody>
              {(events.data?.events ?? []).map((event) => (
                <tr key={event.event_id} className="border-b border-admin-divider/40 last:border-0">
                  <td className="px-2 py-1">{event.type}</td>
                  <td className="px-2 py-1">{event.severity}</td>
                  <td className="px-2 py-1">{event.message}</td>
                  <td className="px-2 py-1">
                    {[event.team_name, event.challenge_title].filter(Boolean).join(" / ") || "-"}
                  </td>
                  <td className="px-2 py-1">{toKst(event.created_at)}</td>
                </tr>
              ))}
              {(events.data?.events ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-admin-muted">이벤트 없음</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
}

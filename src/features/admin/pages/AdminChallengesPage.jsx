import { useState } from "react";
import {
  forceResetInstance,
  forceStopInstance,
  getAdminChallenges,
  getAdminInstances,
  setChallengeVisibility,
} from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import { toKst } from "../../../utils/time.js";
import AdminLayout, { AdminBadge, AdminStatusMessage } from "../components/AdminLayout.jsx";
import useAdminResource from "../hooks/useAdminResource.js";

const INSTANCE_STATUS_TONE = { RUNNING: "good", FAILED: "bad" };

// 인스턴스 목록/필터/강제 재시작-종료 - Figma 사이드바 항목("문제 목록 · 인스턴스",
// node 384:415)에 맞춰 문제 목록 화면에 같이 붙였다. GET /admin/instances,
// POST .../reset, DELETE .../{id}(README 8절, 백엔드: 완료).
function InstancesSection() {
  const [statusFilter, setStatusFilter] = useState("");
  const instances = useAdminResource(
    () => getAdminInstances({ status: statusFilter || undefined, size: 50 }),
    [statusFilter],
    "인스턴스 목록을 불러오지 못했습니다.",
  );
  const [mutatingId, setMutatingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const runAction = async (instanceId, action, fallbackMessage) => {
    setMutatingId(instanceId);
    setActionError("");
    try {
      const response = await action();
      if (!isSuccess(response.data)) throw new Error(response.data?.message || fallbackMessage);
      await instances.reload();
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || fallbackMessage);
    } finally {
      setMutatingId(null);
    }
  };

  const list = instances.data?.instances ?? [];
  const byStatus = instances.data?.summary?.by_status ?? {};

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-im-fell text-lg text-admin-ink">인스턴스</h2>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded border border-admin-divider bg-white/60 px-3 py-1.5 font-song-myung text-sm"
        >
          <option value="">전체 상태</option>
          {Object.keys(byStatus).map((s) => (
            <option key={s} value={s}>
              {s} ({byStatus[s]})
            </option>
          ))}
        </select>
      </div>

      <AdminStatusMessage status={instances.status} error={instances.error} onRetry={instances.retry} />
      {actionError && <p role="alert" className="mb-3 font-song-myung text-sm text-admin-failed">{actionError}</p>}

      {instances.status === "success" && (
        <div className="overflow-x-auto rounded-lg border border-admin-divider">
          <table className="w-full border-collapse font-song-myung text-sm">
            <thead>
              <tr className="border-b border-admin-divider text-left text-admin-muted">
                <th className="px-3 py-2 font-normal">팀</th>
                <th className="px-3 py-2 font-normal">문제</th>
                <th className="px-3 py-2 font-normal">상태</th>
                <th className="px-3 py-2 font-normal">만료</th>
                <th className="px-3 py-2 font-normal">조치</th>
              </tr>
            </thead>
            <tbody>
              {list.map((instance) => (
                <tr key={instance.instance_id} className="border-b border-admin-divider/40 last:border-0">
                  <td className="px-3 py-2">{instance.team_name}</td>
                  <td className="px-3 py-2">{instance.challenge_title}</td>
                  <td className="px-3 py-2">
                    <AdminBadge tone={INSTANCE_STATUS_TONE[instance.status] ?? "neutral"}>{instance.status}</AdminBadge>
                  </td>
                  <td className="px-3 py-2 font-kode-mono text-xs">
                    {instance.expires_at ? toKst(instance.expires_at) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={mutatingId === instance.instance_id}
                        onClick={() =>
                          runAction(
                            instance.instance_id,
                            () => forceResetInstance(instance.instance_id),
                            "강제 재시작에 실패했습니다.",
                          )
                        }
                        className="rounded border border-admin-divider px-2 py-1 text-xs disabled:opacity-50"
                      >
                        강제 재시작
                      </button>
                      <button
                        type="button"
                        disabled={mutatingId === instance.instance_id}
                        onClick={() =>
                          runAction(
                            instance.instance_id,
                            () => forceStopInstance(instance.instance_id),
                            "강제 종료에 실패했습니다.",
                          )
                        }
                        className="rounded border border-admin-failed px-2 py-1 text-xs text-admin-failed disabled:opacity-50"
                      >
                        강제 종료
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-admin-muted">
                    표시할 인스턴스가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// 문제 목록 - README.md "8. 관리자 페이지 > 문제/릴리스"(백엔드: 완료).
// 릴리스 등록/이력/전환(공급망 artifact-v2.json 체계)은 백엔드가 "시작 전"
// 상태라 이번엔 공개상태 전환까지만 붙였다. api/admin.js에는 릴리스 관련
// 함수도 이미 있으니 백엔드 준비되면 이어서 붙이면 된다.
export default function AdminChallengesPage() {
  const challenges = useAdminResource(getAdminChallenges, [], "문제 목록을 불러오지 못했습니다.");
  const [mutatingId, setMutatingId] = useState(null);
  const [actionError, setActionError] = useState("");

  const toggleVisibility = async (challenge) => {
    setMutatingId(challenge.challenge_id);
    setActionError("");
    try {
      const response = await setChallengeVisibility(challenge.challenge_id, {
        isPublished: !challenge.is_published,
        reason: challenge.is_published ? "관리자 비공개 전환" : "관리자 공개 전환",
      });
      if (!isSuccess(response.data)) {
        throw new Error(response.data?.message || "공개 상태 변경에 실패했습니다.");
      }
      await challenges.reload();
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || "공개 상태 변경에 실패했습니다.");
    } finally {
      setMutatingId(null);
    }
  };

  const list = challenges.data?.challenges ?? [];

  return (
    <AdminLayout title="문제 목록 · 인스턴스">
      <AdminStatusMessage status={challenges.status} error={challenges.error} onRetry={challenges.retry} />
      {actionError && <p role="alert" className="mb-3 text-sm text-admin-failed">{actionError}</p>}

      {challenges.status === "success" && (
        <div className="overflow-x-auto rounded-lg border border-admin-divider">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-divider text-left text-admin-muted">
                <th className="px-3 py-2 font-normal">제목</th>
                <th className="px-3 py-2 font-normal">분야</th>
                <th className="px-3 py-2 font-normal">난이도</th>
                <th className="px-3 py-2 font-normal">점수</th>
                <th className="px-3 py-2 font-normal">해결 팀</th>
                <th className="px-3 py-2 font-normal">인스턴스</th>
                <th className="px-3 py-2 font-normal">공개 상태</th>
              </tr>
            </thead>
            <tbody>
              {list.map((challenge) => (
                <tr key={challenge.challenge_id} className="border-b border-admin-divider/40 last:border-0">
                  <td className="px-3 py-2">{challenge.title}</td>
                  <td className="px-3 py-2">{challenge.category}</td>
                  <td className="px-3 py-2">{challenge.difficulty}</td>
                  <td className="px-3 py-2">{challenge.score}</td>
                  <td className="px-3 py-2">{challenge.solved_team_count}</td>
                  <td className="px-3 py-2">
                    {challenge.running_instance_count}
                    {challenge.failed_instance_count > 0 && (
                      <span className="ml-1 text-admin-failed">
                        (실패 {challenge.failed_instance_count})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={mutatingId === challenge.challenge_id}
                      onClick={() => toggleVisibility(challenge)}
                      className="disabled:opacity-50"
                    >
                      {challenge.is_published ? (
                        <AdminBadge tone="good">공개 중(클릭 시 비공개)</AdminBadge>
                      ) : (
                        <AdminBadge tone="bad">비공개(클릭 시 공개)</AdminBadge>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-admin-muted">
                    표시할 문제가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <InstancesSection />
    </AdminLayout>
  );
}

import { useState } from "react";
import { getAdminChallenges, setChallengeVisibility } from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import AdminLayout, { AdminBadge, AdminStatusMessage } from "../components/AdminLayout.jsx";
import useAdminResource from "../hooks/useAdminResource.js";

// 문제 목록 - README.md "8. 관리자 페이지 > 문제/릴리스"(백엔드: 논의).
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
    <AdminLayout title="문제 목록">
      <AdminStatusMessage status={challenges.status} error={challenges.error} onRetry={challenges.retry} />
      {actionError && <p role="alert" className="mb-3 text-sm text-[#e59a86]">{actionError}</p>}

      {challenges.status === "success" && (
        <div className="overflow-x-auto rounded-lg border border-[#332a20]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#332a20] text-left text-[#a89b87]">
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
                <tr key={challenge.challenge_id} className="border-b border-[#221b14] last:border-0">
                  <td className="px-3 py-2">{challenge.title}</td>
                  <td className="px-3 py-2">{challenge.category}</td>
                  <td className="px-3 py-2">{challenge.difficulty}</td>
                  <td className="px-3 py-2">{challenge.score}</td>
                  <td className="px-3 py-2">{challenge.solved_team_count}</td>
                  <td className="px-3 py-2">
                    {challenge.running_instance_count}
                    {challenge.failed_instance_count > 0 && (
                      <span className="ml-1 text-[#e59a86]">
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
                  <td colSpan={7} className="px-3 py-6 text-center text-[#a89b87]">
                    표시할 문제가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

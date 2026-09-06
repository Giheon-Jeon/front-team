import { useState } from "react";
import { useParams } from "react-router-dom";
import { adjustMileage, banTeam, getAdminTeamDetail, unbanTeam } from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import { toKst } from "../../../utils/time.js";
import AdminLayout, { AdminBadge, AdminStatusMessage } from "../components/AdminLayout.jsx";
import useAdminResource from "../hooks/useAdminResource.js";

function MileageForm({ teamId, isMutating, onSubmit }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = Number(amount);
        if (!parsed || !reason.trim()) return;
        onSubmit(teamId, parsed, reason.trim()).then((ok) => {
          if (ok) {
            setAmount("");
            setReason("");
          }
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="number"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        placeholder="+지급 / -회수"
        className="w-32 rounded border border-[#4a4030] bg-[#1a1510] px-2 py-1.5 text-sm"
      />
      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="사유"
        className="w-48 rounded border border-[#4a4030] bg-[#1a1510] px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={isMutating || !amount || !reason.trim()}
        className="rounded border border-[#4a4030] px-3 py-1.5 text-sm disabled:opacity-50"
      >
        마일리지 조정
      </button>
    </form>
  );
}

// 팀별 목록 상세 - README.md "8. 관리자 페이지 > 팀 상세"(백엔드: 진행 중).
// 보드 강제 개입(clear 칸/위치 이동/주사위 지급)과 롤백/스냅샷은 전부 백엔드
// "논의" 상태라 이번엔 뺐다 - api/admin.js엔 함수가 이미 있으니 백엔드 확정
// 후 이 페이지에 이어서 붙이면 된다.
export default function AdminTeamDetailPage() {
  const { teamId } = useParams();
  const detail = useAdminResource(
    () => getAdminTeamDetail(teamId),
    [teamId],
    "팀 상세 정보를 불러오지 못했습니다.",
  );
  const [isMutating, setIsMutating] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleMileageAdjust = async (id, amount, reason) => {
    setIsMutating(true);
    setActionError("");
    try {
      const response = await adjustMileage(id, { amount, reason });
      if (!isSuccess(response.data)) {
        throw new Error(response.data?.message || "마일리지 조정에 실패했습니다.");
      }
      await detail.reload();
      return true;
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || "마일리지 조정에 실패했습니다.");
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const handleBanToggle = async () => {
    if (!data.is_banned) {
      // 취소를 누르면 null이 반환된다 - 이 경우 사유 없이 밴이 나가면 안 되므로
      // 여기서 바로 중단한다. admin.js 주석대로 ban_reason은 1자 이상 필수라
      // 빈 문자열 제출도 함께 막는다.
      const reason = window.prompt("밴 사유를 입력해주세요");
      if (reason === null) return;
      if (!reason.trim()) {
        setActionError("밴 사유를 입력해야 합니다.");
        return;
      }
      await submitBan(reason.trim());
      return;
    }
    await submitUnban();
  };

  const submitBan = async (banReason) => {
    setIsMutating(true);
    setActionError("");
    try {
      const response = await banTeam(teamId, { banReason });
      if (!isSuccess(response.data)) {
        throw new Error(response.data?.message || "처리에 실패했습니다.");
      }
      await detail.reload();
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || "처리에 실패했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  const submitUnban = async () => {
    setIsMutating(true);
    setActionError("");
    try {
      const response = await unbanTeam(teamId);
      if (!isSuccess(response.data)) {
        throw new Error(response.data?.message || "처리에 실패했습니다.");
      }
      await detail.reload();
    } catch (error) {
      setActionError(error.response?.data?.message || error.message || "처리에 실패했습니다.");
    } finally {
      setIsMutating(false);
    }
  };

  const data = detail.data;

  return (
    <AdminLayout title={data ? `팀 상세 - ${data.team_name}` : "팀 상세"}>
      <AdminStatusMessage status={detail.status} error={detail.error} onRetry={detail.retry} />
      {actionError && <p role="alert" className="mb-3 text-sm text-[#e59a86]">{actionError}</p>}

      {detail.status === "success" && data && (
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-[#332a20] bg-[#1a1510] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="m-0 text-base font-bold">{data.team_name}</h2>
                {data.is_banned ? (
                  <AdminBadge tone="bad">밴됨</AdminBadge>
                ) : (
                  <AdminBadge tone="good">정상</AdminBadge>
                )}
              </div>
              <button
                type="button"
                disabled={isMutating}
                onClick={handleBanToggle}
                className="rounded border border-[#7a3a2f] px-3 py-1 text-xs text-[#e59a86] disabled:opacity-50"
              >
                {data.is_banned ? "밴 해제" : "밴 처리"}
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
              <dt className="text-[#a89b87]">점수</dt>
              <dd>{data.team_score}</dd>
              <dt className="text-[#a89b87]">마일리지</dt>
              <dd>{data.mileage}</dd>
              {data.is_banned && (
                <>
                  <dt className="text-[#a89b87]">밴 사유</dt>
                  <dd>{data.ban_reason || "-"}</dd>
                  <dt className="text-[#a89b87]">밴 시각</dt>
                  <dd>{data.banned_at ? toKst(data.banned_at) : "-"}</dd>
                </>
              )}
            </dl>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold text-[#a89b87]">팀원</h2>
            <ul className="m-0 flex flex-col gap-1 p-0 text-sm">
              {(data.members ?? []).map((member) => (
                <li key={member.user_id} className="flex items-center gap-2">
                  <span>{member.nickname}</span>
                  {member.is_leader && <AdminBadge>팀장</AdminBadge>}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold text-[#a89b87]">마일리지 조정</h2>
            <MileageForm teamId={teamId} isMutating={isMutating} onSubmit={handleMileageAdjust} />
          </section>

          {Array.isArray(data.recent_mileage_history) && (
            <section>
              <h2 className="mb-2 text-sm font-bold text-[#a89b87]">최근 마일리지 내역</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#332a20] text-left text-[#a89b87]">
                    <th className="px-2 py-1 font-normal">유형</th>
                    <th className="px-2 py-1 font-normal">변동</th>
                    <th className="px-2 py-1 font-normal">사유</th>
                    <th className="px-2 py-1 font-normal">시각</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_mileage_history.map((entry) => (
                    <tr key={entry.history_id} className="border-b border-[#221b14] last:border-0">
                      <td className="px-2 py-1">{entry.type}</td>
                      <td className="px-2 py-1">{entry.amount > 0 ? `+${entry.amount}` : entry.amount}</td>
                      <td className="px-2 py-1">{entry.reason || "-"}</td>
                      <td className="px-2 py-1">{toKst(entry.created_at)}</td>
                    </tr>
                  ))}
                  {data.recent_mileage_history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-[#a89b87]">내역 없음</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

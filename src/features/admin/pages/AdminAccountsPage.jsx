import { useEffect, useState } from "react";
import { getAdminTeams, registerAdminAccount } from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import AdminLayout from "../components/AdminLayout.jsx";

// 계정 등록 - 2026-09-07 신규 요구사항. 이 CTF는 회원가입 페이지가 없고
// 아이디/비밀번호를 관리자가 미리 DB에 등록해 참가자에게 일괄 배포한다.
// Figma 시안은 아직 없어 다른 관리자 화면과 같은 톤의 폼으로 구성했다.
// POST /admin/accounts(README 8절, 백엔드: PR 대기).
const TEAM_MODE = {
  NONE: "NONE",
  EXISTING: "EXISTING",
  NEW: "NEW",
};

export default function AdminAccountsPage() {
  const [teams, setTeams] = useState([]);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [role, setRole] = useState("PARTICIPANT");
  const [isLeader, setIsLeader] = useState(false);
  const [teamMode, setTeamMode] = useState(TEAM_MODE.NONE);
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    getAdminTeams({ size: 100, sort: "name" })
      .then((res) => setTeams(isSuccess(res.data) ? res.data.data.teams ?? [] : []))
      .catch(() => setTeams([]));
  }, [result]);

  const resetForm = () => {
    setLoginId("");
    setPassword("");
    setNickname("");
    setIsLeader(false);
    setTeamMode(TEAM_MODE.NONE);
    setTeamId("");
    setTeamName("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!loginId.trim() || password.length < 4 || !nickname.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await registerAdminAccount({
        loginId: loginId.trim(),
        password,
        nickname: nickname.trim(),
        role,
        isLeader,
        teamId: teamMode === TEAM_MODE.EXISTING ? teamId : undefined,
        teamName: teamMode === TEAM_MODE.NEW ? teamName.trim() : undefined,
      });
      if (!isSuccess(res.data)) throw new Error(res.data?.message || "계정 등록에 실패했습니다.");
      setResult(res.data.data);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "계정 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    loginId.trim() && password.length >= 4 && nickname.trim() &&
    (teamMode !== TEAM_MODE.EXISTING || teamId) &&
    (teamMode !== TEAM_MODE.NEW || teamName.trim());

  return (
    <AdminLayout title="계정 등록">
      <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4 font-song-myung text-sm">
        <label className="flex flex-col gap-1">
          아이디
          <input
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            className="rounded border border-admin-divider bg-white/60 px-3 py-2"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1">
          비밀번호 (4자 이상)
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border border-admin-divider bg-white/60 px-3 py-2"
            autoComplete="new-password"
          />
        </label>
        <label className="flex flex-col gap-1">
          닉네임
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="rounded border border-admin-divider bg-white/60 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          권한
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded border border-admin-divider bg-white/60 px-3 py-2"
          >
            <option value="PARTICIPANT">PARTICIPANT</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isLeader} onChange={(event) => setIsLeader(event.target.checked)} />
          팀장으로 등록
        </label>

        <fieldset className="flex flex-col gap-2 rounded border border-admin-divider p-3">
          <legend className="px-1 text-xs text-admin-muted">소속 팀</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="team-mode"
              checked={teamMode === TEAM_MODE.NONE}
              onChange={() => setTeamMode(TEAM_MODE.NONE)}
            />
            무소속으로 등록
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="team-mode"
              checked={teamMode === TEAM_MODE.EXISTING}
              onChange={() => setTeamMode(TEAM_MODE.EXISTING)}
            />
            기존 팀에 합류
            {teamMode === TEAM_MODE.EXISTING && (
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                className="rounded border border-admin-divider bg-white/60 px-2 py-1"
              >
                <option value="">선택</option>
                {teams.map((team) => (
                  <option key={team.team_id} value={team.team_id}>
                    {team.team_name}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="team-mode"
              checked={teamMode === TEAM_MODE.NEW}
              onChange={() => setTeamMode(TEAM_MODE.NEW)}
            />
            새 팀 생성
            {teamMode === TEAM_MODE.NEW && (
              <input
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="팀 이름"
                className="rounded border border-admin-divider bg-white/60 px-2 py-1"
              />
            )}
          </label>
        </fieldset>

        {error && <p role="alert" className="text-admin-failed">{error}</p>}
        {result && (
          <p role="status" className="text-admin-running">
            등록 완료: {result.login_id} ({result.nickname}) {result.team_name ? `, ${result.team_name}` : ""}
            {result.team_created ? " (신규 팀 생성됨)" : ""}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="self-start rounded border border-admin-ink px-4 py-1.5 disabled:opacity-50"
        >
          등록
        </button>
      </form>
    </AdminLayout>
  );
}

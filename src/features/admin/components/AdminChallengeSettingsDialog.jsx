import { useEffect, useRef, useState } from "react";
import { getAdminChallenge, updateAdminChallenge, getAdminChallengeFlag, revealAdminChallengeFlag } from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import useAdminResource from "../hooks/useAdminResource.js";
import { ADMIN_CHALLENGE_CATEGORIES } from "../utils/adminValidation.js";
import { challengeDetailsDraft, challengeDetailsChanges } from "../utils/adminChallengeSettings.js";
import AdminDialog from "./AdminDialog.jsx";
import AdminTabs from "./AdminTabs.jsx";
import { AdminBadge, AdminStatusMessage } from "./AdminLayout.jsx";
import styles from "./AdminWorkspace.module.css";

function FlagPanel({ challengeId, onBusyChange, onOpenDeployment }) {
  const flag = useAdminResource((config) => getAdminChallengeFlag(challengeId, config), [challengeId], "플래그 설정을 불러오지 못했습니다");
  const [revealed, setRevealed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (revealed === null) return;
    const timer = setTimeout(() => setRevealed(null), 60000);
    const hide = () => { if (document.hidden) setRevealed(null); };
    document.addEventListener("visibilitychange", hide);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", hide); };
  }, [revealed]);

  async function reveal() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); onBusyChange(true); setError("");
    request.current = new AbortController();
    try {
      const response = await revealAdminChallengeFlag(challengeId, { signal: request.current.signal });
      if (!isSuccess(response.data)) throw new Error(response.data?.message || "플래그를 확인하지 못했습니다");
      setRevealed(response.data.data.flag);
    } catch (failure) { setError(failure?.response?.data?.message || failure.message); }
    finally { pending.current = false; setBusy(false); onBusyChange(false); }
  }

  const data = flag.data;
  return <>
    <AdminStatusMessage status={flag.status} error={flag.error} onRetry={flag.retry}/>
    {error && <p role="alert" className={styles.errorNotice}>{error}</p>}
    {flag.status === "success" && <>
      <div className={styles.settingHeading}><h3 className={styles.sectionTitle}>채점용 플래그</h3>
        <AdminBadge tone={data.configured ? "good" : "bad"}>{data.configured ? "등록됨" : "미등록"}</AdminBadge></div>
      <p className={styles.panelIntro}>참가자가 제출한 정답과 비교하는 값입니다</p>
      <div className={styles.flagBox}>
        <output aria-label="채점용 플래그 원문" className={styles.flagValue}>{revealed ?? "••••••••••••••••"}</output>
        <button type="button" className={styles.button} disabled={busy || !data.reveal_available}
          onClick={() => revealed === null ? reveal() : setRevealed(null)}>{revealed === null ? "원문 확인" : "숨기기"}</button>
      </div>
      <p className={styles.secondary}>{data.reveal_available
        ? `${data.source === "repository" ? "info.yaml" : "저장된 비밀값"}에서 채점 값과 일치하는 원문을 확인했습니다 표시한 값은 1분 뒤 숨겨집니다`
        : data.source_status === "mismatch" ? "저장된 원문이 현재 채점 값과 다릅니다 플래그와 실행 설정을 확인해주세요"
        : data.source_status === "unavailable" ? "원문을 읽지 못했습니다 저장소 연결과 비밀값 설정을 확인해주세요"
        : "채점 값과 대조할 원문이 없습니다 해시만으로 원문을 복원할 수는 없습니다"}</p>
      <div className={styles.relatedSetting}><p>컨테이너에 넣을 FLAG와 비밀값 연결은 배포 설정에서 관리합니다</p>
        {onOpenDeployment && <button type="button" className={styles.button} disabled={busy} onClick={onOpenDeployment}>배포 설정으로 이동</button>}
      </div>
    </>}
  </>;
}

export default function AdminChallengeSettingsDialog({ challenge, onClose, onSaved, embedded = false, active = true, onBusyChange, onOpenDeployment }) {
  const detail = useAdminResource((config) => getAdminChallenge(challenge.challenge_id, config), [challenge.challenge_id], "문제 정보를 불러오지 못했습니다");
  const [panel, setPanel] = useState("basic");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const busy = mutating;
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => { if (detail.data) { setSaved(detail.data); setDraft(challengeDetailsDraft(detail.data)); } }, [detail.data]);
  const changes = saved && draft ? challengeDetailsChanges(saved, draft) : {};
  const dirty = Object.keys(changes).length > 0;
  const titleValid = Boolean(draft?.title.trim()) && [...(draft?.title.trim() ?? "")].length <= 200;
  function change(field, value) { setDraft((current) => ({ ...current, [field]: value })); setNotice(""); }

  async function save(event) {
    event.preventDefault();
    if (pending.current || !dirty || !titleValid) return;
    pending.current = true; setMutating(true); setNotice(""); setError("");
    try {
      const response = await updateAdminChallenge(challenge.challenge_id, changes);
      if (!isSuccess(response.data)) throw new Error(response.data?.message || "문제를 저장하지 못했습니다");
      setSaved(response.data.data); setDraft(challengeDetailsDraft(response.data.data));
      setNotice("문제 정보를 저장했습니다");
      const refreshed = await onSaved?.(response.data.data);
      if (refreshed === false) setNotice("문제 정보는 저장했습니다 목록을 새로고침해주세요");
    } catch (failure) { setError(failure?.response?.data?.message || failure.message); }
    finally { pending.current = false; setMutating(false); }
  }

  const content = <>
    <p className={styles.scopeNote}>모든 배포 버전에 공통으로 쓰는 문제 정보입니다</p>
    <AdminTabs idPrefix="challenge-settings" label="문제 설정 메뉴" value={panel} disabled={busy}
      onChange={setPanel}
      items={[{ id: "basic", label: "기본 정보" }, { id: "flag", label: "채점 플래그" }]}/>
    <section role="tabpanel" id="challenge-settings-panel-basic" aria-labelledby="challenge-settings-tab-basic" hidden={panel !== "basic"} className={styles.panel}>
      <AdminStatusMessage status={detail.status} error={detail.error} onRetry={detail.retry}/>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      {error && <p role="alert" className={styles.errorNotice}>{error}</p>}
      {draft && detail.status === "success" && <form onSubmit={save} className={styles.challengeForm}>
        <label className={styles.fullWidth}>문제 제목<input value={draft.title} onChange={(event) => change("title", event.target.value)} className={styles.input} disabled={busy} required maxLength={200}/></label>
        <label>분야<select value={draft.category} className={styles.select} disabled={busy} onChange={(event) => change("category", event.target.value)}>
          {ADMIN_CHALLENGE_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>난이도<select value={draft.difficulty} className={styles.select} disabled={busy} onChange={(event) => change("difficulty", event.target.value)}>
          <option value="EASY">쉬움</option><option value="MEDIUM">보통</option><option value="HARD">어려움</option></select></label>
        <div className={styles.fullWidth}><label htmlFor="challenge-statement">문제 지문<textarea id="challenge-statement" aria-describedby="challenge-statement-help" value={draft.description} rows={8} onChange={(event) => change("description", event.target.value)} className={styles.statementInput} disabled={busy}/></label>
          <p id="challenge-statement-help" className={styles.helpText}>참가자에게 표시되는 지문입니다 저장하면 문제 화면에 반영됩니다</p></div>
        <div className={styles.formFooter}><span className={styles.secondary}>{dirty ? "저장하지 않은 변경 사항이 있습니다" : `현재 배점 ${saved.current_score}점`}</span>
          <button type="submit" className={styles.primary} disabled={busy || !dirty || !titleValid}>{mutating ? "저장 중…" : "기본 정보 저장"}</button></div>
      </form>}
    </section>
    <section role="tabpanel" id="challenge-settings-panel-flag" aria-labelledby="challenge-settings-tab-flag" hidden={panel !== "flag"} className={styles.panel}>
      {active && panel === "flag" && <FlagPanel challengeId={challenge.challenge_id} onBusyChange={setMutating} onOpenDeployment={onOpenDeployment}/>}</section>
  </>;
  return embedded ? content : <AdminDialog title={(saved?.title ?? challenge.title) + " · 문제 설정"} onClose={onClose} busy={busy} variant="workspace">{content}</AdminDialog>;
}

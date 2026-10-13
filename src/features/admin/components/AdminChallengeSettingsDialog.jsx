import { useEffect, useRef, useState } from "react";
import { getAdminChallenge, updateAdminChallenge, getAdminChallengeFlag, revealAdminChallengeFlag, getAdminChallengeFiles, getAdminChallengeRepositoryFiles } from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import useAdminResource from "../hooks/useAdminResource.js";
import { ADMIN_CHALLENGE_CATEGORIES } from "../utils/adminValidation.js";
import { challengeDetailsDraft, challengeDetailsChanges, FILE_KINDS, FLAG_BINDING_STATES, formatFileSize } from "../utils/adminChallengeSettings.js";
import AdminDialog from "./AdminDialog.jsx";
import AdminFileDownloadButton from "./AdminFileDownloadButton.jsx";
import AdminTabs from "./AdminTabs.jsx";
import { AdminBadge, AdminStatusMessage } from "./AdminLayout.jsx";
import styles from "./AdminWorkspace.module.css";

function FlagPanel({ challengeId, onBusyChange }) {
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
      <p className={styles.panelIntro}>채점 값은 해시로 저장됩니다 원문 확인은 저장된 비밀값 또는 info.yaml과 대조합니다</p>
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
      <div className={styles.settingHeading + " mt-8"}><h3 className={styles.sectionTitle}>컨테이너 주입</h3>
        {data.release_version && <span className={styles.secondary}>사용 중인 설정 버전 {data.release_version}</span>}</div>
      {data.bindings.length ? <div className={styles.tableWrap}><table className={styles.settingsTable} aria-label="플래그 주입 연결">
        <thead><tr><th>컨테이너 / 환경변수</th><th>저장된 비밀값</th><th>채점 값 대조</th></tr></thead>
        <tbody>{data.bindings.map((binding) => <tr key={`${binding.container}:${binding.env_name}`}>
          <td className={styles.mono}>{binding.container} / {binding.env_name}</td>
          <td>{binding.secret_name ? `${binding.secret_name} · 버전 ${binding.secret_version}` : "연결 없음"}</td>
          <td><AdminBadge tone={binding.status === "match" ? "good" : "bad"}>{FLAG_BINDING_STATES[binding.status] ?? "확인 필요"}</AdminBadge></td>
        </tr>)}</tbody></table></div> : <p className={styles.empty}>{data.release_version
          ? "현재 설정에 플래그 비밀값 연결이 없습니다 파일로 전달하는 플래그는 실행 파일에서 확인해주세요"
          : "사용 중인 실행 설정이 없습니다"}</p>}
      <p className={styles.helpText}>새 인스턴스에 적용할 설정 기준입니다 기존 인스턴스는 생성 당시 설정을 사용합니다</p>
    </>}
  </>;
}

function RepositoryFilesPanel({ challengeId }) {
  const resource = useAdminResource((config) => getAdminChallengeRepositoryFiles(challengeId, config), [challengeId], "저장소 파일 목록을 불러오지 못했습니다");
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const files = resource.data?.files ?? [];
  const filtered = files.filter((file) => (!kind || file.kind === kind) && file.path.toLowerCase().includes(search.toLowerCase()));
  const visible = filtered.slice((page - 1) * 30, page * 30);
  return <>
    <AdminStatusMessage status={resource.status} error={resource.error} onRetry={resource.retry}/>
    {resource.status === "success" && <>
      <h3 className={styles.sectionTitle}>저장소 파일 <span className={styles.secondary}>{files.length}개</span></h3>
      <p className={styles.panelIntro}>출제 저장소의 원본 목록입니다 현재 참가자에게 배포되는 ZIP과 버전이 다를 수 있습니다</p>
      <div className={styles.toolbar}>
        <label>구분 <select className={styles.select} value={kind} onChange={(event) => { setKind(event.target.value); setPage(1); }}>
          <option value="">전체 ({files.length})</option>{Object.entries(FILE_KINDS).map(([value, label]) =>
            <option key={value} value={value}>{label} ({files.filter((file) => file.kind === value).length})</option>)}
        </select></label>
        <label className={styles.fileSearch}>파일 검색<input type="search" value={search} className={styles.input} placeholder="파일명 또는 경로"
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}/></label>
      </div>
      {filtered.length ? <div className={styles.tableWrap}><table className={styles.fileTable} aria-label="저장소 파일 목록">
        <thead><tr><th>파일 / 경로</th><th>구분</th><th>크기</th></tr></thead>
        <tbody>{visible.map((file) => <tr key={file.path}><td>
          {file.source_url ? <a className={styles.fileLink} href={file.source_url} target="_blank" rel="noreferrer">{file.name} ↗</a> : <span className={styles.title}>{file.name}</span>}
          <span className={styles.filePath}>{file.path}</span></td><td>{FILE_KINDS[file.kind]}</td><td>{formatFileSize(file.size_bytes)}</td></tr>)}</tbody>
      </table></div> : <p className={styles.empty}>{kind === "participant" && !search ? "prob/for_user에 저장된 배포용 파일이 없습니다" : "조건에 맞는 파일이 없습니다"}</p>}
      {filtered.length > 30 && <div className={styles.filePagination}><button type="button" className={styles.button} disabled={page === 1} onClick={() => setPage((value) => value - 1)}>이전</button>
        <span>{page} / {Math.ceil(filtered.length / 30)}</span><button type="button" className={styles.button} disabled={page * 30 >= filtered.length} onClick={() => setPage((value) => value + 1)}>다음</button></div>}
      <p className={styles.helpText}>{resource.data.repository} · {resource.data.source_revision.slice(0, 8)}
        {!resource.data.source_published && " · 로컬에 저장된 버전"}</p>
    </>}
  </>;
}

function FilesPanel({ challengeId }) {
  const resource = useAdminResource((config) => getAdminChallengeFiles(challengeId, config), [challengeId], "참가자 파일을 불러오지 못했습니다");
  const [showSource, setShowSource] = useState(false);
  const data = resource.data;
  const file = data?.current_file;
  const messages = {
    no_release: "배포 버전을 선택하면 해당 버전의 참가자 파일이 연결됩니다",
    pending: "이 버전의 파일 수집 기록이 없습니다 CI 발행과 백엔드 수집 상태를 확인해주세요",
    none: "이 버전은 첨부파일 없이 발행됐습니다",
    disabled: "현재 설정 버전은 참가자에게 첨부파일을 제공하지 않습니다",
    unavailable: "연결된 파일을 찾지 못했습니다 배포 파일 설정과 수집 상태를 확인해주세요",
  };
  return <>
    <AdminStatusMessage status={resource.status} error={resource.error} onRetry={resource.retry}/>
    {resource.status === "success" && <>
      <div className={styles.settingHeading}><h3 className={styles.sectionTitle}>참가자 첨부파일</h3>
        {data.release_version && <span className={styles.secondary}>사용 중인 설정 버전 {data.release_version}</span>}</div>
      <p className={styles.panelIntro}>prob/for_user 아래 파일을 묶은 ZIP입니다 참가자는 문제를 개방한 뒤 내려받을 수 있습니다</p>
      {data.status === "available" ? <div className={styles.attachmentCard}>
        <div><strong>{file.file_name}</strong><span className={styles.secondary}>ZIP 발행 {file.registry_revision} · 파일 {file.file_count}개 · {formatFileSize(file.file_size)}</span>
          <span className={styles.secondary}>압축 해제 시 {formatFileSize(file.uncompressed_size_bytes)} · 소스 {file.source_sha.slice(0, 8)}</span></div>
        <AdminFileDownloadButton key={file.file_id} challengeId={challengeId} file={file}/>
      </div> : <p className={styles.fileNotice}>{messages[data.status] ?? "파일 정보를 확인해주세요"}</p>}
      <p className={styles.helpText}>버전별 파일 연결은 배포 → 배포 파일에서 변경할 수 있습니다 실행 중인 참가자는 생성 당시 버전의 파일을 받습니다</p>
      <p className={styles.helpText}>저장소 설정: {data.storage.provider === "gcs" ? `GCS · ${data.storage.bucket}` : "로컬 파일 저장소"}</p>
      {data.history.length > 0 && <details className={styles.details}><summary>다른 발행 버전의 파일 ({data.history.length}건)</summary>
        <p className={styles.helpText}>관리자 확인용입니다 배포에서 파일을 연결하고 버전을 적용해야 참가자에게 표시됩니다</p>
        <div className={styles.tableWrap}><table className={styles.fileTable} aria-label="첨부파일 발행 이력">
          <thead><tr><th>발행 / 소스</th><th>파일</th><th>다운로드</th></tr></thead>
          <tbody>{data.history.map((item) => <tr key={item.file_id}><td>발행 {item.registry_revision}<span className={styles.secondary}>{item.source_sha.slice(0, 8)}</span></td>
            <td>{item.present ? `${item.file_count}개` : "파일 없음"}{item.present && <span className={styles.secondary}>{formatFileSize(item.file_size)}</span>}</td>
            <td>{item.present ? <AdminFileDownloadButton challengeId={challengeId} file={item}/> : "없음"}</td></tr>)}</tbody></table></div>
        {data.history_has_more && <p className={styles.helpText}>최근 20건의 수집 기록을 표시합니다</p>}
      </details>}
    </>}
    <details className={styles.details} onToggle={(event) => setShowSource(event.currentTarget.open)}><summary>출제 저장소의 원본 파일 보기</summary>
      {showSource && <div className="mt-5"><RepositoryFilesPanel challengeId={challengeId}/></div>}</details>
  </>;
}

export default function AdminChallengeSettingsDialog({ challenge, onClose, onSaved }) {
  const detail = useAdminResource((config) => getAdminChallenge(challenge.challenge_id, config), [challenge.challenge_id], "문제 정보를 불러오지 못했습니다");
  const [panel, setPanel] = useState("basic");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const pending = useRef(false);
  const busy = mutating;
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
      const refreshed = await onSaved?.();
      if (refreshed === false) setNotice("문제 정보는 저장했습니다 목록을 새로고침해주세요");
    } catch (failure) { setError(failure?.response?.data?.message || failure.message); }
    finally { pending.current = false; setMutating(false); }
  }

  return <AdminDialog title={(saved?.title ?? challenge.title) + " · 문제 설정"} onClose={onClose} busy={busy} variant="workspace">
    <div className={styles.settingSummary}><span className={styles.mono}>{saved?.challenge_slug ?? challenge.challenge_slug ?? "저장소 미연결"}</span>
      <AdminBadge tone={(saved?.is_published ?? challenge.is_published) ? "good" : "neutral"}>{(saved?.is_published ?? challenge.is_published) ? "공개" : "비공개"}</AdminBadge></div>
    <AdminTabs idPrefix="challenge-settings" label="문제 설정 메뉴" value={panel} disabled={busy}
      onChange={setPanel}
      items={[{ id: "basic", label: "기본 정보" }, { id: "flag", label: "플래그" }, { id: "files", label: "첨부파일" }]}/>
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
      {panel === "flag" && <FlagPanel challengeId={challenge.challenge_id} onBusyChange={setMutating}/>}</section>
    <section role="tabpanel" id="challenge-settings-panel-files" aria-labelledby="challenge-settings-tab-files" hidden={panel !== "files"} className={styles.panel}>
      {panel === "files" && <FilesPanel challengeId={challenge.challenge_id}/>}</section>
  </AdminDialog>;
}

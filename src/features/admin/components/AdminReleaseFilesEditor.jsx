import { useEffect, useRef, useState } from "react";
import { getAdminReleaseFiles, createAdminIdempotencyKey } from "../../../api/admin.js";
import { isSuccess } from "../../../utils/response.js";
import { formatFileSize } from "../utils/adminChallengeSettings.js";
import useAdminResource from "../hooks/useAdminResource.js";
import { AdminStatusMessage } from "./AdminLayout.jsx";
import AdminFileDownloadButton from "./AdminFileDownloadButton.jsx";
import styles from "./AdminWorkspace.module.css";

export default function AdminReleaseFilesEditor({ challengeId, release, busy, onSave }) {
  const resource = useAdminResource((config) => getAdminReleaseFiles(challengeId, release.release_id, config), [challengeId, release.release_id], "배포 파일을 불러오지 못했습니다");
  const [mode, setMode] = useState(release.user_files.mode);
  const [fileId, setFileId] = useState(release.user_files.file?.file_id ?? "");
  const [older, setOlder] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestKey = useRef(null);
  const moreRequest = useRef(null);
  useEffect(() => { setOlder([]); setNextPage(resource.data?.history_next_page ?? null); }, [resource.data]);
  useEffect(() => () => moreRequest.current?.abort(), []);
  const candidates = [...new Map([resource.data?.current_file, resource.data?.matching_file, ...(resource.data?.history ?? []), ...older]
    .filter((item) => item?.present && item.download_available).map((item) => [item.file_id, item])).values()]
    .sort((a, b) => b.registry_revision - a.registry_revision);
  const preview = mode === "MATCH_REVISION" ? resource.data?.matching_file : mode === "SELECTED" ? candidates.find((item) => item.file_id === fileId) : null;
  const dirty = mode !== release.user_files.mode || (mode === "SELECTED" && fileId !== release.user_files.file?.file_id);
  function changeMode(value) { setMode(value); requestKey.current = null; setError(""); }
  async function loadMore() {
    if (moreRequest.current || !nextPage) return;
    const controller = new AbortController(); moreRequest.current = controller;
    setLoadingMore(true); setError("");
    try {
      const response = await getAdminReleaseFiles(challengeId, release.release_id, { signal: controller.signal, timeout: 10000, params: { page: nextPage } });
      if (!isSuccess(response.data)) throw new Error(response.data?.message);
      if (!controller.signal.aborted) { setOlder((items) => [...items, ...response.data.data.history]); setNextPage(response.data.data.history_next_page); }
    } catch (failure) { if (!controller.signal.aborted) setError(failure?.response?.data?.message || "이전 파일 목록을 불러오지 못했습니다"); }
    finally { moreRequest.current = null; if (!controller.signal.aborted) setLoadingMore(false); }
  }
  async function save(event) {
    event.preventDefault();
    if (!dirty || busy || (mode === "SELECTED" && !preview)) return;
    requestKey.current ??= createAdminIdempotencyKey("release-files");
    await onSave(release.release_id, { mode, ...(mode === "SELECTED" ? { file_id: fileId } : {}) }, requestKey.current);
  }
  return <>
    <AdminStatusMessage status={resource.status} error={resource.error} onRetry={resource.retry}/>
    {resource.status === "success" && <form onSubmit={save} className={styles.releaseFilesForm}>
      <p className={styles.panelIntro}>설정 버전 {release.version} · 이미지 발행 {release.registry_revision}에 연결할 참가자 ZIP을 고릅니다</p>
      <label>파일 연결 방식<select className={styles.select} value={mode} disabled={busy} onChange={(event) => changeMode(event.target.value)}>
        <option value="MATCH_REVISION">이미지와 같은 발행본 자동 연결</option><option value="SELECTED">등록된 ZIP 직접 선택</option><option value="NONE">파일 없음</option>
      </select></label>
      {mode === "SELECTED" && <label>참가자 ZIP<select className={styles.select} value={fileId} disabled={busy} onChange={(event) => { setFileId(event.target.value); requestKey.current = null; }}>
        <option value="">ZIP을 선택해주세요</option>{candidates.map((item) => <option key={item.file_id} value={item.file_id}>발행 {item.registry_revision} · {item.file_count}개 · {formatFileSize(item.file_size)} · {item.source_sha.slice(0, 8)}</option>)}
      </select></label>}
      {mode === "SELECTED" && nextPage && <button type="button" className={styles.button} disabled={busy || loadingMore} onClick={loadMore}>{loadingMore ? "불러오는 중…" : "이전 발행 파일 더 보기"}</button>}
      {preview?.present ? <div className={styles.attachmentCard}>
        <div><strong>{preview.file_name}</strong><span className={styles.secondary}>ZIP 발행 {preview.registry_revision} · 파일 {preview.file_count}개 · {formatFileSize(preview.file_size)}</span>
          <span className={styles.secondary}>소스 {preview.source_sha.slice(0, 8)}</span></div>
        <AdminFileDownloadButton key={preview.file_id} challengeId={challengeId} file={preview} disabled={busy}/>
      </div> : <p className={styles.fileNotice}>{mode === "NONE" ? "이 버전에서는 참가자에게 첨부파일을 제공하지 않습니다"
        : mode === "SELECTED" ? "이 문제에 등록된 ZIP만 선택할 수 있습니다"
        : preview ? "같은 발행본은 첨부파일 없이 발행됐습니다" : "같은 발행번호의 파일이 아직 수집되지 않았습니다 수집되면 자동으로 연결됩니다"}</p>}
      {preview?.present && preview.registry_revision !== release.registry_revision && <p className={styles.fileNotice}>이미지와 ZIP의 발행번호가 다릅니다 이 이미지에 맞는 파일인지 확인해주세요</p>}
      {error && <p role="alert" className={styles.errorNotice}>{error}</p>}
      <div className={styles.formFooter}><span className={styles.helpText}>새 설정 버전으로 저장한 뒤 ‘이 버전 사용’을 누르면 적용됩니다</span>
        <button type="submit" className={styles.primary} disabled={busy || !release.is_deployable || !dirty || (mode === "SELECTED" && !preview)}>파일 연결을 새 버전으로 저장</button></div>
    </form>}
  </>;
}

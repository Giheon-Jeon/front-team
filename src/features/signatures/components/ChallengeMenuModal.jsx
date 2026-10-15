import { useEffect, useRef, useId } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../routes/routePaths.js";
import styles from "./ChallengeMenuModal.module.css";

// 메뉴용 view model을 받는다. API 조회와 미확정 필드 추론은 하지 않는다.
export default function ChallengeMenuModal({ club, items = [], status = "success", error, onClose, onRetry, preview = false }) {
  const dialog = useRef(null);
  const headingId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={headingId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}>
      <div className={styles.paper}>
        {[0, 1, 2, 3].map((corner) => <svg key={corner} className={styles.corner} data-corner={corner} viewBox="0 0 64 64" aria-hidden="true"><path d="M4 58V4h54M10 48V10h38M16 38V16h22M4 4c22 0 8 21 29 18M4 4c0 22 21 8 18 29M32 7l7 7-7 7-7-7Z" /></svg>)}
        <button type="button" className={styles.close} aria-label="문제 메뉴 닫기" onClick={onClose} autoFocus>×</button>
        <header className={styles.header}>
          <img className={styles.symbol} src="/assets/rules/msg-ctf-logo.png" alt="MSG CTF" />
          <div className={styles.coverTitle}><p className={styles.school}>{club.university}</p><h2 id={headingId}>{club.name}</h2><p className={styles.ribbon}>AUTUMN CHALLENGE GUIDE</p></div>
          <div className={styles.coverNote}><span>FIELD NOTES / AUTUMN 2026</span><p>축제의 골목을 따라<br />나만의 도전을 발견하세요.</p></div>
        </header>
        <div className={styles.chapter}><span>THE CHALLENGE TRAIL</span><span>탐험 안내서 / {String(items.length).padStart(2, "0")}개의 도전</span></div>
        <div className={styles.listArea} aria-busy={status === "loading"}>
          {status === "loading" ? <p className={styles.notice} role="status">오늘의 문제 메뉴를 준비하고 있습니다</p>
            : status === "error" ? <div className={styles.notice} role="alert"><p>{error || "문제 메뉴를 불러오지 못했습니다"}</p>{onRetry && <button type="button" className={styles.action} onClick={onRetry}>다시 불러오기</button>}</div>
            : items.length === 0 ? <p className={styles.notice}>아직 공개된 문제가 없습니다</p>
            : <ol className={styles.list}>{items.map((item, index) => (
              <li key={item.id} className={styles.item} data-state={item.state}>
                <div className={styles.waypoint} aria-hidden="true">{index + 1}</div>
                <div className={styles.ticket}>
                <p className={styles.number}>CHALLENGE {String(index + 1).padStart(2, "0")}</p>
                {preview && item.previewIllustration && <div className={styles.illustration} aria-hidden="true"><img src={item.previewIllustration} alt="" /></div>}
                {item.state === "solved" && <div className={styles.solved} aria-label="풀이 완료"><span>EXPEDITION</span><strong>PASS</strong><small>CHALLENGE CLEARED</small></div>}
                <h3>{item.title}</h3>
                <p className={styles.meta}>{item.category || "SIGNATURE"}<span className={styles.price}>{item.score.toLocaleString("ko-KR")}<small> pts</small></span></p>
                {item.description && <p className={styles.description}>{item.description}</p>}
                <div className={styles.itemFooter}>
                  <span className={styles.state}>{item.state === "solved" ? "풀이 완료" : item.state === "locked" ? "공개 예정" : "도전 가능"}</span>
                  {preview || item.state === "locked" || !item.signatureId ? <button type="button" className={styles.action} disabled>{item.state === "locked" ? "공개를 기다려주세요" : preview ? "도전하기 (미리보기)" : "접속 정보 확인 중"}</button>
                    : <Link className={styles.action} to={ROUTES.signatureDetail(item.signatureId)}>{item.state === "solved" ? "문제 다시 보기" : "도전하기"} →</Link>}
                </div>
                </div>
              </li>
            ))}</ol>}
        </div>
        <footer className={styles.footer}><span aria-hidden="true">❧</span><p>{preview ? "DESIGN PREVIEW / 샘플 데이터 / 실제 문제 연결 전" : "CLUB FESTIVAL / CHALLENGE MENU"}</p><span className={styles.compass} aria-hidden="true">✥</span><em>Every challenge begins a journey</em><span aria-hidden="true">❧</span></footer>
      </div>
    </dialog>
  );
}

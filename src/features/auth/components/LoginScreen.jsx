import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../routes/routePaths.js";
import styles from "./LoginScreen.module.css";

export default function LoginScreen({
  onLogin,
  submitting = false,
  checkingSession = false,
  feedback = null,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const busy = submitting || checkingSession;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) return;
    onLogin({ username, password });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link
          to={ROUTES.intro + "#top"}
          className={styles.backLink}
          aria-label="MSG CTF 대회 안내로 돌아가기"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="m9 4-4 4 4 4M5 8h8" />
          </svg>
          대회 안내
        </Link>
      </header>
      <div className={styles.content}>
        <section className={styles.panel} aria-labelledby="login-title">
          <h1 id="login-title" className={styles.srOnly}>로그인</h1>
          <img
            src="/assets/intro/event-logo.webp"
            alt="MSG CTF"
            width="1254"
            height="1254"
            decoding="async"
            fetchpriority="high"
            className={styles.logo}
          />
          <form onSubmit={handleSubmit} className={styles.form} aria-busy={busy}>
            <div className={styles.fieldGroup}>
              <label htmlFor="login-username">아이디</label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="아이디를 입력하세요"
                value={username}
                required
                disabled={busy}
                aria-describedby={feedback ? "login-feedback" : undefined}
                onChange={(event) => setUsername(event.target.value)}
                className={styles.field}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="login-password">비밀번호</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                required
                disabled={busy}
                aria-describedby={feedback ? "login-feedback" : undefined}
                onChange={(event) => setPassword(event.target.value)}
                className={styles.field}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              aria-label="로그인"
              className={styles.loginButton}
            >
              {checkingSession ? "계정 확인 중" : submitting ? "로그인 중" : "LOGIN"}
            </button>
            {checkingSession && (
              <p className={styles.feedback} role="status">로그인 상태를 확인하고 있어요</p>
            )}
            {feedback && (
              <p
                id="login-feedback"
                className={[
                  styles.feedback,
                  feedback.type === "error" ? styles.feedbackError : styles.feedbackSuccess,
                ].join(" ")}
                role={feedback.type === "error" ? "alert" : "status"}
              >
                {feedback.message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

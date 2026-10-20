// Each screen owns its request/error state and AbortController. This scheduler
// pauses between requests in hidden tabs and serializes refreshes on return.
export function startVisiblePolling(task, { intervalMs = 30000, immediate = true, document = globalThis.document } = {}) {
  let stopped = false;
  let running = false;
  let refreshOnFinish = false;
  let timer;

  const clear = () => { clearTimeout(timer); timer = undefined; };
  const settled = () => {
    running = false;
    if (stopped || document.hidden) return;
    if (refreshOnFinish) {
      refreshOnFinish = false;
      run();
    } else timer = setTimeout(run, intervalMs);
  };
  const run = () => {
    clear();
    if (stopped || document.hidden) return;
    if (running) { refreshOnFinish = true; return; }
    running = true;
    // Recheck after the microtask so cleanup/StrictMode cannot start a stale request.
    Promise.resolve().then(() => {
      if (!stopped && !document.hidden) return task();
    }).then(settled, settled);
  };
  const onVisibility = () => {
    clear();
    refreshOnFinish = false;
    if (!document.hidden) run();
  };

  document.addEventListener("visibilitychange", onVisibility);
  if (immediate) run();
  else if (!document.hidden) timer = setTimeout(run, intervalMs);
  return () => {
    stopped = true;
    clear();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

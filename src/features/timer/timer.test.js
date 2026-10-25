import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createServer } from "vite";
import { adaptTimer, timerOffset, timerStage } from "./utils/timerData.js";

let server;
let Screen;

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    appType: "custom",
    cacheDir: "node_modules/.vite-timer-tests",
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  Screen = (await server.ssrLoadModule("/src/features/timer/components/TimerScreen.jsx")).default;
});

after(async () => server?.close());

const NOW = Date.parse("2026-11-08T00:00:00Z");
const contest = (status, extra = {}) => adaptTimer({
  name: "MSG CTF 2026",
  status,
  start_time: "2026-11-08T01:00:00Z",
  end_time: "2026-11-08T13:00:00Z",
  server_time: "2026-11-08T00:00:00Z",
  ...extra,
}, NOW);
const render = (props) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Screen, { status: "success", isSynced: true, onRetry() {}, ...props })));

test("서버 단계와 지금 시각으로 시작까지, 종료까지, 끝남을 가른다", () => {
  assert.deepEqual(timerStage(contest("BEFORE"), NOW), { stage: "before", secondsLeft: 3600 });
  // 서버가 아직 시작 전이라고 해도 시작 시각을 넘겼으면 종료까지 센다
  assert.deepEqual(timerStage(contest("BEFORE"), NOW + 3600e3 + 1000), { stage: "running", secondsLeft: 12 * 3600 - 1 });
  assert.deepEqual(timerStage(contest("RUNNING"), NOW + 2 * 3600e3), { stage: "running", secondsLeft: 11 * 3600 });
  assert.deepEqual(timerStage(contest("RUNNING"), NOW + 13 * 3600e3), { stage: "ended", secondsLeft: 0 });
  assert.deepEqual(timerStage(contest("ENDED"), NOW), { stage: "ended", secondsLeft: 0 });
  assert.deepEqual(timerStage(contest("BEFORE", { start_time: null }), NOW), { stage: "before", secondsLeft: null });
  assert.deepEqual(timerStage(null, NOW), { stage: null, secondsLeft: null });
});

test("서버 시각이 있으면 기기 시계와의 차이를 쓰고 없으면 기기 시계를 그대로 믿는다", () => {
  assert.equal(timerOffset(contest("BEFORE", { server_time: "2026-11-08T00:00:05Z" })), 5000);
  assert.equal(timerOffset(contest("BEFORE", { server_time: null })), 0);
  assert.equal(timerOffset(null), 0);
});

test("시작 전 타이머는 대기 화면과 같은 무대에서 시작까지 세고 다른 화면으로 가는 버튼 없이 시계만 둔다", () => {
  const html = render({ contest: contest("BEFORE"), stage: "before", secondsLeft: 3600 });
  assert.match(html, /data-goal="start"/);
  assert.match(html, /data-variant="timer"/);
  assert.match(html, /data-phase="waiting"/);
  assert.match(html, /STARTS IN/);
  assert.match(html, /오전 10시 시작/);
  assert.doesNotMatch(html, /<nav|<a /);
  assert.doesNotMatch(html, /이 화면이 바로 열립니다/);
});

test("진행 중에는 종료까지 센다", () => {
  const html = render({ contest: contest("RUNNING"), stage: "running", secondsLeft: 7 });
  assert.match(html, /data-goal="end"/);
  assert.match(html, /data-phase="final"/);
  assert.match(html, /대회 종료까지 7초/);
  const waiting = render({ contest: contest("RUNNING"), stage: "running", secondsLeft: 9000 });
  assert.match(waiting, /ENDS IN/);
  assert.match(waiting, /오후 10시 종료/);
  assert.doesNotMatch(waiting, /<nav|<a /);
});

test("끝난 뒤에는 로고와 끝났다는 말을 두고, 서버 시각을 못 받았으면 그렇다고 적는다", () => {
  const html = render({ contest: contest("ENDED"), stage: "ended", secondsLeft: 0, isSynced: false });
  assert.match(html, /data-phase="done"/);
  assert.match(html, /대회가 끝났습니다/);
  assert.match(html, /이 기기 시계를 기준으로 표시합니다/);
});

test("대회 정보를 받기 전에는 불러오는 중, 실패, 없음을 알린다", () => {
  assert.match(render({ status: "loading", contest: null }), /타이머 정보를 불러오는 중입니다/);
  const failed = render({ status: "error", contest: null, error: "연결 실패" });
  assert.match(failed, /role="alert"[^>]*>연결 실패</);
  assert.match(failed, />다시 시도</);
  assert.match(render({ status: "empty", contest: null }), /예정된 대회가 없습니다/);
});

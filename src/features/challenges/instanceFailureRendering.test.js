import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { mapChallengeInstance } from "./utils/challengeDetailMapper.js";

let server, Panel, Dialog;
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: "custom", cacheDir: "node_modules/.vite-instance-failure-tests", optimizeDeps: { noDiscovery: true, include: [] } });
  Panel = (await server.ssrLoadModule("/src/features/challenges/components/InstancePanel.jsx")).default;
  Dialog = (await server.ssrLoadModule("/src/features/challenges/components/InstanceActionDialog.jsx")).default;
});
after(async () => server?.close());

test("실패한 초기화의 원인과 다음 행동을 접속 정보 영역에서 읽을 수 있다", () => {
  const instance = mapChallengeInstance({ instance_id: "replacement", status: "FAILED", replaced_instance_id: "original", delete_reason: "TTL_EXPIRED" });
  const html = renderToStaticMarkup(createElement(Panel, { instance }));
  assert.match(html, /role="status">초기화 중 사용 시간이 만료됐습니다/);
  assert.match(html, /새 인스턴스를 생성해 주세요/);
  assert.doesNotMatch(html, /상태가 바뀌면 자동으로 갱신됩니다/);
});

test("다시 생성한 요청에는 이전 만료 실패 안내를 남기지 않는다", () => {
  const instance = mapChallengeInstance({ instance_id: "new", status: "REQUESTED" });
  const html = renderToStaticMarkup(createElement(Panel, { instance }));
  assert.doesNotMatch(html, /초기화 중 사용 시간이 만료/);
  assert.match(html, /상태가 바뀌면 자동으로 갱신됩니다/);
});

test("초기화 확인창은 남은 시간이 유지되고 먼저 연장할 수 있음을 알린다", () => {
  const html = renderToStaticMarkup(createElement(Dialog, { action: "restart" }));
  assert.match(html, /남은 시간은 늘어나지 않으니 만료가 가까우면 먼저 연장해 주세요/);
  assert.match(html, /aria-describedby=/);
});

test("정리가 완료된 이력은 준비 중으로 표시하거나 계속 기다리라고 안내하지 않는다", () => {
  const html = renderToStaticMarkup(createElement(Panel, { instance: mapChallengeInstance({ instance_id: "cleaned", status: "CLEANED" }) }));
  assert.match(html, /종료됨/);
  assert.match(html, /다시 사용하려면 새 인스턴스를 생성해 주세요/);
  assert.doesNotMatch(html, /준비 중|상태가 바뀌면 자동으로 갱신됩니다/);
});

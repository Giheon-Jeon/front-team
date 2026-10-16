import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
test("황금열쇠 결과는 공통 원본 이미지와 동적 카드 텍스트를 쓴다", () => {
  const card = source("./components/GoldenKeyCard.jsx");
  for (const id of ["card_reroll", "card_roll_twice_choose", "card_move_offset", "card_free_travel", "card_extra_roll"]) assert.ok(card.includes(id));
  assert.match(card, /golden-key-original.png/);
  assert.match(card, /card.description/);
  assert.doesNotMatch(card, /card.effect/);
  assert.match(card, /Escape/);
});
test("추첨 성공 화면만 교체하고 기존 로딩, 오류, 재시도를 유지한다", () => {
  const panel = source("./components/BoardEventPanel.jsx");
  assert.match(panel, /<GoldenKeyCard card=\{event.result\}/);
  assert.match(panel, /event.status === "loading"/);
  assert.match(panel, /event.status === "error"/);
  assert.match(panel, /onRetry\(event.token\)/);
});
test("미리보기는 개발 전용이며 게임 API와 연결하지 않는다", () => {
  const routes = source("../../routes/AppRoutes.jsx");
  assert.match(routes, /import.meta.env.DEV && <Route path="\/dev\/golden-key-preview"/);
  const preview = source("./preview/GoldenKeyPreviewPage.jsx");
  assert.doesNotMatch(preview, /from ["'].*(?:api|useBoardController)/);
  assert.match(preview, /useState\(0\)/);
});

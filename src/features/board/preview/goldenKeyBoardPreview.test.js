import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./GoldenKeyPreviewPage.jsx", import.meta.url), "utf8");
test("황금열쇠 미리보기는 실제 보드와 추첨 응답 어댑터를 재사용한다", () => {
  assert.match(source, /<BoardScreen/);
  assert.match(source, /adaptChanceDraw\(\{ card_id:/);
  assert.match(source, /currentCell=\{PREVIEW_BOARD_CELLS\[6\]\}/);
  assert.doesNotMatch(source, /<GoldenKeyCard|<BoardSurface|fetch\(|from ["'].*\/api\//);
});
test("미리보기 추첨은 로컬 로딩·성공·닫기 흐름과 타이머 정리를 제공한다", () => {
  assert.match(source, /status: "loading"/);
  assert.match(source, /status: "success"/);
  assert.match(source, /onCloseCellEvent=\{\(\) => setCellEvent\(null\)\}/);
  assert.match(source, /clearTimeout\(timer.current\)/);
});
test("촬영 모드와 F2는 개발 컨트롤만 숨기고 실제 카드 UI는 유지한다", () => {
  assert.match(source, /has\("capture"\)/);
  assert.match(source, /event.key === "F2"/);
  assert.match(source, /controls && <aside/);
});

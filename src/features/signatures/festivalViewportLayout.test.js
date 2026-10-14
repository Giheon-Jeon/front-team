import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./components/SignatureFestival.module.css", import.meta.url), "utf8");

test("축제 PC 배경은 전체 폭을 채우고 부스만 독립적인 3열 2행으로 배치한다", () => {
  const pc=css.slice(css.indexOf("/* PC는"), css.indexOf("@media (max-width: 900px)"));
  assert.match(pc, /width: 100%;/);
  assert.match(pc, /max-width: none;/);
  assert.match(pc, /height: 100dvh;/);
  assert.match(pc, /background-plaza\.png.*cover/);
  assert.match(pc, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(pc, /grid-template-rows: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(pc, /aspect-ratio: 1\.12987/);
  assert.doesNotMatch(pc, /overflow|transform|150dvh|contain/);
});

test("축제 모바일은 기존 두 열과 페이지 스크롤을 유지한다", () => {
  const mobile = css.slice(css.indexOf("@media (max-width: 900px)"));
  assert.match(mobile, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(mobile, /aspect-ratio: auto/);
});

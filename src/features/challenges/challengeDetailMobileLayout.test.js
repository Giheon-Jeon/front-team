import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./components/ChallengeDetailScene.module.css", import.meta.url), "utf8");
const mobile = css.split(/@container game-scene \(max-width: 1100px\) or \(max-height: 619px\)\s*\{/)[1]?.split("@media (prefers-reduced-motion")[0];

test("문제 상세의 레이아웃 분기는 실제 화면 대신 공통 원본 캔버스를 기준으로 한다", () => {
  assert.ok(mobile);
  assert.match(mobile, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@container game-scene \(min-width: 1101px\) and \(min-height: 620px\)/);
  assert.match(mobile, /\.sectionNav\s*\{[^}]*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("작은 캔버스에서도 긴 본문과 접속 정보의 스크롤·줄바꿈 규칙을 유지한다", () => {
  assert.match(mobile, /\.descriptionBody\s*\{[^}]*max-height: none;[^}]*overflow: visible;/);
  assert.match(mobile, /\.descriptionBody pre\s*\{[^}]*overflow-x: auto;/);
  assert.match(mobile, /\.connectionText\s*\{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/);
  assert.match(mobile, /\.dock\s*\{[^}]*position: static;/);
});

test("모달 확인창은 원본 캔버스 밖의 실제 모바일 화면과 safe area에 맞춘다", () => {
  assert.match(mobile, /\.attachmentButton,[\s\S]*?min-height: 44px;/);
  assert.match(mobile, /\.flagInput\s*\{[^}]*font-size: 18px;/);
  assert.match(mobile, /\.submitButton\s*\{[^}]*width: 100%;/);
  assert.match(css, /\.confirmDialog\s*\{[^}]*width: min\(460px, calc\(100vw - 32px\)\);[^}]*max-height: calc\(100dvh - 32px\);/);
  assert.match(css, /100dvh - 32px - env\(safe-area-inset-top\) - env\(safe-area-inset-bottom\)/);
});

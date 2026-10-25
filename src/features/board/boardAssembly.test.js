import test, { beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ASSEMBLY_KEY,
  DICE_INTRO_KEY,
  assemblyHoldMs,
  clearAssemblyPending,
  isAssemblyPending,
  markBoardIntro,
} from "./utils/boardIntro.js";

const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
beforeEach(() => {
  const store = new Map();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
  });
});
after(() => {
  if (original) Object.defineProperty(globalThis, "sessionStorage", original);
  else delete globalThis.sessionStorage;
});

test("로그인과 대회 시작 카운트다운은 판이 생기는 연출과 첫 주사위 안내를 함께 켠다", () => {
  assert.equal(isAssemblyPending(), false);
  markBoardIntro();
  assert.equal(sessionStorage.getItem(DICE_INTRO_KEY), "1");
  assert.equal(sessionStorage.getItem(ASSEMBLY_KEY), "login");
  assert.equal(isAssemblyPending(), true);
  assert.equal(assemblyHoldMs(), 0, "로그인 직후에는 바로 판을 세운다");
  markBoardIntro("countdown");
  assert.equal(assemblyHoldMs(), 1800, "카운트다운 뒤에는 시작 연출의 막이 걷히는 동안 기다린다");
  clearAssemblyPending();
  assert.equal(isAssemblyPending(), false);
  assert.equal(sessionStorage.getItem(DICE_INTRO_KEY), "1", "주사위 안내는 첫 굴림까지 남는다");
});

test("저장소를 쓸 수 없어도 보드는 연출 없이 그대로 열린다", () => {
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, get() { throw new Error("blocked"); } });
  assert.doesNotThrow(() => markBoardIntro());
  assert.equal(isAssemblyPending(), false);
  assert.equal(assemblyHoldMs(), 0);
});

test("판이 생기는 연출이 끝난 뒤에만 주사위 안내를 띄우고 로그인과 대기 화면이 표시를 남긴다", () => {
  const track = readFileSync(new URL("./components/BoardTrack.jsx", import.meta.url), "utf8");
  assert.match(track, /showIntro && canRoll && diceReady && !isRolling && !rolling && assembly === "done"/);
  assert.match(track, /data-assembly=\{assembly === "done" \? undefined : assembly\}/);
  const screen = readFileSync(new URL("./components/BoardScreen.jsx", import.meta.url), "utf8");
  assert.match(screen, /frame\.dataset\.assembly = assembly/);
  const login = readFileSync(new URL("../auth/pages/LoginPage.jsx", import.meta.url), "utf8");
  assert.match(login, /markBoardIntro\(\);/);
  const gate = readFileSync(new URL("../../routes/ContestGate.jsx", import.meta.url), "utf8");
  assert.match(gate, /markBoardIntro\("countdown"\)/);
  // 패널과 말은 투명도와 이동만 움직여 보드가 붙으며 바빠도 끊기지 않는다
  const css = readFileSync(new URL("./components/BoardScreen.module.css", import.meta.url), "utf8");
  assert.match(css, /@property --board-sweep/);
  // 3D 주사위 캔버스는 보이는 크기를 재므로 주사위와 그 위 판 전체에는 이동과 크기 변화를 주지 않는다
  const dice = /@keyframes assembly-dice-in \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
  assert.ok(dice);
  assert.doesNotMatch(dice, /translate|scale|transform/);
  assert.doesNotMatch(/\.track\[data-assembly="playing"\] \{([^}]*)\}/.exec(css)?.[1] ?? "", /board-settle/);
  for (const name of ["assembly-panel-in", "assembly-piece-in", "assembly-start-flash", "board-settle"]) {
    const frames = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css)?.[1] ?? "";
    assert.ok(frames, name);
    assert.doesNotMatch(frames, /filter|width|height|left|top/, name);
  }
});

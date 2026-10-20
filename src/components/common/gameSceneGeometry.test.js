import test from "node:test";
import assert from "node:assert/strict";
import { GAME_SCENE, getAnchoredBackdrop, getGameSceneGeometry } from "./gameSceneGeometry.js";

const sizes = [[320, 568], [390, 844], [430, 932], [844, 390], [768, 1024], [1024, 768], [1100, 900], [1101, 900], [1440, 900], [1920, 1080], [2560, 1080], [1600, 600]];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test("작은 화면도 원본 1920×1080 캔버스를 같은 축척으로 맞춘다", () => {
  for (const [w, h] of sizes) {
    const scene = getGameSceneGeometry(w, h);
    if (!scene.compact) continue;
    assert.equal(scene.layoutWidth, GAME_SCENE.width);
    assert.equal(scene.layoutHeight, GAME_SCENE.height);
    close(scene.layoutWidth * scene.scale / (scene.layoutHeight * scene.scale), 16 / 9);
    assert.ok(scene.layoutWidth * scene.scale <= w + 1e-7);
    assert.ok(scene.layoutHeight * scene.scale <= h + 1e-7);
    close(scene.left * 2 + scene.layoutWidth * scene.scale, w);
    close(scene.top * 2 + scene.layoutHeight * scene.scale, h);
  }
});

test("일반 와이드 화면에는 추가 확대나 축소를 적용하지 않는다", () => {
  for (const [w, h] of sizes.filter(([w, h]) => w > 1100 && h >= 620)) {
    assert.deepEqual(getGameSceneGeometry(w, h), {
      compact: false, scale: 1, layoutWidth: w, layoutHeight: h,
      worldWidth: w, worldHeight: h, left: 0, top: 0,
    });
  }
});

test("확대 시 원본 크기를 읽고 하단 안내도 보기 버튼 위까지 이동할 수 있다", () => {
  for (const [w, h] of sizes.filter(([w, h]) => w <= 1100 || h < 620)) {
    const scene = getGameSceneGeometry(w, h, true);
    assert.equal(scene.scale, 1);
    assert.ok(scene.worldWidth >= 1920 && scene.worldWidth >= w);
    assert.ok(scene.worldHeight >= 1080 + 96 && scene.worldHeight >= h + 96);
    assert.ok(scene.top >= 0 && scene.left >= 0);
  }
});

test("세로·가로·확대 화면의 단일 배경이 틈 없이 채워지고 바닥 기준점을 지킨다", () => {
  const anchor = { x: 917, y: 630 };
  for (const [w, h] of sizes) for (const expanded of [false, true]) {
    const scene = getGameSceneGeometry(w, h, expanded);
    const backdrop = getAnchoredBackdrop(scene, anchor);
    close(backdrop.width / backdrop.height, 16 / 9);
    assert.ok(backdrop.left <= 1e-7 && backdrop.top <= 1e-7);
    assert.ok(backdrop.left + backdrop.width >= scene.worldWidth - 1e-7);
    assert.ok(backdrop.top + backdrop.height >= scene.worldHeight - 1e-7);
    close(backdrop.left + backdrop.width * anchor.x / 1920, scene.left + anchor.x * scene.scale);
    close(backdrop.top + backdrop.height * anchor.y / 1080, scene.top + anchor.y * scene.scale);
  }
});

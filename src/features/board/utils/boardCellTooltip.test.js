import test from "node:test";
import assert from "node:assert/strict";
import { getBoardCellTooltipPosition, getBoardCellTooltipTail } from "./boardCellTooltip.js";

test("툴팁은 칸 바로 위에 놓이고 상단 공간이 없으면 아래에 놓인다", () => {
  const size = { width: 140, height: 60 }, viewport = { width: 1000, height: 800 };
  assert.deepEqual(getBoardCellTooltipPosition({ left: 400, right: 500, top: 300, bottom: 350 }, size, viewport), { left: 380, top: 224 });
  assert.deepEqual(getBoardCellTooltipPosition({ left: 400, right: 500, top: 10, bottom: 50 }, size, viewport), { left: 380, top: 66 });
});

test("꼬리는 위·아래 배치에 따라 반전되고 화면 경계에서는 둥근 모서리 안쪽으로 제한된다", () => {
  const size = { width: 140, height: 60 };
  assert.deepEqual(getBoardCellTooltipTail({ left: 400, right: 500, top: 300, bottom: 350 }, size, { left: 380, top: 224 }), { side: "bottom", offset: 70 });
  assert.deepEqual(getBoardCellTooltipTail({ left: 400, right: 500, top: 10, bottom: 50 }, size, { left: 380, top: 66 }), { side: "top", offset: 70 });
  assert.equal(getBoardCellTooltipTail({ left: -20, right: 20, top: 100, bottom: 140 }, size, { left: 8, top: 24 }).offset, 20);
  assert.equal(getBoardCellTooltipTail({ left: 370, right: 410, top: 100, bottom: 140 }, size, { left: 242, top: 24 }).offset, 120);
});

test("화면 네 모서리와 작은 viewport에서도 툴팁은 8px 안전 여백 안에 있다", () => {
  const size = { width: 140, height: 60 }, viewport = { width: 390, height: 844 };
  for (const left of [-20, 360]) for (const top of [0, 830]) {
    const result = getBoardCellTooltipPosition({ left, right: left + 40, top, bottom: top + 40 }, size, viewport);
    assert.ok(result.left >= 8 && result.left + size.width <= viewport.width - 8);
    assert.ok(result.top >= 8 && result.top + size.height <= viewport.height - 8);
  }
});

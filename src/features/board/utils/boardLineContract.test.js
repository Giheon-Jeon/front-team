import test from "node:test";
import assert from "node:assert/strict";
import { adaptBoardDefinition, adaptMyBoard } from "./boardData.js";
import { getBoardLineProgress, getBoardLineEarnedScore, getBoardLineAccentMap, prepareBoardLines } from "./boardLines.js";
import { PREVIEW_BOARD_CELLS, PREVIEW_LINE_INDEXES, createRailPreview } from "../preview/lineRailPreviewData.js";

const definition = () => adaptBoardDefinition({ total_cell_count: 36, cells: [
  ...[2, 3, 4, 5, 6].map((cell_index) => ({ cell_index, type: "CHALLENGE", line_number: 1 })),
  { cell_index: 7, type: "CHANCE", line_number: null },
  { cell_index: 8, type: "CHALLENGE", line_number: 2 },
  ...[9, 10, 11, 12].map(cell_index => ({ cell_index, type: "CHALLENGE", line_number: 2 })),
] });
const states = (cell_states) => new Map(adaptMyBoard({ cell_states }).cellStates.map((cell) => [cell.cellIndex, cell]));

test("서버의 line_number를 클라이언트 lineNumber로 보존한다", () => {
  assert.equal(definition().cells[0].lineNumber, 1);
  assert.equal(definition().cells[5].lineNumber, null);
  assert.equal(adaptBoardDefinition({ cells: [{ cell_index: 2, type: "CHALLENGE" }] }).cells[0].lineNumber, null);
});

test("서버 라인 묶음과 현재 팀의 CLEARED 상태를 연결한다", () => {
  const lines = getBoardLineProgress(definition().cells, states([
    { cell_index: 2, status: "CLEARED" }, { cell_index: 3, status: "OPENED" },
    { cell_index: 4, status: "CONSUMED" }, { cell_index: 7, status: "CLEARED" },
    { cell_index: 8, status: "CLEARED" },
  ]));
  assert.deepEqual(lines.map((line) => line.cellIndexes), [[2, 3, 4, 5, 6], [8, 9, 10, 11, 12]]);
  assert.deepEqual(lines.map((line) => line.solvedCellIndexes), [[2], [8]]);
  assert.ok(lines.every((line) => line.isCompleted === false && line.bonusScore === null));
});

test("모든 칸을 풀어도 서버 지급 확인 없이 독점 완료와 점수를 만들지 않는다", () => {
  const [line] = getBoardLineProgress(definition().cells, states([2, 3, 4, 5, 6].map((cell_index) => ({ cell_index, status: "CLEARED" }))));
  assert.equal(line.isCompleted, false);
  assert.equal(line.awaitingConfirmation, true);
  assert.equal(line.rewardScore, null);
  assert.equal(getBoardLineEarnedScore(line), null);
});

test("라인이 없는 구버전 응답과 잘못된 번호에서 기본 라인을 추정하지 않는다", () => {
  for (const lineNumber of [undefined, null, 0, 7, "1", 1.5]) {
    assert.deepEqual(getBoardLineProgress([{ cellIndex: 2, type: "CHALLENGE", lineNumber }], new Map()), []);
  }
  assert.deepEqual(getBoardLineProgress(null, new Map()), []);
  assert.deepEqual(getBoardLineProgress(definition().cells, null), []);
});

test("중복 문제 칸 라인은 제외하고 특수 칸의 잘못된 번호는 무시한다", () => {
  for (const extra of [
    { cellIndex: 2, type: "CHALLENGE", lineNumber: 1 },
  ]) {
    const lines = getBoardLineProgress([...definition().cells, extra], new Map());
    assert.ok(lines.every((line) => line.lineId !== "line-1"));
  }
});

test("6개 라인의 5칸 계약, 특수칸 제외, 지급 미확인과 미리보기 격리", () => {
  const lines = getBoardLineProgress(PREVIEW_BOARD_CELLS, new Map());
  assert.deepEqual(lines.map(line => line.cellIndexes), PREVIEW_LINE_INDEXES);
  assert.ok(lines.every(line => line.cellIndexes.length === 5 && line.payoutStatus === "unknown" && getBoardLineEarnedScore(line) === null));
  const malformed = PREVIEW_BOARD_CELLS.map(cell => cell.lineNumber === null ? { ...cell, lineNumber: 1 } : cell);
  assert.deepEqual(getBoardLineProgress(malformed, new Map()).map(line => line.cellIndexes), PREVIEW_LINE_INDEXES);
  assert.equal(getBoardLineProgress(PREVIEW_BOARD_CELLS.filter(cell => cell.cellIndex !== 6), new Map()).length, 5);
  for (const state of ["complete", "partial", "incomplete"]) {
    const preview = createRailPreview(Array(6).fill(state));
    assert.equal(preview.lines.filter(line => line.isCompleted).length, state === "complete" ? 6 : 0);
    assert.ok(preview.lines.every(line => line.solvedCellIndexes.length === (state === "complete" ? 5 : state === "partial" ? 2 : 0)));
    assert.ok(getBoardLineProgress(PREVIEW_BOARD_CELLS, new Map(preview.cleared.map(index => [index, { status: "CLEARED" }]))).every(line => !line.isCompleted));
  }
});

test("라인 누락이나 순서 변경에도 번호별 보석색이 유지된다", () => {
  const lines = getBoardLineProgress(PREVIEW_BOARD_CELLS, new Map());
  const colors = getBoardLineAccentMap(lines);
  assert.equal(getBoardLineAccentMap([lines[4], lines[1]]).get("line-2"), colors.get("line-2"));
  assert.equal(getBoardLineAccentMap([lines[4]]).get("line-5"), "#376f77");
});

test("지급 미확인 모델은 완료 플래그가 섞여도 지급 완료로 확정하지 않는다", () => {
  const [line] = getBoardLineProgress(PREVIEW_BOARD_CELLS, new Map([2,3,4,5,6].map(index => [index, { status: "CLEARED" }])));
  const [prepared] = prepareBoardLines([{ ...line, isCompleted: true, bonusScore: 500 }], PREVIEW_BOARD_CELLS);
  assert.equal(prepared.allProblemsCleared, true);
  assert.equal(prepared.isCompleted, false);
  assert.equal(prepared.bonusScore, null);
  assert.equal(getBoardLineEarnedScore(prepared), null);
});

test("팀 상태를 바꾸거나 초기화하면 다른 팀의 풀이를 이어받지 않는다", () => {
  const cells = definition().cells;
  assert.deepEqual(getBoardLineProgress(cells, states([{ cell_index: 2, status: "CLEARED" }]))[0].solvedCellIndexes, [2]);
  assert.deepEqual(getBoardLineProgress(cells, states([{ cell_index: 3, status: "CLEARED" }]))[0].solvedCellIndexes, [3]);
  assert.deepEqual(getBoardLineProgress(cells, states([]))[0].solvedCellIndexes, []);
});

import { getBoardLineProgress, prepareBoardLines } from "../utils/boardLines.js";

// 개발 미리보기 전용 계약 fixture. 서비스 컨트롤러에서는 import하지 않는다.
export const PREVIEW_LINE_INDEXES = [[2,3,4,5,6], [8,9,10,11,12], [13,14,15,17,18],
  [19,20,22,23,24], [26,27,28,29,31], [32,33,34,35,36]];
const specialTypes = { 1: "START", 7: "CHANCE", 16: "ROULETTE", 21: "AIRPORT", 25: "ROULETTE", 30: "CHANCE" };
export const PREVIEW_BOARD_CELLS = Array.from({ length: 36 }, (_, index) => {
  const cellIndex = index + 1;
  const group = PREVIEW_LINE_INDEXES.findIndex(indexes => indexes.includes(cellIndex));
  return { cellIndex, type: specialTypes[cellIndex] ?? "CHALLENGE", lineNumber: group < 0 ? null : group + 1 };
});

export function createRailPreview(states) {
  const cleared = PREVIEW_LINE_INDEXES.flatMap((indexes, index) =>
    states[index] === "complete" ? indexes : states[index] === "partial" ? indexes.slice(0, 2) : []);
  const cellStates = new Map(cleared.map(index => [index, { status: "CLEARED" }]));
  const lines = prepareBoardLines(getBoardLineProgress(PREVIEW_BOARD_CELLS, cellStates).map((line, index) => ({
    ...line, payoutStatus: "simulation", isCompleted: states[index] === "complete",
  })), PREVIEW_BOARD_CELLS);
  return { lines, cleared };
}

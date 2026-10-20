import { getBoardCellPosition } from "./boardData.js";

export function getBoardZoomScrollLeft(viewportWidth, boardWidth, cellIndex, trackBounds = null) {
  if (
    !Number.isFinite(viewportWidth) ||
    !Number.isFinite(boardWidth) ||
    viewportWidth <= 0 ||
    boardWidth <= viewportWidth
  ) return 0;

  const { x } = getBoardCellPosition(cellIndex);
  const validBounds = trackBounds && Number.isFinite(trackBounds.left) && Number.isFinite(trackBounds.width) &&
    trackBounds.left >= 0 && trackBounds.width > 0 && trackBounds.left + trackBounds.width <= boardWidth + 1;
  const pieceOffset = validBounds ? trackBounds.left + trackBounds.width * x / 100 : boardWidth * x / 100;
  return Math.max(0, Math.min(boardWidth - viewportWidth, pieceOffset - viewportWidth / 2));
}
// The responsive board uses the original x448/y120 crop. Keep its floor point under the track.
export function getMobileBoardBackdrop({ width, height, sceneLeft, sceneTop, sceneWidth, sceneHeight }) {
  const x = sceneLeft + sceneWidth * (917 - 448) / 951;
  const y = sceneTop + sceneHeight * (630 - 120) / 960;
  const scale = Math.max(x / 917, (width - x) / 1003, y / 630, (height - y) / 450);
  return { left: x - 917 * scale, top: y - 630 * scale, width: 1920 * scale, height: 1080 * scale };
}

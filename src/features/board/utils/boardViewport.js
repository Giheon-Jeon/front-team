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
// Entering the responsive layout must not enlarge the original desktop track.
// Keep the breakpoint's native width, with the same height limit as the desktop stage.
export function getMobileBoardFitWidth(viewportWidth, viewportHeight) {
  return Math.min(viewportWidth, 1100 * 951 / 1920, viewportHeight * 951 / 1080);
}

// Size the backdrop for the fitted view once, then apply the scene's zoom to both
// layers. Recomputing cover from the enlarged page changes the ground/track ratio.
export function getMobileBoardBackdrop({
  width, height, sceneLeft, sceneTop, sceneWidth, sceneHeight,
  fitSceneWidth = sceneWidth, fitSceneLeft = sceneLeft, fitFrameHeight = height,
}) {
  const zoom = sceneWidth / fitSceneWidth;
  const fitX = fitSceneLeft + fitSceneWidth * (917 - 448) / 951;
  const fitY = sceneTop + sceneHeight / zoom * (630 - 120) / 960;
  const fitScale = Math.max(fitX / 917, (width - fitX) / 1003, fitY / 630, (fitFrameHeight - fitY) / 450);
  const x = sceneLeft + sceneWidth * (917 - 448) / 951;
  const y = sceneTop + sceneHeight * (630 - 120) / 960;
  const scale = fitScale * zoom;
  return { left: x - 917 * scale, top: y - 630 * scale, width: 1920 * scale, height: 1080 * scale };
}

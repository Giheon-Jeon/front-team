export const GAME_SCENE = Object.freeze({ width: 1920, height: 1080 });

export function getGameSceneGeometry(width, height, expanded = false) {
  const compact = width <= 1100 || height < 620;
  const scale = compact && !expanded ? Math.min(width / GAME_SCENE.width, height / GAME_SCENE.height) : 1;
  const layoutWidth = compact ? GAME_SCENE.width : width;
  const layoutHeight = compact ? GAME_SCENE.height : height;
  const worldWidth = Math.max(width, layoutWidth * scale);
  const sceneHeight = Math.max(height, layoutHeight * scale);
  // Allow the original footer to scroll above the fixed view control in reading mode.
  const worldHeight = sceneHeight + (compact && expanded ? 96 : 0);
  return {
    compact, scale, layoutWidth, layoutHeight, worldWidth, worldHeight,
    left: (worldWidth - layoutWidth * scale) / 2,
    top: (sceneHeight - layoutHeight * scale) / 2,
  };
}

// Keep the floor's original point under the board while one proportional image covers the viewport.
export function getAnchoredBackdrop(geometry, anchor) {
  const { worldWidth, worldHeight, scale, left, top } = geometry;
  const x = left + anchor.x * scale;
  const y = top + anchor.y * scale;
  const backdropScale = Math.max(
    x / anchor.x, (worldWidth - x) / (GAME_SCENE.width - anchor.x),
    y / anchor.y, (worldHeight - y) / (GAME_SCENE.height - anchor.y),
  );
  return {
    left: x - anchor.x * backdropScale,
    top: y - anchor.y * backdropScale,
    width: GAME_SCENE.width * backdropScale,
    height: GAME_SCENE.height * backdropScale,
  };
}

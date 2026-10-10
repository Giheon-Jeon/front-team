// viewport 좌표를 사용해 보드의 scale이나 스크롤 영역 밖에서도 잘리지 않게 한다.
export function getBoardCellTooltipPosition(anchor, size, viewport) {
  const margin = 8;
  const gap = 16;
  const clamp = (value, max) => Math.max(margin, Math.min(value, Math.max(margin, max)));
  const above = anchor.top - size.height - gap;
  const top = above >= margin ? above : anchor.bottom + gap;
  return {
    left: clamp((anchor.left + anchor.right - size.width) / 2, viewport.width - size.width - margin),
    top: clamp(top, viewport.height - size.height - margin),
  };
}

export function getBoardCellTooltipTail(anchor, size, position) {
  const center = (anchor.left + anchor.right) / 2;
  return {
    side: (anchor.top + anchor.bottom) / 2 >= position.top + size.height / 2 ? "bottom" : "top",
    // 꼬리는 칸 중심을 가리키되 둥근 모서리를 침범하지 않는다.
    offset: Math.max(20, Math.min(center - position.left, size.width - 20)),
  };
}

import { useEffect } from "react";
import { getMobileBoardBackdrop } from "../utils/boardViewport.js";

export default function useMobileBoardBackdrop(frameRef, viewportRef) {
  useEffect(() => {
    const frame = frameRef.current, viewport = viewportRef.current;
    const scene = viewport?.querySelector('[data-board-layer="scene"]');
    if (!frame || !viewport || !scene) return;
    let scheduled;
    const update = () => {
      scheduled = undefined;
      if (!window.matchMedia("(max-width: 1100px)").matches) return;
      const bounds = frame.getBoundingClientRect(), board = scene.getBoundingClientRect();
      if (!board.width || !board.height) return;
      const image = getMobileBoardBackdrop({
        width: bounds.width, height: bounds.height,
        sceneLeft: board.left - bounds.left, sceneTop: board.top - bounds.top,
        sceneWidth: board.width, sceneHeight: board.height,
      });
      for (const key of ["left", "top", "width", "height"]) frame.style.setProperty(`--mobile-background-${key}`, `${image[key]}px`);
    };
    const schedule = () => { if (scheduled === undefined) scheduled = requestAnimationFrame(update); };
    const observer = new ResizeObserver(update);
    // Status text and navigation can change the scene's top without changing its own size.
    [frame, viewport, scene, ...frame.lastElementChild.children].forEach(node => observer.observe(node));
    viewport.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", update);
      if (scheduled !== undefined) cancelAnimationFrame(scheduled);
    };
  }, [frameRef, viewportRef]);
}

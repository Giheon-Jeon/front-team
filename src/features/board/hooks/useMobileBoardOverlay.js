import { useEffect, useState } from "react";
import { useGameScene } from "../../../components/common/GameSceneContext.js";

export default function useMobileBoardOverlay(panelRef) {
  const scene = useGameScene();
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 1100px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => setIsMobile(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, []);
  const useMobileOverlay = isMobile && !scene;
  useEffect(() => {
    if (!useMobileOverlay) return;
    const body = document.body;
    const app = document.getElementById("root");
    const previousInert = app?.inert;
    const previousFocus = document.activeElement;
    const x = window.scrollX, y = window.scrollY;
    const previous = Object.fromEntries(["position", "top", "left", "width", "overflow"].map(key => [key, body.style[key]]));
    Object.assign(body.style, { position: "fixed", top: `${-y}px`, left: `${-x}px`, width: "100%", overflow: "hidden" });
    if (app) app.inert = true;
    const trapFocus = event => {
      if (event.key !== "Tab") return;
      const targets = [...(panelRef.current?.querySelectorAll('button:not(:disabled), input, select, summary, [tabindex="0"]') ?? [])].filter(el => el.getClientRects().length);
      const first = targets[0], last = targets.at(-1);
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      document.removeEventListener("keydown", trapFocus);
      Object.assign(body.style, previous);
      if (app) app.inert = previousInert;
      window.scrollTo(x, y);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [useMobileOverlay, panelRef]);
  return useMobileOverlay;
}

import { Component, useCallback, useLayoutEffect, useRef, useState } from "react";
import { createRoot, extend } from "@react-three/fiber";
import { AmbientLight, DirectionalLight, Group, HemisphereLight, Mesh, PlaneGeometry, ShadowMaterial } from "three";

// Canvas extends the entire Three namespace. The root API keeps only this scene's
// JSX catalogue while retaining R3F's renderer, color management and shadows.
extend({ AmbientLight, DirectionalLight, Group, HemisphereLight, Mesh, PlaneGeometry, ShadowMaterial });

class SceneErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function DiceCanvas({ children, camera, onCreated, gl, shadows, dpr, frameloop }) {
  const cleanup = useRef(null);
  const redraw = useRef(null);
  const current = useRef(null);
  current.current = { children, camera, onCreated, gl, shadows, dpr, frameloop };
  const [failure, setFailure] = useState(null);

  // Callback refs follow the actual DOM lifetime in React 18. StrictMode's
  // effect replay must not unmount and re-create a root on the same canvas.
  const attach = useCallback(container => {
    cleanup.current?.();
    cleanup.current = null;
    if (!container) return;
    const canvas = container.firstElementChild;
    const renderer = createRoot(canvas);
    let active = true;
    const render = () => {
      if (!active) return;
      const { width, height, top, left } = container.getBoundingClientRect();
      if (!width || !height) return;
      const { children: scene, ...options } = current.current;
      try {
        renderer.configure({ ...options, size: { width, height, top, left } });
        renderer.render(<SceneErrorBoundary onError={error => active && setFailure(error)}>{scene}</SceneErrorBoundary>);
      } catch (error) { setFailure(error); }
    };
    redraw.current = render;
    const observer = new ResizeObserver(render);
    observer.observe(container);
    window.addEventListener("resize", render);
    render();
    cleanup.current = () => {
      active = false;
      observer.disconnect();
      window.removeEventListener("resize", render);
      renderer.unmount();
      if (redraw.current === render) redraw.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    redraw.current?.();
  }, [children]);

  // Let BoardTrack's existing boundary supply the same playable fallback.
  if (failure) throw failure;
  return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
    <div ref={attach} style={{ width: "100%", height: "100%" }}>
      <canvas style={{ display: "block" }} />
    </div>
  </div>;
}

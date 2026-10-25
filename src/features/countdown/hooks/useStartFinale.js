import { useEffect, useState } from "react";
import { FINALE_MS } from "../utils/countdown.js";

// 대기 화면을 보고 있다가 시작 시각을 넘긴 경우에만 시작 연출을 한 번 보인다
// 시작 뒤에 들어온 사람이나 다른 화면에 있다 돌아온 사람은 바로 게임 화면으로 간다
export default function useStartFinale(blocked, watching = true, duration = FINALE_MS) {
  const [seen, setSeen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!watching) setSeen(false);
    else if (blocked) setSeen(true);
  }, [blocked, watching]);

  const finale = watching && seen && !blocked && !done;

  useEffect(() => {
    if (!finale) return undefined;
    const id = window.setTimeout(() => setDone(true), duration);
    return () => window.clearTimeout(id);
  }, [finale, duration]);

  return finale;
}

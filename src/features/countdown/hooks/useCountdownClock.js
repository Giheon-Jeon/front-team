import { useEffect, useState } from "react";

// 남은 시간이 1초 단위로 바뀌는 순간마다 다시 그린다
// 1초 간격 타이머는 처음 연 순간에 맞춰 돌아서 기기마다 숫자가 늦게 바뀐다 남은 시간이 1초 단위를 넘는 순간 바로 뒤에 다시 잰다
// targets: 기다리는 시각 하나 또는 여러 개 (시작과 종료처럼), 지난 시각은 건너뛰고 다음 시각에 맞춘다
export default function useCountdownClock(targets, offsetMs = 0, enabled = true) {
  const [now, setNow] = useState(() => Date.now());
  const list = (Array.isArray(targets) ? targets : [targets]).filter(Number.isFinite).sort((a, b) => a - b);
  const key = list.join(",");

  useEffect(() => {
    const times = key ? key.split(",").map(Number) : [];
    if (!enabled || times.length === 0) return undefined;
    let id;
    const tick = () => {
      window.clearTimeout(id);
      const current = Date.now();
      setNow(current);
      const serverNow = current + offsetMs;
      const next = times.find((time) => time > serverNow);
      if (next == null) return;
      id = window.setTimeout(tick, ((next - serverNow) % 1000) + 20);
    };
    // 뒤로 숨었던 탭은 타이머가 늦게 깨므로 다시 보일 때 바로 잰다
    const wake = () => { if (!document.hidden) tick(); };
    tick();
    document.addEventListener("visibilitychange", wake);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [key, offsetMs, enabled]);

  return now;
}

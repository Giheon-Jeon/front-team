import { useCallback, useEffect, useRef, useState } from "react";
import { getTimer } from "../../../api/timer.js";
import { isSuccess } from "../../../utils/response.js";
import { startVisiblePolling } from "../../../utils/visiblePolling.js";
import useCountdownClock from "../../countdown/hooks/useCountdownClock.js";
import { adaptTimer, timerOffset, timerStage } from "../utils/timerData.js";

const RESYNC_INTERVAL_MS = 30_000; // 클라이언트 시계 오차 누적 방지용 주기 재동기화

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage;
}

export default function useTimerController() {
  const [requestSequence, setRequestSequence] = useState(0);
  const [state, setState] = useState({
    status: "loading", // loading | success | empty | error
    contest: null,
    error: "",
  });
  const lastBoundaryRef = useRef(null);
  const active = useRef(false);
  const requestId = useRef(0);
  const controller = useRef(null);

  const load = useCallback(async () => {
    if (!active.current) return;
    const sequence = ++requestId.current;
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setState((current) => ({ ...current, status: "loading", error: "" }));

    try {
      const response = await getTimer({ signal: request.signal, timeout: 10000 });
      if (!active.current || request.signal.aborted || sequence !== requestId.current) return;
      const envelope = response.data;

      if (!isSuccess(envelope)) {
        throw new Error(envelope?.message || "타이머 정보를 불러오지 못했습니다");
      }

      if (!envelope.data) {
        setState({ status: "empty", contest: null, error: "" });
        return;
      }

      setState({
        status: "success",
        contest: adaptTimer(envelope.data),
        error: "",
      });
    } catch (error) {
      if (!active.current || request.signal.aborted || sequence !== requestId.current) return;
      // 현장 화면에 띄워 둔 타이머가 잠깐의 재동기화 실패로 사라지지 않게 받아 둔 시각은 그대로 쓴다
      setState((current) => ({
        status: current.contest ? "success" : "error",
        contest: current.contest,
        error: getErrorMessage(error, "타이머 정보를 불러오지 못했습니다"),
      }));
    }
  }, []);

  useEffect(() => {
    active.current = true;
    const stopPolling = startVisiblePolling(load, { intervalMs: RESYNC_INTERVAL_MS });
    return () => {
      stopPolling();
      active.current = false;
      requestId.current++;
      controller.current?.abort();
    };
  }, [load, requestSequence]);

  const retry = useCallback(() => {
    setRequestSequence((sequence) => sequence + 1);
  }, []);

  // 남은 초가 바뀌는 순간에 맞춰 화면을 갱신하고, 별도로 일정 주기마다 서버와 다시 동기화한다
  const contest = state.contest;
  const now = useCountdownClock(
    [Date.parse(contest?.startTime), Date.parse(contest?.endTime)],
    timerOffset(contest),
    Boolean(contest),
  );
  const { stage, secondsLeft } = timerStage(contest, now);

  // 시작이나 종료 시각을 넘겨 서버가 알려 준 단계와 화면 단계가 달라지면 한 번만 다시 불러온다
  useEffect(() => {
    const served = { BEFORE: "before", RUNNING: "running", ENDED: "ended" }[String(contest?.status ?? "").toUpperCase()];
    const boundary = contest && stage && served && stage !== served ? `${contest.status}:${stage}` : null;
    if (boundary && state.status === "success" && !document.hidden && lastBoundaryRef.current !== boundary) {
      // 서버가 같은 단계를 계속 알려 줘도 다시 불러오기를 반복하지 않는다
      lastBoundaryRef.current = boundary;
      load();
    }
  }, [contest, stage, state.status, load]);

  return {
    status: state.status,
    contest,
    error: state.error,
    isSynced: contest?.serverTime != null,
    stage,
    secondsLeft,
    retry,
  };
}

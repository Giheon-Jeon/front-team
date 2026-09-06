import { useCallback, useEffect, useRef, useState } from "react";
import {
  getKothClubs,
  getKothTeamToken,
  getMyKothProgress,
} from "../../../api/koth.js";
import { isSuccess } from "../../../utils/response.js";

const AUTO_REFRESH_INTERVAL_MS = 30_000;

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage;
}

// 클럽 1개 = 문제 1개(6클럽 x 1문제, 중첩 challenges[] 아님) - kothChallengeState.js
// 참고. club.challenges 존재를 요구하던 이전 검증은 실제 응답과 안 맞아서 제거함.
function validateKothData(clubsData, progressData) {
  return Array.isArray(clubsData?.clubs)
    && clubsData.clubs.every((club) => club?.koth_challenge_id != null)
    && Array.isArray(progressData?.challenges);
}

export function useKothData() {
  const [requestSequence, setRequestSequence] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    clubsData: null,
    progressData: null,
    error: "",
  });
  const isMountedRef = useRef(true);

  const loadKothData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setState((current) => ({ ...current, status: "loading", error: "" }));
    }

    try {
      const [clubsResponse, progressResponse] = await Promise.all([
        getKothClubs(),
        getMyKothProgress(),
      ]);
      const clubsEnvelope = clubsResponse.data;
      const progressEnvelope = progressResponse.data;

      if (!isSuccess(clubsEnvelope)) {
        throw new Error(clubsEnvelope?.message || "KOTH 문제를 불러오지 못했습니다.");
      }
      if (!isSuccess(progressEnvelope)) {
        throw new Error(progressEnvelope?.message || "내 KOTH 진행 상태를 불러오지 못했습니다.");
      }
      if (!validateKothData(clubsEnvelope.data, progressEnvelope.data)) {
        throw new Error("KOTH API 응답 형식이 올바르지 않습니다.");
      }

      if (isMountedRef.current) {
        setState({
          status: "success",
          clubsData: clubsEnvelope.data,
          progressData: progressEnvelope.data,
          error: "",
        });
      }
    } catch (error) {
      // 백그라운드(silent) 재조회 실패로 화면을 error 상태로 덮지 않는다 -
      // 다음 30초 주기에 다시 시도한다. 최초 로드 실패만 화면에 표시.
      if (isMountedRef.current && !silent) {
        setState({
          status: "error",
          clubsData: null,
          progressData: null,
          error: getErrorMessage(error, "KOTH 정보를 불러오지 못했습니다."),
        });
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadKothData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadKothData, requestSequence]);

  // 점수/공개 상태(status, current_owner, current_score 등)는 다른 팀의 풀이로
  // 계속 바뀔 수 있어 30초마다 조용히(로딩 표시 없이) 재조회한다.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadKothData({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [loadKothData]);

  const retry = useCallback(() => {
    setRequestSequence((sequence) => sequence + 1);
  }, []);

  return { ...state, retry };
}

export function useKothTeamToken() {
  const requestSequence = useRef(0);
  const [state, setState] = useState({
    status: "idle",
    data: null,
    error: "",
  });

  const requestTeamToken = useCallback(async () => {
    const currentRequest = requestSequence.current + 1;
    requestSequence.current = currentRequest;
    setState({ status: "loading", data: null, error: "" });

    try {
      const response = await getKothTeamToken();
      const envelope = response.data;
      if (!isSuccess(envelope)) {
        throw new Error(envelope?.message || "KOTH 팀 토큰을 불러오지 못했습니다.");
      }
      if (!envelope.data?.team_token?.trim()) {
        throw new Error("KOTH 팀 토큰 응답 형식이 올바르지 않습니다.");
      }

      if (requestSequence.current === currentRequest) {
        setState({ status: "success", data: envelope.data, error: "" });
      }
    } catch (error) {
      if (requestSequence.current === currentRequest) {
        setState({
          status: "error",
          data: null,
          error: getErrorMessage(error, "KOTH 팀 토큰을 불러오지 못했습니다."),
        });
      }
    }
  }, []);

  const clearTeamToken = useCallback(() => {
    requestSequence.current += 1;
    setState({ status: "idle", data: null, error: "" });
  }, []);

  return { ...state, requestTeamToken, clearTeamToken };
}

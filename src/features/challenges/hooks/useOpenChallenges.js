import { useCallback, useEffect, useState } from "react";
import { getOpenedChallenges } from "../../../api/board.js";
import { getMyInstances } from "../../../api/instances.js";
import { adaptOpenedChallenges } from "../../board/utils/boardData.js";
import { isSuccess } from "../../../utils/response.js";
import { mapChallengeInstance } from "../utils/challengeDetailMapper.js";

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage;
}

// 열린 문제 목록 페이지 - README.md "10. 열린 문제 목록 페이지".
// 전용 API가 없어 GET /board/opened_challenges + GET /teams/me/instances
// 조합으로 만든다(README에 확정된 방식).
export default function useOpenChallenges() {
  const [requestSequence, setRequestSequence] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    challenges: [],
    totalCount: 0,
    solvedCount: 0,
    totalScore: 0,
    instance: null,
    error: "",
  });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));

    try {
      const openedResponse = await getOpenedChallenges();
      const openedEnvelope = openedResponse.data;

      if (!isSuccess(openedEnvelope)) {
        throw new Error(openedEnvelope?.message || "열린 문제 목록을 불러오지 못했습니다.");
      }

      const challenges = adaptOpenedChallenges(openedEnvelope.data);

      // 현재 인스턴스 표시는 보조 정보라, 이게 실패해도(백엔드 상태에 따라
      // 아직 없을 수 있음) 열린 문제 목록 자체는 정상 표시되게 한다.
      let instance = null;
      try {
        const instanceResponse = await getMyInstances();
        const instanceEnvelope = instanceResponse.data;
        instance = isSuccess(instanceEnvelope) ? mapChallengeInstance(instanceEnvelope.data) : null;
      } catch {
        instance = null;
      }

      setState({
        status: "success",
        challenges,
        totalCount: openedEnvelope.data?.total_count ?? challenges.length,
        solvedCount: openedEnvelope.data?.solved_count ?? 0,
        totalScore: openedEnvelope.data?.total_score ?? 0,
        instance,
        error: "",
      });
    } catch (error) {
      setState({
        status: "error",
        challenges: [],
        totalCount: 0,
        solvedCount: 0,
        totalScore: 0,
        instance: null,
        error: getErrorMessage(error, "열린 문제 목록을 불러오지 못했습니다."),
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load, requestSequence]);

  const retry = useCallback(() => setRequestSequence((sequence) => sequence + 1), []);

  return { ...state, retry };
}

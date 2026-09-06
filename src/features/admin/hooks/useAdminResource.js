import { useCallback, useEffect, useState } from "react";
import { isSuccess } from "../../../utils/response.js";

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage;
}

// 관리자 페이지 6개가 전부 "GET 호출 -> envelope 검증 -> data 저장" 패턴을
// 반복하길래 공통 훅으로 뺐다. fetcher는 axios 응답(response.data가 envelope)을
// 반환하는 함수, deps가 바뀌면 다시 불러온다.
export default function useAdminResource(fetcher, deps, fallbackMessage) {
  const [requestSequence, setRequestSequence] = useState(0);
  const [state, setState] = useState({ status: "loading", data: null, error: "" });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const response = await fetcher();
      const envelope = response.data;
      if (!isSuccess(envelope)) {
        throw new Error(envelope?.message || fallbackMessage);
      }
      setState({ status: "success", data: envelope.data, error: "" });
    } catch (error) {
      setState({ status: "error", data: null, error: getErrorMessage(error, fallbackMessage) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, requestSequence]);

  const retry = useCallback(() => setRequestSequence((sequence) => sequence + 1), []);

  return { ...state, retry, reload: load };
}

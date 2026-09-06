import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { logout } from "../../../api/auth.js";
import {
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  ROLE_STORAGE_KEY,
} from "../../../api/client.js";
import { getMyMileageHistory, getMyProfile } from "../../../api/mypage.js";
import { ROUTES } from "../../../routes/routePaths.js";
import { isSuccess } from "../../../utils/response.js";
import MyPageScreen from "../components/MyPageScreen.jsx";
import { PREVIEW_MY_PAGE_DATA } from "../data/previewMyPageData.js";
import { mapMileageHistory, mapTeamProfile } from "../utils/myPageData.js";

const LOADING_STATE = Object.freeze({ status: "loading", data: null });
const SOLVE_HISTORY_API_READY_STATE = Object.freeze({
  status: "unavailable",
  data: [],
});

function resolveResponse(settledResult, mapData, isEmpty) {
  if (settledResult.status === "rejected") {
    return { status: "error", data: null };
  }

  const envelope = settledResult.value?.data;
  if (!isSuccess(envelope)) {
    return { status: "error", data: null };
  }

  if (isEmpty(envelope.data)) {
    return { status: "empty", data: null };
  }

  return { status: "success", data: mapData(envelope.data) };
}

export default function MyPage() {
  const navigate = useNavigate();
  const logoutInFlightRef = useRef(false);
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "mypage";
  const previewState = useMemo(
    () => ({
      profile: { status: "success", data: PREVIEW_MY_PAGE_DATA.profile },
      mileageHistory: {
        status: "success",
        data: PREVIEW_MY_PAGE_DATA.mileageHistory,
      },
      solveHistory: {
        status: "success",
        data: PREVIEW_MY_PAGE_DATA.solveHistory,
      },
    }),
    [],
  );
  const [apiState, setApiState] = useState({
    profile: LOADING_STATE,
    mileageHistory: LOADING_STATE,
  });
  const [logoutState, setLogoutState] = useState({
    isSubmitting: false,
    error: "",
  });

  const clearStoredAuth = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  };

  const handleLogout = async () => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;

    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    setLogoutState({ isSubmitting: true, error: "" });

    if (!refreshToken) {
      clearStoredAuth();
      navigate(ROUTES.login, { replace: true });
      return;
    }

    try {
      const response = await logout({ refreshToken });
      const envelope = response.data;

      if (!isSuccess(envelope)) {
        logoutInFlightRef.current = false;
        setLogoutState({
          isSubmitting: false,
          error: envelope?.message || "로그아웃에 실패했습니다.",
        });
        return;
      }

      clearStoredAuth();
      navigate(ROUTES.login, { replace: true });
    } catch (error) {
      logoutInFlightRef.current = false;
      setLogoutState({
        isSubmitting: false,
        error: error?.response?.data?.message || "로그아웃 요청에 실패했습니다.",
      });
    }
  };

  useEffect(() => {
    if (isPreview) return undefined;

    const controller = new AbortController();
    let active = true;

    setApiState({
      profile: LOADING_STATE,
      mileageHistory: LOADING_STATE,
    });

    Promise.allSettled([
      getMyProfile({ signal: controller.signal }),
      getMyMileageHistory({ signal: controller.signal }),
    ]).then(([profileResult, mileageHistoryResult]) => {
      if (!active) return;

      setApiState({
        profile: resolveResponse(
          profileResult,
          mapTeamProfile,
          (data) => data == null,
        ),
        mileageHistory: resolveResponse(
          mileageHistoryResult,
          mapMileageHistory,
          (data) => !data || !Array.isArray(data.history) || data.history.length === 0,
        ),
      });
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isPreview]);

  const viewState = isPreview
    ? previewState
    : {
        ...apiState,
        solveHistory: SOLVE_HISTORY_API_READY_STATE,
      };

  return (
    <MyPageScreen
      {...viewState}
      onLogout={handleLogout}
      isLoggingOut={logoutState.isSubmitting}
      logoutError={logoutState.error}
    />
  );
}

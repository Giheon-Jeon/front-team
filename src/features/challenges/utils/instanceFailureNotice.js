export function getInstanceFailureNotice(instance) {
  if (instance?.status !== "FAILED") return null;
  const reset = Boolean(instance.replacedInstanceId);
  if (instance.deleteReason === "TTL_EXPIRED") {
    return {
      title: reset ? "초기화 중 사용 시간이 만료됐습니다" : "생성 중 사용 시간이 만료됐습니다",
      message: "새 인스턴스를 생성해 주세요",
    };
  }
  if (instance.deleteReason === "HARD_TIMEOUT") {
    return {
      title: "최대 사용 시간이 만료됐습니다",
      message: "새 인스턴스를 생성해 주세요",
    };
  }
  return {
    title: reset ? "초기화를 완료하지 못했습니다" : "인스턴스를 생성하지 못했습니다",
    message: "새로 생성한 뒤에도 실패하면 운영진에게 문의해 주세요",
  };
}

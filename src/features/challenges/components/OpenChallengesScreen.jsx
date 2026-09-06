import { formatRemaining } from "../../../utils/time.js";

// TODO(open-challenges): 다른 페이지와 달리 이 페이지는 참고할 Figma 시안이
// 없어(README "10. 열린 문제 목록 페이지" 문서엔 전용 화면이 없고 API 조합만
// 확정돼있음) 기능 우선으로 만들었다. 시안이 나오면 이 컴포넌트만 교체하면
// 되도록 훅(useOpenChallenges)과 분리해뒀다.

function InstancePanel({ instance }) {
  if (!instance) return null;

  return (
    <section className="mb-8 rounded-lg border border-[#4a3a24] bg-[#241a10] p-4">
      <h2 className="m-0 mb-2 text-sm font-bold text-[#f8d48b]">현재 인스턴스</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="opacity-70">상태</dt>
        <dd>{instance.status}</dd>
        <dt className="opacity-70">접속 주소</dt>
        <dd>{instance.connectUrl || "-"}</dd>
        <dt className="opacity-70">남은 시간</dt>
        <dd>{formatRemaining(instance.remainingSeconds)}</dd>
      </dl>
    </section>
  );
}

export default function OpenChallengesScreen({
  status,
  error,
  challenges,
  totalCount,
  solvedCount,
  totalScore,
  instance,
  onRetry,
  onSelectChallenge,
}) {
  return (
    <main className="min-h-screen bg-[#1c1207] px-6 py-10 text-[#fff0c4]">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold">열린 문제 목록</h1>
        <p className="mb-6 text-sm opacity-70">
          {solvedCount}/{totalCount} 해결 / 획득 점수 {totalScore}
        </p>

        {status === "loading" && <p>불러오는 중입니다...</p>}

        {status === "error" && (
          <div className="flex flex-col items-start gap-3">
            <p role="alert">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded border border-[#c89252] bg-[#6d391c] px-4 py-2"
            >
              다시 시도
            </button>
          </div>
        )}

        {status === "success" && (
          <>
            <InstancePanel instance={instance} />

            {challenges.length === 0 ? (
              <p className="opacity-70">아직 오픈한 문제가 없습니다. 보드에서 칸을 열어보세요.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {challenges.map((challenge) => (
                  <li key={challenge.challengeId}>
                    <button
                      type="button"
                      onClick={() => onSelectChallenge(challenge.challengeId)}
                      className="flex w-full items-center justify-between gap-4 rounded-lg border border-[#4a3a24] bg-[#241a10] px-4 py-3 text-left hover:brightness-110"
                    >
                      <span className="min-w-0">
                        <strong className="block truncate">{challenge.title}</strong>
                        <span className="block text-xs opacity-70">
                          {[challenge.category, challenge.clubName].filter(Boolean).join(" / ")}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className="font-bold text-[#e8b957]">{challenge.score} P</span>
                        {challenge.isSolved && (
                          <span className="rounded-full border border-[#6c8e4a] px-2 py-0.5 text-xs text-[#9fd17a]">
                            SOLVED
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}

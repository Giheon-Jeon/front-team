// 대회 시작 카운트다운 화면의 계산 화면과 떼어 두고 테스트한다

// 마지막 셈을 시작하는 초와 0초 뒤 시작 연출 길이
export const FINAL_SECONDS = 10;
export const FINALE_MS = 2600;

// 남은 초로 단계를 정한다 그 시각을 모르면 기다림, 10초부터 1초까지 마지막 셈, 0초면 마무리 연출
export function countdownPhase(secondsLeft) {
  if (!Number.isFinite(secondsLeft)) return "waiting";
  if (secondsLeft <= 0) return "finale";
  return secondsLeft <= FINAL_SECONDS ? "final" : "waiting";
}

// 홍보 페이지 STARTS IN 처럼 일, 시, 분, 초 칸으로 나눈다 하루가 안 남으면 일 칸을 뺀다
export function clockParts(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return [];
  const whole = Math.floor(seconds);
  const days = Math.floor(whole / 86400);
  const parts = [
    ["hours", Math.floor((whole % 86400) / 3600)],
    ["minutes", Math.floor((whole % 3600) / 60)],
    ["seconds", whole % 60],
  ];
  return (days > 0 ? [["days", days], ...parts] : parts)
    .map(([unit, value]) => ({ unit, label: unit.toUpperCase(), value: String(value).padStart(2, "0") }));
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" });
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "numeric", minute: "numeric", hourCycle: "h23" });

// 시각을 홍보 페이지 날짜 줄처럼 "10월 25일 일요일" 과 "오후 5시 54분 시작" 으로 나눈다 뒤에 붙는 말은 시작이나 종료
export function momentLabels(iso, suffix = "시작") {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return null;
  const [hour, minute] = timeFormat.format(date).split(":").map(Number);
  const meridiem = hour % 24 < 12 ? "오전" : "오후";
  const clock = `${meridiem} ${hour % 12 || 12}시${minute ? ` ${minute}분` : ""}`;
  return { date: dateFormat.format(date), time: `${clock} ${suffix}` };
}

// 단풍잎 위치는 회차마다 같게 나와야 테스트와 화면이 흔들리지 않는다 씨앗값으로 만드는 작은 난수
function random(seed) {
  let value = (seed * 2654435761) >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(value ^ (value >>> 15), value | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export const LEAF_COLORS = ["#d9662b", "#e8913a", "#c4472b", "#f0b44a", "#b9552e", "#e07a35"];

const between = (next, min, max) => min + next() * (max - min);

// 시작하는 순간 로고 가운데에서 사방으로 흩어지는 잎
export function burstLeaves(seed, count = 36) {
  const next = random(seed + 97);
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + between(next, -0.18, 0.18);
    const reach = between(next, 40, 78);
    return {
      id: `burst-${seed}-${index}`,
      dx: Math.cos(angle) * reach,
      dy: Math.sin(angle) * reach * 0.72 + between(next, 4, 16),
      turn: between(next, 360, 980) * (next() < 0.5 ? -1 : 1),
      size: Math.round(between(next, 24, 44)),
      delay: Math.round(between(next, 0, 240)),
      duration: Math.round(between(next, 1800, 2600)),
      color: LEAF_COLORS[index % LEAF_COLORS.length],
    };
  });
}

// 기다리는 동안 화면 위에서 천천히 내려오는 잎
export function ambientLeaves(count = 9) {
  const next = random(5);
  return Array.from({ length: count }, (_, index) => ({
    id: `ambient-${index}`,
    x: between(next, 4, 96),
    drift: between(next, -14, 14),
    turn: between(next, 260, 560) * (next() < 0.5 ? -1 : 1),
    size: Math.round(between(next, 10, 17)),
    delay: -Math.round(between(next, 0, 16000)),
    duration: Math.round(between(next, 13000, 21000)),
    color: LEAF_COLORS[index % LEAF_COLORS.length],
  }));
}

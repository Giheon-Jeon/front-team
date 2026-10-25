// 보드에 처음 들어올 때만 보이는 연출 표시 새 로그인 세션이나 대회 시작 카운트다운에서 켠다
// 판이 생기는 연출은 한 번 보면 끄고, 주사위 안내는 첫 주사위 굴림에서 끈다
export const DICE_INTRO_KEY = "board.diceIntroPending";
export const ASSEMBLY_KEY = "board.assemblePending";
// 카운트다운에서 들어오면 시작 연출의 막이 걷히는 동안 기다렸다가 판을 세운다
const COUNTDOWN_HOLD_MS = 1800;

// source: login 은 로그인 직후, countdown 은 대회 시작 카운트다운 뒤
export function markBoardIntro(source = "login") {
  try {
    sessionStorage.setItem(DICE_INTRO_KEY, "1");
    sessionStorage.setItem(ASSEMBLY_KEY, source);
  } catch { /* 저장할 수 없으면 연출과 안내만 생략한다 */ }
}

export function isAssemblyPending() {
  try { return Boolean(sessionStorage.getItem(ASSEMBLY_KEY)); } catch { return false; }
}

export function assemblyHoldMs() {
  try { return sessionStorage.getItem(ASSEMBLY_KEY) === "countdown" ? COUNTDOWN_HOLD_MS : 0; } catch { return 0; }
}

export function clearAssemblyPending() {
  try { sessionStorage.removeItem(ASSEMBLY_KEY); } catch { /* 저장할 수 없으면 현재 화면에서만 끈다 */ }
}

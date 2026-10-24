"""README용 시스템 아키텍처 이미지를 그린다. 사용법: python scripts/render-architecture.py (결과: docs/readme/architecture.png)"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "readme" / "architecture.png"
FONTS = Path("C:/Windows/Fonts")
S = 2
bold = lambda n: ImageFont.truetype(str(FONTS / "malgunbd.ttf"), n * S)
reg = lambda n: ImageFont.truetype(str(FONTS / "malgun.ttf"), n * S)
W, H = 1700, 900
img = Image.new("RGB", (W * S, H * S), "#fbfaf7")
d = ImageDraw.Draw(img)
s = lambda v: int(v * S)

d.text((s(50), s(30)), "MSG CTF 시스템 아키텍처", font=bold(30), fill="#2b2118")


def box(x, y, w, h, title, lines, color, fill):
    d.rounded_rectangle((s(x), s(y), s(x + w), s(y + h)), radius=s(12), fill=fill, outline=color, width=s(3))
    d.text((s(x + 18), s(y + 12)), title, font=bold(19), fill=color)
    for i, line in enumerate(lines):
        d.text((s(x + 18), s(y + 46 + i * 24)), line, font=reg(15), fill="#3a2e22")


def arrow(a, b, label="", color="#6b5b4a", dy=-22):
    d.line([(s(a[0]), s(a[1])), (s(b[0]), s(b[1]))], fill=color, width=s(3))
    ax, ay = b
    dx = 1 if b[0] > a[0] else -1 if b[0] < a[0] else 0
    dyy = 1 if b[1] > a[1] else -1 if b[1] < a[1] else 0
    d.polygon([(s(ax), s(ay)), (s(ax - dx * 14 - dyy * 8), s(ay - dyy * 14 + dx * 8)),
               (s(ax - dx * 14 + dyy * 8), s(ay - dyy * 14 - dx * 8))], fill=color)
    if label:
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + dy
        tw = d.textlength(label, font=reg(14)) / S
        d.text((s(mx - tw / 2), s(my)), label, font=reg(14), fill=color)


box(50, 330, 260, 150, "참가자 · 운영자", ["웹 브라우저", "데스크톱 · 모바일", "관리자는 노트북 한 화면"], "#2f6fb5", "#e8f1fb")
box(400, 300, 330, 210, "프론트엔드 컨테이너", ["NGINX + React SPA (Vite 빌드)", "보안 헤더, SPA 새로고침 폴백", "/api, /healthz, 런타임 비밀값", "조회 경로를 백엔드로 프록시"], "#009639", "#e3f5e9")
box(830, 300, 330, 210, "백엔드 API", ["msg-backend (Django REST)", "JWT 인증, 팀장 권한, 밴 처리", "보드·문제·KoTH·시그니처·결제", "관리자 API, 점수 15분 구간 수집"], "#c05621", "#fdeedd")
box(1260, 120, 390, 130, "데이터 저장소", ["팀·계정·보드 상태·풀이·마일리지", "KoTH 구간 점수, 이벤트 로그, 스냅샷"], "#6b46c1", "#f0e9fb")
box(1260, 330, 390, 150, "스케줄러 · 브로커", ["인스턴스 생성·재시작·연장·종료", "노드 후보 선택, 자원 예약 원장", "여러 클라우드 계정의 노드 사용"], "#6b46c1", "#f0e9fb")
box(1260, 560, 390, 130, "문제 실행 노드", ["Docker 컨테이너 인스턴스", "참가자 접속 host:port 발급"], "#4a5568", "#edf0f4")
box(830, 600, 330, 130, "KoTH 문제 서버", ["동아리별 6개 서버", "팀 토큰 검증, 15분 순위 제공"], "#0f766e", "#e2f4f2")
box(400, 600, 330, 130, "문제 저장소 (GitHub)", ["MSG-CTF/2026_MSG_CTF", "info.yaml, env, prob/for_user"], "#2b2118", "#f1ece4")
box(400, 90, 330, 130, "CI / CD", ["GitHub Actions: 테스트·보안 스캔", "이미지 빌드 후 개발 VM 배포"], "#2088ff", "#e4f0ff")

arrow((310, 405), (400, 405), "HTTPS")
arrow((730, 405), (830, 405), "/api/v1")
arrow((1160, 360), (1260, 200), "", dy=0)
arrow((1160, 405), (1260, 405), "내부 토큰")
arrow((1455, 480), (1455, 560), "")
arrow((960, 510), (960, 600), "")
arrow((1030, 600), (1030, 510), "")
d.text((s(1045), s(545)), "구간 점수 수집 · 토큰 검증", font=reg(14), fill="#6b5b4a")
arrow((565, 600), (565, 510), "")
d.text((s(580), s(545)), "발행본 가져오기", font=reg(14), fill="#6b5b4a")
arrow((565, 220), (565, 300), "")
d.text((s(580), s(250)), "배포", font=reg(14), fill="#6b5b4a")
d.text((s(50), s(840)), "참가자는 팀 토큰으로 KoTH 문제 서버에 직접 접속하고, 문제 서버는 플랫폼의 내부 API로 토큰을 검증합니다.",
       font=reg(15), fill="#6b5b4a")
img.save(OUT, optimize=True)
print(OUT, img.size)

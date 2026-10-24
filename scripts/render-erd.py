"""README용 ERD 이미지를 그린다.

출처는 AGENT.md의 API 명세와 mock-backend/api/models.py 이며, 실제 DB 스키마를 덤프한 것이 아니라
화면이 쓰는 데이터를 기준으로 정리한 논리 ERD다.

사용법: python scripts/render-erd.py   (결과: docs/readme/erd.png)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "readme" / "erd.png"
FONTS = Path("C:/Windows/Fonts")
SCALE = 2

F_HEAD = ImageFont.truetype(str(FONTS / "malgunbd.ttf"), 17 * SCALE)
F_BODY = ImageFont.truetype(str(FONTS / "consola.ttf"), 14 * SCALE)
F_BODY_B = ImageFont.truetype(str(FONTS / "consolab.ttf"), 14 * SCALE)
F_TITLE = ImageFont.truetype(str(FONTS / "malgunbd.ttf"), 30 * SCALE)
F_SUB = ImageFont.truetype(str(FONTS / "malgun.ttf"), 15 * SCALE)
F_GROUP = ImageFont.truetype(str(FONTS / "malgunbd.ttf"), 19 * SCALE)
F_CARD = ImageFont.truetype(str(FONTS / "consolab.ttf"), 15 * SCALE)

GROUPS = {
    "account": ("#2f6fb5", "#e8f1fb", "계정 · 팀"),
    "board": ("#b7791f", "#fdf3df", "보드"),
    "challenge": ("#2f855a", "#e6f5ec", "문제 · 풀이"),
    "runtime": ("#6b46c1", "#f0e9fb", "인스턴스 · 배포"),
    "money": ("#c53030", "#fbe9e9", "마일리지 · 결제"),
    "koth": ("#0f766e", "#e2f4f2", "KoTH · 시그니처"),
    "ops": ("#4a5568", "#edf0f4", "대회 운영"),
}

# (필드, 타입, 표시) 표시: PK / FK / UK
T = {
    "users": ("account", [
        ("user_id", "uuid", "PK"), ("login_id", "varchar", "UK"), ("password_hash", "varchar", ""),
        ("nickname", "varchar", ""), ("role", "PARTICIPANT|ADMIN", ""), ("is_leader", "bool", ""),
        ("team_id", "uuid", "FK"),
    ]),
    "refresh_tokens": ("account", [
        ("token_id", "uuid", "PK"), ("user_id", "uuid", "FK"), ("token_hash", "varchar", ""),
        ("expires_at", "datetime", ""),
    ]),
    "teams": ("account", [
        ("team_id", "uuid", "PK"), ("team_name", "varchar", "UK"), ("jeopardy_score", "int", ""),
        ("koth_score", "int", ""), ("mileage", "int", ""), ("is_banned", "bool", ""),
        ("ban_reason", "varchar", ""), ("banned_at", "datetime", ""), ("banned_by", "varchar", ""),
        ("koth_team_token_hash", "varchar", ""),
    ]),
    "team_snapshots": ("account", [
        ("snapshot_id", "uuid", "PK"), ("team_id", "uuid", "FK"), ("reason", "BAN|MANUAL", ""),
        ("position / dice / cells", "json", ""), ("team_score, mileage", "int", ""),
        ("is_rolled_back", "bool", ""), ("created_by", "varchar", ""),
    ]),
    "board_cells": ("board", [
        ("cell_index", "int 1~36", "PK"), ("type", "START|CHALLENGE|CHANCE|AIRPORT|ROULETTE", ""),
        ("difficulty", "EASY|MEDIUM|HARD", ""), ("name", "varchar", ""),
    ]),
    "team_board_states": ("board", [
        ("team_id", "uuid", "PK"), ("position", "int", "FK"), ("dice_rolls_left", "int 0~3", ""),
        ("next_dice_reset_at", "datetime", ""), ("airport_move_used", "bool", ""),
        ("has_passed_start", "bool", ""), ("board_completed", "bool", ""),
        ("roulette_spun / pending_roll", "...", ""),
    ]),
    "team_cell_status": ("board", [
        ("team_id", "uuid", "PK"), ("cell_index", "int", "PK"),
        ("status", "CONSUMED|OPENED|CLEARED", ""),
    ]),
    "chance_card_catalog": ("board", [
        ("card_id", "varchar", "PK"), ("name", "varchar", ""), ("effect", "varchar", ""),
        ("usage_timing", "PRE_ROLL|POST_ROLL", ""),
    ]),
    "team_chance_cards": ("board", [
        ("id", "uuid", "PK"), ("team_id", "uuid", "FK"), ("card_id", "varchar", "FK"),
        ("used", "bool", ""), ("discarded", "bool", ""),
    ]),
    "challenges": ("challenge", [
        ("challenge_id", "uuid", "PK"), ("title", "varchar", ""), ("category", "enum", ""),
        ("difficulty", "EASY|MEDIUM|HARD", ""), ("club_name", "varchar", ""),
        ("score / current_score", "int", ""), ("description", "text", ""),
        ("flag_hash", "varchar", ""), ("is_published", "bool", ""),
    ]),
    "challenge_files": ("challenge", [
        ("file_id", "uuid", "PK"), ("challenge_id", "uuid", "FK"), ("file_name", "varchar", ""),
        ("download_url", "url", ""), ("file_size", "int", ""),
    ]),
    "team_challenge_accesses": ("challenge", [
        ("team_id", "uuid", "PK"), ("challenge_id", "uuid", "PK"), ("cell_index", "int", "FK"),
        ("opened_at", "datetime", ""), ("solve_deadline_at", "datetime", ""),
        ("status", "OPENED|SOLVED", ""),
    ]),
    "solves": ("challenge", [
        ("solve_id", "uuid", "PK"), ("team_id", "uuid", "FK"), ("challenge_id", "uuid", "FK"),
        ("solved_by_user_id", "uuid", "FK"), ("earned_score", "int", ""),
        ("earned_mileage", "int", ""), ("is_extra_dice_granted", "bool", ""), ("solved_at", "datetime", ""),
    ]),
    "flag_attempts": ("challenge", [
        ("team_id", "uuid", "PK"), ("challenge_id", "uuid", "PK"), ("wrong_count", "int", ""),
        ("locked_until", "datetime", ""),
    ]),
    "challenge_releases": ("runtime", [
        ("release_id", "uuid", "PK"), ("challenge_id", "uuid", "FK"), ("source", "GITHUB|PLATFORM", ""),
        ("image / containers / ports", "json", ""), ("ttl, hard_timeout", "int", ""),
        ("is_active", "bool", ""), ("env_complete", "bool", ""),
    ]),
    "runtime_secrets": ("runtime", [
        ("secret_id", "uuid", "PK"), ("challenge_id", "uuid", "FK"), ("name", "varchar", ""),
        ("version", "int", ""),
    ]),
    "instances": ("runtime", [
        ("instance_id", "uuid", "PK"), ("user_id", "uuid", "FK"), ("team_id", "uuid", "FK"),
        ("challenge_id", "uuid", "FK"), ("release_id", "uuid", "FK"), ("status", "12 states", ""),
        ("host / ports", "json", ""), ("expires_at", "datetime", ""), ("hard_expires_at", "datetime", ""),
        ("replaced_instance_id", "uuid", ""),
    ]),
    "mileage_history": ("money", [
        ("history_id", "uuid", "PK"), ("team_id", "uuid", "FK"), ("type", "8 types", ""),
        ("amount", "int (+/-)", ""), ("reason", "varchar", ""), ("item_name", "varchar", ""),
        ("is_refunded", "bool", ""), ("ref_history_id", "uuid", "FK"), ("created_at", "datetime", ""),
    ]),
    "payment_tokens": ("money", [
        ("payment_token", "varchar", "PK"), ("team_id", "uuid", "FK"), ("expires_at", "datetime", ""),
        ("used", "bool", ""),
    ]),
    "payment_history": ("money", [
        ("payment_id", "uuid", "PK"), ("team_id", "uuid", "FK"), ("history_id", "uuid", "FK"),
        ("item_name", "varchar", ""), ("amount", "int", ""), ("processed_by", "varchar", ""),
    ]),
    "koth_clubs": ("koth", [
        ("club_id", "uuid", "PK"), ("name", "varchar", "UK"),
    ]),
    "koth_challenges": ("koth", [
        ("koth_challenge_id", "uuid", "PK"), ("club_id", "uuid", "FK"), ("title", "varchar", ""),
        ("status", "SCHEDULED|ACTIVE|CLOSED", ""), ("open_group", "int", ""),
        ("challenge_url", "url", ""), ("score_api_url", "url", ""), ("opened_at / closed_at", "datetime", ""),
        ("inbound_internal_token_hash", "varchar", ""),
    ]),
    "koth_solves": ("koth", [
        ("koth_challenge_id", "uuid", "PK"), ("team_id", "uuid", "PK"), ("earned_score", "int", ""),
        ("solved_at", "datetime", ""),
    ]),
    "koth_score_periods": ("koth", [
        ("koth_challenge_id", "uuid", "PK"), ("period_id", "datetime", "PK"),
        ("status", "PENDING|APPLIED|FAILED", ""), ("attempts", "int", ""),
        ("response_payload", "json", ""), ("last_error", "text", ""), ("applied_at", "datetime", ""),
    ]),
    "signatures": ("koth", [
        ("signature_id", "uuid", "PK"), ("club_id", "uuid", "FK"), ("title", "varchar", ""),
        ("description", "text", ""), ("flag_hash", "varchar", ""), ("score", "int", ""),
        ("is_published", "bool", ""),
    ]),
    "signature_solves": ("koth", [
        ("signature_id", "uuid", "PK"), ("team_id", "uuid", "PK"), ("earned_score", "int", ""),
        ("solved_at", "datetime", ""),
    ]),
    "contests": ("ops", [
        ("contest_id", "uuid", "PK"), ("name", "varchar", ""), ("start_time", "datetime", ""),
        ("end_time", "datetime", ""),
    ]),
    "admin_settings": ("ops", [
        ("dice_rolls_per_reset", "int", ""), ("dice_reset_interval_minutes", "int", ""),
        ("solve_deadline_minutes", "int", ""), ("max_attempts", "int", ""), ("lock_seconds", "int", ""),
        ("updated_by", "varchar", ""),
    ]),
    "admin_events": ("ops", [
        ("event_id", "uuid", "PK"), ("type", "11 types", ""), ("severity", "4 levels", ""),
        ("message", "varchar", ""), ("team_id", "uuid", "FK"), ("actor", "varchar", ""),
        ("created_at", "datetime", ""),
    ]),
    "idempotency_keys": ("ops", [
        ("key", "varchar", "PK"), ("scope", "enum", ""), ("user_id", "uuid", "FK"),
        ("response_payload", "json", ""),
    ]),
}

COL_X = [70, 590, 1110, 1630, 2150, 2670]
BOX_W = 460
GAP_Y = 50
LAYOUT = [
    ["koth_clubs", "koth_challenges", "koth_solves", "koth_score_periods", "signatures", "signature_solves"],
    ["mileage_history", "payment_history", "payment_tokens", "team_snapshots", "admin_events", "idempotency_keys"],
    ["teams", "users", "refresh_tokens", "contests", "admin_settings"],
    ["board_cells", "team_board_states", "team_cell_status", "team_chance_cards", "chance_card_catalog"],
    ["challenges", "challenge_files", "team_challenge_accesses", "solves", "flag_attempts"],
    ["instances", "challenge_releases", "runtime_secrets"],
]
TOP = 230
ROW_H = 27
HEAD_H = 44

# (자식, 자식 FK 필드, 부모, 부모 키 필드, 관계 라벨)
RELATIONS = [
    ("users", "team_id", "teams", "team_id", "N:1"),
    ("refresh_tokens", "user_id", "users", "user_id", "N:1"),
    ("team_snapshots", "team_id", "teams", "team_id", "N:1"),
    ("team_board_states", "team_id", "teams", "team_id", "1:1"),
    ("team_board_states", "position", "board_cells", "cell_index", "N:1"),
    ("team_cell_status", "cell_index", "board_cells", "cell_index", "N:1"),
    ("team_chance_cards", "team_id", "teams", "team_id", "N:1"),
    ("team_chance_cards", "card_id", "chance_card_catalog", "card_id", "N:1"),
    ("team_challenge_accesses", "cell_index", "board_cells", "cell_index", "N:1"),
    ("team_challenge_accesses", "team_id", "teams", "team_id", "N:1"),
    ("team_challenge_accesses", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("challenge_files", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("solves", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("solves", "team_id", "teams", "team_id", "N:1"),
    ("solves", "solved_by_user_id", "users", "user_id", "N:1"),
    ("flag_attempts", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("challenge_releases", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("runtime_secrets", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("instances", "challenge_id", "challenges", "challenge_id", "N:1"),
    ("instances", "release_id", "challenge_releases", "release_id", "N:1"),
    ("instances", "team_id", "teams", "team_id", "N:1"),
    ("mileage_history", "team_id", "teams", "team_id", "N:1"),
    ("payment_history", "team_id", "teams", "team_id", "N:1"),
    ("payment_history", "history_id", "mileage_history", "history_id", "1:1"),
    ("payment_tokens", "team_id", "teams", "team_id", "N:1"),
    ("koth_challenges", "club_id", "koth_clubs", "club_id", "1:1"),
    ("koth_solves", "koth_challenge_id", "koth_challenges", "koth_challenge_id", "N:1"),
    ("koth_solves", "team_id", "teams", "team_id", "N:1"),
    ("koth_score_periods", "koth_challenge_id", "koth_challenges", "koth_challenge_id", "N:1"),
    ("signatures", "club_id", "koth_clubs", "club_id", "N:1"),
    ("signature_solves", "signature_id", "signatures", "signature_id", "N:1"),
    ("signature_solves", "team_id", "teams", "team_id", "N:1"),
    ("admin_events", "team_id", "teams", "team_id", "N:1"),
]


def s(v):
    return int(v * SCALE)


def box_height(name):
    return HEAD_H + ROW_H * len(T[name][1]) + 10


pos = {}
for ci, names in enumerate(LAYOUT):
    y = TOP
    for name in names:
        pos[name] = (COL_X[ci], y, BOX_W, box_height(name))
        y += box_height(name) + GAP_Y

WIDTH = COL_X[-1] + BOX_W + 70
HEIGHT = max(y for (_, y, _, h) in [(0, p[1] + p[3], 0, 0) for p in pos.values()]) + 90

img = Image.new("RGB", (s(WIDTH), s(HEIGHT)), "#fbfaf7")
d = ImageDraw.Draw(img)

d.text((s(70), s(40)), "MSG CTF ERD", font=F_TITLE, fill="#2b2118")
d.text((s(70), s(92)), "API 명세(AGENT.md)와 목 서버 모델을 근거로 정리한 논리 ERD입니다. 실제 DB 스키마와 컬럼 이름이 다를 수 있습니다.",
       font=F_SUB, fill="#6b5b4a")

# 그룹 범례
lx = 70
for key, (stroke, fill, label) in GROUPS.items():
    d.rounded_rectangle((s(lx), s(140), s(lx + 20), s(160)), radius=s(4), fill=fill, outline=stroke, width=s(2))
    d.text((s(lx + 30), s(136)), label, font=F_SUB, fill="#3a2e22")
    lx += 30 + int(d.textlength(label, font=F_SUB) / SCALE) + 40
d.text((s(lx + 10), s(136)), "PK 기본키   FK 외래키   UK 유니크   1:1 / N:1 관계", font=F_SUB, fill="#6b5b4a")


def field_y(name, field):
    x, y, w, h = pos[name]
    for i, (fname, _, _) in enumerate(T[name][1]):
        if fname == field:
            return y + HEAD_H + ROW_H * i + ROW_H / 2
    raise KeyError((name, field))


# 관계선은 박스 뒤에 먼저 그린다
lane = {}
for child, cfield, parent, pfield, card in RELATIONS:
    cx, cy, cw, ch = pos[child]
    px, py, pw, ph = pos[parent]
    stroke = GROUPS[T[child][0]][0]
    y1 = field_y(child, cfield)
    y2 = field_y(parent, pfield)
    if abs(cx - px) < 1:
        # 같은 열: 오른쪽 바깥으로 돌아서 연결
        n = lane.setdefault(("same", cx), 0)
        lane[("same", cx)] = n + 1
        x_out = cx + cw + 14 + n * 7
        pts = [(cx + cw, y1), (x_out, y1), (x_out, y2), (px + pw, y2)]
        c_end, p_end = (cx + cw + 5, y1), (px + pw + 5, y2)
    elif px > cx:
        n = lane.setdefault(("r", cx), 0)
        lane[("r", cx)] = n + 1
        x_mid = cx + cw + 16 + (n % 5) * 8
        pts = [(cx + cw, y1), (x_mid, y1), (x_mid, y2), (px, y2)]
        c_end, p_end = (cx + cw + 6, y1), (px - 6, y2)
    else:
        n = lane.setdefault(("l", cx), 0)
        lane[("l", cx)] = n + 1
        x_mid = cx - 16 - (n % 5) * 8
        pts = [(cx, y1), (x_mid, y1), (x_mid, y2), (px + pw, y2)]
        c_end, p_end = (cx - 6, y1), (px + pw + 6, y2)
    d.line([(s(a), s(b)) for a, b in pts], fill=stroke, width=s(1.6), joint="curve")
    # 끝점 표시: 자식 쪽 N, 부모 쪽 1
    for (ex, ey), label in ((c_end, "N" if card != "1:1" else "1"), (p_end, "1")):
        tw = d.textlength(label, font=F_CARD) / SCALE
        d.rounded_rectangle((s(ex - tw / 2 - 3), s(ey - 11), s(ex + tw / 2 + 3), s(ey + 9)), radius=s(5),
                            fill="#fbfaf7")
        d.text((s(ex - tw / 2), s(ey - 11)), label, font=F_CARD, fill=stroke)

# 엔티티 박스
for name, (group, fields) in T.items():
    x, y, w, h = pos[name]
    stroke, fill, _ = GROUPS[group]
    d.rounded_rectangle((s(x), s(y), s(x + w), s(y + h)), radius=s(10), fill="#ffffff", outline=stroke, width=s(2))
    d.rounded_rectangle((s(x), s(y), s(x + w), s(y + HEAD_H)), radius=s(10), fill=stroke)
    d.rectangle((s(x + 1), s(y + HEAD_H - 12), s(x + w - 1), s(y + HEAD_H)), fill=stroke)
    d.text((s(x + 16), s(y + 9)), name, font=F_HEAD, fill="#ffffff")
    for i, (fname, ftype, mark) in enumerate(fields):
        ry = y + HEAD_H + ROW_H * i
        if i % 2 == 0:
            d.rectangle((s(x + 2), s(ry), s(x + w - 2), s(ry + ROW_H)), fill=fill)
        if mark:
            d.text((s(x + 12), s(ry + 4)), mark, font=F_BODY_B, fill=stroke)
        d.text((s(x + 52), s(ry + 4)), fname, font=F_BODY_B if mark == "PK" else F_BODY, fill="#2b2118")
        tw = d.textlength(ftype, font=F_BODY) / SCALE
        d.text((s(x + w - 12 - tw), s(ry + 4)), ftype, font=F_BODY, fill="#7a6a58")

OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT, optimize=True)
print(OUT, img.size)

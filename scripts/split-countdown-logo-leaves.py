"""Split the ten maple leaves off the event logo for the start countdown.

The countdown drops one logo leaf per second, so the branch art and each leaf
are saved as separate lossless WebP files. Leaves are found by their autumn
colour, their dark veins are filled in, and the edge is widened a little so the
cut follows the anti-aliasing. Stacking the branch and the leaves again must give
back the original artwork exactly.
"""
import colorsys
import json
from collections import deque
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter

root = Path(__file__).resolve().parents[1]
source = root / "public/assets/intro/event-logo.webp"
target = root / "public/assets/countdown"
module = root / "src/features/countdown/utils/logoLeaves.js"
# Logo box used by the countdown in the 1254px source, and the art band above the first rule
BOX = (242, 325, 1012, 896)
ART = (242, 325, 1012, 637)
PAD = 3

with Image.open(source) as opened:
    logo = opened.convert("RGBA")
art = logo.crop(ART)
width, height = art.size
pixels = art.load()

colour = Image.new("L", art.size, 0)
paint = colour.load()
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        if a < 60:
            continue
        _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v > 0.5 and s > 0.45:
            paint[x, y] = 255


def blobs(mask):
    data = mask.load()
    seen = set()
    for y in range(height):
        for x in range(width):
            if data[x, y] and (x, y) not in seen:
                queue, points = deque([(x, y)]), []
                seen.add((x, y))
                while queue:
                    cx, cy = queue.popleft()
                    points.append((cx, cy))
                    for nx in (cx - 1, cx, cx + 1):
                        for ny in (cy - 1, cy, cy + 1):
                            if 0 <= nx < width and 0 <= ny < height and data[nx, ny] and (nx, ny) not in seen:
                                seen.add((nx, ny))
                                queue.append((nx, ny))
                yield points


def leaf_mask(points):
    """Fill the veins inside one leaf and widen its edge."""
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    left, top, right, bottom = min(xs) - PAD, min(ys) - PAD, max(xs) + PAD, max(ys) + PAD
    inside = Image.new("L", art.size, 0)
    fill = inside.load()
    for x, y in points:
        fill[x, y] = 255
    # Anything the outside cannot reach is a hole in the leaf
    outside, queue = set(), deque()
    for x in range(left, right + 1):
        queue.extend([(x, top), (x, bottom)])
    for y in range(top, bottom + 1):
        queue.extend([(left, y), (right, y)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in outside or not (left <= x <= right and top <= y <= bottom) or fill[x, y]:
            continue
        outside.add((x, y))
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            if (x, y) not in outside:
                fill[x, y] = 255
    return inside.filter(ImageFilter.MaxFilter(5))


leaves = [leaf_mask(points) for points in blobs(colour) if len(points) > 300]
assert len(leaves) == 10, len(leaves)

# Two loose leaves blow away first, then the branch empties from its tip toward the trunk
def centre(mask):
    left, top, right, bottom = mask.getbbox()
    return (left + right) / 2, (top + bottom) / 2

def with_stem(mask):
    """A leaf already blowing away takes every pixel joined to it, so its stem does not stay behind."""
    grown, opaque = mask.copy(), art.getchannel("A").load()
    data = grown.load()
    queue = deque((x, y) for y in range(height) for x in range(width) if data[x, y])
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < width and 0 <= ny < height and not data[nx, ny] and opaque[nx, ny] > 0:
                data[nx, ny] = 255
                queue.append((nx, ny))
    return grown


loose = sorted([with_stem(m) for m in leaves if centre(m)[0] > 600 and centre(m)[1] > 160], key=lambda m: centre(m)[1])
branch_leaves = sorted([m for m in leaves if not (centre(m)[0] > 600 and centre(m)[1] > 160)], key=lambda m: -centre(m)[0])
order = loose + branch_leaves
assert len(order) == 10

target.mkdir(parents=True, exist_ok=True)
union = Image.new("L", art.size, 0)
records = []
for index, mask in enumerate(order):
    second = 10 - index
    union = ImageChops.lighter(union, mask)
    box = mask.getbbox()
    piece = Image.new("RGBA", art.size, (0, 0, 0, 0))
    piece.paste(art, (0, 0), mask)
    piece = piece.crop(box)
    name = f"logo-leaf-{second:02d}.webp"
    piece.save(target / name, lossless=True, method=6, exact=True)
    left, top, right, bottom = box
    records.append({
        "second": second,
        "src": f"/assets/countdown/{name}",
        "left": round((left + ART[0] - BOX[0]) / (BOX[2] - BOX[0]) * 100, 4),
        "top": round((top + ART[1] - BOX[1]) / (BOX[3] - BOX[1]) * 100, 4),
        "width": round((right - left) / (BOX[2] - BOX[0]) * 100, 4),
        "height": round((bottom - top) / (BOX[3] - BOX[1]) * 100, 4),
    })

branch = art.copy()
branch.putalpha(ImageChops.subtract(art.getchannel("A"), union))
branch.save(target / "logo-branch.webp", lossless=True, method=6, exact=True)

# The branch with every leaf laid back must equal the original art band, and no pixel may belong to two leaves
with Image.open(target / "logo-branch.webp") as saved:
    alpha = saved.convert("RGBA").getchannel("A")
for record, mask in zip(records, order):
    with Image.open(root / "public" / record["src"].lstrip("/")) as piece:
        layer = Image.new("L", art.size, 0)
        layer.paste(piece.convert("RGBA").getchannel("A"), mask.getbbox()[:2])
        assert ImageChops.multiply(alpha, layer).getbbox() is None, record["src"]
        alpha = ImageChops.add(alpha, layer)
assert ImageChops.difference(alpha, art.getchannel("A")).getbbox() is None

lines = ",\n".join(f"  {json.dumps(record, ensure_ascii=False)}" for record in records)
module.write_text(
    "// scripts/split-countdown-logo-leaves.py 가 만든다 손으로 고치지 않는다\n"
    "// 로고 상자 x 242~1012, y 325~896 기준 백분율 second 는 그 잎이 떨어지는 남은 초\n"
    f"export const LOGO_LEAVES = [\n{lines},\n];\n",
    encoding="utf-8",
)
print(f"{len(records)} leaves, branch {branch.size}")

"""Extract original icon pixels without changing the SVG coordinates or filter.

Run with Python + Pillow after editing artwork regions in the component.
"""

from pathlib import Path
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
component = root / "src/features/leaderboard/components/LeaderboardArtworkSymbol.jsx"
source = component.read_text(encoding="utf-8")
regions = [tuple(map(int, match)) for match in re.findall(
    r"\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]", source)]
padding = int(re.search(r"ARTWORK_PADDING\s*=\s*(\d+)", source).group(1))
assert regions and len(set(regions)) == len(regions)
target = root / "public/assets/leaderboard/symbols"
target.mkdir(exist_ok=True)
total = 0
with Image.open(root / "public/assets/leaderboard/leaderboard.png") as original:
    for x, y, width, height in regions:
        assert 0 <= x - padding < x + width + padding <= original.width
        assert 0 <= y - padding < y + height + padding <= original.height
        crop = original.crop((x-padding, y-padding, x+width+padding, y+height+padding))
        path = target / f"{x}-{y}-{width}-{height}.webp"
        crop.save(path, format="WEBP", lossless=True, exact=True, method=6)
        with Image.open(path) as decoded:
            assert decoded.convert("RGBA").tobytes() == crop.convert("RGBA").tobytes()
        total += path.stat().st_size
        print(f"{path.name}: {path.stat().st_size:,} bytes; original pixels verified")
print(f"{len(regions)} symbols: {total:,} bytes total")

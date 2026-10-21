"""Lossless centre crop for portrait cover backgrounds, with unchanged scale.

The CSS only selects it at aspect ratios <= 9/10. Wider windows keep the full
image. Retaining the full height preserves detail at every device pixel ratio.
"""
import math
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / "public/assets/login/background-plaza.webp"
target = source.with_name("background-plaza-portrait.webp")
with Image.open(source) as original:
    width = math.ceil(original.height * 9 / 10 / 2) * 2
    assert (original.width - width) % 2 == 0
    left = (original.width - width) // 2
    cropped = original.crop((left, 0, left + width, original.height))
    cropped.save(target, format="WEBP", lossless=True, exact=True, method=6)
    with Image.open(target) as decoded:
        assert decoded.size == (width, original.height)
        assert decoded.convert("RGBA").tobytes() == cropped.convert("RGBA").tobytes()
print(f"Portrait crop: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes; {width}x{cropped.height}, identical source pixels")

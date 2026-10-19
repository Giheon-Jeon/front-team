"""Encode runtime art as lossless WebP and a high-quality board backdrop.

Run with Python + Pillow: python scripts/optimize-game-images.py
The PNG source art remains available, including the poster's original-file link.
"""

from pathlib import Path
import math
from PIL import Image, ImageChops, ImageStat

root = Path(__file__).resolve().parents[1]
assets = root / "public/assets"
images = (
    "intro/msg-ctf-2025-poster.png",
    "intro/preparation-laptop-v1.png",
    "intro/preparation-identity-v1.png",
    "signatures/booth-menu-paper-v1.png",
    "board/golden-key-original.png",
    "koth/koth-trail-background.png",
    "koth/completion-stamp-round-1.png",
    "koth/completion-stamp-round-2.png",
    "koth/completion-stamp-round-3.png",
    "leaderboard/leaderboard-layout.png",
    "login/background-plaza.png",
    "challenge-detail/panel-board.png",
)
for relative in images:
    source = assets / relative
    target = source.with_suffix(".webp")
    with Image.open(source) as image:
        image.save(target, format="WEBP", lossless=True, method=6, exact=True)
        with Image.open(target) as decoded:
            assert decoded.size == image.size
            assert decoded.convert("RGBA").tobytes() == image.convert("RGBA").tobytes(), source
    print(f"{relative}: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes (identical pixels)")

# The decorative backdrop has no interactive labels. Keep its full resolution
# and original files, but use quality 96 for the display copy. All cards, text
# panels and stamps above remain pixel-identical lossless encodings.
source = assets / "board/bg-1920x1080.png"
target = assets / "board/bg-1920x1080-display.webp"
with Image.open(source) as image:
    image.save(target, format="WEBP", quality=96, method=6)
    with Image.open(target) as decoded:
        assert image.size == decoded.size
        diff = ImageStat.Stat(ImageChops.difference(image.convert("RGB"), decoded.convert("RGB")))
        mse = sum(diff.sum2) / (image.width * image.height * 3)
        psnr = 10 * math.log10(255 ** 2 / mse)
        assert psnr >= 39, f"Backdrop quality below the verified threshold: {psnr}"
print(f"board backdrop: {target.stat().st_size:,} bytes; PSNR {psnr:.2f} dB")

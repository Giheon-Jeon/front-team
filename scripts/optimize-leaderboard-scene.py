"""Encode the generated scenery layer without changing its dimensions.

Run: python scripts/optimize-leaderboard-scene.py /path/to/generated-scene.png
The original scoreboard artwork is used separately and remains lossless.
"""

from pathlib import Path
import io
import math
import sys
from PIL import Image, ImageChops, ImageStat

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / "public/assets/leaderboard/leaderboard-scene-v1.webp"
with Image.open(source) as image:
    image = image.convert("RGB")
    for quality in (86, 88, 90, 92, 94, 96):
        encoded = io.BytesIO()
        image.save(encoded, format="WEBP", quality=quality, method=6)
        encoded.seek(0)
        with Image.open(encoded) as decoded:
            assert decoded.size == image.size
            diff = ImageStat.Stat(ImageChops.difference(image, decoded.convert("RGB")))
            mse = sum(diff.sum2) / (image.width * image.height * 3)
            psnr = 10 * math.log10(255 ** 2 / mse) if mse else math.inf
        if psnr >= 37:
            target.write_bytes(encoded.getvalue())
            print(f"{target.name}: {image.width}x{image.height}; Q{quality}; {target.stat().st_size:,} bytes; PSNR {psnr:.2f} dB")
            break
    else:
        raise RuntimeError("Scenery encoding did not meet the 37 dB quality threshold")

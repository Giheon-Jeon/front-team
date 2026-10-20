"""Analyze rendered backgrounds and alpha captures from qa-mobile-details.js.

Usage: python scripts/analyze-mobile-details.py <playwright-cli log> <report.json> [--report-only]
Requires Pillow in the QA environment, not in the application.
"""
import json
import math
import re
import sys
from pathlib import Path
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
raw = Path(sys.argv[1]).read_text(encoding="utf-8-sig")
if "### Error" in raw:
    raise SystemExit(raw[raw.index("### Error"):][:1500])
if "### Result" not in raw:
    raise SystemExit("The browser audit has not returned a result yet.")
data = json.JSONDecoder().raw_decode(raw.split("### Result", 1)[1].lstrip())[0]
contrasts, corners, icons, layouts = [], [], [], []

def luminance(rgb):
    linear = [v / 255 / 12.92 if v / 255 <= .04045 else ((v / 255 + .055) / 1.055) ** 2.4 for v in rgb[:3]]
    return sum(a*b for a,b in zip(linear, (.2126, .7152, .0722)))

for item in data["results"]:
    kind = item["kind"]
    if kind == "layout":
        layouts.append(item)
        continue
    img = Image.open(item["shot"]).convert("RGBA")
    if kind in ("alpha", "icon"):
        alpha = img.getchannel("A")
        if kind == "alpha":
            points = [(1,1),(img.width-2,1),(1,img.height-2),(img.width-2,img.height-2)]
            corners.append({**item,"cornerAlpha":[alpha.getpixel(p) for p in points]})
        else:
            bbox = alpha.point(lambda v: 255 if v >= 128 else 0).getbbox()
            icons.append({**item,"canvas":[img.width,img.height],"artBounds":bbox,"artSize":[bbox[2]-bbox[0],bbox[3]-bbox[1]] if bbox else None})
        continue
    for text in item["metrics"]:
        color = [float(v) for v in re.findall(r"[\d.]+", text["color"])]
        if len(color)<3 or (len(color)==4 and color[3]<.99):
            continue
        foreground = luminance(color)
        minimum=21
        for rect in text["rects"]:
            box=(max(0,math.ceil(rect["x"])),max(0,math.ceil(rect["y"])),min(img.width,math.floor(rect["x"]+rect["width"])),min(img.height,math.floor(rect["y"]+rect["height"])))
            crop = img.crop(box)
            pixels = crop.get_flattened_data() if hasattr(crop, "get_flattened_data") else crop.getdata()
            for pixel in pixels:
                background = luminance(pixel)
                ratio=(max(foreground,background)+.05)/(min(foreground,background)+.05)
                minimum=min(minimum,ratio)
        threshold=3 if text["fontSize"]>=24 or (text["fontWeight"]>=700 and text["fontSize"]>=18.667) else 4.5
        contrasts.append({"path":item["path"],"width":item["width"],"scroll":item["scroll"],**text,"contrast":round(minimum,3),"required":threshold,"pass":minimum>=threshold})

failures=sorted([r for r in contrasts if not r["pass"]],key=lambda r:r["contrast"])
unique={}
for r in failures:
    key=(r["path"],r["text"],str(r["className"]))
    if key not in unique: unique[key]=r
icon_failures=[]
for width in sorted(set(i["width"] for i in icons)):
    group=[i for i in icons if i["width"]==width]
    if len(group)!=4 or any(not i["artBounds"] or not all(0<i["artBounds"][a] and i["artBounds"][a+2]<i["canvas"][a] for a in (0,1)) for i in group):
        icon_failures.append({"width":width,"reason":"Missing or clipped artwork"})
    elif any(max(i["artSize"][a] for i in group)-min(i["artSize"][a] for i in group)>1 for a in (0,1)):
        icon_failures.append({"width":width,"reason":"Visible artwork differs by more than 1px"})
report={"contrastSamples":len(contrasts),"contrastFailures":len(failures),"uniqueContrastFailures":list(unique.values()),"contrasts":contrasts,"corners":corners,"icons":icons,"iconFailures":icon_failures,"layouts":layouts,"pageErrors":data["errors"]}
Path(sys.argv[2]).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({
    "contrastSamples":len(contrasts),"contrastFailures":len(failures),"cornerCases":len(corners),
    "opaqueCorners":[c for c in corners if any(c["cornerAlpha"])],
    "iconCases":len(icons),"iconFailures":icon_failures,"overflows":[l for l in layouts if l["overflow"]],"pageErrors":data["errors"],
    "uniqueContrastFailures":[{k:v for k,v in r.items() if k not in ("rects",)} for r in unique.values()]
},ensure_ascii=False,indent=2))
if "--report-only" not in sys.argv and (failures or icon_failures or any(any(c["cornerAlpha"]) for c in corners) or any(l["overflow"] for l in layouts) or data["errors"]):
    raise SystemExit(1)

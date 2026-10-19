from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import json

out=Path(__file__).resolve().parents[1] / "output/playwright"
records={}
for name in ['baseline','current']:
    file=out/f'interactions-{name}.log'
    raw=file.read_text(encoding='utf-16' if file.read_bytes().startswith(b'\xff\xfe') else 'utf-8-sig')
    data=json.loads(raw.split('### Result')[1].splitlines()[1])
    records[name]=data
    (out/f'interactions-{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
before={(row['name'],row['width']):row for row in records['baseline']['results']}
rows=[]
geometry_deltas=[]
for current in records['current']['results']:
    key=(current['name'],current['width'])
    old=before[key]
    node_changes=[]
    if len(old['nodes'])!=len(current['nodes']):
        node_changes.append({'count_before':len(old['nodes']),'count_after':len(current['nodes'])})
    else:
        for a,b in zip(old['nodes'],current['nodes']):
            geometry_deltas.extend(abs(x-y) for x,y in zip(a['rect'],b['rect']))
            if any(a[k]!=b[k] for k in ['tag','role','label','text']) or max(abs(x-y) for x,y in zip(a['rect'],b['rect']))>1:
                node_changes.append({'before':a,'after':b})
    image_a=Image.open(out/f'regression-baseline-{key[0]}-{key[1]}.png').convert('RGB')
    image_b=Image.open(out/f'regression-current-{key[0]}-{key[1]}.png').convert('RGB')
    pixels={}
    if image_a.size==image_b.size:
        diff=ImageChops.difference(image_a,image_b)
        red,green,blue=diff.split()
        maximum=ImageChops.lighter(ImageChops.lighter(red,green),blue)
        histogram=maximum.histogram()
        pixels={'size':image_a.size,'mae':round(sum(ImageStat.Stat(diff).mean)/3,5),'percent_over_8':round(100*sum(histogram[9:])/(diff.width*diff.height),4),'percent_over_32':round(100*sum(histogram[33:])/(diff.width*diff.height),4)}
        if sum(histogram[9:]): diff.save(out/f'audit-diff-{key[0]}-{key[1]}.png')
    else: pixels={'size_before':image_a.size,'size_after':image_b.size}
    rows.append({'name':key[0],'width':key[1],'same_text':old['text']==current['text'],'node_changes':node_changes,'pixels':pixels,'focus_before':old['focusInsideDialog'],'focus_after':current['focusInsideDialog'],'source_image_requested_before':old['leaderboardFullImage'],'source_image_requested_after':current['leaderboardFullImage']})
summary={'cases':len(rows),'errors':records['current']['errors'],'unknown':records['current']['unknown'],'text_changes':sum(not row['same_text'] for row in rows),'layout_changes':sum(bool(row['node_changes']) for row in rows),'geometry_values':len(geometry_deltas),'max_geometry_delta':max(geometry_deltas,default=0),'rows':rows}
(out/'interaction-comparison.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({**{k:v for k,v in summary.items() if k!='rows'},'differences':[row for row in rows if row['node_changes'] or not row['same_text'] or row['pixels'].get('percent_over_32',0)>1], 'leaderboard':[{'width':row['width'],**row['pixels'],'old_source':row['source_image_requested_before'],'new_source':row['source_image_requested_after']} for row in rows if row['name']=='leaderboard-symbols']},ensure_ascii=False))

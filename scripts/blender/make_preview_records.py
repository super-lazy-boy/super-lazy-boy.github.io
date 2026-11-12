"""Prepare an offline-only atlas from the already-public static records."""
import json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'content/public-records.json').read_text(encoding='utf-8'))
records=data['records'] if isinstance(data,dict) else data
books=[r for r in records if r['kind']=='book'];films=[r for r in records if r['kind'] in ('movie','game')]
palette=['#8f3f37','#2f3f52','#c8b07a','#5c6b52','#7b5a63','#d9cdb4','#3f4a44','#b98a5e','#8fa3a8']
image=Image.new('RGB',(2048,5120),'#d9cdb4');draw=ImageDraw.Draw(image)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',43);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
for i in range(146):
    record=(books[i] if i<len(books) else {}) if i<90 else (films[i-90] if i-90<len(films) else {})
    x=i%16*128;y=i//16*512
    draw.rectangle((x,y,x+127,y+511),fill=palette[i%9]);draw.rectangle((x+9,y+14,x+118,y+498),outline='#d3bc8e',width=2)
    for k,char in enumerate(record.get('title','')[:8]):draw.text((x+64,y+62+k*48),char,font=font,anchor='mm',fill='#f1e7cf')
    draw.text((x+64,y+468),str(i+1),font=small,anchor='mm',fill='#e2d5ba')
out=root/'work/qa';out.mkdir(parents=True,exist_ok=True);image.save(out/'record-atlas.png')
print('Offline public-record atlas ready')

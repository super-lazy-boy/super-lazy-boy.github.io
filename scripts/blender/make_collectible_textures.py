"""Original, typeset labels for the requested miniature and film prop."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[2];out=root/'public/models/collectibles';out.mkdir(parents=True,exist_ok=True)
im=Image.new('RGB',(1024,1024),'#f8f4e9');d=ImageDraw.Draw(im)
for text,y,width in [('ONE',320,240),('WISH',535,420),('WILLOW',780,680)]:
    size=200;font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',size)
    while d.textlength(text,font=font)>width:size-=1;font=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',size)
    d.text((512,y),text,font=font,fill='#d42321',anchor='mm')
im.save(out/'wish-label.png',optimize=True)
im=Image.new('RGB',(1024,600),'#9e5143');d=ImageDraw.Draw(im);d.rectangle((25,25,999,575),outline='#d5b57d',width=22);d.rectangle((62,62,962,538),fill='#715a48',outline='#e2c495',width=7)
for x in range(145,950,180):
    for y in range(140,530,150):
        for dx,dy in [(0,-35),(35,0),(0,35),(-35,0)]:d.ellipse((x+dx-23,y+dy-23,x+dx+23,y+dy+23),fill='#c5a172')
        d.ellipse((x-12,y-12,x+12,y+12),fill='#7f5148')
im.save(out/'monica-rug.png',optimize=True)
print('Collectible label and rug maps ready')

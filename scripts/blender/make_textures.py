"""Restrained, seamless, original material maps at physically plausible scales."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

out=Path(__file__).resolve().parents[2]/'public/models/sunlit-room'
out.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(24)
size=512
y,x=np.mgrid[0:size,0:size]
grain=np.sin(y*.38+np.sin(x*.013)*1.5)+.42*np.sin(y*1.7+np.sin(x*.021)*2)
grain+=rng.normal(0,.3,(size,size))
color=np.array([202,181,148])+grain[:,:,None]*np.array([2.3,2.1,1.8])
Image.fromarray(np.uint8(np.clip(color,0,255))).save(out/'oak.png',optimize=True)
for name,base,amp in [('linen',[235,232,224],2.1),('wool',[220,214,201],3.2)]:
    weave=np.sin(x*np.pi/2)*np.sin(y*np.pi/2)+rng.normal(0,.27,(size,size))
    color=np.array(base)+weave[:,:,None]*amp
    Image.fromarray(np.uint8(np.clip(color,0,255))).save(out/(name+'.png'),optimize=True)
    gx,gy=np.gradient(weave)
    normals=np.dstack([-gy*.09,-gx*.09,np.ones_like(x)])
    normals/=np.linalg.norm(normals,axis=2)[:,:,None]
    Image.fromarray(np.uint8((normals*.5+.5)*255)).save(out/(name+'-normal.png'),optimize=True)
image=Image.new('RGB',(960,320),(245,243,238));draw=ImageDraw.Draw(image)
rows=[['esc','1','2','3','4','5','6','7','8','9','0','-','=','del','home'],['tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\','end'],['caps','A','S','D','F','G','H','J','K','L',';',"'",'enter','',''],['shift','Z','X','C','V','B','N','M',',','.','/','up','shift','',''],['ctrl','fn','alt','','','','','','','','alt','left','down','right','ctrl']]
for row,keys in enumerate(rows):
    for col,key in enumerate(keys):
        font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17 if len(key)<3 else 12)
        draw.text((col*64+32,row*64+32),key,fill=(106,113,108),font=font,anchor='mm')
image.save(out/'keyboard.png',optimize=True)
print('Material maps ready')

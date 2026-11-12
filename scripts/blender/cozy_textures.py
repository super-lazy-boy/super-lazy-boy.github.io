"""Original textile and timber maps: muted colour, fine weave, no external assets."""
from pathlib import Path
import math
import numpy as np
from PIL import Image,ImageDraw

out=Path(__file__).resolve().parents[2]/'public/models/sunlit-room'
rng=np.random.default_rng(71);n=512;y,x=np.mgrid[:n,:n]
grain=np.sin(y*.35+np.sin(x*.015)*2)+.45*np.sin(y*1.8+np.sin(x*.02)) + rng.normal(0,.23,(n,n))
for name,base in [('honey-oak',[172,132,87]),('walnut',[133,94,61])]:
    a=np.array(base)+grain[:,:,None]*np.array([3.0,2.6,2.1]);Image.fromarray(np.uint8(np.clip(a,0,255))).save(out/(name+'.png'),optimize=True)
for name,base in [('rust',[176,119,86]),('moss',[99,120,90]),('gold',[196,158,81]),('cream',[217,202,173])]:
    weave=np.sin(x*math.pi/2)*np.sin(y*math.pi/2)+rng.normal(0,.28,(n,n))
    a=np.array(base)+weave[:,:,None]*3.0;Image.fromarray(np.uint8(np.clip(a,0,255))).save(out/('cozy-'+name+'.png'),optimize=True)
    gy,gx=np.gradient(weave);normal=np.dstack([-gx*.10,-gy*.10,np.ones_like(gx)]);normal/=np.linalg.norm(normal,axis=2)[:,:,None]
    Image.fromarray(np.uint8((normal*.5+.5)*255)).save(out/('cozy-'+name+'-normal.png'),optimize=True)

# A restrained botanical carpet, with continuous borders and hand-drawn petals.
S=1024;im=Image.new('RGB',(S,S),'#d8bf94');d=ImageDraw.Draw(im)
d.rectangle((30,30,994,994),fill='#8e5145');d.rectangle((63,63,961,961),fill='#d1b480');d.rectangle((91,91,933,933),fill='#3d574c')
for border in (49,78):d.rectangle((border,border,S-border,S-border),outline='#ecdbb8',width=3)
for t in range(24):
    c=110+t*35
    for px,py,a in [(c,47,0),(c,977,0),(47,c,math.pi/2),(977,c,math.pi/2)]:
        d.ellipse((px-5,py-5,px+5,py+5),fill='#d5ba7f')
        for side in (-1,1):d.ellipse((px-13,py+side*9-4,px+13,py+side*9+4),fill='#c48c69')
for row in range(5):
    for col in range(4):
        cx=190+col*214+(row%2)*24;cy=176+row*166;r=49
        d.line((cx-45,cy+48,cx+39,cy-59),fill='#b0b891',width=5)
        for side in (-1,1):
            d.ellipse((cx+side*44-20,cy+36-8,cx+side*44+20,cy+36+8),fill='#a9b48a')
        for k in range(8):
            a=k*math.tau/8;points=[]
            for j in range(36):
                t=j*math.tau/36;rad=r*(.55+.45*math.cos(t));across=math.sin(t)*r*.31
                points.append((cx+math.cos(a)*rad-math.sin(a)*across,cy+math.sin(a)*rad+math.cos(a)*across))
            d.polygon(points,fill=['#c28b70','#dec797','#a95d55'][(row+col)%3])
        d.ellipse((cx-12,cy-12,cx+12,cy+12),fill='#cda452');d.ellipse((cx-5,cy-5,cx+5,cy+5),fill='#e3d4ab')
a=np.asarray(im).astype(float);yy,xx=np.mgrid[:S,:S];weave=(np.sin(xx*math.pi)*np.sin(yy*math.pi/2)+rng.normal(0,.8,(S,S)))
a+=weave[:,:,None]*1.7;Image.fromarray(np.uint8(np.clip(a,0,255))).save(out/'cozy-rug.png',optimize=True)
print('Cozy material maps ready')

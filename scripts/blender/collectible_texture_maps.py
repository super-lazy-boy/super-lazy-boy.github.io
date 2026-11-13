"""Original baked PBR and decorative maps; see ASSET-CREDITS.md for sleeve art."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
import math,random
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'public/models/collectibles';OUT.mkdir(parents=True,exist_ok=True)
R=random.Random(92024)
def save(im,name):im.save(OUT/(name+'.png'),optimize=True)
def normal(height,name,strength=1):
    y,x=np.gradient(height.astype(float));v=np.stack((-x*strength,-y*strength,np.ones_like(x)),axis=-1);v/=np.linalg.norm(v,axis=-1,keepdims=True);save(Image.fromarray(np.uint8((v*.5+.5)*255)),name)

n=512;yy,xx=np.mgrid[:n,:n];rng=np.random.default_rng(75192);weave=.045*np.sin(xx*math.tau/8)*np.cos(yy*math.tau/8)+.018*np.sin(xx*math.tau/2)+rng.normal(0,.005,(n,n));normal(weave,'woven-normal',4)
grain=np.zeros((n,n))
for k in range(1,17):grain+=np.sin(yy*math.tau*k/n+np.sin(xx*math.tau/n)*.3+k*.71)/k
grain+=rng.normal(0,.08,(n,n));rgb=np.array([171,127,78])[None,None,:]+grain[:,:,None]*np.array([6,5,4]);save(Image.fromarray(np.uint8(np.clip(rgb,0,255))),'mini-oak');normal(grain,'wood-normal',.11)
im=Image.new('RGB',(1024,512),'#b8aa91');d=ImageDraw.Draw(im)
for row in range(9):
    for col in range(-1,12):
        x=col*100+(row%2)*50;y=row*60;c=R.choice(['#886a54','#9b7559','#aa8162','#ae876c','#997357']);d.rounded_rectangle((x+3,y+3,x+97,y+56),3,fill=c)
save(im.filter(ImageFilter.GaussianBlur(.6)),'mini-brick')

im=Image.new('RGB',(1536,1024),'#292a23');d=ImageDraw.Draw(im)
for pad,width,c in [(18,7,'#b79d70'),(40,6,'#77674c'),(114,10,'#bca57e'),(132,8,'#504b39')]:d.rectangle((pad,pad,1535-pad,1023-pad),outline=c,width=width)
d.rectangle((150,150,1386,874),fill='#c5b68e');d.ellipse((420,235,1116,789),fill='#b2a681',outline='#8c9070',width=8)
def flower(x,y,r,color):
    for i in range(7):a=i*math.tau/7;xx=x+math.cos(a)*r*.55;yy=y+math.sin(a)*r*.55;d.ellipse((xx-r*.37,yy-r*.28,xx+r*.37,yy+r*.28),fill=color,outline='#786c4d',width=2)
    d.ellipse((x-r*.16,y-r*.16,x+r*.16,y+r*.16),fill='#b99b59')
for x in range(200,1350,110):
    for y in range(200,850,103):d.arc((x-55,y-45,x+62,y+65),15,255,fill='#778566',width=5);d.ellipse((x+15,y+25,x+49,y+38),fill='#778566');flower(x,y,25,R.choice(['#8f7062','#a2846b','#9b9a77']))
for x in range(75,1500,92):
    for y in (80,943):flower(x,y,21,'#b29a70')
for y in range(172,930,90):
    for x in (80,1455):flower(x,y,20,'#b29a70')
d.ellipse((670,420,866,604),outline='#a18e67',width=6);flower(768,512,74,'#a3916e');arr=np.array(im).astype(float);arr+=rng.normal(0,1.7,arr.shape[:2])[:,:,None];save(Image.fromarray(np.uint8(np.clip(arr,0,255))),'monica-rug')
im=Image.new('RGB',(512,512),'#d1bd99');d=ImageDraw.Draw(im);colors=['#9d5550','#5a7c70','#c0a268','#dfd3b7','#495e57','#a58a79']
for j in range(4):
    for i in range(4):
        x,y=i*128,j*128;d.rectangle((x+2,y+2,x+126,y+126),fill=colors[(j*3+i)%6]);d.rectangle((x+8,y+8,x+120,y+120),outline='#d0b997',width=2);d.line([(x+15,y+64),(x+64,y+15),(x+113,y+64),(x+64,y+113),(x+15,y+64)],fill='#d7c4a0',width=4)
save(im,'patchwork');im=Image.new('RGB',(512,512),'#94483e');d=ImageDraw.Draw(im)
for k in range(0,512,64):d.rectangle((k,0,k+14,511),fill='#602e2c');d.rectangle((0,k,511,k+14),fill='#602e2c');d.line((k+27,0,k+27,511),fill='#c48a71',width=2);d.line((0,k+27,511,k+27),fill='#c48a71',width=2)
save(im,'red-plaid')
im=Image.new('RGB',(1024,1024),'#c3c4bb');d=ImageDraw.Draw(im)
for r in (100,130,158,351,398,447,475):d.ellipse((512-r,512-r,512+r,512+r),outline='#868c89',width=2)
for k in range(32):
    a=k*math.tau/32;v=(math.sin(a),math.cos(a));t=(math.cos(a),-math.sin(a));pts=[(512+v[0]*r+t[0]*w,512+v[1]*r+t[1]*w) for r,w in [(168,-4),(435,-7),(435,7),(168,4)]];d.line(pts+[pts[0]],fill='#727b78',width=3)
    for r in (194,243,292,341,390):x,y=512+v[0]*r,512+v[1]*r;d.line((x-t[0]*5,y-t[1]*5,x+t[0]*5,y+t[1]*5),fill='#777f7b',width=2)
save(im,'falcon-radar');print('Original floral textiles and baked PBR maps ready',flush=True)

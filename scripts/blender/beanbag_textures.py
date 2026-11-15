"""Fine heathered cotton: subdued irregular yarns without ribbed grid banding."""
from pathlib import Path
import numpy as np
from PIL import Image,ImageFilter
out=Path(__file__).resolve().parents[2]/'public/models/sunlit-room';out.mkdir(parents=True,exist_ok=True)
n=1024;y,x=np.mgrid[:n,:n];rng=np.random.default_rng(217)
noise=rng.normal(0,1,(n,n))
soft=np.asarray(Image.fromarray(np.uint8(np.clip(128+noise*24,0,255))).filter(ImageFilter.GaussianBlur(.6))).astype(float)
soft=(soft-128)/24
weave=.11*np.sin(x*np.pi/2+.18*np.sin(y*np.pi*12/n))*np.sin(y*np.pi/2+.15*np.sin(x*np.pi*8/n))
slub=.045*np.sin(x*np.pi*48/n+.7)*np.cos(y*np.pi*20/n)+.035*np.sin(x*np.pi*92/n)*np.cos(y*np.pi*38/n)
height=weave+.40*soft+slub
variation=.7*np.sin(x*np.pi*8/n+.3)*np.cos(y*np.pi*12/n-.3)+.25*np.sin(x*np.pi*22/n+1.2)*np.cos(y*np.pi*18/n-1.2)
colour=np.array([173,153,120])+(height*7+variation*1.6+noise*.65)[:,:,None]
Image.fromarray(np.uint8(np.clip(colour,0,255))).save(out/'beanbag-oat.png',optimize=True)
# A unique normal atlas adds fine gathered pressure folds in the same places
# as the sculpted seams. Base-colour grain retains its separate physical UV.
u=(1-y/(n-1));a=x/(n-1)*np.pi*2;r=np.sin(np.pi*u)
xx=1.02*r*np.sin(a);zz=1.02*r*np.cos(a)
def smooth(lo,hi,value):
    t=np.clip((value-lo)/(hi-lo),0,1);return t*t*(3-2*t)
pressure=np.zeros((n,n));wrng=np.random.default_rng(218)
for side,count in [(-1,15),(1,23)]:
    for j in range(count):
        anchor=wrng.uniform(.25,.74);slope=wrng.uniform(.16,.57);length=wrng.uniform(.18,.63);width=wrng.uniform(.005,.013);depth=wrng.uniform(.0025,.007)
        along=side*xx;across=zz-anchor+slope*along+.012*np.sin(along*12+j)
        taper=smooth(.015,.07,along)*(1-smooth(length*.70,length,along))
        pressure-=depth*np.exp(-(across/width)**2)*taper*smooth(.54,.66,u)*smooth(.04,.20,zz)
angle=(a-np.pi+np.pi)%(np.pi*2)-np.pi
for side in (-1,1):
    for j in range(17):
        centre=wrng.uniform(.33,.67);slope=wrng.uniform(-.12,.18);length=wrng.uniform(.16,.54);width=wrng.uniform(.0025,.006);depth=wrng.uniform(.0015,.004)
        along=side*angle;across=u-centre-slope*along
        taper=smooth(.01,.06,along)*(1-smooth(length*.7,length,along))
        pressure-=depth*np.exp(-(across/width)**2)*taper*smooth(.25,.37,u)*(1-smooth(.78,.90,u))
pressure*=smooth(.06,.13,u)*(1-smooth(.97,.995,u))
da=(np.roll(pressure,-1,axis=1)-np.roll(pressure,1,axis=1))*.5
# PNG rows point downward, while UV V and the meridian point upward.
du=(np.roll(pressure,1,axis=0)-np.roll(pressure,-1,axis=0))*.5
sa=np.maximum(.018,2*np.pi*1.02*r/n);su=np.pi*1.1/n
nx=-da/sa;ny=-du/su
# Subtle non-periodic fibre relief avoids the previous large ribbed bands.
fibre_x=(np.roll(soft,-1,axis=1)-np.roll(soft,1,axis=1))*.06
fibre_y=(np.roll(soft,1,axis=0)-np.roll(soft,-1,axis=0))*.06
normal=np.dstack([nx+fibre_x,ny+fibre_y,np.ones((n,n))]);normal/=np.linalg.norm(normal,axis=2)[:,:,None]
Image.fromarray(np.uint8(np.clip((normal*.5+.5)*255,0,255))).save(out/'beanbag-oat-normal.png',optimize=True)
rough=np.uint8(np.clip(247+height*5+variation*2,240,253))
Image.fromarray(np.dstack([rough,rough,rough])).save(out/'beanbag-oat-roughness.png',optimize=True)
print('SOFT_HEATHERED_COTTON_READY',n)

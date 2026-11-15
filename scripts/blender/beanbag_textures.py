"""Original washed cotton canvas: lofted yarns, slubs and a dry diffuse finish."""
from pathlib import Path
import numpy as np
from PIL import Image

out=Path(__file__).resolve().parents[2]/'public/models/sunlit-room';out.mkdir(parents=True,exist_ok=True)
n=1024;y,x=np.mgrid[:n,:n];rng=np.random.default_rng(115);period=10.6666666667
# Rounded yarn crowns alternate above and below each other. Slubs vary along
# each strand; this is a fabric height field, rather than generic white noise.
warp_phase=x/period+.022*np.sin(y*np.pi*12/n);weft_phase=y/period+.018*np.sin(x*np.pi*16/n)
warp=np.exp(-((np.mod(warp_phase,1)-.5)/.29)**4);weft=np.exp(-((np.mod(weft_phase,1)-.5)/.29)**4)
over=(np.floor(warp_phase).astype(int)+np.floor(weft_phase).astype(int))%2
height=np.where(over,warp+.19*weft,weft+.19*warp)
slub=.12*np.sin(x*np.pi*42/n+.7)*np.cos(y*np.pi*16/n)+.07*np.sin(x*np.pi*96/n)*np.cos(y*np.pi*34/n)
crumple=.08*np.sin(x*np.pi*18/n+1.2*np.sin(y*np.pi*8/n))+.035*np.cos(y*np.pi*26/n+.6*np.sin(x*np.pi*12/n))
fibre=.035*rng.normal(0,1,(n,n))
height+=slub+crumple+fibre
variation=.65*np.sin(x*np.pi*8/n+.3)*np.cos(y*np.pi*12/n-.3)+.22*np.sin(x*np.pi*22/n+1.2)*np.cos(y*np.pi*18/n-1.2)
colour=np.array([187,172,147])+((height-.55)*10+variation*2+fibre*8)[:,:,None]
Image.fromarray(np.uint8(np.clip(colour,0,255))).save(out/'beanbag-oat.png',optimize=True)
gx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*.5;gy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*.5
normal=np.dstack([-gx*1.6,-gy*1.6,np.ones((n,n))]);normal/=np.linalg.norm(normal,axis=2)[:,:,None]
Image.fromarray(np.uint8(np.clip((normal*.5+.5)*255,0,255))).save(out/'beanbag-oat-normal.png',optimize=True)
rough=np.uint8(np.clip(247-height*5+variation*2+fibre*3,238,253))
Image.fromarray(np.dstack([rough,rough,rough])).save(out/'beanbag-oat-roughness.png',optimize=True)
print('BEANBAG_COTTON_READY',n)

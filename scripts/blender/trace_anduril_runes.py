"""Read the supplied reference's inscription into reusable vector modelling data.

No product photograph is exported as a texture. Only the small white blade
marks become contour coordinates used by the native engraved/inlaid geometry.
"""
import sys,json
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1]);box=(391,634,416,1493)
pixels=np.asarray(Image.open(source).convert('RGB'))[box[1]:box[3],box[0]:box[2]]
mask=(pixels.min(axis=2)>158)&(pixels.mean(axis=2)>181)
height,width=mask.shape
# Remove isolated compression specks while retaining small separators.
seen=set();kept=np.zeros_like(mask)
for y,x in zip(*np.nonzero(mask)):
    if (x,y) in seen:continue
    todo=[(x,y)];component=[];seen.add((x,y))
    while todo:
        px,py=todo.pop();component.append((px,py))
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            q=(px+dx,py+dy)
            if 0<=q[0]<width and 0<=q[1]<height and mask[q[1],q[0]] and q not in seen:seen.add(q);todo.append(q)
    if len(component)>=3:
        for px,py in component:kept[py,px]=True
edges={}
def add(a,b):edges.setdefault(a,[]).append(b)
for y,x in zip(*np.nonzero(kept)):
    if y==0 or not kept[y-1,x]:add((x,y),(x+1,y))
    if x==width-1 or not kept[y,x+1]:add((x+1,y),(x+1,y+1))
    if y==height-1 or not kept[y+1,x]:add((x+1,y+1),(x,y+1))
    if x==0 or not kept[y,x-1]:add((x,y+1),(x,y))
loops=[]
while edges:
    start=next(iter(edges));current=start;loop=[]
    for _ in range(20000):
        loop.append(current);following=edges[current].pop()
        if not edges[current]:del edges[current]
        current=following
        if current==start:break
    simple=[]
    for i,p in enumerate(loop):
        a=loop[i-1];c=loop[(i+1)%len(loop)]
        if (p[0]-a[0])*(c[1]-p[1])!=(p[1]-a[1])*(c[0]-p[0]):simple.append(p)
    if len(simple)>=3:loops.append([[round(x/width-.5,6),round(y/height,6)] for x,y in simple])
out=root/'design/collectibles/anduril-runes.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps({'source':'User-supplied frontal sword reference; contour geometry only','loops':loops},separators=(',',':'))+'\n')
print(json.dumps({'contours':len(loops),'vertices':sum(map(len,loops))}))

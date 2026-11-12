"""Overfilled fabric cushions on a low Japanese-style timber floor chair."""
import bpy,math
from mathutils.bvhtree import BVHTree

def build(g):
    xyz,tag,asset,box,tube=(g[k] for k in ('xyz','tag','asset','box','tube'))
    rust=bpy.data.materials['Rust boucle upholstery'];moss=bpy.data.materials['Moss woven cushion'];gold=bpy.data.materials['Golden woven throw'];wood=bpy.data.materials['Oiled walnut joinery'];binding=bpy.data.materials['Rust upholstery piping']
    prefixes=('Sculpted linen seat','Sculpted upholstery sidewall','Continuous upholstery welt','Upholstery side seam','Lumbar cushion','Soft draped oat throw','Throw fringe','Footstool woven cushion','Overfilled floor seat','Reclining filled back','Plump foot cushion','Floor chair','Seat cushion stitched','Back cushion stitched','Plump moss pillow','Draped golden','Blanket twisted')
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):bpy.data.objects.remove(obj,do_unlink=True)
    def mesh(name,verts,faces,material,uv):
        data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in verts],[],faces);data.update();obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);tag(obj,name,material)
        for f in data.polygons:f.use_smooth=True
        layer=data.uv_layers.new()
        for loop in data.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
        return obj
    def cushion(name,center,size,material,tilt=0):
        verts=[];faces=[];uv=[];N=22
        for axis in range(3):
            others=[a for a in range(3) if a!=axis]
            for side in (-1,1):
                start=len(verts)
                for row in range(N+1):
                    for col in range(N+1):
                        p=[0,0,0];p[axis]=side;p[others[0]]=2*col/N-1;p[others[1]]=2*row/N-1
                        length=sum(abs(v)**3.4 for v in p)**(1/3.4);p=[v/length for v in p]
                        # Low-amplitude radial gathers near the edge, with a broad
                        # convex filled centre. Silhouette and seam are geometry.
                        wrinkle=.007*math.sin(p[0]*15+p[2]*11)*abs(p[0]*p[2])**2
                        x=p[0]*size[0]/2;y=p[1]*size[1]/2+wrinkle;z=p[2]*size[2]/2
                        yy=y*math.cos(tilt)-z*math.sin(tilt);zz=y*math.sin(tilt)+z*math.cos(tilt)
                        verts.append((center[0]+x,center[1]+yy,center[2]+zz));uv.append((col/N*1.5,row/N*1.5))
                        if row and col:
                            n=start+row*(N+1)+col;face=(n-N-2,n-N-1,n,n-1)
                            # Correct outward face orientation for all six patches.
                            a,b,c=[verts[i] for i in face[:3]];ab=[b[i]-a[i] for i in range(3)];ac=[c[i]-a[i] for i in range(3)]
                            normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]]
                            outward=[sum(verts[i][k] for i in face)/4-center[k] for k in range(3)]
                            faces.append(face if sum(normal[k]*outward[k] for k in range(3))>0 else tuple(reversed(face)))
        return mesh(name,verts,faces,material,uv)
    asset('lounge')
    seat=cushion('Overfilled floor seat cushion',(3,.55,.58),(1.92,.65,1.64),rust)
    back=cushion('Reclining filled back cushion',(3,1.32,1.72),(1.84,1.28,.46),rust,.45)
    foot=cushion('Plump foot cushion',(3,.36,-.92),(1.43,.36,.85),rust)
    trees=[BVHTree.FromPolygons([v.co for v in o.data.vertices],[tuple(f.vertices) for f in o.data.polygons]) for o in (seat,back,foot)]
    for i in range(3):
        for j in range(i+1,3):assert not trees[i].overlap(trees[j]),'Independent lounge cushions intersect'
    # Timber supports and rear stiles form the structural chair; cushions remain
    # separate and clear of each other, rather than being pushed through a shell.
    for x in (2.22,3.78):
        tube('Floor chair curved back support',[(x,.23,1.58),(x,.52,1.70),(x,1.44,2.04)],.035,wood)
    box('Floor chair back lower rail',(3,.67,1.82),(1.64,.07,.08),wood,.018)
    # Side welts emphasise a compressible filled edge without a hard bucket rim.
    for side in (-1,1):
        pts=[]
        for i in range(65):
            a=i/64*math.tau;x=.965*math.copysign(abs(math.cos(a))**(2/3.4),math.cos(a));z=.825*math.copysign(abs(math.sin(a))**(2/3.4),math.sin(a))
            pts.append((3+x,.55+side*.010,.58+z))
        if side==1:tube('Seat cushion stitched welt',pts,.004,binding)
    pts=[]
    for i in range(97):
        a=i/96*math.tau;x=.925*math.copysign(abs(math.cos(a))**(2/3.4),math.cos(a));y=.645*math.copysign(abs(math.sin(a))**(2/3.4),math.sin(a))
        pts.append((3+x,1.32+y*math.cos(.45),1.72+y*math.sin(.45)))
    tube('Back cushion stitched welt',pts,.004,binding)
    asset('soft furnishings')
    # A small pillow rests on the relatively flat seat, away from the throw.
    # Its underside is sampled from the same analytic cushion surface.
    def seat_y(x,z):
        q=abs((x-3)/.96)**3.4+abs((z-.58)/.82)**3.4
        return .55+.325*max(0,1-q)**(1/3.4)
    verts=[];faces=[];uv=[];cols,rows=23,19
    for layer in range(2):
        for row in range(rows):
            v=row/(rows-1)
            for col in range(cols):
                u=col/(cols-1);x=3.24+(u-.5)*.64*(.92+.08*math.sin(v*math.pi));z=.54+v*.48
                y=seat_y(x,z)+.024+layer*(.028+.17*max(0,math.sin(math.pi*u)*math.sin(math.pi*v))**.6)
                verts.append((x,y,z));uv.append((u,v))
                if row and col:
                    n=layer*rows*cols+row*cols+col;f=(n-cols-1,n-1,n,n-cols);faces.append(f if layer else tuple(reversed(f)))
    edge=[*range(cols),*[r*cols+cols-1 for r in range(1,rows)],*range(rows*cols-2,(rows-1)*cols-1,-1),*[r*cols for r in range(rows-2,0,-1)]]
    for i,a in enumerate(edge):b=edge[(i+1)%len(edge)];faces.append((a,b,b+rows*cols,a+rows*cols))
    mesh('Plump moss pillow',verts,faces,moss,uv)
    verts=[];faces=[];uv=[]
    for row in range(31):
        for col in range(25):
            x=2.30+col/24*.53;z=.08+row/30*.84;y=seat_y(x,z)+.024+.011*math.sin(col*.54+row*.3)**2
            verts.append((x,y,z));uv.append((col/24,row/30))
            if row and col:n=row*25+col;faces.append((n-26,n-1,n,n-25))
    mesh('Draped golden woven blanket',verts,faces,gold,uv)
    for i in range(13):
        x=2.31+i*.042;z=.08;y=seat_y(x,z)+.028;tube('Blanket twisted fringe',[(x,y,z),(x+.007,y-.009,z-.04)],.0023,gold)
    for bound in g['bounds']:
        if bound['name']=='single lounge envelope':bound['min']=[1.92,.04,-.42];bound['max']=[4.08,2.02,2.22]

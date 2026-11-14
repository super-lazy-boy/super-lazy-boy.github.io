"""Decorative Anduril movie-prop study, with a separately hideable display plaque."""
import math,json
from pathlib import Path
from mathutils import Vector
from collectible_builder import Builder,ROOT
from collectible_fantasy_geometry import solid_xy,ring_xy,bezier,support,star_xy,curves_xy,flowing_outline

def build():
    b=Builder('anduril')
    steel=b.material('Satin forged blade','#c6ccd0',.24,1)
    edge=b.material('Polished blade bevels','#e0e4e5',.13,1)
    fuller=b.material('Recessed fuller steel','#9da7ae',.29,1)
    silver=b.material('Silver hilt and pommel','#cbd0d0',.18,1)
    trim=b.material('Hilt bright edge','#e7e8e3',.11,1)
    gold=b.material('Warm gilded hilt recesses','#bc9b52',.27,.92)
    leather=b.material('Black wrapped leather','#242727',.73)
    seam=b.material('Leather raised binding seam','#343a38',.66)
    letters=b.material('Blade inscription inlay','#dce1dd',.37,.72)
    wood=b.material('Display walnut plaque','#ffffff',.58,texture='public/models/sunlit-room/walnut.png')
    border=b.material('Display dark sculpted rim','#302b26',.56)
    tree=b.material('Display golden tree and vine inlay','#bfab68',.46,.72)
    bracket=b.material('Display aged brass hooks','#85734c',.39,.85)
    lining=b.material('Display soft hook lining','#282b29',.9)
    # The plaque is a separate collector display, never part of the sword mesh.
    mark=len(b.objects)
    outline=[(0,1.171),(.059,1.205),(.109,1.192),(.152,1.145),(.167,1.116),(.136,1.099),(.131,.971),(.139,.872),(.121,.775),(.083,.707),(.036,.665),(0,.647)]
    outline+= [(-x,y) for x,y in reversed(outline[1:-1])]
    solid_xy(b,'Display black shield rim',outline,-.030,-.010,border,.0035)
    center=Vector((0,.954));inner=[tuple(center+(Vector(p)-center)*.953) for p in outline]
    solid_xy(b,'Display walnut shield face',inner,-.010,-.006,wood,.002,uv_size=(.32,.59))
    # Symmetric, curving White Tree-inspired inlay and its long lower roots.
    z=-.0057
    paths=[[(0,.855,z),(-.004,.93,z),(.006,1.027,z),(0,1.153,z)]]
    for side in (-1,1):
        for i in range(5):
            yy=.981+i*.032
            paths.append([(side*.002,yy,z),(side*(.025+i*.004),yy+.025,z),(side*(.095-i*.008),yy+.005,z),(side*(.098-i*.010),yy+.053,z)])
        paths.extend([
            [(0,.855,z),(side*.027,.805,z),(side*.117,.819,z),(side*.074,.724,z)],
            [(0,.901,z),(side*.111,.942,z),(side*.107,.879,z),(side*.040,.849,z)],
            [(side*.074,.724,z),(side*.026,.742,z),(side*.015,.706,z),(side*.045,.701,z)]])
    for i,path in enumerate(paths):
        curve=bezier(path,32);b.tube('Display flowing golden tree branch '+str(i),curve,.00145 if i else .0020,tree,segments=7)
        if i in (*range(1,6),*range(9,14)):
            side=1 if curve[-1][0]>0 else -1
            for j,index in enumerate((14,23,31)):
                x,y,_=curve[index];tip=(x+side*.007,y+.009,z)
                b.tube('Display connected gilded tree twig',[(x,y,z),tip],.0006,tree,segments=6)
                # Pointed foil leaves grow from their twigs, instead of floating above them.
                dx,dy=side*.006,.007;nx,ny=-dy*.30,dx*.30
                leaf=[(tip[0],tip[1]),(tip[0]+dx*.45+nx,tip[1]+dy*.45+ny),(tip[0]+dx,tip[1]+dy),(tip[0]+dx*.45-nx,tip[1]+dy*.45-ny)]
                solid_xy(b,'Display pointed golden tree leaf',flowing_outline(leaf),z-.0001,z+.0005,tree,.00005)
    for i in range(7):
        a=(i-3)*.25;star_xy(b,'Display tree crown star',math.sin(a)*.076,1.169+math.cos(a)*.018,z,.0042,tree,points=4)
    # Discrete rubber-lined brackets meet the guard, not the blade edges.
    for side in (-1,1):
        b.tube('Display wall hook',[(side*.043,1.003,-.008),(side*.043,1.003,.008),(side*.043,1.021,.012)],.0032,bracket,segments=12)
        b.tube('Display hook sleeve',[(side*.043,1.013,.011),(side*.043,1.021,.012)],.0035,lining,segments=12)
    support(b.objects[mark:])

    # Continuous double-edged blade: actual centre fuller, shoulders and edge planes.
    def halfwidth(y):
        if y<.115:return .024*(max(y,0)/.115)**.78
        return .024+(.028-.024)*(y-.115)/(.929)
    heights=[.001,.012,.035,.065,.10,.115,.18,.30,.45,.60,.75,.89,.97,1.025,1.042]
    section=[(-1,0),(-.88,1),(-.43,1),(-.34,.57),(.34,.57),(.43,1),(.88,1),(1,0)]
    vertices=[];faces=[];mats=[];n=16;axis=.010
    for j,y in enumerate(heights):
        half=halfwidth(y);thickness=.0034*min(1,max(.055,y/.095))
        ring=[(a,amount) for a,amount in section]+[(a,-amount) for a,amount in reversed(section)]
        # Distinct but coincident edge vertices are welded after construction below.
        for x,depth in ring:vertices.append((x*half,y,axis+depth*thickness))
        if j:
            for i in range(n):faces.append(((j-1)*n+i,(j-1)*n+(i+1)%n,j*n+(i+1)%n,j*n+i));mats.append(1 if i%8 in (0,6,7) else 2 if i%8==3 else 0)
    faces.extend([tuple(reversed(range(n))),tuple(range((len(heights)-1)*n,len(heights)*n))]);mats.extend([0,0])
    blade=b.mesh('Full-length Anduril double-edged blade',vertices,faces,steel)
    blade.data.materials.append(edge);blade.data.materials.append(fuller)
    for face,index in zip(blade.data.polygons,mats):face.material_index=index
    import bmesh
    bm=bmesh.new();bm.from_mesh(blade.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(blade.data);bm.free();blade['assembly']='sword'

    # Contour geometry follows the supplied inscription instead of an unrelated Latin font.
    data=json.loads((ROOT/'design/collectibles/anduril-runes.json').read_text())
    loops=[]
    for loop in data['loops']:
        points=[]
        for u,v in loop:
            y=.956-v*.805;points.append((u*halfwidth(y)*.58,y))
        loops.append(points)
    front=curves_xy(b,'Reference-traced blade rune inlays',loops,letters,.010+.0034*.57+.000025,.000007);front['assembly']='sword'
    back=curves_xy(b,'Reverse blade rune inlays',[[(-x,y) for x,y in loop] for loop in loops],letters,.010-.0034*.57-.000025,.000007)
    # A thin lower-face inlay is viewed from the reverse; preserve both visible surfaces.
    for material in (letters,):material.use_backface_culling=False
    for side in (-1,1):
        zz=axis+side*.0034*.58
        star_xy(b,'Rayed sun blade emblem',0,1.000,zz,.0110,letters)
        for i in range(7):star_xy(b,'Seven star separator '+str(i),.0024,.88-i*.105,zz,.0018,letters,points=4)
        moon=[]
        for i in range(33):
            a=math.radians(50+i*260/32);moon.append((math.cos(a)*.0049,.132+math.sin(a)*.0049))
        for i in range(32,-1,-1):
            a=math.radians(50+i*260/32);moon.append((.0019+math.cos(a)*.0038,.132+math.sin(a)*.0038))
        solid_xy(b,'Crescent moon blade emblem',moon,zz,zz+side*.000035,letters)

    # The guard's flared, pierced ends and central downward point are its key silhouette.
    half=[(0,1.052),(.035,1.043),(.097,1.042),(.125,1.050),(.132,1.069),(.139,1.077),(.151,1.068),(.157,1.049),(.149,1.030),(.139,1.022),(.127,1.030),(.071,1.031),(.029,1.024),(0,.994)]
    guard_outline=flowing_outline(half+[(-x,y) for x,y in reversed(half[1:-1])])
    guard=solid_xy(b,'Sculpted Anduril crossguard',guard_outline,-.0005,.021,silver,.0014);guard['assembly']='sword'
    for side in (-1,1):
        outer=[(side*.137,1.070),(side*.151,1.051),(side*.140,1.029),(side*.132,1.049)]
        inner=[(side*.139,1.060),(side*.146,1.051),(side*.140,1.039),(side*.136,1.049)]
        outer=flowing_outline(outer);inner=flowing_outline(inner)
        cutter=solid_xy(b,'Quillon opening cutter',inner,-.005,.027,silver)
        import bpy
        bpy.context.view_layer.objects.active=guard;mod=guard.modifiers.new('Open quillon eye','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);b.objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
        ring_xy(b,'Gold-edged quillon inset',outer,inner,.0212,.0225,gold,.00025)
        b.tube('Guard polished upper arris',[(0,1.051,.022),(side*.035,1.043,.022),(side*.098,1.042,.022),(side*.126,1.051,.022)],.00075,trim,segments=10)

    # Leather grip with narrow helical binding and oval metal ferrules.
    N,M=32,26;v=[];f=[]
    for j in range(M+1):
        t=j/M;y=1.051+t*.132;rx=.013*(1-.10*math.sin(math.pi*t));rz=.0084*(1-.10*math.sin(math.pi*t))
        for i in range(N):
            a=i*math.tau/N;v.append((rx*math.cos(a),y,axis+rz*math.sin(a)))
            if j:k=j*N+i;l=j*N+(i+1)%N;f.append((k-N,l-N,l,k))
    f.extend([tuple(reversed(range(N))),tuple(range(M*N,(M+1)*N))]);grip=b.mesh('Fitted black leather grip',v,f,leather,smooth=True)
    pts=[]
    for i in range(801):
        t=i/800;a=t*math.tau*13;rx=.013*(1-.10*math.sin(math.pi*t));rz=.0084*(1-.10*math.sin(math.pi*t));pts.append((rx*math.cos(a),1.052+t*.129,axis+rz*math.sin(a)))
    b.tube('Continuous leather wrap seam',pts,.00042,seam,segments=6)
    for y in (1.050,1.181):
        for dy in (-.002,.002):
            pts=[(.014*math.cos(i*math.tau/64),y+dy,axis+.0093*math.sin(i*math.tau/64)) for i in range(65)];b.tube('Oval hilt ferrule',pts,.0011,silver,segments=10)

    # Long tapered silver neck and a genuine opening in the leaf-shaped pommel.
    profiles=[(1.184,.014,.008),(1.196,.013,.007),(1.235,.009,.0058),(1.278,.010,.006),(1.305,.018,.008)]
    v=[];f=[]
    for j,(y,rx,rz) in enumerate(profiles):
        for i in range(16):
            a=i*math.tau/16;v.append((rx*math.cos(a),y,axis+rz*math.sin(a)))
            if j:k=j*16+i;l=j*16+(i+1)%16;f.append((k-16,l-16,l,k))
    f.extend([tuple(reversed(range(16))),tuple(range(64,80))]);neck=b.mesh('Tapered silver pommel neck',v,f,silver,smooth=True)
    for obj in (grip,neck):
        bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    outer=[(0,1.346),(.018,1.339),(.030,1.311),(.017,1.298),(0,1.287),(-.017,1.298),(-.030,1.311),(-.018,1.339)]
    inner=[(0,1.332),(.010,1.328),(.015,1.314),(.009,1.306),(0,1.303),(-.009,1.306),(-.015,1.314),(-.010,1.328)]
    outer=flowing_outline(outer);inner=flowing_outline(inner)
    ring_xy(b,'Pierced leaf-shaped pommel',outer,inner,.001,.021,trim,.0010)
    b.tube('Pommel recessed golden accent',[(x,y,.0213) for x,y in inner+[inner[0]]],.0007,gold,segments=10)

    b.camera_view=(.46,.70,2.55);b.studio_world_color=(.44,.44,.44,1);b.studio_world_strength=.7
    b.layout_details={'reference':'User supplied Anduril/Narsil-form movie-prop photographs','swordLength':1.346,'bladeLength':1.042,
        'runeContours':len(loops),'sunMoonAndSevenStars':True,'piercedPommel':True,'displaySupportCanHide':True,
        'features':['double edge and recessed fuller','reference-traced rune geometry','leather binding','sculpted quillons','open pommel','walnut display with gold tree']}
    b.finish()

if __name__=='__main__':build()

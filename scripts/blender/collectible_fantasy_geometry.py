"""Shared Y-up mesh helpers for decorative fantasy collectibles."""
import math
import bpy,bmesh
from mathutils import Vector
from collectible_builder import C,xyz

def solid_xy(b,name,outline,z0,z1,material,bevel=0,uv_size=(.3,.6)):
    n=len(outline);v=[(x,y,z) for z in (z0,z1) for x,y in outline]
    f=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    obj=b.mesh(name,v,f,material,[(x/uv_size[0]+.5,y/uv_size[1]) for x,y in outline]*2)
    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    if bevel:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bevel,segments=4,affect='EDGES',profile=.5)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free();obj.data.update()
    for face in obj.data.polygons:face.use_smooth=max(abs(c) for c in face.normal)<.999
    return obj

def ring_xy(b,name,outer,inner,z0,z1,material,bevel=.0006):
    assert len(outer)==len(inner);n=len(outer)
    v=[(x,y,z) for z in (z0,z1) for loop in (outer,inner) for x,y in loop];f=[]
    for i in range(n):
        j=(i+1)%n
        f.extend([(i,j,j+2*n,i+2*n),(i+n,i+3*n,j+3*n,j+n),(i,i+n,j+n,j),(i+2*n,j+2*n,j+3*n,i+3*n)])
    obj=b.mesh(name,v,f,material);bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    if bevel:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bevel,segments=3,affect='EDGES',profile=.5)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free();obj.data.update()
    for face in obj.data.polygons:face.use_smooth=max(abs(c) for c in face.normal)<.999
    return obj

def bezier(points,steps=30):
    a,b,c,d=[Vector(p) for p in points];return [tuple((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d) for t in (i/steps for i in range(steps+1))]

def flowing_outline(points,steps=5):
    """Interpolate a closed sculpted silhouette without faceted polygon corners."""
    result=[];n=len(points)
    for i in range(n):
        a,b,c,d=[Vector(points[j%n]) for j in (i-1,i,i+1,i+2)]
        for k in range(steps):
            t=k/steps
            result.append(tuple(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)))
    return result

def support(objects):
    for obj in objects:obj['display_support']=True

def star_xy(b,name,x,y,z,r,material,points=8):
    polygon=[]
    for i in range(points*2):
        a=i*math.pi/points;rr=r if i%2==0 else r*.32;polygon.append((x+math.sin(a)*rr,y+math.cos(a)*rr))
    return solid_xy(b,name,polygon,z,z+.00005,material)

def curves_xy(b,name,loops,material,z,extrude=.000018):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='2D';curve.fill_mode='BOTH';curve.resolution_u=1;curve.extrude=extrude
    for loop in loops:
        spline=curve.splines.new('POLY');spline.points.add(len(loop)-1)
        for point,(x,y) in zip(spline.points,loop):point.co=(x,y,0,1)
        spline.use_cyclic_u=True
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.matrix_world=C.copy();obj.location=xyz((0,0,z))
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH')
    obj=bpy.context.object;obj.data.materials.append(material);obj['asset_group']=b.name;b.objects.append(obj);return obj

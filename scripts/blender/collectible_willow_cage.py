"""Asymmetric, hollow charred wood: staggered, tilted voids and uneven split tips."""
import bpy,bmesh,math,random
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from collectible_builder import xyz


def add_cage(b):
    material=b.material('Charred black willow lattice','#171918',.39)
    N,M=96,110;verts=[];faces=[]
    for inner in (False,True):
        for j in range(M+1):
            t=j/M
            for i in range(N):
                a=i*math.tau/N
                x=-.120+t*.240+(1-t)*.0024*math.sin(a*3+.2)+t*.0030*math.sin(a*2+.5)
                r=.0116*(1+.095*math.sin(t*8.7+a*.2)+.045*math.sin(t*35+a*3))-(.0027 if inner else 0)
                verts.append((x,.014+math.cos(a)*r+.0005*math.sin(t*8),math.sin(a)*r+.00065*math.sin(t*10)))
                if j:
                    k=j*N+i;n=j*N+(i+1)%N;offset=int(inner)*(M+1)*N
                    face=(offset+k-N,offset+n-N,offset+n,offset+k)
                    faces.append(tuple(reversed(face)) if inner else face)
    offset=(M+1)*N
    for j in (0,M):
        for i in range(N):
            k=j*N+i;n=j*N+(i+1)%N;faces.append((k,n,offset+n,offset+k))
    cage=b.mesh('Single irregular hollow willow with forked ends',verts,faces,material,smooth=True)
    bm=bmesh.new();bm.from_mesh(cage.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(cage.data);bm.free()
    rng=random.Random(4271);openings=[];cuts=[]
    # Each face has a different number of nonuniform intervals, with no common rows.
    for side,count in enumerate((5,6,4,5)):
        weights=[rng.uniform(.55,1.55) for _ in range(count)]
        x=-.110+rng.uniform(-.003,.003);span=.220
        for width in (span*w/sum(weights) for w in weights):
            center=x+width*rng.uniform(.42,.58)
            hole={'x':center,'angle':side*math.pi/2+math.pi/4+rng.uniform(-.21,.21),
                'halfLength':width*rng.uniform(.31,.40),'halfWidth':rng.uniform(.0048,.0065),'tilt':rng.uniform(-.30,.30)}
            openings.append(hole);cuts.append(hole);x+=width
        for end in (-1,1):
            cuts.append({'x':end*(.122+rng.uniform(-.003,.003)),
                'angle':side*math.pi/2+math.pi/4+rng.uniform(-.17,.17),
                'halfLength':rng.uniform(.014,.020),'halfWidth':rng.uniform(.0055,.0070),'tilt':rng.uniform(-.25,.25)})
    for index,hole in enumerate(cuts):
        a=hole['angle'];tilt=hole['tilt'];bm=bmesh.new()
        bmesh.ops.create_uvsphere(bm,u_segments=40,v_segments=20,radius=1)
        for v in bm.verts:
            u=v.co.x*hole['halfLength'];w=v.co.y*hole['halfWidth'];radial=v.co.z*.0088+.0108
            axial=u*math.cos(tilt)-w*math.sin(tilt)
            across=u*math.sin(tilt)+w*math.cos(tilt)+.0011*math.sin(v.co.x*math.pi)*(1-abs(v.co.x))
            v.co=xyz((hole['x']+axial,.014+math.cos(a)*radial-math.sin(a)*across,math.sin(a)*radial+math.cos(a)*across))
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
        if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
        data=bpy.data.meshes.new('Irregular opening cutter');bm.to_mesh(data);bm.free();data.update()
        cutter=bpy.data.objects.new('Irregular opening cutter',data);bpy.context.collection.objects.link(cutter)
        bpy.context.view_layer.update();bpy.context.view_layer.objects.active=cage
        mod=cage.modifiers.new('Staggered organic void '+str(index),'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
        if index%7==6:print('WILLOW_OPENINGS',index+1,flush=True)
    bpy.context.view_layer.update();tree=BVHTree.FromObject(cage,bpy.context.evaluated_depsgraph_get())
    for hole in openings:
        a=hole['angle'];origin=Vector(xyz((hole['x'],.014+.05*math.cos(a),.05*math.sin(a))))
        direction=Vector(xyz((0,-math.cos(a),-math.sin(a))))
        assert tree.ray_cast(origin,direction,.05)[0] is None,'Each irregular opening must pass through the near wall'
    mod=cage.modifiers.new('Rounded irregular opening edges','REMESH');mod.mode='VOXEL';mod.voxel_size=.00065;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=cage.modifiers.new('Natural charred wood transitions','SMOOTH');mod.factor=.43;mod.iterations=3;bpy.ops.object.modifier_apply(modifier=mod.name)
    for face in cage.data.polygons:face.use_smooth=True
    cage.data.update();normals=[v.normal.copy() for v in cage.data.vertices]
    for vertex,normal in zip(cage.data.vertices,normals):
        co=vertex.co;noise=.00010*math.sin(co.x*1170+co.y*320)*math.sin(co.z*910-co.x*210);vertex.co+=normal*noise
    cage['assembly']='hollow willow';cage['side_opening_count']=len(openings);cage['irregular_openings']=True;cage['open_fork_ends']=True
    return cage,openings

"""A hollow burnt branch with elongated openings and four uneven forked ends."""
import bpy,bmesh,math
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from collectible_builder import xyz


def add_cage(b):
    material=b.material('Charred black willow lattice','#171918',.39)
    # A continuous thick-walled shell, rather than separate thin pipe-like rails.
    N,M=96,100;verts=[];faces=[]
    for inner in (False,True):
        for j in range(M+1):
            x=-.120+j*.240/M;t=j/M
            for i in range(N):
                a=i*math.tau/N
                r=.0116*(1+.065*math.sin(t*16.4)+.035*math.sin(t*35+a*3))-(.0027 if inner else 0)
                verts.append((x,.014+math.cos(a)*r+.0005*math.sin(t*8),.045+math.sin(a)*r+.00065*math.sin(t*10)))
                if j:
                    k=j*N+i;next_j=j*N+(i+1)%N;offset=int(inner)*(M+1)*N
                    face=(offset+k-N,offset+next_j-N,offset+next_j,offset+k)
                    faces.append(tuple(reversed(face)) if inner else face)
    offset=(M+1)*N
    for j in (0,M):
        for i in range(N):
            k=j*N+i;n=j*N+(i+1)%N
            faces.append((k,n,offset+n,offset+k))
    cage=b.mesh('Single charred hollow willow with forked ends',verts,faces,material,smooth=True)
    bm=bmesh.new();bm.from_mesh(cage.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(cage.data);bm.free()
    cutters=[]
    for row,x in enumerate((-.121,-.088,-.044,0,.044,.088,.121)):
        for side in range(4):
            a=side*math.pi/2+math.pi/4+.05*math.sin(row*2+side)
            xx=x if row in (0,6) else x+.0018*math.sin(side*2+row)
            rx=.0158 if row in (0,6) else .0178+.0015*math.sin(row+side)
            tangent=.0065+.0005*math.sin(row*1.7+side)
            bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=40,v_segments=20,radius=1)
            for v in bm.verts:
                axial=v.co.x*rx;radial=v.co.z*.0085+.0110;across=v.co.y*tangent
                v.co=xyz((xx+axial,.014+math.cos(a)*radial-math.sin(a)*across,.045+math.sin(a)*radial+math.cos(a)*across))
            bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
            # Mapping sphere axes to the radial frame reverses handedness.
            # Consistent normals alone do not fix a globally inverted cutter.
            if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
            data=bpy.data.meshes.new('Oval wood opening cutter');bm.to_mesh(data);bm.free();data.update()
            obj=bpy.data.objects.new('Oval wood opening cutter',data);bpy.context.collection.objects.link(obj);cutters.append(obj)
    # Apply each opening separately so overlapping cutter volumes cannot fill a
    # neighbouring opening when the collection operand resolves their union.
    for i,obj in enumerate(cutters):
        bpy.context.view_layer.update();bpy.context.view_layer.objects.active=cage
        mod=cage.modifiers.new('Organic opening '+str(i),'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=obj
        bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(obj,do_unlink=True)
        if i%4==3:print('WILLOW_WINDOW_ROW',i//4,'faces',len(cage.data.polygons),flush=True)
    bpy.context.view_layer.update()
    origin=Vector(xyz((0,.014+.05/math.sqrt(2),.045+.05/math.sqrt(2))))
    direction=Vector(xyz((0,-1/math.sqrt(2),-1/math.sqrt(2))))
    hit=BVHTree.FromObject(cage,bpy.context.evaluated_depsgraph_get()).ray_cast(origin,direction,.05)
    assert hit[0] is None,'Boolean opening must pass through the near wall'
    mod=cage.modifiers.new('Rounded organic window edges','REMESH');mod.mode='VOXEL';mod.voxel_size=.00070;mod.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=cage.modifiers.new('Soft burnt wood edges','SMOOTH');mod.factor=.48;mod.iterations=3;bpy.ops.object.modifier_apply(modifier=mod.name)
    for face in cage.data.polygons:face.use_smooth=True
    cage.data.update()
    normals=[v.normal.copy() for v in cage.data.vertices]
    for vertex,normal in zip(cage.data.vertices,normals):
        co=vertex.co;noise=.00010*math.sin(co.x*1170+co.y*320)*math.sin(co.z*910-co.x*210)
        vertex.co+=normal*noise
    cage['assembly']='hollow willow';cage['large_window_rows']=5;cage['open_fork_ends']=True
    minimum=min((cage.matrix_world@v.co).z for v in cage.data.vertices)
    paper_min=min((o.matrix_world@v.co).z for o in b.objects if o!=cage for v in o.data.vertices)
    cage.location.z+=paper_min-minimum
    return cage

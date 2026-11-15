"""Reference-led soft beanbag with a closed fabric shell, pressure folds and drape."""
import bpy,bmesh,math
from pathlib import Path
from beanbag_surface import point,surface_normal,replaced,FOLDS

ROOT=Path(__file__).resolve().parents[2]

def build(g):
    xyz,tag,asset,tube=(g[k] for k in ('xyz','tag','asset','tube'))
    for obj in list(bpy.data.objects):
        if replaced(obj):bpy.data.objects.remove(obj,do_unlink=True)
    def fabric():
        name='Oatmeal beanbag woven upholstery'
        material=bpy.data.materials.get(name) or bpy.data.materials.new(name);material.use_nodes=True
        tree=material.node_tree;old_images=[node.image for node in tree.nodes if node.type=='TEX_IMAGE' and node.image];tree.nodes.clear()
        for image in old_images:
            if image.users==0:bpy.data.images.remove(image)
        output=tree.nodes.new('ShaderNodeOutputMaterial');shader=tree.nodes.new('ShaderNodeBsdfPrincipled');tree.links.new(shader.outputs['BSDF'],output.inputs['Surface'])
        shader.inputs['Roughness'].default_value=.98;shader.inputs['Sheen Weight'].default_value=.25;shader.inputs['Sheen Roughness'].default_value=1
        shader.inputs['Specular IOR Level'].default_value=.18;shader.inputs['Coat Weight'].default_value=0;shader.inputs['Transmission Weight'].default_value=0
        for suffix in ('','-normal','-roughness'):
            node=tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(ROOT/'public/models/sunlit-room'/('beanbag-oat'+suffix+'.png')),check_existing=False);node.image.pack()
            if suffix:node.image.colorspace_settings.name='Non-Color'
            if suffix=='':tree.links.new(node.outputs['Color'],shader.inputs['Base Color'])
            elif suffix=='-roughness':tree.links.new(node.outputs['Color'],shader.inputs['Roughness'])
            else:
                coordinates=tree.nodes.new('ShaderNodeUVMap');coordinates.uv_map='Gathered cloth atlas';tree.links.new(coordinates.outputs['UV'],node.inputs['Vector'])
                normal=tree.nodes.new('ShaderNodeNormalMap');normal.uv_map='Gathered cloth atlas';normal.inputs['Strength'].default_value=.90;tree.links.new(node.outputs['Color'],normal.inputs['Color']);tree.links.new(normal.outputs['Normal'],shader.inputs['Normal'])
        return material
    upholstery=fabric();moss=bpy.data.materials['Moss woven cushion']
    binding=bpy.data.materials.get('Oatmeal inset seam thread') or bpy.data.materials.new('Oatmeal inset seam thread');binding.use_nodes=True
    shader=binding.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.43,.37,.28,1);shader.inputs['Roughness'].default_value=.95
    shader.inputs['Specular IOR Level'].default_value=.15;shader.inputs['Sheen Weight'].default_value=.25
    def mesh(name,vertices,faces,material,uv,weld=False):
        data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in vertices],[],faces);data.update()
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);tag(obj,name,material)
        layer=data.uv_layers.new(name='Physical cloth weave')
        for loop in data.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
        bm=bmesh.new();bm.from_mesh(data)
        if weld:bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
        bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
        for face in data.polygons:face.use_smooth=True
        data.update();return obj
    asset('lounge');rows,cols=192,256;vertices=[];faces=[];uv=[]
    for row in range(rows+1):
        for col in range(cols+1):
            u=row/rows;a=col/cols*math.tau;vertices.append(point(u,a));uv.append((col/cols*5,u*6))
            if row and col:
                n=row*(cols+1)+col;faces.append((n-cols-2,n-cols-1,n,n-1))
    body=mesh('Sculpted continuous beanbag shell',vertices,faces,upholstery,uv,True)
    detailed=body.data.uv_layers.new(name='Gathered cloth atlas');physical=body.data.uv_layers[0]
    for loop in body.data.loops:detailed.data[loop.index].uv=(physical.data[loop.index].uv.x/5,physical.data[loop.index].uv.y/6)
    physical.active_render=True;body.data.uv_layers.active=physical
    body['construction']='weighted stuffed ovoid with an off-centre compressed seat; no rim or frame';body['large_fold_count']=len(FOLDS)
    body['reference']='user 2026-11-15 oatmeal beanbag photograph'
    # Real spaced topstitching, avoiding a continuous raised rubber-like piping.
    for a in (0,math.pi):
        data=bpy.data.curves.new('Cotton double topstitch','CURVE');data.dimensions='3D';data.resolution_u=1;data.bevel_depth=.00095;data.bevel_resolution=1
        end=1.0
        for offset in (-.007,.007):
            for i in range(0,256,2):
                spline=data.splines.new('POLY');spline.points.add(1)
                for vertex,j in zip(spline.points,(i,i+.85)):
                    u=.23+(end-.23)*j/256;p=point(u,a+offset);n=surface_normal(u,a+offset);position=tuple(p[k]+n[k]*.0022 for k in range(3));vertex.co=(*xyz(position),1)
        obj=bpy.data.objects.new('Cotton double topstitch',data);bpy.context.collection.objects.link(obj);tag(obj,'Cotton double topstitch',binding)
    # Concealed closure is soft, at the lower rear panel rather than a metal frame.
    seam=[]
    for i in range(45):
        u=.34+i/44*.12;p=point(u,.014);n=surface_normal(u,.014);seam.append(tuple(p[k]+n[k]*.006 for k in range(3)))
    tube('Concealed rear fabric zip',seam,.003,binding)
    asset('soft furnishings');vertices=[];faces=[];uv=[];rows,cols=24,28
    for side in (0,1):
        for row in range(rows+1):
            v=row/rows
            for col in range(cols+1):
                u=col/cols;x=1.48+(u-.5)*.56*(.91+.09*math.sin(math.pi*v));z=.40+(v-.5)*.43
                fill=max(0,math.sin(math.pi*u)*math.sin(math.pi*v))**.65
                y=.045+side*(.012+.19*fill)
                vertices.append((x,y,z));uv.append((u,v))
                if row and col:
                    n=side*(rows+1)*(cols+1)+row*(cols+1)+col;f=(n-cols-2,n-1,n,n-cols-1);faces.append(f if side else tuple(reversed(f)))
    count=(rows+1)*(cols+1);edge=[*range(cols+1),*[r*(cols+1)+cols for r in range(1,rows+1)],*range(count-2,rows*(cols+1)-1,-1),*[r*(cols+1) for r in range(rows-1,0,-1)]]
    for i,a in enumerate(edge):b=edge[(i+1)%len(edge)];faces.append((a,b,b+count,a+count))
    mesh('Plump moss pillow beside beanbag',vertices,faces,moss,uv)
    for bound in g['bounds']:
        if bound['name']=='single lounge envelope':bound['min']=[1.93,.04,-.31];bound['max']=[4.10,1.40,1.95]
    return body
